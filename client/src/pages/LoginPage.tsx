import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, guestLogin } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGuest, setShowGuest] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.error'));
    }
    setLoading(false);
  };

  const handleGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setError('');
    setLoading(true);
    try {
      await guestLogin(guestName.trim());
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
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5 animate-float bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-2xl shadow-violet-500/30">
            <span className="text-3xl font-black text-white tracking-tighter">n2</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight">{t('app.name')}</h1>
          <p className="text-sm text-violet-400 font-medium italic mt-1">{t('app.fullName')}</p>
          <p className="text-zinc-500 mt-4 text-sm leading-relaxed max-w-xs mx-auto">{t('app.description')}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-3 text-center animate-slide-down mb-4">{error}</div>
        )}

        {!showGuest ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
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
                autoComplete="current-password"
              />

              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-xl active:scale-[0.98] transition-all disabled:opacity-40 text-base shadow-lg shadow-violet-500/25"
              >
                {t('auth.loginAction')}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-zinc-950 px-3 text-sm text-zinc-600">{t('session.or')}</span>
              </div>
            </div>

            <button
              onClick={() => setShowGuest(true)}
              className="w-full py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium rounded-xl active:scale-[0.98] transition-all text-base hover:border-zinc-700"
            >
              {t('auth.guestAction')}
            </button>

            <p className="text-center mt-6 text-sm text-zinc-600">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-violet-400 font-medium hover:text-violet-300 transition-colors">{t('auth.register')}</Link>
            </p>
          </>
        ) : (
          <>
            <form onSubmit={handleGuest} className="space-y-3 animate-slide-up">
              <input
                type="text"
                placeholder={t('auth.guestNamePlaceholder')}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-base text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                autoFocus
              />

              <button
                type="submit"
                disabled={loading || !guestName.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-xl active:scale-[0.98] transition-all disabled:opacity-40 text-base shadow-lg shadow-violet-500/25"
              >
                {t('auth.guestStart')}
              </button>
            </form>

            <button
              onClick={() => setShowGuest(false)}
              className="w-full text-center mt-4 text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {t('common.back')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
