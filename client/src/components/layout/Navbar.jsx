import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiChevronDown, FiEdit3, FiFeather, FiLogOut, FiMenu, FiSearch, FiShield, FiUser, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { cachedGet } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import SearchModal from './SearchModal';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/blog', label: 'Stories' },
  { to: '/writers', label: 'Writers' },
  { to: '/about', label: 'About' },
];

const linkClass = ({ isActive }) =>
  `relative rounded-full px-4 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
  }`;

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [topics, setTopics] = useState([]);
  const menuRef = useRef(null);
  const topicsRef = useRef(null);

  useEffect(() => {
    cachedGet('/categories').then((res) => setTopics(res.data.data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
    setTopicsOpen(false);
  }, [location.pathname]);

  // Close dropdowns on outside click.
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (topicsRef.current && !topicsRef.current.contains(e.target)) setTopicsOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Ctrl/⌘ + K opens search.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 pt-3">
      <div className="container-page">
      <div
        className={`flex h-[4.5rem] items-center justify-between gap-4 rounded-2xl border px-4 transition-all duration-300 sm:px-6 ${
          scrolled
            ? 'border-slate-200/80 bg-slate-50/80 shadow-soft backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/75'
            : 'border-transparent bg-transparent'
        }`}
      >
        <Link to="/" className="flex items-center gap-2" aria-label="Inkwell home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-soft">
            <FiFeather size={18} />
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Inkwell</span>
        </Link>

        <nav className="hidden items-center gap-1.5 lg:flex" aria-label="Main">
          {links.slice(0, 2).map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>{l.label}</NavLink>
          ))}

          {/* Topics mega menu */}
          <div className="relative" ref={topicsRef} onMouseLeave={() => setTopicsOpen(false)}>
            <button
              onClick={() => setTopicsOpen((o) => !o)}
              onMouseEnter={() => setTopicsOpen(true)}
              aria-expanded={topicsOpen}
              aria-haspopup="true"
              className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              Topics <FiChevronDown className={`transition ${topicsOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {topicsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-1/2 top-full w-[26rem] -translate-x-1/2 pt-3"
                >
                  <div className="card grid grid-cols-2 gap-1 p-3">
                    {topics.map((t) => (
                      <Link key={t._id} to={`/category/${t.slug}`} className="rounded-xl p-3 transition hover:bg-brand-50 dark:hover:bg-brand-900/20">
                        <p className="font-display font-semibold text-slate-900 dark:text-white">{t.name}</p>
                        <p className="text-xs text-slate-500">{t.postCount} {t.postCount === 1 ? 'story' : 'stories'}</p>
                      </Link>
                    ))}
                    {topics.length === 0 && <p className="col-span-2 p-3 text-sm text-slate-500">No topics yet.</p>}
                    <Link to="/topics" className="col-span-2 mt-1 rounded-xl bg-slate-100 p-3 text-center text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:bg-slate-800 dark:text-brand-300">
                      Explore all topics →
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {links.slice(2).map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>{l.label}</NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search (Ctrl K)"
            className="flex h-10 items-center gap-2 rounded-full border border-slate-200 px-3 text-sm text-slate-500 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:hover:text-brand-300 md:w-48"
          >
            <FiSearch aria-hidden="true" />
            <span className="hidden flex-1 text-left md:block">Search…</span>
            <kbd className="hidden rounded border border-slate-200 px-1.5 text-[10px] dark:border-slate-700 md:block">⌘K</kbd>
          </button>
          <ThemeToggle />

          {user ? (
            <>
              <Button to="/write" size="sm" className="hidden rounded-full sm:inline-flex"><FiEdit3 /> Write</Button>
              <div className="relative hidden lg:block" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="Open account menu"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="rounded-full ring-offset-2 ring-offset-slate-50 transition hover:ring-2 hover:ring-brand-300 dark:ring-offset-slate-950"
                >
                  <Avatar user={user} size="md" />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="card absolute right-0 mt-3 w-60 overflow-hidden p-1.5"
                    >
                      <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                      <MenuLink to="/dashboard" icon={<FiUser />}>Dashboard</MenuLink>
                      <MenuLink to={`/author/${user._id}`} icon={<FiFeather />}>My public profile</MenuLink>
                      {isAdmin && <MenuLink to="/admin" icon={<FiShield />}>Admin panel</MenuLink>}
                      <button role="menuitem" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">
                        <FiLogOut /> Log out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-1.5 lg:flex">
              <Button to="/login" variant="ghost" size="sm" className="rounded-full">Log in</Button>
              <Button to="/register" size="sm" className="rounded-full">Get started</Button>
            </div>
          )}

          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu size={20} />
          </button>
        </div>
      </div>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile slide-in menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="fixed inset-0 z-[55] bg-slate-950/50 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.aside
              className="fixed right-0 top-0 z-[56] flex h-full w-80 max-w-[88%] flex-col overflow-y-auto bg-slate-50 p-5 shadow-2xl lg:hidden dark:bg-slate-900"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              aria-label="Mobile menu"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-xl font-semibold">Menu</span>
                <button className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <FiX size={20} />
                </button>
              </div>
              {[...links, { to: '/topics', label: 'Topics' }, { to: '/contact', label: 'Contact' }, { to: '/faq', label: 'FAQ' }].map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `${linkClass({ isActive })} !rounded-xl py-3 text-base`}>{l.label}</NavLink>
              ))}
              <div className="my-4 border-t border-slate-200 dark:border-slate-800" />
              {user ? (
                <div className="flex flex-col gap-1">
                  <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                    <Avatar user={user} />
                    <div className="min-w-0"><p className="truncate text-sm font-semibold">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div>
                  </div>
                  <NavLink to="/write" className={linkClass}>Write a story</NavLink>
                  <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
                  <NavLink to={`/author/${user._id}`} className={linkClass}>My public profile</NavLink>
                  {isAdmin && <NavLink to="/admin" className={linkClass}>Admin panel</NavLink>}
                  <button onClick={handleLogout} className="rounded-full px-4 py-2 text-left text-sm font-medium text-red-600">Log out</button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button to="/login" variant="secondary">Log in</Button>
                  <Button to="/register">Get started</Button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

function MenuLink({ to, icon, children }) {
  return (
    <Link to={to} role="menuitem" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
      {icon} {children}
    </Link>
  );
}
