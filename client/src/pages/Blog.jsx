import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiTag, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api, { cachedGet } from '../api/axios';
import useDebounce from '../hooks/useDebounce';
import SearchBar from '../components/blog/SearchBar';
import PostList from '../components/blog/PostList';
import PageHeader from '../components/common/PageHeader';
import Pagination from '../components/common/Pagination';

const SORTS = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'liked', label: 'Most liked' },
  { value: 'viewed', label: 'Most viewed' },
];

// Serves /blog, /category/:category and /tag/:tag. Filters live in the URL so they can be shared.
export default function Blog() {
  const params = useParams();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const category = params.category || sp.get('category') || '';
  const tag = params.tag || sp.get('tag') || '';
  const sort = sp.get('sort') || 'latest';
  const page = Math.max(1, parseInt(sp.get('page'), 10) || 1);
  const urlQuery = sp.get('q') || '';

  const [search, setSearch] = useState(urlQuery);
  const debounced = useDebounce(search, 400);
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    Promise.all([cachedGet('/categories'), cachedGet('/posts/tags')])
      .then(([c, t]) => {
        setCategories(c.data.data.categories);
        setTags(t.data.data.tags);
      })
      .catch(() => {});
  }, []);

  // Keep the box in sync when the URL changes from outside (e.g. the home page search).
  useEffect(() => setSearch(urlQuery), [urlQuery]);

  // Push the debounced search term into the URL (and reset to page 1).
  useEffect(() => {
    if (debounced === urlQuery) return;
    setSp(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debounced) next.set('q', debounced);
        else next.delete('q');
        next.delete('page');
        return next;
      },
      { replace: true }
    );
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch whenever any filter changes.
  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get('/posts', { params: { page, limit: 9, sort, search: urlQuery || undefined, category: category || undefined, tag: tag || undefined } })
      .then((res) => {
        if (!active) return;
        setPosts(res.data.data.posts);
        setPagination(res.data.pagination);
      })
      .catch((err) => active && toast.error(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, sort, urlQuery, category, tag]);

  // Build a /blog URL with the given overrides.
  const go = (changes) => {
    const next = new URLSearchParams();
    const merged = { q: urlQuery, category, tag, sort: sort !== 'latest' ? sort : '', ...changes };
    Object.entries(merged).forEach(([k, v]) => v && next.set(k, v));
    navigate(`/blog${next.toString() ? `?${next}` : ''}`);
  };

  const changePage = (p) => {
    setSp((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', p);
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCategory = categories.find((c) => c.slug === category);
  const heading = activeCategory ? activeCategory.name : tag ? `#${tag}` : 'All posts';
  const hasFilters = category || tag || urlQuery;

  return (
    <>
      <Helmet>
        <title>{`${heading} – Inkwell Blog`}</title>
        <meta name="description" content={activeCategory?.description || 'Browse, search and filter all posts on Inkwell.'} />
      </Helmet>

      <PageHeader
        eyebrow={activeCategory ? 'Topic' : tag ? 'Tag' : 'The blog'}
        title={heading}
        subtitle={activeCategory?.description || (tag ? `Stories tagged #${tag}.` : 'Browse, search and filter every story on Inkwell.')}
        crumbs={[{ label: 'Stories', to: activeCategory || tag ? '/blog' : undefined }, ...(activeCategory || tag ? [{ label: heading }] : [])]}
      />
      <div className="container-page py-10 sm:py-14">

      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto]">
        <SearchBar value={search} onChange={setSearch} />
        <div>
          <label htmlFor="sort" className="sr-only">Sort posts</label>
          <select
            id="sort"
            className="input md:w-44"
            value={sort}
            onChange={(e) =>
              setSp((prev) => {
                const next = new URLSearchParams(prev);
                next.set('sort', e.target.value);
                next.delete('page');
                return next;
              })
            }
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
        <button onClick={() => go({ category: '', tag: '' })} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${!category ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
          All
        </button>
        {categories.map((c) => (
          <button
            key={c._id}
            onClick={() => go({ category: c.slug })}
            aria-pressed={category === c.slug}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${category === c.slug ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {tags.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by tag">
          <FiTag className="text-slate-400" aria-hidden="true" />
          {tags.map((t) => (
            <button
              key={t.name}
              onClick={() => go({ tag: tag === t.name ? '' : t.name })}
              aria-pressed={tag === t.name}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition ${tag === t.name ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200' : 'border-slate-200 text-slate-500 hover:border-brand-300 dark:border-slate-700'}`}
            >
              #{t.name}
            </button>
          ))}
        </div>
      )}

      {hasFilters && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          {pagination && <span>{pagination.total} {pagination.total === 1 ? 'result' : 'results'}</span>}
          {urlQuery && <span>for &ldquo;{urlQuery}&rdquo;</span>}
          <Link to="/blog" className="ml-1 inline-flex items-center gap-1 font-medium text-brand-600 hover:underline">
            <FiX /> Clear filters
          </Link>
        </div>
      )}

      <PostList
        posts={posts}
        loading={loading}
        emptyTitle={hasFilters ? 'No posts match your search' : 'No posts yet – write your first one'}
        emptyText={hasFilters ? 'Try a different keyword or clear the filters.' : 'Be the first to publish something.'}
        emptyAction={hasFilters ? { to: '/blog', label: 'Clear filters' } : { to: '/write', label: 'Write a post' }}
      />
      {!loading && pagination && <Pagination page={pagination.page} pages={pagination.pages} onChange={changePage} />}
      </div>
    </>
  );
}
