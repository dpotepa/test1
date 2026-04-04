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
  onReact?: (answerId: number, emoji: string) => void;
  currentRoundId?: number;
}

export default function SessionHistory({ rounds, onReact, currentRoundId }: Props) {
  const { t } = useTranslation();

  const revealedRounds = rounds.filter((r) => r.status === 'revealed' && r.id !== currentRoundId);

  if (revealedRounds.length === 0) {
    return (
      <div className="text-center py-8 text-warm-400 text-sm">
        {t('history.noHistory')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-warm-400 uppercase tracking-wider">
        {t('session.history')}
      </h3>
      <div className="space-y-3">
        {revealedRounds.map((round) => (
          <AnswerReveal
            key={round.id}
            questionText={round.question_text}
            answers={round.answers.map((a: any) => ({
              id: a.id,
              userId: a.user_id,
              userName: a.user_name,
              answerType: a.answer_type,
              text: a.text,
              mediaUrl: a.media_url,
              createdAt: a.created_at,
              reactions: a.reactions,
            }))}
            categoryName={round.category_name}
            depthLevel={round.depth_level}
            onReact={onReact}
          />
        ))}
      </div>
    </div>
  );
}
