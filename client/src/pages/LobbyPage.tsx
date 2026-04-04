import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LobbyPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await api.get('/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
    setLoading(false);
  };

  const createSession = async () => {
    try {
      const res = await api.post('/sessions');
      navigate(`/session/${res.data.id}`);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const joinSession = async () => {
    if (!joinCode.trim()) return;
    try {
      const res = await api.post(`/sessions/join/${joinCode.trim()}`);
      navigate(`/session/${res.data.id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || t('common.error'));
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      waiting: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      active: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      archived: 'bg-zinc-800 text-zinc-500 border border-zinc-700',
    };
    const labels: Record<string, string> = {
      waiting: t('lobby.waiting'),
      active: t('lobby.active'),
      archived: t('lobby.archived'),
    };
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-dvh bg-zinc-950 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">{t('app.name')}</h1>
            <p className="text-zinc-600 text-xs italic">{t('app.fullName')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-zinc-400">{user?.displayName}</p>
          </div>
        </div>

        {/* Create session */}
        <button
          onClick={createSession}
          className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-2xl active:scale-[0.98] transition-all text-base shadow-lg shadow-violet-500/25 animate-slide-up"
        >
          + {t('lobby.createSession')}
        </button>

        {/* Join by code */}
        <div className="flex gap-2 mt-4 animate-slide-up" style={{ animationDelay: '80ms' }}>
          <input
            type="text"
            placeholder={t('lobby.joinPlaceholder')}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-base text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
            onKeyDown={(e) => e.key === 'Enter' && joinSession()}
          />
          <button
            onClick={joinSession}
            disabled={!joinCode.trim()}
            className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-xl font-medium text-violet-400 active:bg-zinc-800 transition-all disabled:opacity-30"
          >
            {t('lobby.join')}
          </button>
        </div>

        {/* Session list */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: '160ms' }}>
          <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3">
            {t('lobby.title')}
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-sm">{t('lobby.noSessions')}</div>
          ) : (
            <div className="space-y-2 stagger-children">
              {sessions.map((session) => {
                const partnerName = session.user1_id === user?.id
                  ? session.user2_name
                  : session.user1_name;

                return (
                  <button
                    key={session.id}
                    onClick={() => navigate(`/session/${session.id}`)}
                    className="w-full bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-4 border border-zinc-800 text-left active:scale-[0.98] transition-all hover:border-zinc-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-zinc-200">
                          {partnerName
                            ? `${t('lobby.withPartner')} ${partnerName}`
                            : t('lobby.waiting')
                          }
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {statusBadge(session.status)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
