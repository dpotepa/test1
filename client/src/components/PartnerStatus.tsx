import { useTranslation } from 'react-i18next';

interface Props {
  partnerName?: string;
  online: boolean;
}

export default function PartnerStatus({ partnerName, online }: Props) {
  const { t } = useTranslation();

  if (!partnerName) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <div className="w-2 h-2 rounded-full bg-zinc-700 animate-pulse" />
        {t('session.waitingForPartner')}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full transition-colors ${online ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-zinc-600'}`} />
      <span className="font-medium text-zinc-300">{partnerName}</span>
      <span className="text-zinc-600">
        {online ? t('session.partnerOnline') : t('session.partnerOffline')}
      </span>
    </div>
  );
}
