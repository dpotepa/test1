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
    return <div className="text-center py-8 text-gray-400">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">{t('session.pickQuestion')}</h2>
      <div className="space-y-3">
        {questions.map((q) => (
          <QuestionCard key={q.id} question={q} onPick={onPick} />
        ))}
      </div>
      <button
        onClick={loadQuestions}
        className="w-full py-3 text-indigo-600 font-medium text-sm rounded-xl border-2 border-dashed border-indigo-200 active:bg-indigo-50 transition-colors"
      >
        {t('session.newQuestions')}
      </button>
    </div>
  );
}
