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
  1: 'bg-sage-50 text-sage-600 border border-sage-200',
  2: 'bg-amber-50 text-amber-600 border border-amber-200',
  3: 'bg-rose-50 text-rose-500 border border-rose-200',
};

export default function QuestionCard({ question, onPick }: Props) {
  const { t } = useTranslation();

  return (
    <button
      onClick={() => onPick(question.id)}
      className="w-full text-left note-card rounded-2xl p-5 active:scale-[0.98]"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${depthColors[question.depth_level]}`}>
          {t(`session.depth.${question.depth_level}`)}
        </span>
        <span className="text-xs text-warm-400">{question.category_name}</span>
      </div>
      <p className="text-warm-700 text-base leading-relaxed">{question.text}</p>
    </button>
  );
}
