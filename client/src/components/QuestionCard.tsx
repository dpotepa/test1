import { useTranslation } from 'react-i18next';

interface Props {
  question: {
    id: number;
    text: string;
    depth_level: number;
    category_name: string;
  };
  onPick: (questionId: number) => void;
}

const depthColors: Record<number, string> = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-amber-100 text-amber-700',
  3: 'bg-red-100 text-red-700',
};

export default function QuestionCard({ question, onPick }: Props) {
  const { t } = useTranslation();

  return (
    <button
      onClick={() => onPick(question.id)}
      className="w-full text-left bg-white rounded-2xl p-5 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${depthColors[question.depth_level]}`}>
          {t(`session.depth.${question.depth_level}`)}
        </span>
        <span className="text-xs text-gray-400">{question.category_name}</span>
      </div>
      <p className="text-gray-800 text-base leading-relaxed">{question.text}</p>
    </button>
  );
}
