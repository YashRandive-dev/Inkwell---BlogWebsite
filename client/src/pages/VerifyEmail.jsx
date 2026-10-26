import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { FiMail } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import AuthCard from '../components/common/AuthCard';
import Button from '../components/common/Button';

const LENGTH = 6;
const COOLDOWN = 60;

// Step 2 of sign-up: enter the 6-digit code emailed to the user.
export default function VerifyEmail() {
  const { user, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const [devOtp, setDevOtp] = useState(location.state?.devOtp || '');

  const [digits, setDigits] = useState(Array(LENGTH).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [seconds, setSeconds] = useState(COOLDOWN);
  const inputs = useRef([]);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  if (user) return <Navigate to="/dashboard" replace />;
  if (!email) return <Navigate to="/register" replace />;

  const submit = async (code) => {
    setSubmitting(true);
    try {
      const verified = await verifyOtp(email, code);
      toast.success(`Welcome to Inkwell, ${verified.name.split(' ')[0]}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setDigits(Array(LENGTH).fill(''));
      inputs.current[0]?.focus();
      setSubmitting(false);
    }
  };

  const update = (index, value) => {
    const clean = value.replace(/\D/g, '');
    if (!clean && value) return;
    const next = [...digits];
    // Typing or pasting several digits fills the following boxes.
    clean.slice(0, LENGTH - index).split('').forEach((d, i) => (next[index + i] = d));
    if (!clean) next[index] = '';
    setDigits(next);
    const focusAt = Math.min(index + Math.max(clean.length, 1), LENGTH - 1);
    if (clean) inputs.current[focusAt]?.focus();
    if (next.every(Boolean)) submit(next.join(''));
  };

  const onKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const resend = async () => {
    try {
      const res = await resendOtp(email);
      setDevOtp(res.data.data?.devOtp || '');
      toast.success('A new code is on its way');
      setSeconds(COOLDOWN);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <AuthCard
      title="Check your email"
      subtitle={`We sent a 6-digit code to ${email}. It expires in 10 minutes.`}
      footer={<>Wrong email? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Start over</Link></>}
    >
      <Helmet><title>Verify email – Inkwell</title></Helmet>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (digits.every(Boolean)) submit(digits.join(''));
        }}
        className="space-y-6"
      >
        <div className="flex justify-between gap-2" role="group" aria-label="Verification code">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              value={d}
              onChange={(e) => update(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={LENGTH}
              aria-label={`Digit ${i + 1}`}
              disabled={submitting}
              className="h-14 w-full max-w-[3.5rem] rounded-xl border border-slate-300 bg-white text-center text-2xl font-semibold text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          ))}
        </div>

        <Button type="submit" loading={submitting} disabled={!digits.every(Boolean)} className="w-full" size="lg">
          <FiMail /> Verify email
        </Button>

        <p className="text-center text-sm text-slate-500">
          Didn&apos;t get it?{' '}
          {seconds > 0 ? (
            <span>Resend in {seconds}s</span>
          ) : (
            <button type="button" onClick={resend} className="font-semibold text-brand-600 hover:underline">Resend code</button>
          )}
        </p>
        {devOtp && (
          <div className="rounded-xl border border-accent-300 bg-accent-50 p-4 text-sm text-accent-900 dark:border-accent-700 dark:bg-accent-900/20 dark:text-accent-100">
            <p className="font-semibold">Developer mode: email isn&apos;t being delivered</p>
            <p className="mt-1">Your code is <strong className="tracking-widest">{devOtp}</strong>. Check the SMTP settings in <code>server/.env</code> to send real emails.</p>
            <button type="button" onClick={() => { setDigits(devOtp.split('')); submit(devOtp); }} className="mt-3 font-semibold text-brand-700 underline dark:text-brand-300">Use this code</button>
          </div>
        )}
      </form>
    </AuthCard>
  );
}
