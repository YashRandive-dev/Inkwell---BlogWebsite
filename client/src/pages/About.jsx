import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiEdit3, FiHeart, FiMail, FiPenTool, FiSend, FiShield, FiUsers } from 'react-icons/fi';
import api from '../api/axios';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';

const values = [
  { icon: FiPenTool, title: 'Writing first', text: 'A distraction-free editor and a reading experience designed around the words.' },
  { icon: FiUsers, title: 'Community driven', text: 'Comments, likes and author profiles help good ideas find the right readers.' },
  { icon: FiShield, title: 'Trust by default', text: 'Email-verified accounts and rate-limited sign-in keep the community genuine.' },
  { icon: FiHeart, title: 'Built with care', text: 'Fast, accessible and respectful of your attention, in light and dark mode.' },
];

const steps = [
  { icon: FiMail, title: 'Sign up', text: 'Create a free account with your email.' },
  { icon: FiShield, title: 'Verify', text: 'Enter the 6-digit code we send you.' },
  { icon: FiEdit3, title: 'Write', text: 'Draft in the rich editor, add a cover image.' },
  { icon: FiSend, title: 'Publish', text: 'Share your story with readers everywhere.' },
];

export default function About() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/posts', { params: { limit: 1 } }), api.get('/categories'), api.get('/users')])
      .then(([p, c, u]) => setStats({ stories: p.data.pagination.total, topics: c.data.data.categories.length, writers: u.data.data.authors.length }))
      .catch(() => {});
  }, []);

  return (
    <>
      <Helmet>
        <title>About – Inkwell</title>
        <meta name="description" content="Learn what Inkwell is about and why we built it." />
      </Helmet>
      <PageHeader eyebrow="About us" title="A home for thoughtful writing" subtitle="Inkwell is an independent blogging platform. We believe sharing what you know should be simple, and reading it should feel calm." crumbs={[{ label: 'About' }]} />

      <div className="container-page space-y-24 py-16">
        {stats && (
          <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-3xl border border-slate-200 bg-white py-8 text-center shadow-soft dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {[['Stories', stats.stories], ['Topics', stats.topics], ['Writers', stats.writers]].map(([label, value]) => (
              <div key={label}>
                <p className="gradient-text font-display text-4xl font-semibold sm:text-5xl">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        )}

        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">Our story</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">Why we built Inkwell</h2>
            <p className="mt-5 leading-relaxed text-slate-600 dark:text-slate-400">Great ideas get lost in noisy feeds and cluttered editors. We wanted a place where the writing is the star: generous typography, a calm interface and tools that stay out of the way.</p>
            <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-400">Whether you are sharing a tutorial, a personal essay or a product update, Inkwell gives you a beautiful page and an audience that came to read.</p>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-accent-500 p-10 text-white shadow-lift">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-2xl" aria-hidden="true" />
            <p className="relative font-display text-3xl font-semibold leading-snug !text-white">&ldquo;Write the thing you wish you could have read yesterday.&rdquo;</p>
            <p className="relative mt-4 text-sm text-brand-50">The Inkwell writing principle</p>
          </div>
        </section>

        <section>
          <div className="mb-10 text-center">
            <p className="eyebrow mb-2">How it works</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">From idea to published in four steps</h2>
          </div>
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <motion.li key={title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card relative p-6">
                <span className="absolute right-5 top-4 font-display text-5xl font-semibold text-slate-200 dark:text-slate-800">{i + 1}</span>
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30"><Icon size={20} /></span>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-slate-500">{text}</p>
              </motion.li>
            ))}
          </ol>
        </section>

        <section>
          <div className="mb-10 text-center">
            <p className="eyebrow mb-2">What we value</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">Principles we build by</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, text }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="card p-6">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white"><Icon size={20} /></span>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="card p-10 text-center">
          <h2 className="text-3xl font-semibold">Ready to share your story?</h2>
          <p className="mt-2 text-slate-500">Create a free account and publish your first post in minutes.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button to="/register">Get started</Button>
            <Button to="/blog" variant="secondary">Read the blog</Button>
          </div>
        </section>
      </div>
    </>
  );
}
