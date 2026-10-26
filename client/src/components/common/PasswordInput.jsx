import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

// A password field with a show/hide toggle.
export default function PasswordInput({ id, value, onChange, placeholder, autoComplete = 'current-password', required = true }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className="input pr-11"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      >
        {visible ? <FiEyeOff /> : <FiEye />}
      </button>
    </div>
  );
}
