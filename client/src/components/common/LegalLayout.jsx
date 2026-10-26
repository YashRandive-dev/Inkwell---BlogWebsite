import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import PageHeader from './PageHeader';

// Two-column legal page: sticky table of contents on the left, sections on the right.
export default function LegalLayout({ title, updated, intro, sections, crumb }) {
  return (
    <>
      <Helmet>
        <title>{`${title} – Inkwell`}</title>
        <meta name="description" content={intro} />
      </Helmet>
      <PageHeader eyebrow="Legal" title={title} subtitle={`Last updated ${updated}`} crumbs={[{ label: crumb }]} />
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-28 space-y-1 text-sm">
            <p className="eyebrow mb-3 !text-[10px]">On this page</p>
            {sections.map((s, i) => (
              <a key={s.id} href={`#${s.id}`} className="block rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-brand-700 dark:text-slate-400 dark:hover:bg-slate-800">
                {i + 1}. {s.title}
              </a>
            ))}
          </nav>
        </aside>
        <article className="max-w-3xl">
          <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400">{intro}</p>
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-28 border-t border-slate-200 pt-8 mt-10 dark:border-slate-800">
              <h2 className="text-2xl font-semibold">{i + 1}. {s.title}</h2>
              {s.body.map((p) => <p key={p} className="mt-4 leading-relaxed text-slate-600 dark:text-slate-400">{p}</p>)}
            </section>
          ))}
          <p className="mt-12 rounded-2xl bg-brand-50 p-5 text-sm text-brand-900 dark:bg-brand-900/20 dark:text-brand-100">
            Questions about this page? <Link to="/contact" className="font-semibold underline">Contact us</Link> and we&apos;ll be happy to help.
          </p>
        </article>
      </div>
    </>
  );
}
