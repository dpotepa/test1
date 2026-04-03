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
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gradient-to-b from-indigo-50 to-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-3xl mb-4 shadow-lg shadow-indigo-200">
            <span className="text-3xl font-black text-white tracking-tighter">n2</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">{t('app.name')}</h1>
          <p className="text-sm text-indigo-500 font-medium italic mt-1">{t('app.fullName')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 text-center">{error}</div>
          )}

          <input
            type="text"
            placeholder={t('auth.displayName')}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />

          <input
            type="text"
            placeholder={t('auth.username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            autoComplete="username"
          />

          <input
            type="password"
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={loading || !username || !password || !displayName}
            className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-xl active:bg-indigo-700 transition-colors disabled:opacity-50 text-base"
          >
            {t('auth.registerAction')}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-indigo-600 font-medium">{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  );
}
