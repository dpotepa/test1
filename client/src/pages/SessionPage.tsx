import { useState, useEffect, useCallback } from 'react';
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
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [rounds, setRounds] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  const partnerName = session
    ? (session.user1_id === user?.id ? session.user2_name : session.user1_name)
    : undefined;

  // Load session data
  useEffect(() => {
    if (!id) return;
    api.get(`/sessions/${id}`).then((res) => setSession(res.data)).catch(() => navigate('/'));
    api.get(`/sessions/${id}/rounds`).then((res) => setRounds(res.data));
  }, [id]);

  // Socket connection
  useEffect(() => {
    if (!id || !session) return;

    const socket = connectSocket();

    socket.emit('session:join', { sessionId: parseInt(id) });

    socket.on('session:partner-joined', (data: any) => {
      setPartnerOnline(true);
      // Update session status to active and set partner info
      setSession((s: any) => {
        if (!s) return s;
        const updated = { ...s, status: 'active' };
        if (data.user) {
          if (s.user1_id === user?.id) {
            updated.user2_name = data.user.displayName;
            updated.user2_id = data.user.id;
          } else {
            updated.user1_name = data.user.displayName;
            updated.user1_id = data.user.id;
          }
        }
        return updated;
      });
    });

    socket.on('session:partner-left', () => {
      setPartnerOnline(false);
    });

    socket.on('round:started', (data: any) => {
      setCurrentRound(data.round);
      setCurrentQuestion(data.question);
      setRoundState('answering');
      setHasAnswered(false);
      setRevealedAnswers([]);
    });

    socket.on('round:partner-answered', () => {
      // Partner answered, we're still waiting for ours or both done
    });

    socket.on('round:revealed', (data: any) => {
      setRevealedAnswers(data.answers);
      setRoundState('revealed');
      // Refresh history
      api.get(`/sessions/${id}/rounds`).then((res) => setRounds(res.data));
    });

    return () => {
      socket.emit('session:leave', { sessionId: parseInt(id) });
      socket.off('session:partner-joined');
      socket.off('session:partner-left');
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

  const handleAnswer = useCallback((answerType: 'text' | 'photo' | 'video', text?: string, mediaUrl?: string) => {
    if (!currentRound) return;
    const socket = connectSocket();
    socket.emit('round:answer', {
      roundId: currentRound.id,
      answerType,
      text,
      mediaUrl,
    });
    setHasAnswered(true);
  }, [currentRound]);

  const handleNextQuestion = () => {
    setRoundState('picking');
    setCurrentRound(null);
    setCurrentQuestion(null);
    setRevealedAnswers([]);
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
      <div className="min-h-dvh flex items-center justify-center bg-zinc-950">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isWaiting = session.status === 'waiting' && !session.user2_id;
  const hasPartner = session.status === 'active' || session.user2_id;

  return (
    <div className="min-h-dvh bg-zinc-950 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <button onClick={() => navigate('/')} className="text-zinc-500 p-2 -ml-2 rounded-xl hover:bg-zinc-900 active:bg-zinc-800 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <PartnerStatus partnerName={partnerName} online={partnerOnline} />
        </div>

        {/* Invite code (if waiting for partner) */}
        {isWaiting && (
          <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800 text-center space-y-4 animate-slide-up">
            <div className="w-12 h-12 mx-auto rounded-full bg-violet-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">{t('session.inviteCode')}</p>
              <p className="text-3xl font-mono font-bold text-white tracking-[0.3em]">
                {session.invite_code}
              </p>
            </div>
            <button
              onClick={copyInviteLink}
              className="px-6 py-2.5 bg-violet-600 text-white font-medium rounded-xl text-sm active:bg-violet-700 transition-all active:scale-95"
            >
              {copied ? t('session.copied') : t('session.copyLink')}
            </button>
            <p className="text-xs text-zinc-600">{t('session.shareHint')}</p>
          </div>
        )}

        {/* Game area */}
        {hasPartner && (
          <div className="animate-fade-in">
            {/* Idle / Picking state */}
            {(roundState === 'idle' || roundState === 'picking') && (
              <>
                {roundState === 'idle' && (
                  <div className="text-center py-10 animate-slide-up">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                    <p className="text-zinc-500 mb-6 text-sm">{t('session.noActiveRound')}</p>
                    <button
                      onClick={() => setRoundState('picking')}
                      className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-2xl active:scale-95 transition-all shadow-lg shadow-violet-500/25"
                    >
                      {t('session.pickQuestion')}
                    </button>
                  </div>
                )}
                {roundState === 'picking' && (
                  <QuestionPicker sessionId={parseInt(id!)} onPick={handlePick} />
                )}
              </>
            )}

            {/* Answering state */}
            {roundState === 'answering' && currentQuestion && (
              <div className="space-y-4 animate-slide-up">
                <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-5 border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-2">{currentQuestion.category_name}</p>
                  <p className="text-lg font-medium text-zinc-100 leading-relaxed">
                    {currentQuestion.text}
                  </p>
                </div>
                <AnswerForm onSubmit={handleAnswer} disabled={hasAnswered} />
              </div>
            )}

            {/* Revealed state */}
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
                  className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-2xl active:scale-95 transition-all shadow-lg shadow-violet-500/25"
                >
                  {t('session.nextQuestion')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {rounds.length > 0 && (
          <div className="animate-fade-in">
            <SessionHistory rounds={rounds} />
          </div>
        )}
      </div>
    </div>
  );
}
