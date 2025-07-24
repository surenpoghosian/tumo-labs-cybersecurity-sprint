import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['hy', 'en'],
    defaultLocale: 'hy',

    localePrefix: 'always',
});