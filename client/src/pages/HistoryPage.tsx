import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import SessionHistory from '../components/SessionHistory';

export default function HistoryPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sessions').then((res) => {
      setSessions(res.data.filter((s: any) => s.status !== 'waiting'));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedSession) {
      api.get(`/sessions/${selectedSession}/rounds`).then((res) => setRounds(res.data));
    }
  }, [selectedSession]);

  return (
    <div className="min-h-dvh notebook-bg pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        <h1 className="text-2xl font-black text-warm-800 animate-fade-in">{t('history.title')}</h1>

        {loading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-sage-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-warm-400 text-sm">{t('history.noHistory')}</div>
        ) : (
          <div className="space-y-2 stagger-children">
            {sessions.map((session) => {
              const partnerName = session.user1_id === user?.id
                ? session.user2_name
                : session.user1_name;

              return (
                <div key={session.id}>
                  <button
                    onClick={() => setSelectedSession(
                      selectedSession === session.id ? null : session.id
                    )}
                    className="w-full note-card rounded-2xl p-4 text-left active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-warm-700">
                          {partnerName || t('lobby.waiting')}
                        </p>
                        <p className="text-xs text-warm-400 mt-1">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <svg
                        className={`w-5 h-5 text-warm-400 transition-transform duration-200 ${
                          selectedSession === session.id ? 'rotate-180' : ''
                        }`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {selectedSession === session.id && (
                    <div className="mt-2 ml-2 animate-slide-up">
                      <SessionHistory rounds={rounds} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
