import { Link } from 'react-router-dom';

// Small pill linking to a category's posts. Renders as a plain span when there is no slug.
export default function CategoryBadge({ category, active = false, className = '' }) {
  if (!category) return null;
  const classes = `inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition ${
    active
      ? 'bg-brand-600 text-white'
      : 'bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-900/40 dark:text-brand-200 dark:hover:bg-brand-900/70'
  } ${className}`;

  if (!category.slug) return <span className={classes}>{category.name}</span>;
  return (
    <Link to={`/category/${category.slug}`} className={classes}>
      {category.name}
    </Link>
  );
}
