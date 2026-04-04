import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { connectSocket } from '../socket/socket';
import QuestionPicker from '../components/QuestionPicker';
import AnswerForm from '../components/AnswerForm';
import AnswerReveal from '../components/AnswerReveal';
import PartnerStatus from '../components/PartnerStatus';
import SessionHistory from '../components/SessionHistory';

type RoundState = 'idle' | 'picking' | 'answering' | 'waiting' | 'revealed';

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState<any>(null);
  const [roundState, setRoundState] = useState<RoundState>('idle');
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [rounds, setRounds] = useState<any[]>([]);
  const [completedRoundCount, setCompletedRoundCount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const sessionIdRef = useRef<string | undefined>(id);

  const isParty = session?.mode === 'party';
  const isHost = session?.user1_id === user?.id;
  const participants = session?.participants || [];

  const partnerName = session && !isParty
    ? (session.user1_id === user?.id ? session.user2_name : session.user1_name)
    : undefined;

  useEffect(() => { sessionIdRef.current = id; }, [id]);

  useEffect(() => {
    if (!id) return;
    api.get(`/sessions/${id}`).then((res) => setSession(res.data)).catch(() => navigate('/'));
    api.get(`/sessions/${id}/rounds`).then((res) => {
      setRounds(res.data);
      // Restore active round state if one exists
      const activeRound = res.data.find((r: any) => r.status === 'answering');
      if (activeRound) {
        setCurrentRound({ id: activeRound.id, sessionId: activeRound.session_id, status: activeRound.status });
        setCurrentQuestion({
          id: activeRound.question_id,
          text: activeRound.question_text,
          category_name: activeRound.category_name,
          depth_level: activeRound.depth_level,
        });
        setRoundState('answering');
        // Check if current user already answered
        if (activeRound.user_answered) setHasAnswered(true);
      }
    });
  }, [id]);

  useEffect(() => {
    if (!id || !session) return;

    const socket = connectSocket();
    const sessionId = parseInt(id);

    const joinSession = () => {
      socket.emit('session:join', { sessionId });
    };

    joinSession();
    socket.on('connect', joinSession);

    socket.on('session:partner-joined', (data: any) => {
      if (data.user) {
        setOnlineUsers(prev => new Set([...prev, data.user.id]));
        setSession((s: any) => {
          if (!s) return s;
          const updated = { ...s, status: s.mode === 'party' ? s.status : 'active' };
          if (!isParty && data.user) {
            if (s.user1_id === user?.id) {
              updated.user2_name = data.user.displayName;
              updated.user2_id = data.user.id;
            } else {
              updated.user1_name = data.user.displayName;
              updated.user1_id = data.user.id;
            }
          }
          if (s.mode === 'party') {
            api.get(`/sessions/${id}`).then((res) => setSession(res.data));
          }
          return updated;
        });
      }
    });

    socket.on('session:partner-left', (data: any) => {
      if (data.userId) {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    });

    socket.on('session:started', () => {
      setSession((s: any) => s ? { ...s, status: 'active' } : s);
    });

    socket.on('round:started', (data: any) => {
      setCurrentRound(data.round);
      setCurrentQuestion(data.question);
      setRoundState('answering');
      setHasAnswered(data.alreadyAnswered || false);
      setRevealedAnswers([]);
    });

    socket.on('round:partner-answered', () => {});

    socket.on('round:revealed', (data: any) => {
      setRevealedAnswers(data.answers);
      setRoundState('revealed');
      if (typeof data.roundCount === 'number') {
        setCompletedRoundCount(data.roundCount);
      }
      api.get(`/sessions/${id}/rounds`).then((res) => setRounds(res.data));
    });

    const handleBeforeUnload = () => {
      socket.emit('session:leave', { sessionId });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      socket.emit('session:leave', { sessionId });
      socket.off('connect', joinSession);
      socket.off('session:partner-joined');
      socket.off('session:partner-left');
      socket.off('session:started');
      socket.off('round:started');
      socket.off('round:partner-answered');
      socket.off('round:revealed');
    };
  }, [id, session?.id]);

  const handlePick = useCallback((questionId: number) => {
    const socket = connectSocket();
    socket.emit('round:pick', { sessionId: parseInt(id!), questionId });
    setRoundState('answering');
  }, [id]);

  const handleAnswer = useCallback((answerType: 'text' | 'photo' | 'video' | 'voice', text?: string, mediaUrl?: string) => {
    if (!currentRound) return;
    const socket = connectSocket();
    socket.emit('round:answer', { roundId: currentRound.id, answerType, text, mediaUrl });
    setHasAnswered(true);
  }, [currentRound]);

  const handleNextQuestion = () => {
    setRoundState('idle');
    setCurrentRound(null);
    setCurrentQuestion(null);
    setRevealedAnswers([]);
  };

  const handleStartGame = async () => {
    try {
      await api.post(`/sessions/${id}/start`);
      const socket = connectSocket();
      socket.emit('session:started', { sessionId: parseInt(id!) });
      setSession((s: any) => s ? { ...s, status: 'active' } : s);
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  const copyInviteLink = () => {
    if (!session) return;
    const link = `${window.location.origin}/join/${session.invite_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!session) {
    return (
      <div className="min-h-dvh flex items-center justify-center notebook-bg">
        <div className="w-6 h-6 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isWaitingDuo = !isParty && session.status === 'waiting' && !session.user2_id;
  const isWaitingParty = isParty && session.status === 'waiting';
  const gameActive = session.status === 'active' || (!isParty && session.user2_id);

  // Determine whose turn it is (based on completed round count)
  // Use completedRoundCount from server when available (avoids race condition)
  const revealedCount = completedRoundCount ?? rounds.filter(r => r.status === 'revealed').length;

  const getTurnUserId = () => {
    if (!session) return null;
    if (isParty) {
      if (participants.length === 0) return null;
      const turnIndex = revealedCount % participants.length;
      return participants[turnIndex]?.id;
    } else {
      const userIds = [session.user1_id, session.user2_id].filter(Boolean);
      if (userIds.length < 2) return user?.id;
      return userIds[revealedCount % 2];
    }
  };

  const turnUserId = getTurnUserId();
  const isMyTurn = turnUserId === user?.id;

  return (
    <div className="min-h-dvh notebook-bg pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <button onClick={() => navigate('/')} className="text-warm-400 p-2 -ml-2 rounded-xl hover:bg-white/50 active:bg-white/70 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {!isParty && <PartnerStatus partnerName={partnerName} online={onlineUsers.size > 0} />}
          {isParty && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-warm-100 text-warm-600 border border-warm-200">
              {t('lobby.party')} · {participants.length} {t('lobby.players')}
            </span>
          )}
        </div>

        {/* Invite code — duo waiting */}
        {isWaitingDuo && (
          <div className="card-paper rounded-2xl p-6 text-center space-y-4 animate-slide-up">
            <div className="w-12 h-12 mx-auto rounded-full bg-sage-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-sage-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-warm-400 uppercase tracking-wider font-medium mb-2">{t('session.inviteCode')}</p>
              <p className="text-3xl font-mono font-bold text-warm-800 tracking-[0.3em]">{session.invite_code}</p>
            </div>
            <button onClick={copyInviteLink} className="px-6 py-2.5 bg-sage-500 text-white font-medium rounded-xl text-sm active:bg-sage-600 transition-all active:scale-95">
              {copied ? t('session.copied') : t('session.copyLink')}
            </button>
            <p className="text-xs text-warm-400">{t('session.shareHint')}</p>
          </div>
        )}

        {/* Party lobby — waiting for host to start */}
        {isWaitingParty && (
          <div className="card-paper rounded-2xl p-6 space-y-4 animate-slide-up">
            <div className="text-center">
              <p className="text-xs text-warm-400 uppercase tracking-wider font-medium mb-2">{t('session.inviteCode')}</p>
              <p className="text-3xl font-mono font-bold text-warm-800 tracking-[0.3em]">{session.invite_code}</p>
            </div>
            <button onClick={copyInviteLink} className="w-full px-6 py-2.5 bg-sage-500 text-white font-medium rounded-xl text-sm active:bg-sage-600 transition-all active:scale-95">
              {copied ? t('session.copied') : t('session.copyLink')}
            </button>

            <div>
              <p className="text-xs text-warm-400 uppercase tracking-wider font-medium mb-2">{t('session.participants')} ({participants.length})</p>
              <div className="space-y-1">
                {participants.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2 px-3 py-2 bg-warm-50 rounded-lg border border-paper-border">
                    <div className={`w-2 h-2 rounded-full ${onlineUsers.has(p.id) ? 'bg-sage-400' : 'bg-warm-300'}`} />
                    <span className="text-sm text-warm-700">{p.display_name}</span>
                    {p.id === session.user1_id && <span className="text-xs text-sage-500 ml-auto">host</span>}
                  </div>
                ))}
              </div>
            </div>

            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={participants.length < 2}
                className="w-full py-3.5 bg-sage-500 hover:bg-sage-600 text-white font-semibold rounded-2xl active:scale-95 transition-all shadow-sm disabled:opacity-40"
              >
                {t('session.startGame')}
              </button>
            ) : (
              <p className="text-center text-warm-400 text-sm">{t('session.waitingForHost')}</p>
            )}
          </div>
        )}

        {/* Game area */}
        {gameActive && (
          <div className="animate-fade-in">
            {(roundState === 'idle' || roundState === 'picking') && (
              <>
                {roundState === 'idle' && (
                  <div className="text-center py-10 animate-slide-up">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sage-50 flex items-center justify-center">
                      <svg className="w-8 h-8 text-sage-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                    <p className="text-warm-400 mb-6 text-sm">{t('session.noActiveRound')}</p>
                    {isMyTurn ? (
                      <button
                        onClick={() => setRoundState('picking')}
                        className="px-8 py-3.5 bg-sage-500 hover:bg-sage-600 text-white font-semibold rounded-2xl active:scale-95 transition-all shadow-sm"
                      >
                        {t('session.pickQuestion')}
                      </button>
                    ) : (
                      <p className="text-warm-500 text-sm font-medium">
                        {t('session.turnOf', { name: participants.find((p: any) => p.id === turnUserId)?.display_name || partnerName || '...' })}
                      </p>
                    )}
                  </div>
                )}
                {roundState === 'picking' && isMyTurn && (
                  <QuestionPicker sessionId={parseInt(id!)} onPick={handlePick} mode={session.mode || 'duo'} />
                )}
              </>
            )}

            {roundState === 'answering' && currentQuestion && (
              <div className="space-y-4 animate-slide-up">
                <div className="card-paper rounded-2xl p-5 relative">
                  <p className="text-xs text-warm-400 mb-2">{currentQuestion.category_name}</p>
                  <p className="text-lg text-warm-800 leading-relaxed">{currentQuestion.text}</p>
                </div>
                <AnswerForm onSubmit={handleAnswer} disabled={hasAnswered} />
              </div>
            )}

            {roundState === 'revealed' && currentQuestion && (
              <div className="space-y-4 animate-slide-up">
                <AnswerReveal
                  questionText={currentQuestion.text}
                  answers={revealedAnswers}
                  categoryName={currentQuestion.category_name}
                  depthLevel={currentQuestion.depth_level}
                />
                <button
                  onClick={handleNextQuestion}
                  className="w-full py-3.5 bg-sage-500 hover:bg-sage-600 text-white font-semibold rounded-2xl active:scale-95 transition-all shadow-sm"
                >
                  {t('session.nextQuestion')}
                </button>
              </div>
            )}
          </div>
        )}

        {rounds.length > 0 && (
          <div className="animate-fade-in">
            <SessionHistory rounds={rounds} />
          </div>
        )}
      </div>
    </div>
  );
}
