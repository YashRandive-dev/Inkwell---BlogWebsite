import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { cachedGet } from '../api/axios';
import PageHeader from '../components/common/PageHeader';
import { Skeleton } from '../components/common/Loader';

const tints = [
  'from-brand-500 to-accent-400',
  'from-accent-500 to-brand-400',
  'from-brand-700 to-brand-400',
  'from-accent-600 to-accent-300',
];

export default function Topics() {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([cachedGet('/categories'), cachedGet('/posts/tags')])
      .then(([c, t]) => {
        setCategories(c.data.data.categories);
        setTags(t.data.data.tags);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet>
        <title>Topics – Inkwell</title>
        <meta name="description" content="Explore every topic on Inkwell, from technology and design to productivity and lifestyle." />
      </Helmet>
      <PageHeader eyebrow="Explore" title="Find your next favourite topic" subtitle="Every story on Inkwell lives in a topic. Pick one to dive in." crumbs={[{ label: 'Topics' }]} />

      <div className="container-page py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)
            : categories.map((c, i) => (
                <motion.div key={c._id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.08 }}>
                  <Link to={`/category/${c.slug}`} className={`group relative flex h-56 flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br ${tints[i % tints.length]} p-6 text-white shadow-soft transition hover:-translate-y-1 hover:shadow-lift`}>
                    <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/15 blur-2xl transition group-hover:scale-125" aria-hidden="true" />
                    <span className="flex h-10 w-10 items-center justify-center self-end rounded-full bg-white/20 backdrop-blur transition group-hover:rotate-45"><FiArrowUpRight /></span>
                    <div className="relative">
                      <h2 className="text-3xl font-semibold !text-white">{c.name}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-white/85">{c.description || 'Stories and ideas.'}</p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/90">{c.postCount} {c.postCount === 1 ? 'story' : 'stories'}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
        </div>

        {tags.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-5 text-2xl font-semibold">Popular tags</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <Link key={t.name} to={`/tag/${t.name}`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-brand-400 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  #{t.name} <span className="text-slate-400">{t.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
