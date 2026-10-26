import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import AuthCard from '../components/common/AuthCard';
import Button from '../components/common/Button';
import PasswordInput from '../components/common/PasswordInput';
import { validatePassword } from '../utils/helpers';

export default function Register() {
  const { user, register, updateUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const rules = [
    { ok: password.length >= 8, text: 'At least 8 characters' },
    { ok: /[A-Za-z]/.test(password), text: 'Contains a letter' },
    { ok: /\d/.test(password), text: 'Contains a number' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validatePassword(password);
    if (problem) return toast.error(problem);
    setSubmitting(true);
    try {
      const result = await register(name.trim(), email, password);
      if (result.requiresVerification === false) {
        updateUser(result.user); // email verification is switched off on the server
        toast.success('Account created – welcome to Inkwell!');
        return navigate('/dashboard', { replace: true });
      }
      toast.success('Check your inbox for a 6-digit code');
      navigate('/verify-email', { state: { email: result.email, devOtp: result.devOtp }, replace: true });
    } catch (err) {
      toast.error(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join Inkwell to share your own stories."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link></>}
    >
      <Helmet><title>Sign up – Inkwell</title></Helmet>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="label">Name</label>
          <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" autoComplete="name" maxLength={50} required />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" autoComplete="new-password" />
          <ul className="mt-2 space-y-1 text-xs" aria-label="Password requirements">
            {rules.map((r) => (
              <li key={r.text} className={`flex items-center gap-1.5 ${r.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                <FiCheck className={r.ok ? '' : 'opacity-30'} aria-hidden="true" /> {r.text}
              </li>
            ))}
          </ul>
        </div>
        <Button type="submit" loading={submitting} className="w-full" size="lg">Create account</Button>
      </form>
    </AuthCard>
  );
}
