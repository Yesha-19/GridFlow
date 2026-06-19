import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Radar,
  Lock,
  Mail,
  User as UserIcon,
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        navigate('/dashboard'); // redirect after login
      } else {
        if (!username) {
          throw new Error("Username is required");
        }
        await signup(email, password, username);
        // Supabase might require email confirmation, but usually logs them in immediately if disabled.
        alert("Account created successfully! You can now log in.");
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      {/* Tactical grid backdrop, consistent with the console theme, fading toward the edges */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid opacity-40"
        style={{
          maskImage: 'radial-gradient(ellipse 60% 55% at 50% 35%, black 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 35%, black 0%, transparent 75%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-signal/10 blur-[110px]"
      />

      <div className="relative w-full max-w-md">
        {/* Brand mark */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-signal shadow-glow">
            <Radar className="h-6 w-6 text-white" />
          </div>
          <span className="mt-3 font-display text-base font-bold tracking-wider text-console-text">
            GRIDFLOW 
          </span>
        </div>

        <div className="rounded-2xl border border-console-border bg-console-panel/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-7 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-console-border bg-console-raised px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-signal">
              {isLogin ? <Lock size={11} /> : <UserIcon size={11} />}
              {isLogin ? 'Console Access' : 'New Registration'}
            </span>
            <h1 className="mt-3 font-display text-2xl font-semibold text-console-text sm:text-[28px]">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-console-muted">
              {isLogin
                ? 'Sign in to access the tactical control console.'
                : 'Register to start forecasting congestion risk.'}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2 rounded-md border border-risk-critical/40 bg-risk-critical/10 px-3 py-2.5 text-xs text-risk-critical animate-fade-in"
            >
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Field label="Username" htmlFor="auth-username">
                <UserIcon
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-console-muted"
                />
                <input
                  id="auth-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="input pl-10 pr-4 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="e.g. officer_smith"
                />
              </Field>
            )}

            <Field label="Email address" htmlFor="auth-email">
              <Mail
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-console-muted"
              />
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="input pl-10 pr-4 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="officer@gridlock.gov"
              />
            </Field>

            <Field label="Password" htmlFor="auth-password">
              <Lock
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-console-muted"
              />
              <input
                id="auth-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="input pl-10 pr-10 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-console-muted transition-colors hover:text-console-text"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-signal py-3 text-sm font-bold tracking-wide text-white transition-colors hover:bg-signal/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  {isLogin ? 'Authenticating…' : 'Creating account…'}
                </span>
              ) : (
                <>
                  {isLogin ? 'Sign in' : 'Create account'}
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-console-muted">
            {isLogin ? 'Need an account?' : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="font-semibold text-signal transition-colors hover:text-signal/80"
            >
              {isLogin ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-console-muted/70">
          Flipkart Gridflow Hackathon 
        </p>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-console-muted"
      >
        {label}
      </label>
      <div className="relative">{children}</div>
    </div>
  );
}