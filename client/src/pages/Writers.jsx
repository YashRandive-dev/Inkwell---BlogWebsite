import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiEye, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api/axios';
import PageHeader from '../components/common/PageHeader';
import SearchBar from '../components/blog/SearchBar';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import { Skeleton } from '../components/common/Loader';
import { compactNumber, truncate } from '../utils/helpers';

export default function Writers() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api
      .get('/users')
      .then((res) => setAuthors(res.data.data.authors))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => authors.filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase())), [authors, query]);

  return (
    <>
      <Helmet>
        <title>Writers – Inkwell</title>
        <meta name="description" content="Meet the writers publishing on Inkwell." />
      </Helmet>
      <PageHeader eyebrow="Community" title="Meet our writers" subtitle="The people behind the stories. Follow their work and discover new voices." crumbs={[{ label: 'Writers' }]}>
        <div className="max-w-md"><SearchBar value={query} onChange={setQuery} placeholder="Search writers…" /></div>
      </PageHeader>

      <div className="container-page py-14">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-52 w-full rounded-2xl" />)}</div>
        ) : shown.length === 0 ? (
          <div className="card flex flex-col items-center px-6 py-16 text-center">
            <h2 className="text-xl font-semibold">{query ? 'No writers match your search' : 'No writers yet'}</h2>
            <p className="mt-1 text-sm text-slate-500">Be the first to publish a story.</p>
            <Button to="/write" className="mt-5">Start writing</Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((a, i) => (
              <motion.div key={a._id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.08 }}>
                <Link to={`/author/${a._id}`} className="card group flex h-full flex-col items-center p-7 text-center transition hover:-translate-y-1 hover:shadow-lift">
                  <Avatar user={a} size="xl" className="ring-4 ring-brand-100 transition group-hover:ring-brand-300 dark:ring-brand-900/40" />
                  <h2 className="mt-4 text-xl font-semibold">{a.name}</h2>
                  <p className="mt-2 flex-1 text-sm text-slate-500">{a.bio ? truncate(a.bio, 90) : 'Writer at Inkwell'}</p>
                  <div className="mt-5 flex gap-5 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800">
                    <span className="flex items-center gap-1"><FiFileText /> {a.postCount} {a.postCount === 1 ? 'story' : 'stories'}</span>
                    <span className="flex items-center gap-1"><FiEye /> {compactNumber(a.views)} views</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
