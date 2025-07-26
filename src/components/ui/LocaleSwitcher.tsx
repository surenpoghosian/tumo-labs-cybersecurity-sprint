import { useLocale, useTranslations } from 'next-intl';
import { routing } from '@/i18n/routing';
import LocaleSwitcherSelect from './LocaleSwitcherSelect';

export default function LocaleSwitcher() {
  const langSwitcher = useTranslations('LanguageSwitcher');
  const locale = useLocale();

  const localeOptions = routing.locales.map((cur) => ({
    value: cur,
    label: cur === 'en' ? 'English' : 'Հայերեն',
    flag: cur === 'en' ? '🇺🇸' : '🇦🇲'
  }));

  return (
    <LocaleSwitcherSelect 
      defaultValue={locale} 
      label={langSwitcher('title')}
      options={localeOptions}
    />
  );
}
