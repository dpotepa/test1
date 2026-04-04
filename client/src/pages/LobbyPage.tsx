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
  const [dailyQuestion, setDailyQuestion] = useState<any>(null);

  useEffect(() => {
    loadSessions();
    loadDailyQuestion();
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

  const loadDailyQuestion = async () => {
    try {
      const res = await api.get('/questions/daily');
      if (res.data) setDailyQuestion(res.data);
    } catch (err) {
      console.error('Failed to load daily question:', err);
    }
  };

  const createSession = async (mode: 'duo' | 'party' = 'duo') => {
    try {
      const res = await api.post('/sessions', { mode });
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
      waiting: 'bg-amber-50 text-amber-600 border border-amber-200',
      active: 'bg-sage-50 text-sage-600 border border-sage-200',
      archived: 'bg-warm-100 text-warm-500 border border-warm-200',
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
    <div className="min-h-dvh notebook-bg pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-black text-warm-800 tracking-tight">{t('app.name')}</h1>
            <p className="text-sage-500 text-sm font-hand">{t('app.fullName')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-warm-600">{user?.displayName}</p>
          </div>
        </div>

        {/* Question of the day */}
        {dailyQuestion && (
          <div className="card-paper rounded-2xl p-5 mb-5 animate-fade-in relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                {t('lobby.questionOfDay')}
              </span>
              <span className="text-xs text-warm-400">{dailyQuestion.category_name}</span>
            </div>
            <p className="text-warm-700 text-base leading-relaxed font-hand text-xl">{dailyQuestion.text}</p>
          </div>
        )}

        {/* Create session */}
        <div className="flex gap-2 animate-slide-up">
          <button
            onClick={() => createSession('duo')}
            className="flex-1 py-4 bg-sage-500 hover:bg-sage-600 text-white font-semibold rounded-2xl active:scale-[0.98] transition-all text-base shadow-sm"
          >
            {t('lobby.createDuo')}
          </button>
          <button
            onClick={() => createSession('party')}
            className="flex-1 py-4 bg-warm-700 hover:bg-warm-800 text-white font-semibold rounded-2xl active:scale-[0.98] transition-all text-base shadow-sm"
          >
            {t('lobby.createParty')}
          </button>
        </div>

        {/* Join by code */}
        <div className="flex gap-2 mt-4 animate-slide-up" style={{ animationDelay: '80ms' }}>
          <input
            type="text"
            placeholder={t('lobby.joinPlaceholder')}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="flex-1 px-4 py-3 bg-white border border-paper-border rounded-xl text-base text-warm-800 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-sage-400/50 focus:border-sage-400/50 transition-all"
            onKeyDown={(e) => e.key === 'Enter' && joinSession()}
          />
          <button
            onClick={joinSession}
            disabled={!joinCode.trim()}
            className="px-6 py-3 bg-white border border-paper-border rounded-xl font-medium text-sage-600 active:bg-sage-50 transition-all disabled:opacity-30"
          >
            {t('lobby.join')}
          </button>
        </div>

        {/* Session list */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: '160ms' }}>
          <h2 className="text-sm font-hand text-warm-500 tracking-wider mb-3">
            {t('lobby.title')}
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-sage-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-warm-400 text-sm">{t('lobby.noSessions')}</div>
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
                    className="w-full note-card rounded-2xl p-4 text-left active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-warm-700">
                          {partnerName
                            ? `${t('lobby.withPartner')} ${partnerName}`
                            : t('lobby.waiting')
                          }
                        </p>
                        <p className="text-xs text-warm-400 mt-1">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.mode === 'party' && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-warm-100 text-warm-600 border border-warm-200">
                            {t('lobby.party')}
                          </span>
                        )}
                        {statusBadge(session.status)}
                      </div>
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
