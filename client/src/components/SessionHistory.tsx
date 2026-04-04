import { useTranslation } from 'react-i18next';
import AnswerReveal from './AnswerReveal';

interface Round {
  id: number;
  question_text: string;
  category_name: string;
  depth_level: number;
  status: string;
  answers: any[];
}

interface Props {
  rounds: Round[];
}

export default function SessionHistory({ rounds }: Props) {
  const { t } = useTranslation();

  const revealedRounds = rounds.filter((r) => r.status === 'revealed');

  if (revealedRounds.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-600 text-sm">
        {t('history.noHistory')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-hand text-zinc-500 tracking-wider">
        {t('session.history')}
      </h3>
      <div className="space-y-3">
        {revealedRounds.map((round) => (
          <AnswerReveal
            key={round.id}
            questionText={round.question_text}
            answers={round.answers.map((a: any) => ({
              userId: a.user_id,
              userName: a.user_name,
              answerType: a.answer_type,
              text: a.text,
              mediaUrl: a.media_url,
              createdAt: a.created_at,
            }))}
            categoryName={round.category_name}
            depthLevel={round.depth_level}
          />
        ))}
      </div>
    </div>
  );
}
