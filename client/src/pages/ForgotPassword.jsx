import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { FiMail } from 'react-icons/fi';
import api from '../api/axios';
import AuthCard from '../components/common/AuthCard';
import Button from '../components/common/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
      footer={<Link to="/login" className="font-semibold text-brand-600 hover:underline">Back to log in</Link>}
    >
      <Helmet><title>Forgot password – Inkwell</title></Helmet>
      {sent ? (
        <div className="rounded-xl bg-emerald-50 p-5 text-center text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" role="status">
          <FiMail className="mx-auto mb-2" size={22} aria-hidden="true" />
          If an account exists for <strong>{email}</strong>, a reset link is on its way. It expires in 30 minutes.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
          </div>
          <Button type="submit" loading={submitting} className="w-full" size="lg">Send reset link</Button>
        </form>
      )}
    </AuthCard>
  );
}
