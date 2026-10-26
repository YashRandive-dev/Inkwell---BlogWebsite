import { FiFileText } from 'react-icons/fi';
import PostCard from './PostCard';
import { PostGridSkeleton } from '../common/Loader';
import Button from '../common/Button';

// Grid of post cards with loading and empty states.
export default function PostList({
  posts,
  loading = false,
  skeletonCount = 6,
  emptyTitle = 'No posts yet',
  emptyText = 'Nothing to show here right now.',
  emptyAction,
}) {
  if (loading) return <PostGridSkeleton count={skeletonCount} />;

  if (!posts || posts.length === 0) {
    return (
      <div className="card flex flex-col items-center px-6 py-16 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/40">
          <FiFileText size={24} />
        </span>
        <h3 className="text-lg font-semibold">{emptyTitle}</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{emptyText}</p>
        {emptyAction && (
          <Button to={emptyAction.to} className="mt-5">
            {emptyAction.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post, i) => (
        <PostCard key={post._id} post={post} index={i} />
      ))}
    </div>
  );
}
