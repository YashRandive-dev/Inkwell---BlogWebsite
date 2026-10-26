import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AuthCard from '../components/common/AuthCard';
import Button from '../components/common/Button';
import PasswordInput from '../components/common/PasswordInput';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const loggedIn = await login(email, password);
      toast.success(`Welcome back, ${loggedIn.name.split(' ')[0]}!`);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response?.data?.data?.requiresVerification) {
        toast('Please verify your email to continue', { icon: '✉️' });
        return navigate('/verify-email', { state: { email: err.response.data.data.email, devOtp: err.response.data.data.devOtp }, replace: true });
      }
      toast.error(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to write, comment and save posts."
      footer={<>New to Inkwell? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create an account</Link></>}
    >
      <Helmet><title>Log in – Inkwell</title></Helmet>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <Link to="/forgot-password" className="text-xs font-medium text-brand-600 hover:underline">Forgot password?</Link>
          </div>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
        </div>
        <Button type="submit" loading={submitting} className="w-full" size="lg">Log in</Button>
      </form>
    </AuthCard>
  );
}
