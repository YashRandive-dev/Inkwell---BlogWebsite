import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiChevronRight } from 'react-icons/fi';

// Shared hero band for inner pages: breadcrumb, title, subtitle and optional actions.
export default function PageHeader({ eyebrow, title, subtitle, crumbs = [], children, align = 'left' }) {
  return (
    <section className="grain relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl dark:bg-brand-700/15" />
        <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-accent-200/60 blur-3xl dark:bg-accent-600/10" />
      </div>
      <div className={`container-page py-14 sm:py-20 ${align === 'center' ? 'text-center' : ''}`}>
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className={`mb-5 flex items-center gap-1 text-xs text-slate-500 ${align === 'center' ? 'justify-center' : ''}`}>
            <Link to="/" className="hover:text-brand-600">Home</Link>
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-1">
                <FiChevronRight aria-hidden="true" />
                {c.to ? <Link to={c.to} className="hover:text-brand-600">{c.label}</Link> : <span className="text-slate-700 dark:text-slate-300">{c.label}</span>}
              </span>
            ))}
          </nav>
        )}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">{title}</h1>
          {subtitle && <p className={`mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400 ${align === 'center' ? 'mx-auto' : ''}`}>{subtitle}</p>}
          {children && <div className="mt-8">{children}</div>}
        </motion.div>
      </div>
    </section>
  );
}
