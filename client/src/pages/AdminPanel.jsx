import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { FiEdit2, FiFileText, FiFolder, FiMessageSquare, FiPlus, FiStar, FiTrash2, FiUsers } from 'react-icons/fi';
import api, { clearCache } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { Skeleton } from '../components/common/Loader';
import SearchBar from '../components/blog/SearchBar';
import useDebounce from '../hooks/useDebounce';
import { formatDate, timeAgo, truncate } from '../utils/helpers';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'posts', label: 'Posts' },
  { id: 'comments', label: 'Comments' },
  { id: 'categories', label: 'Categories' },
];

const PIE_COLORS = ['#d4421c', '#f9b02a', '#2f7d6d', '#7a4e8c', '#e8920e', '#8d2b19', '#4f8a9c'];

function Table({ caption, head, children, loading, empty }) {
  if (loading) return <Skeleton className="h-52 w-full rounded-2xl" />;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
          <tr>{head.map((h, i) => <th key={i} scope="col" className={`px-4 py-3 ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody>
      </table>
      {empty && <p className="p-8 text-center text-sm text-slate-500">{empty}</p>}
    </div>
  );
}

const iconBtn = 'rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800';

// ---------- Overview ----------
function Overview() {
  const { theme } = useTheme();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then((res) => setData(res.data.data)).catch((err) => toast.error(err.message));
  }, []);

  const axis = theme === 'dark' ? '#a89988' : '#7e6f62';
  const tooltipStyle = { borderRadius: 12, border: '1px solid #e7dcd0', background: theme === 'dark' ? '#1f1917' : '#fff', color: theme === 'dark' ? '#f3ece4' : '#1f1917' };

  const cards = [
    { icon: FiUsers, label: 'Users', value: data?.stats.users },
    { icon: FiFileText, label: 'Posts', value: data?.stats.posts },
    { icon: FiMessageSquare, label: 'Comments', value: data?.stats.comments },
    { icon: FiFolder, label: 'Categories', value: data?.stats.categories },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ icon: Icon, label, value }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-200"><Icon size={20} /></span>
            <div>
              {data ? <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p> : <Skeleton className="mb-1 h-6 w-10" />}
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Posts per month</h2>
          {data ? (
            <div className="h-64" role="img" aria-label="Bar chart of posts created per month">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.postsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#2e2623' : '#e7dcd0'} vertical={false} />
                  <XAxis dataKey="month" stroke={axis} fontSize={12} tickLine={false} />
                  <YAxis allowDecimals={false} stroke={axis} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(212,66,28,0.08)' }} />
                  <Bar dataKey="posts" fill="#d4421c" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <Skeleton className="h-64 w-full" />}
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-bold">Posts by category</h2>
          {data ? (
            data.postsByCategory.length === 0 ? (
              <p className="py-20 text-center text-sm text-slate-500">No posts yet.</p>
            ) : (
              <div className="h-64" role="img" aria-label="Pie chart of posts by category">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.postsByCategory} dataKey="count" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} stroke="none">
                      {data.postsByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12, color: axis }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )
          ) : <Skeleton className="h-64 w-full" />}
        </div>
      </div>
    </div>
  );
}

// ---------- Users ----------
function UsersTab({ confirm }) {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 400);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/admin/users', { params: { page, search: debounced || undefined } })
      .then((res) => {
        setUsers(res.data.data.users);
        setPagination(res.data.pagination);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [page, debounced]);

  useEffect(() => load(), [load]);
  useEffect(() => setPage(1), [debounced]);

  const changeRole = async (u, role) => {
    try {
      const res = await api.put(`/admin/users/${u._id}/role`, { role });
      toast.success(res.data.message);
      setUsers((list) => list.map((x) => (x._id === u._id ? { ...x, role } : x)));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="max-w-sm"><SearchBar value={search} onChange={setSearch} placeholder="Search name or email…" /></div>
      <Table caption="Users" head={['User', 'Email', 'Role', 'Joined', 'Actions']} loading={loading} empty={users.length === 0 && 'No users found.'}>
        {users.map((u) => (
          <tr key={u._id}>
            <td className="px-4 py-3"><Link to={`/author/${u._id}`} className="flex items-center gap-3 font-medium text-slate-900 hover:text-brand-600 dark:text-white"><Avatar user={u} size="sm" />{u.name}</Link></td>
            <td className="px-4 py-3 text-slate-500">{u.email}</td>
            <td className="px-4 py-3">
              <label className="sr-only" htmlFor={`role-${u._id}`}>Role for {u.name}</label>
              <select id={`role-${u._id}`} value={u.role} disabled={u._id === me._id} onChange={(e) => changeRole(u, e.target.value)} className="input !w-28 !py-1.5">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </td>
            <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
            <td className="px-4 py-3 text-right">
              <button
                disabled={u._id === me._id}
                aria-label={`Delete ${u.name}`}
                className={`${iconBtn} hover:!text-red-600 disabled:opacity-30`}
                onClick={() => confirm({ title: `Delete ${u.name}?`, text: 'Their account, posts and comments will be permanently removed.', action: async () => { await api.delete(`/admin/users/${u._id}`); toast.success('User deleted'); load(); } })}
              >
                <FiTrash2 />
              </button>
            </td>
          </tr>
        ))}
      </Table>
      {pagination && <Pagination page={pagination.page} pages={pagination.pages} onChange={setPage} />}
    </div>
  );
}

// ---------- Posts ----------
function PostsTab({ confirm }) {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 400);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/admin/posts', { params: { page, search: debounced || undefined } })
      .then((res) => {
        setPosts(res.data.data.posts);
        setPagination(res.data.pagination);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [page, debounced]);

  useEffect(() => load(), [load]);
  useEffect(() => setPage(1), [debounced]);

  const toggleFeature = async (p) => {
    try {
      const res = await api.put(`/admin/posts/${p._id}/feature`);
      toast.success(res.data.message);
      setPosts((list) => list.map((x) => (x._id === p._id ? { ...x, featured: res.data.data.post.featured } : x)));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="max-w-sm"><SearchBar value={search} onChange={setSearch} placeholder="Search post titles…" /></div>
      <Table caption="Posts" head={['Title', 'Author', 'Status', 'Views', 'Actions']} loading={loading} empty={posts.length === 0 && 'No posts found.'}>
        {posts.map((p) => (
          <tr key={p._id}>
            <td className="max-w-[260px] truncate px-4 py-3 font-medium text-slate-900 dark:text-white">
              <Link to={`/blog/${p.slug}`} className="hover:text-brand-600">{p.title}</Link>
            </td>
            <td className="px-4 py-3 text-slate-500">{p.author?.name}</td>
            <td className="px-4 py-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>{p.status}</span>
            </td>
            <td className="px-4 py-3">{p.views}</td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1">
                <button onClick={() => toggleFeature(p)} aria-pressed={p.featured} aria-label={p.featured ? `Unfeature ${p.title}` : `Feature ${p.title}`} className={`${iconBtn} ${p.featured ? '!text-amber-500' : ''}`}>
                  <FiStar className={p.featured ? 'fill-current' : ''} />
                </button>
                <Link to={`/edit/${p.slug}`} aria-label={`Edit ${p.title}`} className={iconBtn}><FiEdit2 /></Link>
                <button
                  aria-label={`Delete ${p.title}`}
                  className={`${iconBtn} hover:!text-red-600`}
                  onClick={() => confirm({ title: 'Delete this post?', text: `“${p.title}” and its comments will be permanently deleted.`, action: async () => { await api.delete(`/posts/${p._id}`); toast.success('Post deleted'); load(); } })}
                >
                  <FiTrash2 />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </Table>
      {pagination && <Pagination page={pagination.page} pages={pagination.pages} onChange={setPage} />}
    </div>
  );
}

// ---------- Comments ----------
function CommentsTab({ confirm }) {
  const [comments, setComments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/admin/comments', { params: { page } })
      .then((res) => {
        setComments(res.data.data.comments);
        setPagination(res.data.pagination);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => load(), [load]);

  return (
    <div className="space-y-4">
      <Table caption="Comments" head={['Comment', 'User', 'Post', 'When', 'Actions']} loading={loading} empty={comments.length === 0 && 'No comments yet.'}>
        {comments.map((c) => (
          <tr key={c._id}>
            <td className="max-w-[280px] px-4 py-3">{truncate(c.content, 90)}</td>
            <td className="px-4 py-3 text-slate-500">{c.user?.name || 'Deleted user'}</td>
            <td className="max-w-[180px] truncate px-4 py-3">{c.post ? <Link to={`/blog/${c.post.slug}`} className="hover:text-brand-600">{c.post.title}</Link> : '—'}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{timeAgo(c.createdAt)}</td>
            <td className="px-4 py-3 text-right">
              <button
                aria-label="Delete comment"
                className={`${iconBtn} hover:!text-red-600`}
                onClick={() => confirm({ title: 'Delete this comment?', text: 'Replies to it will be removed as well.', action: async () => { await api.delete(`/comments/${c._id}`); toast.success('Comment deleted'); load(); } })}
              >
                <FiTrash2 />
              </button>
            </td>
          </tr>
        ))}
      </Table>
      {pagination && <Pagination page={pagination.page} pages={pagination.pages} onChange={setPage} />}
    </div>
  );
}

// ---------- Categories ----------
function CategoriesTab({ confirm }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {} (new) | category
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api
      .get('/categories')
      .then((res) => setCategories(res.data.data.categories))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  const openForm = (category = {}) => {
    setEditing(category);
    setForm({ name: category.name || '', description: category.description || '' });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing._id) await api.put(`/categories/${editing._id}`, form);
      else await api.post('/categories', form);
      clearCache();
      toast.success(editing._id ? 'Category updated' : 'Category created');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => openForm()}><FiPlus /> New category</Button></div>
      <Table caption="Categories" head={['Name', 'Slug', 'Posts', 'Actions']} loading={loading} empty={categories.length === 0 && 'No categories yet.'}>
        {categories.map((c) => (
          <tr key={c._id}>
            <td className="px-4 py-3"><p className="font-medium text-slate-900 dark:text-white">{c.name}</p><p className="text-xs text-slate-500">{truncate(c.description, 60)}</p></td>
            <td className="px-4 py-3 text-slate-500">{c.slug}</td>
            <td className="px-4 py-3">{c.postCount}</td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1">
                <button onClick={() => openForm(c)} aria-label={`Edit ${c.name}`} className={iconBtn}><FiEdit2 /></button>
                <button
                  aria-label={`Delete ${c.name}`}
                  className={`${iconBtn} hover:!text-red-600`}
                  onClick={() => confirm({ title: `Delete “${c.name}”?`, text: 'Categories that still have posts cannot be deleted.', action: async () => { await api.delete(`/categories/${c._id}`); clearCache(); toast.success('Category deleted'); load(); } })}
                >
                  <FiTrash2 />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?._id ? 'Edit category' : 'New category'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label htmlFor="cat-name" className="label">Name</label>
            <input id="cat-name" className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={40} required autoFocus />
          </div>
          <div>
            <label htmlFor="cat-desc" className="label">Description</label>
            <textarea id="cat-desc" className="input min-h-[80px]" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} maxLength={200} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState('overview');
  const [pending, setPending] = useState(null); // { title, text, action }
  const [working, setWorking] = useState(false);

  const run = async () => {
    setWorking(true);
    try {
      await pending.action();
      setPending(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="container-page py-10 sm:py-14">
      <Helmet><title>Admin panel – Inkwell</title><meta name="robots" content="noindex" /></Helmet>
      <h1 className="text-3xl font-extrabold">Admin panel</h1>
      <p className="mb-8 mt-1 text-slate-500">Manage users, posts, comments and categories.</p>

      <div role="tablist" aria-label="Admin sections" className="mb-8 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`relative shrink-0 px-4 py-3 text-sm font-medium transition ${tab === t.id ? 'text-brand-600 dark:text-brand-300' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            {t.label}
            {tab === t.id && <motion.span layoutId="admin-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-600" />}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'overview' && <Overview />}
        {tab === 'users' && <UsersTab confirm={setPending} />}
        {tab === 'posts' && <PostsTab confirm={setPending} />}
        {tab === 'comments' && <CommentsTab confirm={setPending} />}
        {tab === 'categories' && <CategoriesTab confirm={setPending} />}
      </div>

      <Modal
        open={!!pending}
        onClose={() => setPending(null)}
        title={pending?.title}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPending(null)}>Cancel</Button>
            <Button variant="danger" loading={working} onClick={run}>Delete</Button>
          </>
        }
      >
        {pending?.text}
      </Modal>
    </div>
  );
}
