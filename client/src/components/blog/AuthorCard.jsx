import { Link } from 'react-router-dom';
import { FiGithub, FiGlobe, FiLinkedin, FiTwitter } from 'react-icons/fi';
import Avatar from '../common/Avatar';

const socials = [
  { key: 'twitter', icon: FiTwitter, label: 'Twitter' },
  { key: 'github', icon: FiGithub, label: 'GitHub' },
  { key: 'linkedin', icon: FiLinkedin, label: 'LinkedIn' },
  { key: 'website', icon: FiGlobe, label: 'Website' },
];

// Only allow http(s) links so a stored "javascript:" URL can never be rendered.
const safeUrl = (url = '') => {
  const value = url.trim();
  if (!value) return '';
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return /^https?:\/\//i.test(withProtocol) ? withProtocol : '';
};

export default function AuthorCard({ author, postCount, large = false }) {
  if (!author) return null;
  const links = socials.filter((s) => safeUrl(author.socialLinks?.[s.key]));

  return (
    <div className={`card flex gap-4 p-6 ${large ? 'flex-col items-center text-center sm:flex-row sm:items-start sm:text-left' : 'items-start'}`}>
      <Avatar user={author} size={large ? 'xl' : 'lg'} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
          {large ? 'Author' : 'Written by'}
        </p>
        <h3 className="text-lg font-bold">
          {large ? author.name : <Link to={`/author/${author._id}`} className="hover:text-brand-600">{author.name}</Link>}
        </h3>
        {typeof postCount === 'number' && (
          <p className="text-xs text-slate-500">{postCount} published {postCount === 1 ? 'post' : 'posts'}</p>
        )}
        {author.bio ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{author.bio}</p>
        ) : (
          <p className="mt-2 text-sm italic text-slate-400">This author hasn&apos;t written a bio yet.</p>
        )}
        {links.length > 0 && (
          <div className={`mt-3 flex gap-2 ${large ? 'justify-center sm:justify-start' : ''}`}>
            {links.map(({ key, icon: Icon, label }) => (
              <a
                key={key}
                href={safeUrl(author.socialLinks[key])}
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label={`${author.name} on ${label}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700"
              >
                <Icon />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
