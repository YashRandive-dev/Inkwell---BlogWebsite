import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiEye, FiHeart } from 'react-icons/fi';
import CategoryBadge from './CategoryBadge';
import Avatar from '../common/Avatar';
import { compactNumber, formatDate, optimizeImage, truncate } from '../../utils/helpers';

// `index` staggers the entrance of cards that appear together.
export default function PostCard({ post, index = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: (index % 3) * 0.08 }}
      whileHover={{ y: -6 }}
      className="card group flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lift"
    >
      <Link to={`/blog/${post.slug}`} className="block overflow-hidden" tabIndex={-1} aria-hidden="true">
        <div className="aspect-[16/10] overflow-hidden bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-900/40 dark:to-accent-900/40">
          {post.coverImage?.url && (
            <img
              src={optimizeImage(post.coverImage.url, 700)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-2">
          <CategoryBadge category={post.category} />
          {post.status === 'draft' && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              Draft
            </span>
          )}
        </div>

        <h3 className="font-display text-xl font-semibold leading-snug">
          <Link to={`/blog/${post.slug}`} className="transition hover:text-brand-600 dark:hover:text-brand-300">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {truncate(post.excerpt, 110)}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800">
          {post.author ? (
            <Link to={`/author/${post.author._id}`} className="flex min-w-0 items-center gap-2 hover:text-brand-600">
              <Avatar user={post.author} size="sm" />
              <span className="truncate font-medium">{post.author.name}</span>
            </Link>
          ) : (
            <span />
          )}
          <div className="flex shrink-0 items-center gap-3">
            <span className="flex items-center gap-1" title="Reading time"><FiClock aria-hidden="true" />{post.readingTime} min</span>
            <span className="flex items-center gap-1" title="Likes"><FiHeart aria-hidden="true" /><span className="sr-only">Likes:</span>{compactNumber(post.likesCount)}</span>
            <span className="hidden items-center gap-1 sm:flex" title="Views"><FiEye aria-hidden="true" /><span className="sr-only">Views:</span>{compactNumber(post.views)}</span>
          </div>
        </div>
        <time className="mt-2 text-xs text-slate-400" dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
      </div>
    </motion.article>
  );
}
