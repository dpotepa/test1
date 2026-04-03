import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { connectSocket, disconnectSocket } from '../socket/socket';
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
      if (!session.user2_name && data.user) {
        setSession((s: any) => ({ ...s, user2_name: data.user.displayName, user2_id: data.user.id }));
      }
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
    return <div className="min-h-dvh flex items-center justify-center text-gray-400">{t('common.loading')}</div>;
  }

  return (
    <div className="min-h-dvh bg-gray-50 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-gray-400 p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <PartnerStatus partnerName={partnerName} online={partnerOnline} />
        </div>

        {/* Invite code (if waiting for partner) */}
        {session.status === 'waiting' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center space-y-3">
            <p className="text-sm text-gray-500">{t('session.inviteCode')}</p>
            <p className="text-2xl font-mono font-bold text-indigo-600 tracking-wider">
              {session.invite_code}
            </p>
            <button
              onClick={copyInviteLink}
              className="px-5 py-2.5 bg-indigo-100 text-indigo-700 font-medium rounded-xl text-sm active:bg-indigo-200 transition-colors"
            >
              {copied ? t('session.copied') : t('session.copyLink')}
            </button>
          </div>
        )}

        {/* Game area */}
        {session.status === 'active' || session.user2_id ? (
          <>
            {/* Idle / Picking state */}
            {(roundState === 'idle' || roundState === 'picking') && (
              <>
                {roundState === 'idle' && (
                  <div className="text-center py-6">
                    <p className="text-gray-400 mb-4">{t('session.noActiveRound')}</p>
                    <button
                      onClick={() => setRoundState('picking')}
                      className="px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-2xl active:bg-indigo-700 transition-colors"
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
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">{currentQuestion.category_name}</p>
                  <p className="text-lg font-medium text-gray-800 leading-relaxed">
                    {currentQuestion.text}
                  </p>
                </div>
                <AnswerForm onSubmit={handleAnswer} disabled={hasAnswered} />
              </div>
            )}

            {/* Revealed state */}
            {roundState === 'revealed' && currentQuestion && (
              <div className="space-y-4">
                <AnswerReveal
                  questionText={currentQuestion.text}
                  answers={revealedAnswers}
                  categoryName={currentQuestion.category_name}
                  depthLevel={currentQuestion.depth_level}
                />
                <button
                  onClick={handleNextQuestion}
                  className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-2xl active:bg-indigo-700 transition-colors"
                >
                  {t('session.nextQuestion')}
                </button>
              </div>
            )}
          </>
        ) : null}

        {/* History */}
        {rounds.length > 0 && <SessionHistory rounds={rounds} />}
      </div>
    </div>
  );
}
