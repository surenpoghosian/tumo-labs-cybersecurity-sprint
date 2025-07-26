'use client';

import clsx from 'clsx';
import {useParams} from 'next/navigation';
import {Locale} from 'next-intl';
import {useState, useTransition} from 'react';
import {usePathname, useRouter} from '@/i18n/navigation';

type LocaleOption = {
  value: string;
  label: string;
  flag: string;
};

type Props = {
  defaultValue: string;
  label: string;
  options: LocaleOption[];
};

export default function LocaleSwitcherSelect({
  defaultValue,
  label,
  options
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const params = useParams();

  const currentOption = options.find(option => option.value === defaultValue);

  function onSelectChange(nextLocale: string) {
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        // are used in combination with a given `pathname`. Since the two will
        // always match for the current route, we can skip runtime checks.
        {pathname, params},
        {locale: nextLocale as Locale}
      );
    });
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={clsx(
          'flex items-center gap-1 px-2 py-1 rounded-md',
          'hover:bg-gray-100 transition-colors duration-200',
          'text-lg',
          isPending && 'opacity-50 cursor-not-allowed'
        )}
        aria-label={label}
        title={currentOption?.label}
      >
        <span className="text-lg">{currentOption?.flag}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px] max-w-[200px]">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelectChange(option.value)}
              className={clsx(
                'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50',
                'first:rounded-t-lg last:rounded-b-lg transition-colors duration-150',
                'text-sm text-gray-700 hover:text-gray-900',
                option.value === defaultValue && 'bg-orange-50 text-orange-700'
              )}
            >
              <span className="text-lg">{option.flag}</span>
              <span>{option.label}</span>
              {option.value === defaultValue && (
                <div className="ml-auto w-2 h-2 bg-orange-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
