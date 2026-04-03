import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggle = () => {
    const newLang = i18n.language === 'pl' ? 'en' : 'pl';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <button
      onClick={toggle}
      className="flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium text-gray-500 transition-colors"
    >
      <span className="text-lg leading-6">{i18n.language === 'pl' ? '🇬🇧' : '🇵🇱'}</span>
      {i18n.language === 'pl' ? 'EN' : 'PL'}
    </button>
  );
}
