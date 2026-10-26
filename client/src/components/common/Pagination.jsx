import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// Builds [1, '…', 4, 5, 6, '…', 10] style page lists.
const getPages = (page, pages) => {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const list = new Set([1, pages, page, page - 1, page + 1]);
  const sorted = [...list].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
};

export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;

  const base =
    'flex h-10 min-w-[2.5rem] items-center justify-center rounded-xl px-3 text-sm font-medium transition';

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <button
        className={`${base} border border-slate-300 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800`}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <FiChevronLeft />
      </button>
      {getPages(page, pages).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-slate-400" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Page ${p}`}
            className={`${base} ${
              p === page
                ? 'bg-brand-600 text-white shadow-soft'
                : 'border border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        className={`${base} border border-slate-300 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800`}
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        aria-label="Next page"
      >
        <FiChevronRight />
      </button>
    </nav>
  );
}
