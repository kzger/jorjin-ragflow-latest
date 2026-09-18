import { useTranslation } from 'react-i18next';
import { appName } from '@/conf.json';

export function NextBanner() {
  const { t } = useTranslation();
  return (
    <h1 className="text-2xl leading-snug sm:text-3xl">
      <span className="font-semibold text-text-primary">
        {t('header.welcome')}{' '}
      </span>
      <span className="font-bold text-primary">{appName}</span>
    </h1>
  );
}
