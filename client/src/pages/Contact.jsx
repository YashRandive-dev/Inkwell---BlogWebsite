import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { FiClock, FiHelpCircle, FiMail, FiMapPin, FiSend } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';

const info = [
  { icon: FiMail, title: 'Email us', text: 'hello@inkwell.example' },
  { icon: FiClock, title: 'Response time', text: 'Within one business day' },
  { icon: FiMapPin, title: 'Where we are', text: 'Remote, worldwide' },
];

export default function Contact() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.post('/contact', form);
      toast.success(res.data.message);
      setForm((f) => ({ ...f, subject: '', message: '' }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact – Inkwell</title>
        <meta name="description" content="Get in touch with the Inkwell team." />
      </Helmet>
      <PageHeader eyebrow="Contact" title="Let's start a conversation" subtitle="Questions, feedback or ideas? Send us a note and we'll reply as soon as we can." crumbs={[{ label: 'Contact' }]} />

      <div className="container-page grid gap-10 py-14 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          {info.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card flex items-center gap-4 p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30"><Icon size={20} /></span>
              <div>
                <p className="font-display text-lg font-semibold">{title}</p>
                <p className="text-sm text-slate-500">{text}</p>
              </div>
            </div>
          ))}
          <Link to="/faq" className="card group flex items-center gap-4 p-5 transition hover:border-brand-300 hover:shadow-lift">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white"><FiHelpCircle size={20} /></span>
            <div>
              <p className="font-display text-lg font-semibold">Check the FAQ first</p>
              <p className="text-sm text-slate-500">Your answer may already be there.</p>
            </div>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-8 lg:col-span-3">
          <h2 className="text-2xl font-semibold">Send a message</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="c-name" className="label">Name</label>
              <input id="c-name" className="input" value={form.name} onChange={set('name')} maxLength={80} required />
            </div>
            <div>
              <label htmlFor="c-email" className="label">Email</label>
              <input id="c-email" type="email" className="input" value={form.email} onChange={set('email')} required />
            </div>
          </div>
          <div>
            <label htmlFor="c-subject" className="label">Subject</label>
            <input id="c-subject" className="input" value={form.subject} onChange={set('subject')} maxLength={120} required />
          </div>
          <div>
            <label htmlFor="c-message" className="label">Message <span className="font-normal text-slate-400">({form.message.length}/2000)</span></label>
            <textarea id="c-message" className="input min-h-[160px]" value={form.message} onChange={set('message')} minLength={10} maxLength={2000} required />
          </div>
          <Button type="submit" loading={sending} size="lg"><FiSend /> Send message</Button>
        </form>
      </div>
    </>
  );
}
