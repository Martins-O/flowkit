import React, { useState } from 'react';

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
}

export function AuthForm({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Flowkit</h1>
        <p className="text-sm text-gray-500 mt-1">Sign in to sync your sessions</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-brand-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-brand-400"
        />

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-2xl font-semibold text-sm text-white bg-brand-600 hover:bg-brand-400 transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="text-xs text-gray-600 text-center">
        No account?{' '}
        <a
          href="https://flowkit.app/register"
          target="_blank"
          rel="noreferrer"
          className="text-brand-400 hover:underline"
        >
          Create one at flowkit.app
        </a>
      </p>
    </div>
  );
}
