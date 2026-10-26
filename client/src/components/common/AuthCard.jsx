import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiFeather } from 'react-icons/fi';

const perks = ['A calm, distraction-free editor', 'Drafts, bookmarks and reading lists', 'A readership that values good writing'];

// Split-screen layout: brand panel on large screens, form card on the right.
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="container-page py-8 sm:py-12">
    <div className="grid min-h-[640px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-accent-500 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-accent-300/30 blur-3xl" aria-hidden="true" />
        <Link to="/" className="relative flex items-center gap-2 text-2xl font-bold">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur"><FiFeather /></span>
          <span className="font-display">Inkwell</span>
        </Link>
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-tight !text-white">Write the things worth reading.</h2>
          <ul className="mt-8 space-y-3 text-brand-50">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3"><FiCheckCircle className="shrink-0" /> {p}</li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-brand-100">© {new Date().getFullYear()} Inkwell</p>
      </aside>

      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <h1 className="text-3xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-slate-500">{footer}</div>}
        </motion.div>
      </div>
    </div>
    </div>
  );
}
