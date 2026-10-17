import { useTranslation } from 'react-i18next';

/**
 * Compact language toggle — place next to theme button in Navbar.
 */
export default function LangToggle({ className = '' }) {
  const { i18n, t } = useTranslation();
  const isHi = i18n.language?.startsWith('hi');

  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(isHi ? 'en' : 'hi')}
      className={className}
      aria-label={t('lang.aria')}
      title={isHi ? t('lang.switchToEn') : t('lang.switchToHi')}
    >
      <span className="text-[11px] font-extrabold tracking-wide">
        {isHi ? 'EN' : 'हिं'}
      </span>
    </button>
  );
}