import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AnimatePresence, motion } from 'framer-motion';
import { FiMinus, FiPlus } from 'react-icons/fi';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';

const groups = [
  {
    title: 'Getting started',
    items: [
      ['Is Inkwell free?', 'Yes. Creating an account, reading, commenting and publishing stories are all free.'],
      ['How do I create an account?', 'Choose Get started, enter your name, email and a password. We email you a 6-digit code; enter it to verify your address and you are in.'],
      ['I did not receive my verification code', 'Check your spam folder, then use Resend code on the verification page (available after a minute). Codes expire after 10 minutes.'],
    ],
  },
  {
    title: 'Writing',
    items: [
      ['How do I publish a story?', 'Select Write, add a title, category and content, then choose Publish. Use Save as draft to keep working privately.'],
      ['What image formats can I upload?', 'JPG, PNG and WebP up to 2MB, both for cover images and for images inside the editor.'],
      ['Can I edit or delete a story later?', 'Yes. Open the story from your dashboard to edit or delete it. Deleting also removes its comments.'],
    ],
  },
  {
    title: 'Account and privacy',
    items: [
      ['I forgot my password', 'Choose Forgot password on the login page. We email a reset link that is valid for 30 minutes.'],
      ['How do I change my profile or avatar?', 'Go to Dashboard, then Settings, to update your name, bio, photo and social links.'],
      ['Who can see my saved posts?', 'Only you. Saved posts are private and appear in your dashboard.'],
    ],
  },
];

function Item({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 dark:border-slate-800">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 py-5 text-left">
        <span className="font-display text-lg font-semibold text-slate-900 dark:text-white">{q}</span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${open ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>
          {open ? <FiMinus /> : <FiPlus />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="pb-5 pr-12 leading-relaxed text-slate-600 dark:text-slate-400">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  return (
    <>
      <Helmet>
        <title>Help &amp; FAQ – Inkwell</title>
        <meta name="description" content="Answers to common questions about writing, accounts and verification on Inkwell." />
      </Helmet>
      <PageHeader eyebrow="Help centre" title="Frequently asked questions" subtitle="Quick answers about writing, accounts and email verification." crumbs={[{ label: 'FAQ' }]} />
      <div className="container-page max-w-3xl space-y-12 py-14">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="eyebrow mb-2">{g.title}</h2>
            {g.items.map(([q, a]) => <Item key={q} q={q} a={a} />)}
          </section>
        ))}
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-semibold">Still have questions?</h2>
          <p className="mt-2 text-slate-500">Our team is happy to help.</p>
          <Button to="/contact" className="mt-5">Contact us</Button>
          <p className="mt-4 text-xs text-slate-500">See also our <Link to="/privacy" className="underline">privacy policy</Link> and <Link to="/terms" className="underline">terms</Link>.</p>
        </div>
      </div>
    </>
  );
}
