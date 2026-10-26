import { FiSearch, FiX } from 'react-icons/fi';

// Controlled search box. Debouncing is done by the parent with useDebounce.
export default function SearchBar({ value, onChange, placeholder = 'Search posts…' }) {
  return (
    <div className="relative">
      <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search posts"
        className="input pl-11 pr-10 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          <FiX />
        </button>
      )}
    </div>
  );
}
