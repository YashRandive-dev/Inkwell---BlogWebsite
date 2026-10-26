import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AuthCard from '../components/common/AuthCard';
import Button from '../components/common/Button';
import PasswordInput from '../components/common/PasswordInput';
import { validatePassword } from '../utils/helpers';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validatePassword(password);
    if (problem) return toast.error(problem);
    if (password !== confirm) return toast.error('Passwords do not match');
    setSubmitting(true);
    try {
      const res = await api.put(`/auth/reset-password/${token}`, { password });
      updateUser(res.data.data.user); // the API logs the user in after a successful reset
      toast.success('Password updated');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="At least 8 characters, with a letter and a number."
      footer={<Link to="/forgot-password" className="font-semibold text-brand-600 hover:underline">Request a new link</Link>}
    >
      <Helmet><title>Reset password – Inkwell</title></Helmet>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="label">New password</label>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </div>
        <div>
          <label htmlFor="confirm" className="label">Confirm password</label>
          <PasswordInput id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </div>
        <Button type="submit" loading={submitting} className="w-full" size="lg">Update password</Button>
      </form>
    </AuthCard>
  );
}
