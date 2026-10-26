import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import api from '../api/axios';
import AuthorCard from '../components/blog/AuthorCard';
import PostList from '../components/blog/PostList';
import Pagination from '../components/common/Pagination';
import { Skeleton } from '../components/common/Loader';
import NotFound from './NotFound';

// Public author page: profile details plus their published posts.
export default function Profile() {
  const { id } = useParams();
  const [author, setAuthor] = useState(null);
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMissing(false);
    setPage(1);
    api
      .get(`/users/${id}`)
      .then((res) => active && setAuthor(res.data.data.user))
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 404 || err.response?.status === 400) setMissing(true);
        else toast.error(err.message);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    setPostsLoading(true);
    api
      .get('/posts', { params: { author: id, page, limit: 6 } })
      .then((res) => {
        if (!active) return;
        setPosts(res.data.data.posts);
        setPagination(res.data.pagination);
      })
      .catch(() => {})
      .finally(() => active && setPostsLoading(false));
    return () => {
      active = false;
    };
  }, [id, page]);

  if (missing) return <NotFound />;

  return (
    <>
    <div className="h-40 bg-gradient-to-br from-brand-600 via-brand-500 to-accent-400 sm:h-52" aria-hidden="true" />
    <div className="container-page -mt-20 pb-14 sm:-mt-24">
      <Helmet>
        <title>{author ? `${author.name} – Inkwell` : 'Author – Inkwell'}</title>
        {author?.bio && <meta name="description" content={author.bio} />}
      </Helmet>

      {loading ? <Skeleton className="h-44 w-full rounded-2xl" /> : <AuthorCard author={author} postCount={author?.postCount} large />}

      <h2 className="mb-6 mt-12 text-2xl font-bold">Posts by {author?.name || 'this author'}</h2>
      <PostList
        posts={posts}
        loading={postsLoading}
        emptyTitle="No published posts yet"
        emptyText="This author hasn't published anything yet. Check back soon."
      />
      {!postsLoading && pagination && (
        <Pagination
          page={pagination.page}
          pages={pagination.pages}
          onChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
    </>
  );
}
