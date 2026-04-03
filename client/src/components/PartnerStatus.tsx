import { useTranslation } from 'react-i18next';

interface Props {
  partnerName?: string;
  online: boolean;
}

export default function PartnerStatus({ partnerName, online }: Props) {
  const { t } = useTranslation();

  if (!partnerName) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-300 animate-pulse" />
        {t('session.waitingForPartner')}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2.5 h-2.5 rounded-full ${online ? 'bg-green-500' : 'bg-gray-300'}`} />
      <span className="font-medium text-gray-700">{partnerName}</span>
      <span className="text-gray-400">
        — {online ? t('session.partnerOnline') : t('session.partnerOffline')}
      </span>
    </div>
  );
}
