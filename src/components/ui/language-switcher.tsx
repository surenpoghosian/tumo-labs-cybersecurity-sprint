'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from './button';
import { Globe } from 'lucide-react';
import { useState } from 'react';

const locales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hy', name: 'Հայերեն', flag: '🇦🇲' }
];

export function LanguageSwitcher() {
  const t = useTranslations('LanguageSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);

  const currentLocale = locales.find(l => l.code === locale);

  const switchToLocale = (newLocale: string) => {
    // Remove the current locale from the pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    
    // Navigate to the new locale path
    const newPath = newLocale === 'en' ? pathWithoutLocale : `/${newLocale}${pathWithoutLocale}`;
    router.push(newPath);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2"
        aria-label={t('title')}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLocale?.flag}</span>
        <span className="hidden md:inline">{currentLocale?.name}</span>
      </Button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            {locales.map((loc) => (
              <button
                key={loc.code}
                onClick={() => switchToLocale(loc.code)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 ${
                  locale === loc.code ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{loc.flag}</span>
                <span className="font-medium">{loc.name}</span>
                {locale === loc.code && (
                  <span className="ml-auto text-orange-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
} 