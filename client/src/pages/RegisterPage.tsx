import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get('redirect') || '/';
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
      navigate(redirect);
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.error'));
    }
    setLoading(false);
  };

  const loginUrl = redirect !== '/' ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 notebook-bg">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5 animate-float bg-sage-500 shadow-lg shadow-sage-500/20">
            <span className="text-3xl font-black text-white tracking-tighter">n2</span>
          </div>
          <h1 className="text-5xl font-black text-warm-800 tracking-tight">{t('app.name')}</h1>
          <p className="text-2xl font-hand text-sage-500 mt-1">{t('app.fullName')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3 text-center animate-slide-down">{error}</div>
          )}

          <input
            type="text"
            placeholder={t('auth.displayName')}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value.slice(0, 30))}
            maxLength={30}
            className="w-full px-4 py-3.5 bg-white border border-paper-border rounded-xl text-base text-warm-800 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-sage-400/50 focus:border-sage-400/50 transition-all"
          />

          <input
            type="text"
            placeholder={t('auth.username')}
            value={username}
            onChange={(e) => setUsername(e.target.value.slice(0, 50))}
            maxLength={50}
            className="w-full px-4 py-3.5 bg-white border border-paper-border rounded-xl text-base text-warm-800 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-sage-400/50 focus:border-sage-400/50 transition-all"
            autoComplete="username"
          />

          <input
            type="password"
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 bg-white border border-paper-border rounded-xl text-base text-warm-800 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-sage-400/50 focus:border-sage-400/50 transition-all"
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={loading || !username || !password || !displayName}
            className="w-full py-3.5 bg-sage-500 hover:bg-sage-600 text-white font-semibold rounded-xl active:scale-[0.98] transition-all disabled:opacity-40 text-base shadow-sm"
          >
            {t('auth.registerAction')}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-warm-500">
          {t('auth.hasAccount')}{' '}
          <Link to={loginUrl} className="text-sage-500 font-medium hover:text-sage-600 transition-colors">{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  );
}
