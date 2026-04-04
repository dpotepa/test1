import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

interface Answer {
  userId: number;
  userName: string;
  answerType: 'text' | 'photo' | 'video';
  text?: string;
  mediaUrl?: string;
  createdAt: string;
}

interface Props {
  questionText: string;
  answers: Answer[];
  categoryName?: string;
  depthLevel?: number;
}

const depthColors: Record<number, string> = {
  1: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  2: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  3: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

export default function AnswerReveal({ questionText, answers, categoryName, depthLevel }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const renderAnswer = (answer: Answer) => {
    if (answer.answerType === 'photo' && answer.mediaUrl) {
      return <img src={answer.mediaUrl} alt="answer" className="w-full rounded-xl max-h-80 object-cover" />;
    }
    if (answer.answerType === 'video' && answer.mediaUrl) {
      return <video src={answer.mediaUrl} controls className="w-full rounded-xl max-h-80" />;
    }
    return <p className="text-zinc-300 leading-relaxed">{answer.text}</p>;
  };

  return (
    <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-5 border border-zinc-800 space-y-4">
      <div>
        {depthLevel && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${depthColors[depthLevel]} mr-2`}>
            {t(`session.depth.${depthLevel}`)}
          </span>
        )}
        {categoryName && <span className="text-xs text-zinc-600">{categoryName}</span>}
        <p className="text-zinc-200 font-medium mt-2 leading-relaxed">{questionText}</p>
      </div>

      <div className="space-y-3">
        {answers.map((answer) => (
          <div
            key={answer.userId}
            className={`rounded-xl p-4 ${
              answer.userId === user?.id
                ? 'bg-violet-500/10 border border-violet-500/20'
                : 'bg-zinc-800/50 border border-zinc-700/50'
            }`}
          >
            <p className="text-xs font-medium text-zinc-500 mb-2">
              {answer.userId === user?.id ? t('session.yourAnswer') : answer.userName}
            </p>
            {renderAnswer(answer)}
          </div>
        ))}
      </div>
    </div>
  );
}
