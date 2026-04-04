import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

interface Reaction {
  emoji: string;
  userId: number;
  userName: string;
}

interface Answer {
  id?: number;
  userId: number;
  userName: string;
  answerType: 'text' | 'photo' | 'video' | 'voice';
  text?: string;
  mediaUrl?: string;
  createdAt: string;
  reactions?: Reaction[];
}

interface Props {
  questionText: string;
  answers: Answer[];
  categoryName?: string;
  depthLevel?: number;
  onReact?: (answerId: number, emoji: string) => void;
}

const EMOJI_OPTIONS = ['❤️', '😂', '😮', '👏', '🔥'];

const depthColors: Record<number, string> = {
  1: 'bg-sage-50 text-sage-600 border border-sage-200',
  2: 'bg-amber-50 text-amber-600 border border-amber-200',
  3: 'bg-rose-50 text-rose-500 border border-rose-200',
};

export default function AnswerReveal({ questionText, answers, categoryName, depthLevel, onReact }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [openPicker, setOpenPicker] = useState<number | null>(null);

  const renderAnswer = (answer: Answer) => {
    if (answer.answerType === 'photo' && answer.mediaUrl) {
      return <img src={answer.mediaUrl} alt="answer" className="w-full rounded-xl max-h-80 object-cover" />;
    }
    if (answer.answerType === 'video' && answer.mediaUrl) {
      return <video src={answer.mediaUrl} controls className="w-full rounded-xl max-h-80" />;
    }
    if (answer.answerType === 'voice' && answer.mediaUrl) {
      return (
        <audio src={answer.mediaUrl} controls className="w-full mt-1" style={{ height: 40 }} />
      );
    }
    return <p className="text-warm-700 leading-relaxed">{answer.text}</p>;
  };

  const handleReact = (answerId: number, emoji: string) => {
    if (onReact && answerId) {
      onReact(answerId, emoji);
    }
    setOpenPicker(null);
  };

  // Group reactions by emoji
  const groupReactions = (reactions: Reaction[]) => {
    const groups: Record<string, Reaction[]> = {};
    for (const r of reactions) {
      if (!groups[r.emoji]) groups[r.emoji] = [];
      groups[r.emoji].push(r);
    }
    return groups;
  };

  return (
    <div className="card-paper rounded-2xl p-5 space-y-4">
      <div>
        {depthLevel && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${depthColors[depthLevel]} mr-2`}>
            {t(`session.depth.${depthLevel}`)}
          </span>
        )}
        {categoryName && <span className="text-xs text-warm-400">{categoryName}</span>}
        <p className="text-warm-800 font-medium mt-2 leading-relaxed">{questionText}</p>
      </div>

      <div className="space-y-3">
        {answers.map((answer) => {
          const reactions = answer.reactions || [];
          const grouped = groupReactions(reactions);
          const myReaction = reactions.find(r => r.userId === user?.id);

          return (
            <div
              key={answer.userId}
              className={`rounded-xl p-4 ${
                answer.userId === user?.id
                  ? 'bg-sage-50 border border-sage-200'
                  : 'bg-warm-50 border border-warm-200'
              }`}
            >
              <p className="text-xs font-medium text-warm-400 mb-2">
                {answer.userId === user?.id ? t('session.yourAnswer') : answer.userName}
              </p>
              {renderAnswer(answer)}

              {/* Reactions display + add button */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {Object.entries(grouped).map(([emoji, users]) => (
                  <button
                    key={emoji}
                    onClick={() => answer.id && handleReact(answer.id, emoji)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm border transition-all active:scale-95 ${
                      users.some(u => u.userId === user?.id)
                        ? 'bg-sage-50 border-sage-300'
                        : 'bg-white border-paper-border hover:border-warm-300'
                    }`}
                    title={users.map(u => u.userName).join(', ')}
                  >
                    <span>{emoji}</span>
                    {users.length > 1 && <span className="text-xs text-warm-500">{users.length}</span>}
                  </button>
                ))}

                {/* Add reaction button */}
                {answer.userId !== user?.id && onReact && answer.id && (
                  <div className="relative">
                    <button
                      onClick={() => setOpenPicker(openPicker === answer.userId ? null : answer.userId)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-dashed border-warm-300 text-warm-400 hover:border-warm-400 hover:text-warm-500 transition-all text-sm"
                    >
                      +
                    </button>

                    {openPicker === answer.userId && (
                      <div className="absolute bottom-full left-0 mb-1 flex gap-1 bg-white rounded-full shadow-lg border border-paper-border px-2 py-1.5 z-10 animate-slide-up">
                        {EMOJI_OPTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReact(answer.id!, emoji)}
                            className={`text-lg hover:scale-125 transition-transform px-0.5 ${myReaction?.emoji === emoji ? 'scale-125' : ''}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
