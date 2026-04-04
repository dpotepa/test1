import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

interface Answer {
  userId: number;
  userName: string;
  answerType: 'text' | 'photo' | 'video' | 'voice';
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
  1: 'bg-sage-50 text-sage-600 border border-sage-200',
  2: 'bg-amber-50 text-amber-600 border border-amber-200',
  3: 'bg-rose-50 text-rose-500 border border-rose-200',
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
    if (answer.answerType === 'voice' && answer.mediaUrl) {
      return (
        <audio src={answer.mediaUrl} controls className="w-full mt-1" style={{ height: 40 }} />
      );
    }
    return <p className="text-warm-700 leading-relaxed">{answer.text}</p>;
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
        {answers.map((answer) => (
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
          </div>
        ))}
      </div>
    </div>
  );
}
