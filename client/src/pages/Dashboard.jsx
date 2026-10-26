import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiBookmark, FiEdit2, FiEye, FiFileText, FiHeart, FiMessageSquare, FiPlus, FiSettings, FiTrash2, FiUpload } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import PasswordInput from '../components/common/PasswordInput';
import PostList from '../components/blog/PostList';
import { Skeleton } from '../components/common/Loader';
import { compactNumber, formatDate, validatePassword } from '../utils/helpers';

const TABS = [
  { id: 'posts', label: 'My posts', icon: FiFileText },
  { id: 'saved', label: 'Saved posts', icon: FiBookmark },
  { id: 'settings', label: 'Settings', icon: FiSettings },
];

function StatCard({ icon: Icon, label, value, loading }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card flex items-center gap-4 p-5">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-200">
        <Icon size={20} />
      </span>
      <div>
        {loading ? <Skeleton className="mb-1 h-6 w-12" /> : <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{compactNumber(value)}</p>}
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </motion.div>
  );
}

// ---- My posts table ----
function MyPosts({ posts, loading, onDelete }) {
  if (loading) return <Skeleton className="h-48 w-full rounded-2xl" />;
  if (posts.length === 0) {
    return (
      <div className="card flex flex-col items-center px-6 py-14 text-center">
        <FiFileText size={28} className="mb-3 text-brand-600" aria-hidden="true" />
        <h3 className="text-lg font-semibold">No posts yet – write your first one</h3>
        <p className="mt-1 text-sm text-slate-500">Your published posts and drafts will appear here.</p>
        <Button to="/write" className="mt-5"><FiPlus /> Write a post</Button>
      </div>
    );
  }
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Your posts</caption>
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
          <tr>
            <th scope="col" className="px-4 py-3">Title</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Views</th>
            <th scope="col" className="px-4 py-3">Likes</th>
            <th scope="col" className="px-4 py-3">Created</th>
            <th scope="col" className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {posts.map((p) => (
            <tr key={p._id}>
              <td className="max-w-[260px] truncate px-4 py-3 font-medium text-slate-900 dark:text-white">
                <Link to={`/blog/${p.slug}`} className="hover:text-brand-600">{p.title}</Link>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                  {p.status}
                </span>
              </td>
              <td className="px-4 py-3">{p.views}</td>
              <td className="px-4 py-3">{p.likesCount}</td>
              <td className="px-4 py-3 text-slate-500">{formatDate(p.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Link to={`/edit/${p.slug}`} aria-label={`Edit ${p.title}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"><FiEdit2 /></Link>
                  <button onClick={() => onDelete(p)} aria-label={`Delete ${p.title}`} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"><FiTrash2 /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Settings: edit profile + change password ----
function Settings() {
  const { user, updateUser } = useAuth();
  const fileInput = useRef(null);
  const [form, setForm] = useState({
    name: user.name,
    bio: user.bio || '',
    twitter: user.socialLinks?.twitter || '',
    github: user.socialLinks?.github || '',
    linkedin: user.socialLinks?.linkedin || '',
    website: user.socialLinks?.website || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => () => avatarPreview && URL.revokeObjectURL(avatarPreview), [avatarPreview]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const pickAvatar = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return toast.error('Only jpg, png and webp images are allowed');
    if (file.size > 2 * 1024 * 1024) return toast.error('Image must be 2MB or smaller');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setRemoveAvatar(false);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    const body = new FormData();
    body.append('name', form.name.trim());
    body.append('bio', form.bio.trim());
    body.append('socialLinks', JSON.stringify({ twitter: form.twitter, github: form.github, linkedin: form.linkedin, website: form.website }));
    if (avatarFile) body.append('avatar', avatarFile);
    else if (removeAvatar) body.append('removeAvatar', 'true');
    setSaving(true);
    try {
      const res = await api.put('/users/profile', body);
      updateUser(res.data.data.user);
      setAvatarFile(null);
      setAvatarPreview('');
      setRemoveAvatar(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const problem = validatePassword(pw.newPassword);
    if (problem) return toast.error(problem);
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', pw);
      toast.success('Password changed');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  const shownAvatar = removeAvatar ? { ...user, avatar: null } : avatarPreview ? { ...user, avatar: { url: avatarPreview } } : user;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="card space-y-4 p-6">
        <h2 className="text-lg font-bold">Edit profile</h2>
        <div className="flex items-center gap-4">
          <Avatar user={shownAvatar} size="xl" />
          <div className="flex flex-col gap-2">
            <Button variant="secondary" size="sm" onClick={() => fileInput.current?.click()}><FiUpload /> Upload photo</Button>
            {(user.avatar?.url || avatarPreview) && !removeAvatar && (
              <Button variant="ghost" size="sm" onClick={() => { setAvatarFile(null); setAvatarPreview(''); setRemoveAvatar(!!user.avatar?.url); }}>Remove</Button>
            )}
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickAvatar} />
          </div>
        </div>
        <div>
          <label htmlFor="p-name" className="label">Name</label>
          <input id="p-name" className="input" value={form.name} onChange={set('name')} maxLength={50} required />
        </div>
        <div>
          <label htmlFor="p-bio" className="label">Bio <span className="font-normal text-slate-400">({form.bio.length}/300)</span></label>
          <textarea id="p-bio" className="input min-h-[90px]" value={form.bio} onChange={set('bio')} maxLength={300} placeholder="Tell readers a little about yourself" />
        </div>
        {['twitter', 'github', 'linkedin', 'website'].map((k) => (
          <div key={k}>
            <label htmlFor={`p-${k}`} className="label capitalize">{k}</label>
            <input id={`p-${k}`} className="input" value={form[k]} onChange={set(k)} placeholder={`https://${k === 'website' ? 'yoursite.com' : `${k}.com/username`}`} />
          </div>
        ))}
        <Button type="submit" loading={saving}>Save changes</Button>
      </form>

      <form onSubmit={changePassword} className="card h-fit space-y-4 p-6">
        <h2 className="text-lg font-bold">Change password</h2>
        <div>
          <label htmlFor="cur-pw" className="label">Current password</label>
          <PasswordInput id="cur-pw" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="new-pw" className="label">New password</label>
          <PasswordInput id="new-pw" value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} autoComplete="new-password" />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters, with a letter and a number.</p>
        </div>
        <Button type="submit" loading={pwSaving}>Update password</Button>
      </form>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('posts');
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, p, b] = await Promise.all([api.get('/users/me/stats'), api.get('/users/me/posts'), api.get('/users/me/bookmarks')]);
      setStats(s.data.data.stats);
      setPosts(p.data.data.posts);
      setSaved(b.data.data.posts);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/posts/${toDelete._id}`);
      toast.success('Post deleted');
      setToDelete(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const cards = [
    { icon: FiFileText, label: 'Total posts', value: stats?.totalPosts ?? 0 },
    { icon: FiEye, label: 'Total views', value: stats?.totalViews ?? 0 },
    { icon: FiHeart, label: 'Total likes', value: stats?.totalLikes ?? 0 },
    { icon: FiMessageSquare, label: 'Total comments', value: stats?.totalComments ?? 0 },
  ];

  return (
    <div className="container-page py-10 sm:py-14">
      <Helmet><title>Dashboard – Inkwell</title></Helmet>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar user={user} size="lg" />
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">Hi, {user.name.split(' ')[0]} 👋</h1>
            <p className="text-sm text-slate-500">Here&apos;s how your writing is doing.</p>
          </div>
        </div>
        <Button to="/write"><FiPlus /> New post</Button>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => <StatCard key={c.label} {...c} loading={loading} />)}
      </div>

      <div role="tablist" aria-label="Dashboard sections" className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition ${tab === id ? 'text-brand-600 dark:text-brand-300' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Icon /> {label}
            {id === 'saved' && saved.length > 0 && <span className="rounded-full bg-slate-100 px-2 text-xs dark:bg-slate-800">{saved.length}</span>}
            {tab === id && <motion.span layoutId="dash-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-600" />}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'posts' && <MyPosts posts={posts} loading={loading} onDelete={setToDelete} />}
        {tab === 'saved' && (
          <PostList
            posts={saved}
            loading={loading}
            emptyTitle="Nothing saved yet"
            emptyText="Tap the bookmark on any post to keep it here for later."
            emptyAction={{ to: '/blog', label: 'Browse posts' }}
          />
        )}
        {tab === 'settings' && <Settings />}
      </div>

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete this post?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>Delete</Button>
          </>
        }
      >
        &ldquo;{toDelete?.title}&rdquo; and all of its comments will be permanently deleted.
      </Modal>
    </div>
  );
}
