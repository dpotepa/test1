import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import QuestionCard from './QuestionCard';

interface Props {
  sessionId: number;
  onPick: (questionId: number) => void;
}

export default function QuestionPicker({ sessionId, onPick }: Props) {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/questions/random', { params: { sessionId, count: 3 } });
      setQuestions(res.data);
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQuestions();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <h2 className="text-lg font-semibold text-zinc-200">{t('session.pickQuestion')}</h2>
      <div className="space-y-3 stagger-children">
        {questions.map((q) => (
          <QuestionCard key={q.id} question={q} onPick={onPick} />
        ))}
      </div>
      <button
        onClick={loadQuestions}
        className="w-full py-3 text-violet-400 font-medium text-sm rounded-xl border border-dashed border-zinc-700 active:bg-zinc-900 transition-colors"
      >
        {t('session.newQuestions')}
      </button>
    </div>
  );
}
