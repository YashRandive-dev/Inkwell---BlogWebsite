import { optimizeImage } from '../../utils/helpers';

const sizes = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl', xl: 'h-24 w-24 text-3xl' };

// Shows the user's photo, or their initials on a gradient when they have none.
export default function Avatar({ user, size = 'md', className = '' }) {
  const name = user?.name || '?';
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (user?.avatar?.url) {
    return (
      <img
        src={optimizeImage(user.avatar.url, 160)}
        alt={name}
        loading="lazy"
        className={`${sizes[size]} shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <span
      aria-label={name}
      role="img"
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 font-semibold text-white ${className}`}
    >
      {initials}
    </span>
  );
}
