import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Briefcase } from 'lucide-react';
import Button from '../components/shared/Button';
import Input from '../components/shared/Input';

const FIREBASE_ERRORS = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/network-request-failed': 'Network error. Check your connection.',
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);

    try {
      await register(email, password);
      navigate('/');
    } catch (err) {
      setError(FIREBASE_ERRORS[err.code] || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-default px-4 py-8 animate-fade-in">
      <div className="w-full max-w-[400px] flex flex-col gap-6">
        <div className="rounded-[20px] bg-surface-default border border-border-default p-6 shadow-sm flex flex-col gap-5">
          <div className="text-center flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-[14px] bg-brand-primary text-white flex items-center justify-center shadow-none mb-1">
              <Briefcase className="w-6 h-6" />
            </div>
            <h1 className="text-[22px] font-bold text-text-primary tracking-tight">
              Create Account
            </h1>
            <p className="text-[14px] text-text-secondary">
              Start tracking jobs instantly with JobPulse
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-[12px] border border-danger-main/20 bg-danger-bg text-[13px] font-medium text-danger-main text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>
          </form>
        </div>

        <p className="text-center text-[14px] text-text-secondary">
          Already have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-brand-primary hover:text-brand-hover transition-colors"
          >
            Sign in
          </Link>
        </p>

        <p className="text-center text-[12px] text-text-muted">
          JobPulse — Doorbell camera for job postings
        </p>
      </div>
    </div>
  );
}
