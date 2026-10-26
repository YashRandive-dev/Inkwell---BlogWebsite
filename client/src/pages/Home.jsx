import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiArrowRight, FiBookOpen, FiClock, FiEdit3, FiMail, FiSearch, FiShield, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api, { cachedGet } from '../api/axios';
import PostList from '../components/blog/PostList';
import CategoryBadge from '../components/blog/CategoryBadge';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import { Skeleton } from '../components/common/Loader';
import { compactNumber, formatDate, optimizeImage, truncate } from '../utils/helpers';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const word = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } } };

function SectionHeader({ eyebrow, title, subtitle, to, linkLabel = 'View all' }) {
  return (
    <div className="mb-10 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-3xl font-semibold sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-2 max-w-xl text-slate-500">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="group flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300">
          {linkLabel} <FiArrowRight className="transition group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

// Large editorial card used for the lead featured story.
function LeadCard({ post }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative flex min-h-[420px] overflow-hidden rounded-3xl bg-slate-900 shadow-soft lg:min-h-[520px]"
    >
      {post.coverImage?.url && (
        <img src={optimizeImage(post.coverImage.url, 1200)} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
      <div className="relative mt-auto w-full p-6 sm:p-10">
        <CategoryBadge category={post.category} active />
        <h3 className="mt-4 font-display text-2xl font-semibold leading-tight !text-white sm:text-4xl">
          <Link to={`/blog/${post.slug}`} className="after:absolute after:inset-0">{post.title}</Link>
        </h3>
        <p className="mt-3 hidden max-w-xl text-slate-200 sm:block">{truncate(post.excerpt, 150)}</p>
        <div className="mt-5 flex items-center gap-3 text-sm text-slate-200">
          <Avatar user={post.author} size="sm" />
          <span className="font-medium">{post.author?.name}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(post.createdAt)}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1"><FiClock /> {post.readingTime} min</span>
        </div>
      </div>
    </motion.article>
  );
}

function SideCard({ post, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, x: 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 + index * 0.1 }}
      className="card group relative flex gap-4 overflow-hidden p-4 transition hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-900/40 dark:to-accent-900/40">
        {post.coverImage?.url && <img src={optimizeImage(post.coverImage.url, 300)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />}
      </div>
      <div className="min-w-0 self-center">
        <p className="eyebrow !text-[10px]">{post.category?.name}</p>
        <h3 className="mt-1 font-display text-lg font-semibold leading-snug">
          <Link to={`/blog/${post.slug}`} className="after:absolute after:inset-0">{post.title}</Link>
        </h3>
        <p className="mt-1 text-xs text-slate-500">{post.author?.name} · {post.readingTime} min read</p>
      </div>
    </motion.article>
  );
}

const features = [
  { icon: FiEdit3, title: 'A writer-first editor', text: 'Rich formatting, image uploads, drafts and one-click publishing. No clutter, no distractions.' },
  { icon: FiBookOpen, title: 'Made for reading', text: 'Generous typography, a reading progress bar and dark mode that is easy on the eyes.' },
  { icon: FiShield, title: 'Verified community', text: 'Every account is confirmed by email code, so conversations stay genuine.' },
  { icon: FiZap, title: 'Fast everywhere', text: 'Lightweight pages, lazy-loaded images and instant search keep things quick on any device.' },
];

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [popular, setPopular] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/posts/featured'),
      api.get('/posts', { params: { limit: 6, sort: 'latest' } }),
      api.get('/posts/popular'),
      cachedGet('/categories'),
    ])
      .then(([f, l, p, c]) => {
        if (!active) return;
        setFeatured(f.data.data.posts.slice(0, 3));
        setLatest(l.data.data.posts);
        setTotalPosts(l.data.pagination.total);
        setPopular(p.data.data.posts);
        setCategories(c.data.data.categories);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const search = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/blog?q=${encodeURIComponent(query.trim())}` : '/blog');
  };

  const subscribe = async (e) => {
    e.preventDefault();
    setSubscribing(true);
    try {
      const res = await api.post('/contact/subscribe', { email });
      toast.success(res.data.message);
      setEmail('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubscribing(false);
    }
  };

  const headline = ['Where', 'good', 'ideas', 'find', 'their', 'words.'];
  const ticker = categories.length ? [...categories, ...categories, ...categories, ...categories] : [];
  const heroPosts = (featured.length ? featured : latest).slice(0, 2);

  return (
    <>
      <Helmet>
        <title>Inkwell – Where good ideas find their words</title>
        <meta name="description" content="Discover thoughtful articles on technology, design, productivity and life – or start writing your own on Inkwell." />
        <meta property="og:title" content="Inkwell – Where good ideas find their words" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero */}
      <section className="grain relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute -left-24 -top-24 h-[28rem] w-[28rem] animate-blob rounded-full bg-brand-200/60 blur-3xl dark:bg-brand-700/20" />
          <div className="absolute -right-20 top-24 h-[26rem] w-[26rem] animate-blob rounded-full bg-accent-200/70 blur-3xl [animation-delay:-6s] dark:bg-accent-600/15" />
        </div>
        <div className="container-page grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="eyebrow mb-5 flex items-center gap-2">
              <span className="h-px w-8 bg-brand-500" /> The Inkwell journal
            </motion.p>
            <motion.h1
              variants={container}
              initial="hidden"
              animate="show"
              className="text-5xl font-semibold leading-[1.05] sm:text-7xl"
            >
              {headline.map((w, i) => (
                <motion.span key={i} variants={word} className={`mr-3 inline-block ${w === 'words.' ? 'gradient-text italic' : ''}`}>{w}</motion.span>
              ))}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-6 max-w-lg text-lg text-slate-600 dark:text-slate-400">
              Read sharp writing on technology, design and everyday life, or publish your own story to a community that cares about craft.
            </motion.p>

            <motion.form onSubmit={search} role="search" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }} className="mt-8 flex max-w-lg gap-2">
              <div className="relative flex-1">
                <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search stories, topics, tags…" aria-label="Search posts" className="input h-12 pl-11 shadow-soft" />
              </div>
              <Button type="submit" size="lg" className="h-12">Search</Button>
            </motion.form>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
              <span><strong className="font-display text-2xl text-slate-900 dark:text-white">{loading ? '–' : compactNumber(totalPosts)}</strong> <span className="text-slate-500">stories</span></span>
              <span><strong className="font-display text-2xl text-slate-900 dark:text-white">{loading ? '–' : categories.length}</strong> <span className="text-slate-500">topics</span></span>
              <Link to="/register" className="group flex items-center gap-1.5 font-semibold text-brand-600 dark:text-brand-300">Start writing <FiArrowRight className="transition group-hover:translate-x-1" /></Link>
            </motion.div>
          </div>

          {/* Floating story previews */}
          <div className="relative hidden h-[540px] lg:block" aria-hidden={loading}>
            {heroPosts.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 40, rotate: 0 }}
                animate={{ opacity: 1, y: 0, rotate: i === 0 ? -4 : 5 }}
                transition={{ delay: 0.6 + i * 0.2, duration: 0.7 }}
                whileHover={{ rotate: 0, scale: 1.03 }}
                className={`card absolute w-72 overflow-hidden ${i === 0 ? 'left-0 top-0' : 'bottom-0 right-0'}`}
              >
                <Link to={`/blog/${p.slug}`}>
                  <div className="aspect-[16/10] bg-gradient-to-br from-brand-200 to-accent-200">
                    {p.coverImage?.url && <img src={optimizeImage(p.coverImage.url, 500)} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="p-4">
                    <p className="eyebrow !text-[10px]">{p.category?.name}</p>
                    <p className="mt-1 font-display text-lg font-semibold leading-snug text-slate-900 dark:text-white">{truncate(p.title, 60)}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Topic ticker */}
      {ticker.length > 0 && (
        <div className="overflow-hidden border-y border-slate-200 bg-slate-900 py-4 dark:border-slate-800 dark:bg-slate-900" aria-hidden="true">
          <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-display text-xl text-slate-200">
            {ticker.map((c, i) => (
              <span key={i} className="flex items-center gap-10">{c.name} <span className="text-brand-400">✦</span></span>
            ))}
          </div>
        </div>
      )}

      <div className="container-page space-y-24 pt-20">
        {/* Featured */}
        {(loading || featured.length > 0) && (
          <section>
            <SectionHeader eyebrow="Editor's picks" title="Featured stories" subtitle="Hand-picked reads worth your time." />
            {loading ? (
              <Skeleton className="h-[420px] w-full rounded-3xl" />
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <LeadCard post={featured[0]} />
                <div className="flex flex-col gap-4">
                  {featured.slice(1).map((p, i) => <SideCard key={p._id} post={p} index={i} />)}
                  {featured.length < 3 && <div className="card flex flex-1 flex-col items-center justify-center p-8 text-center"><p className="font-display text-xl">More stories coming soon</p><Button to="/blog" variant="secondary" size="sm" className="mt-4">Browse all</Button></div>}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Latest */}
        <section>
          <SectionHeader eyebrow="Fresh off the press" title="Latest stories" subtitle="New writing from the community." to="/blog" />
          <PostList posts={latest} loading={loading} emptyTitle="No posts yet – write your first one" emptyText="Be the first to publish something on Inkwell." emptyAction={{ to: '/write', label: 'Write a post' }} />
        </section>

        {/* Popular + categories */}
        <section className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SectionHeader eyebrow="Trending" title="Most read" />
            <ol className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading
                ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="my-3 h-16 w-full" />)
                : popular.map((p, i) => (
                    <motion.li key={p._id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                      <Link to={`/blog/${p.slug}`} className="group flex items-center gap-5 py-5">
                        <span className="gradient-text w-12 shrink-0 font-display text-5xl font-semibold">{String(i + 1).padStart(2, '0')}</span>
                        <div className="min-w-0">
                          <h3 className="font-display text-xl font-semibold leading-snug transition group-hover:text-brand-600 dark:group-hover:text-brand-300">{p.title}</h3>
                          <p className="mt-1 text-xs text-slate-500">{p.author?.name} · {compactNumber(p.views)} views · {p.readingTime} min read</p>
                        </div>
                      </Link>
                    </motion.li>
                  ))}
              {!loading && popular.length === 0 && <p className="py-4 text-sm text-slate-500">Popular posts will show up here.</p>}
            </ol>
          </div>

          <div className="lg:col-span-2">
            <SectionHeader eyebrow="Explore" title="Browse by topic" />
            <div className="grid gap-3">
              {loading
                ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
                : categories.map((c) => (
                    <Link key={c._id} to={`/category/${c.slug}`} className="card group flex items-center justify-between p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift">
                      <div>
                        <h3 className="font-display text-lg font-semibold">{c.name}</h3>
                        <p className="text-xs text-slate-500">{c.postCount} {c.postCount === 1 ? 'story' : 'stories'}</p>
                      </div>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900/30"><FiArrowRight /></span>
                    </Link>
                  ))}
            </div>
          </div>
        </section>

        {/* Why Inkwell */}
        <section>
          <SectionHeader eyebrow="Why Inkwell" title="Built for writers and readers" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="card p-6">
                <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white"><Icon size={20} /></span>
                <h3 className="font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Newsletter */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-16 text-center text-white sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl" aria-hidden="true" />
          <FiMail size={28} className="relative mx-auto mb-4 text-accent-300" aria-hidden="true" />
          <h2 className="relative text-3xl font-semibold !text-white sm:text-4xl">The best of Inkwell, weekly</h2>
          <p className="relative mx-auto mt-3 max-w-md text-slate-300">One thoughtful email, once a week. No spam, leave any time.</p>
          <form onSubmit={subscribe} className="relative mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input id="newsletter-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input flex-1 border-transparent" />
            <Button type="submit" loading={subscribing}>Subscribe</Button>
          </form>
        </section>
      </div>
    </>
  );
}
