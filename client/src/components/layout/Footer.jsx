import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiFeather, FiGithub, FiInstagram, FiLinkedin, FiTwitter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api, { cachedGet } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

const socials = [
  { icon: <FiTwitter />, label: 'Twitter', href: 'https://twitter.com' },
  { icon: <FiInstagram />, label: 'Instagram', href: 'https://instagram.com' },
  { icon: <FiLinkedin />, label: 'LinkedIn', href: 'https://linkedin.com' },
  { icon: <FiGithub />, label: 'GitHub', href: 'https://github.com' },
];

const linkClass = 'text-slate-400 transition hover:text-white hover:translate-x-0.5 inline-block';

export default function Footer() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    cachedGet('/categories').then((res) => setCategories(res.data.data.categories.slice(0, 6))).catch(() => {});
  }, []);

  const subscribe = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post('/contact/subscribe', { email });
      toast.success(res.data.message);
      setEmail('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <footer className="relative mt-28">
      {/* Call to action band */}
      {!user && (
        <div className="container-page relative z-10 -mb-32 sm:-mb-36">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-accent-500 px-6 py-12 text-center text-white shadow-lift sm:px-12 sm:py-14">
            <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/15 blur-3xl" aria-hidden="true" />
            <h2 className="relative text-3xl font-semibold !text-white sm:text-4xl">Your story deserves a page.</h2>
            <p className="relative mx-auto mt-3 max-w-lg text-brand-50">Join Inkwell for free, verify your email and publish your first post in minutes.</p>
            <div className="relative mt-7 flex flex-wrap justify-center gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">Create free account <FiArrowRight /></Link>
              <Link to="/blog" className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Read stories</Link>
            </div>
          </div>
        </div>
      )}

      <div className={`bg-slate-900 text-slate-300 ${!user ? 'pt-44 sm:pt-52' : 'pt-16'}`}>
        <div className="container-page grid gap-12 pb-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-2 text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500"><FiFeather /></span>
              <span className="font-display text-2xl font-semibold">Inkwell</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">A refined home for stories, tutorials and ideas. Read widely, write boldly.</p>
            <form onSubmit={subscribe} className="mt-6 max-w-xs">
              <label htmlFor="footer-email" className="eyebrow !text-accent-300">Weekly newsletter</label>
              <div className="mt-2 flex gap-2">
                <input id="footer-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input !border-slate-700 !bg-slate-800 !text-white" />
                <Button type="submit" loading={busy} size="sm" aria-label="Subscribe"><FiArrowRight /></Button>
              </div>
            </form>
          </div>

          <nav aria-label="Explore" className="flex flex-col gap-3 text-sm lg:col-span-2">
            <span className="eyebrow !text-accent-300">Explore</span>
            <Link to="/blog" className={linkClass}>All stories</Link>
            <Link to="/topics" className={linkClass}>Topics</Link>
            <Link to="/writers" className={linkClass}>Writers</Link>
            <Link to="/write" className={linkClass}>Write a story</Link>
          </nav>

          <nav aria-label="Topics" className="flex flex-col gap-3 text-sm lg:col-span-2">
            <span className="eyebrow !text-accent-300">Popular topics</span>
            {categories.map((c) => <Link key={c._id} to={`/category/${c.slug}`} className={linkClass}>{c.name}</Link>)}
          </nav>

          <nav aria-label="Company" className="flex flex-col gap-3 text-sm lg:col-span-2">
            <span className="eyebrow !text-accent-300">Company</span>
            <Link to="/about" className={linkClass}>About</Link>
            <Link to="/contact" className={linkClass}>Contact</Link>
            <Link to="/faq" className={linkClass}>Help &amp; FAQ</Link>
          </nav>

          <nav aria-label="Legal" className="flex flex-col gap-3 text-sm lg:col-span-2">
            <span className="eyebrow !text-accent-300">Legal</span>
            <Link to="/privacy" className={linkClass}>Privacy policy</Link>
            <Link to="/terms" className={linkClass}>Terms of service</Link>
          </nav>
        </div>

        <div className="border-t border-slate-800">
          <div className="container-page flex flex-col items-center justify-between gap-4 py-6 text-xs text-slate-500 sm:flex-row">
            <p>© {new Date().getFullYear()} Inkwell. Crafted for writers and readers.</p>
            <div className="flex items-center gap-2">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-brand-400 hover:bg-brand-600 hover:text-white">{s.icon}</a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
