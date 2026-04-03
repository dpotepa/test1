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
      waiting: 'bg-amber-100 text-amber-700',
      active: 'bg-green-100 text-green-700',
      archived: 'bg-gray-100 text-gray-500',
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
    <div className="min-h-dvh bg-gray-50 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t('app.name')}</h1>
            <p className="text-gray-400 text-xs italic">{t('app.fullName')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">{user?.displayName}</p>
          </div>
        </div>

        {/* Create session */}
        <button
          onClick={createSession}
          className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-2xl active:bg-indigo-700 transition-colors text-base shadow-sm"
        >
          + {t('lobby.createSession')}
        </button>

        {/* Join by code */}
        <div className="flex gap-2 mt-4">
          <input
            type="text"
            placeholder={t('lobby.joinPlaceholder')}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => e.key === 'Enter' && joinSession()}
          />
          <button
            onClick={joinSession}
            disabled={!joinCode.trim()}
            className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-medium text-indigo-600 active:bg-gray-50 transition-colors disabled:opacity-40"
          >
            {t('lobby.join')}
          </button>
        </div>

        {/* Session list */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t('lobby.title')}
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-400">{t('common.loading')}</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">{t('lobby.noSessions')}</div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const partnerName = session.user1_id === user?.id
                  ? session.user2_name
                  : session.user1_name;

                return (
                  <button
                    key={session.id}
                    onClick={() => navigate(`/session/${session.id}`)}
                    className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">
                          {partnerName
                            ? `${t('lobby.withPartner')} ${partnerName}`
                            : t('lobby.waiting')
                          }
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
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
