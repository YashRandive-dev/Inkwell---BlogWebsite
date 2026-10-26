import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowRight, FiClock, FiHash, FiSearch } from 'react-icons/fi';
import api, { cachedGet } from '../../api/axios';
import useDebounce from '../../hooks/useDebounce';
import { truncate } from '../../utils/helpers';

// Command-palette style search (Ctrl/⌘ + K). Shows live results as you type.
export default function SearchModal({ open, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);
  const [results, setResults] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  // Reset and focus every time the palette opens.
  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    setResults([]);
    setActive(0);
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    cachedGet('/categories').then((res) => setTopics(res.data.data.categories)).catch(() => {});
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !debounced.trim()) {
      setResults([]);
      return undefined;
    }
    let live = true;
    setLoading(true);
    api
      .get('/posts', { params: { search: debounced.trim(), limit: 6 } })
      .then((res) => live && (setResults(res.data.data.posts), setActive(0)))
      .catch(() => live && setResults([]))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [debounced, open]);

  const go = (to) => {
    onClose();
    navigate(to);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') return onClose();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[active]) go(`/blog/${results[active].slug}`);
      else if (query.trim()) go(`/blog?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{ y: -16, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -10, scale: 0.98 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-800">
              <FiSearch className="text-slate-400" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search stories, topics, tags…"
                aria-label="Search"
                className="h-14 w-full bg-transparent text-base text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white"
              />
              <kbd className="hidden rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500 sm:block dark:border-slate-700">ESC</kbd>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {!query.trim() && (
                <>
                  <p className="eyebrow px-3 pb-2 pt-3 !text-[10px]">Browse topics</p>
                  <div className="flex flex-wrap gap-2 px-3 pb-3">
                    {topics.map((t) => (
                      <button key={t._id} onClick={() => go(`/category/${t.slug}`)} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-brand-100 hover:text-brand-700 dark:bg-slate-800 dark:text-slate-200">
                        <FiHash /> {t.name}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {query.trim() && loading && <p className="px-4 py-6 text-center text-sm text-slate-500">Searching…</p>}
              {query.trim() && !loading && results.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-slate-500">No stories match &ldquo;{query}&rdquo;. Press Enter to search all posts.</p>
              )}

              <ul role="listbox">
                {results.map((p, i) => (
                  <li key={p._id} role="option" aria-selected={i === active}>
                    <button
                      onClick={() => go(`/blog/${p.slug}`)}
                      onMouseEnter={() => setActive(i)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${i === active ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display font-semibold text-slate-900 dark:text-white">{p.title}</p>
                        <p className="truncate text-xs text-slate-500">{truncate(p.excerpt, 80)}</p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-slate-400"><FiClock /> {p.readingTime}m</span>
                      <FiArrowRight className={`shrink-0 transition ${i === active ? 'text-brand-600' : 'text-slate-300'}`} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500 dark:border-slate-800">
              <span>↑↓ to navigate · Enter to open</span>
              <button onClick={() => query.trim() && go(`/blog?q=${encodeURIComponent(query.trim())}`)} className="font-semibold text-brand-600 disabled:opacity-40" disabled={!query.trim()}>
                See all results →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
