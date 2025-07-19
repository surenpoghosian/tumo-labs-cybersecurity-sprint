import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'hy'],

  // Used when no locale matches
  defaultLocale: 'en',

  // The `localePrefix` setting controls whether a locale prefix is shown for the default locale
  // Setting this to `never` will hide the `/en` prefix for English
  localePrefix: 'as-needed'
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing); 