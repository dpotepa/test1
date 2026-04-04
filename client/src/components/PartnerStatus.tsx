import { useTranslation } from 'react-i18next';

interface Props {
  partnerName?: string;
  online: boolean;
}

export default function PartnerStatus({ partnerName, online }: Props) {
  const { t } = useTranslation();

  if (!partnerName) {
    return (
      <div className="flex items-center gap-2 text-sm text-warm-400">
        <div className="w-2 h-2 rounded-full bg-warm-300 animate-pulse" />
        {t('session.waitingForPartner')}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full transition-colors ${online ? 'bg-sage-400 shadow-sm shadow-sage-400/50' : 'bg-warm-300'}`} />
      <span className="font-medium text-warm-700">{partnerName}</span>
      <span className="text-warm-400">
        {online ? t('session.partnerOnline') : t('session.partnerOffline')}
      </span>
    </div>
  );
}
