import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, password, displayName);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.error'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-zinc-950">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5 animate-float bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-2xl shadow-violet-500/30">
            <span className="text-3xl font-black text-white tracking-tighter">n2</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight">{t('app.name')}</h1>
          <p className="text-sm text-violet-400 font-medium italic mt-1">{t('app.fullName')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-3 text-center animate-slide-down">{error}</div>
          )}

          <input
            type="text"
            placeholder={t('auth.displayName')}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-base text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
          />

          <input
            type="text"
            placeholder={t('auth.username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-base text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
            autoComplete="username"
          />

          <input
            type="password"
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-base text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={loading || !username || !password || !displayName}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-xl active:scale-[0.98] transition-all disabled:opacity-40 text-base shadow-lg shadow-violet-500/25"
          >
            {t('auth.registerAction')}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-zinc-600">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-violet-400 font-medium hover:text-violet-300 transition-colors">{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  );
}
