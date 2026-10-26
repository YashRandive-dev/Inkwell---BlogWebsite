import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useSpring } from 'framer-motion';
import DOMPurify from 'dompurify';
import toast from 'react-hot-toast';
import { FiBookmark, FiClock, FiEdit2, FiEye, FiHeart, FiLink, FiTrash2 } from 'react-icons/fi';
import { FaLinkedinIn, FaWhatsapp, FaXTwitter } from 'react-icons/fa6';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AuthorCard from '../components/blog/AuthorCard';
import CategoryBadge from '../components/blog/CategoryBadge';
import CommentSection from '../components/blog/CommentSection';
import PostList from '../components/blog/PostList';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Skeleton } from '../components/common/Loader';
import NotFound from './NotFound';
import { compactNumber, formatDate, optimizeImage } from '../utils/helpers';

// Make every link in user-written HTML open safely in a new tab.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer nofollow');
  }
});

function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 right-0 top-0 z-[60] h-1 origin-left bg-gradient-to-r from-brand-500 to-accent-500"
      role="progressbar"
      aria-label="Reading progress"
    />
  );
}

export default function PostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, setBookmarks } = useAuth();

  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setPost(null);
    api
      .get(`/posts/${slug}`)
      .then((res) => {
        if (!active) return;
        setPost(res.data.data.post);
        api.get(`/posts/${slug}/related`).then((r) => active && setRelated(r.data.data.posts)).catch(() => {});
      })
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 404) setNotFound(true);
        else toast.error(err.message);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug, user?._id]);

  const safeHtml = useMemo(() => (post ? DOMPurify.sanitize(post.content) : ''), [post]);

  const requireLogin = (action) => {
    toast(`Please log in to ${action}`, { icon: '🔒' });
    navigate('/login', { state: { from: `/blog/${slug}` } });
  };

  // Like and bookmark update the screen instantly, then roll back if the server says no.
  const toggleLike = async () => {
    if (!user) return requireLogin('like posts');
    const before = { liked: post.liked, likesCount: post.likesCount };
    setPost((p) => ({ ...p, liked: !p.liked, likesCount: p.likesCount + (p.liked ? -1 : 1) }));
    try {
      const res = await api.put(`/posts/${post._id}/like`);
      setPost((p) => ({ ...p, liked: res.data.data.liked, likesCount: res.data.data.likesCount }));
    } catch (err) {
      setPost((p) => ({ ...p, ...before }));
      toast.error(err.message);
    }
  };

  const toggleBookmark = async () => {
    if (!user) return requireLogin('save posts');
    const before = post.bookmarked;
    setPost((p) => ({ ...p, bookmarked: !before }));
    try {
      const res = await api.put(`/posts/${post._id}/bookmark`);
      setPost((p) => ({ ...p, bookmarked: res.data.data.bookmarked }));
      setBookmarks(res.data.data.bookmarks);
      toast.success(res.data.message);
    } catch (err) {
      setPost((p) => ({ ...p, bookmarked: before }));
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success('Post deleted');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
    }
  };

  const url = window.location.href;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch (e) {
      toast.error('Could not copy the link');
    }
  };

  if (notFound) return <NotFound />;

  if (loading || !post) {
    return (
      <div className="container-page max-w-3xl py-12" role="status" aria-label="Loading post">
        <Skeleton className="mb-4 h-6 w-24" />
        <Skeleton className="mb-3 h-10 w-full" />
        <Skeleton className="mb-8 h-10 w-2/3" />
        <Skeleton className="mb-8 aspect-[16/8] w-full rounded-2xl" />
        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="mb-3 h-4 w-full" />)}
      </div>
    );
  }

  const canManage = user && (isAdmin || user._id === post.author._id);
  const shareText = encodeURIComponent(post.title);
  const shareUrl = encodeURIComponent(url);
  const shareBtn = 'flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300';

  return (
    <article>
      <Helmet>
        <title>{`${post.title} – Inkwell`}</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:url" content={url} />
        {post.coverImage?.url && <meta property="og:image" content={post.coverImage.url} />}
        <meta name="twitter:card" content={post.coverImage?.url ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        {post.status === 'draft' && <meta name="robots" content="noindex" />}
      </Helmet>
      <ReadingProgress />

      <div className="container-page max-w-4xl py-10 sm:py-14">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[720px]">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <CategoryBadge category={post.category} />
            {post.status === 'draft' && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                Draft – only you can see this
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
          {post.excerpt && <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">{post.excerpt}</p>}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <Link to={`/author/${post.author._id}`} className="flex items-center gap-3">
              <Avatar user={post.author} size="md" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{post.author.name}</p>
                <p className="text-xs text-slate-500">
                  <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><FiClock aria-hidden="true" /> {post.readingTime} min read</span>
              <span className="flex items-center gap-1"><FiEye aria-hidden="true" /> {compactNumber(post.views)}</span>
            </div>
          </div>

          {canManage && (
            <div className="mt-5 flex gap-2">
              <Button to={`/edit/${post.slug}`} variant="secondary" size="sm"><FiEdit2 /> Edit</Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(true)} className="!text-red-600"><FiTrash2 /> Delete</Button>
            </div>
          )}
        </motion.header>

        {post.coverImage?.url && (
          <motion.img
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            src={optimizeImage(post.coverImage.url, 1400)}
            alt={`Cover image for ${post.title}`}
            className="mt-10 aspect-[16/8] w-full rounded-3xl object-cover shadow-soft"
          />
        )}

        <div className="article mt-10" dangerouslySetInnerHTML={{ __html: safeHtml }} />

        {post.tags?.length > 0 && (
          <div className="mx-auto mt-10 flex max-w-[720px] flex-wrap gap-2">
            {post.tags.map((t) => (
              <Link key={t} to={`/tag/${t}`} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400">
                #{t}
              </Link>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mx-auto mt-10 flex max-w-[720px] flex-wrap items-center justify-between gap-4 border-y border-slate-200 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLike}
              aria-pressed={post.liked}
              aria-label={post.liked ? 'Unlike this post' : 'Like this post'}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${post.liked ? 'border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950/40' : 'border-slate-200 hover:border-rose-300 dark:border-slate-700'}`}
            >
              <motion.span
                key={String(post.liked)}
                initial={{ scale: 1 }}
                animate={{ scale: post.liked ? [1, 1.5, 0.9, 1] : 1 }}
                transition={{ duration: 0.4 }}
                className="flex"
              >
                <FiHeart className={post.liked ? 'fill-current' : ''} />
              </motion.span>
              {post.likesCount}
            </button>
            <button
              onClick={toggleBookmark}
              aria-pressed={post.bookmarked}
              aria-label={post.bookmarked ? 'Remove from saved posts' : 'Save this post'}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${post.bookmarked ? 'border-brand-300 bg-brand-50 text-brand-600 dark:border-brand-800 dark:bg-brand-900/30' : 'border-slate-200 hover:border-brand-300 dark:border-slate-700'}`}
            >
              <motion.span
                key={String(post.bookmarked)}
                animate={{ y: post.bookmarked ? [0, -6, 0] : 0 }}
                transition={{ duration: 0.35 }}
                className="flex"
              >
                <FiBookmark className={post.bookmarked ? 'fill-current' : ''} />
              </motion.span>
              {post.bookmarked ? 'Saved' : 'Save'}
            </button>
          </div>

          <div className="flex items-center gap-2" role="group" aria-label="Share this post">
            <button onClick={copyLink} className={shareBtn} aria-label="Copy link"><FiLink /></button>
            <a className={shareBtn} aria-label="Share on X (Twitter)" target="_blank" rel="noopener noreferrer" href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}><FaXTwitter /></a>
            <a className={shareBtn} aria-label="Share on LinkedIn" target="_blank" rel="noopener noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}><FaLinkedinIn /></a>
            <a className={shareBtn} aria-label="Share on WhatsApp" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${shareText}%20${shareUrl}`}><FaWhatsapp /></a>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-[720px]">
          <AuthorCard author={post.author} />
        </div>

        {post.status === 'published' && <CommentSection postId={post._id} />}
      </div>

      {related.length > 0 && (
        <section className="container-page mt-8" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-6 text-2xl font-bold">Related posts</h2>
          <PostList posts={related} skeletonCount={3} />
        </section>
      )}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this post?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete post</Button>
          </>
        }
      >
        This permanently deletes the post, its comments and its cover image. This cannot be undone.
      </Modal>
    </article>
  );
}
