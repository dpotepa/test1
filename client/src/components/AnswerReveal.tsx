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
  1: 'bg-green-100 text-green-700',
  2: 'bg-amber-100 text-amber-700',
  3: 'bg-red-100 text-red-700',
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
    return <p className="text-gray-700 leading-relaxed">{answer.text}</p>;
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
      <div>
        {depthLevel && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${depthColors[depthLevel]} mr-2`}>
            {t(`session.depth.${depthLevel}`)}
          </span>
        )}
        {categoryName && <span className="text-xs text-gray-400">{categoryName}</span>}
        <p className="text-gray-800 font-medium mt-2 leading-relaxed">{questionText}</p>
      </div>

      <div className="space-y-3">
        {answers.map((answer) => (
          <div
            key={answer.userId}
            className={`rounded-xl p-4 ${
              answer.userId === user?.id ? 'bg-indigo-50' : 'bg-gray-50'
            }`}
          >
            <p className="text-xs font-medium text-gray-500 mb-2">
              {answer.userId === user?.id ? t('session.yourAnswer') : answer.userName}
            </p>
            {renderAnswer(answer)}
          </div>
        ))}
      </div>
    </div>
  );
}
