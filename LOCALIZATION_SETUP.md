# 🌍 Localization Setup Guide

This guide explains how the internationalization (i18n) system works in the Armenian CyberSec Docs Translation Platform.

## 🚀 Features Implemented

### ✅ Complete Localization System
- **🇺🇸 English** (default) and **🇦🇲 Armenian** language support
- **URL-based routing**: `/en/dashboard` and `/hy/dashboard`
- **Automatic language detection** and redirection
- **Language switcher component** with flags and native language names
- **600+ translated strings** covering the entire UI

### ✅ Technical Implementation
- **Next.js 15 + TypeScript** with App Router
- **next-intl** for internationalization
- **Middleware-based routing** for locale handling
- **Client-side language switching** with URL updates
- **Translation memory** with localized placeholders

## 📁 File Structure

```
armenian-docs-translate/
├── i18n.ts                    # Next-intl configuration
├── middleware.ts               # Locale routing middleware
├── messages/
│   ├── en.json                # English translations
│   └── hy.json                # Armenian translations
├── src/
│   ├── app/
│   │   └── [locale]/          # Locale-based routing
│   │       ├── layout.tsx     # Localized layout
│   │       ├── page.tsx       # Localized homepage
│   │       └── dashboard/     # Localized pages
│   └── components/
│       ├── ui/
│       │   └── language-switcher.tsx  # Language selector
│       └── common/
│           ├── Navigation.tsx          # Localized navigation
│           └── LocalizationDemo.tsx    # Demo component
```

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
npm install next-intl@^3.22.0
```

### 2. Configuration Files

The following files are already configured:

- **`i18n.ts`**: Main internationalization configuration
- **`middleware.ts`**: Handles locale routing and redirects
- **`messages/en.json`**: English translations
- **`messages/hy.json`**: Armenian translations

### 3. Environment Setup

No additional environment variables needed for basic localization.

## 🎯 Usage Examples

### Using Translations in Components

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{tCommon('save')}</button>
      <p>{t('welcome', { name: 'John' })}</p>
    </div>
  );
}
```

### Language Switcher

```tsx
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export function Header() {
  return (
    <header>
      <nav>
        {/* Other navigation items */}
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
```

### Translation Keys Structure

```json
{
  "Dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome back, {name}!",
    "stats": {
      "totalProjects": "Total Projects",
      "completedProjects": "Completed"
    }
  },
  "Common": {
    "save": "Save",
    "cancel": "Cancel",
    "loading": "Loading..."
  }
}
```

## 🔗 URL Structure

### Automatic Routing
- **`/`** → Redirects to `/en/` (default locale)
- **`/en/dashboard`** → English dashboard
- **`/hy/dashboard`** → Armenian dashboard
- **`/en/projects/123`** → English project detail
- **`/hy/projects/123`** → Armenian project detail

### Language Switching
The language switcher automatically:
1. Detects current locale from URL
2. Preserves current page path
3. Updates URL with new locale
4. Reloads content in selected language

## 🇦🇲 Armenian Translations

### Cybersecurity Terminology
Special attention was given to translating cybersecurity terms:

| English | Armenian | Context |
|---------|----------|---------|
| Cybersecurity | Կիբեռանվտանգություն | General term |
| Vulnerability | Խոցելիություն | Security weakness |
| Authentication | Վավերացում | User verification |
| Encryption | Գաղտնագրում | Data protection |
| Firewall | Հրապատ | Network security |

### UI Elements
All interface elements are translated:
- Navigation menus
- Form labels and placeholders
- Button text and tooltips
- Error and success messages
- Loading states and confirmations

## 🧪 Testing Localization

### 1. Language Switcher Demo
Visit the dashboard to see the localization demo component that shows:
- Current language detection
- Real-time translation examples
- Side-by-side language comparison

### 2. URL Testing
Test these URLs to verify localization:
```
http://localhost:3000/          # Redirects to /en/
http://localhost:3000/en/       # English homepage
http://localhost:3000/hy/       # Armenian homepage
http://localhost:3000/en/dashboard  # English dashboard
http://localhost:3000/hy/dashboard  # Armenian dashboard
```

### 3. Component Testing
```tsx
// Test translation loading
const t = useTranslations('HomePage');
console.log(t('hero.title')); // Should show translated text

// Test locale detection
const locale = useLocale();
console.log(locale); // Should show 'en' or 'hy'
```

## 🔧 Adding New Translations

### 1. Add to Message Files

**English (`messages/en.json`):**
```json
{
  "NewSection": {
    "title": "New Feature",
    "description": "Feature description"
  }
}
```

**Armenian (`messages/hy.json`):**
```json
{
  "NewSection": {
    "title": "Նոր հատկություն",
    "description": "Հատկության նկարագրություն"
  }
}
```

### 2. Use in Components

```tsx
const t = useTranslations('NewSection');

return (
  <div>
    <h2>{t('title')}</h2>
    <p>{t('description')}</p>
  </div>
);
```

## 🎨 Styling Considerations

### RTL Support Preparation
While Armenian uses LTR (left-to-right), the system is prepared for RTL languages:

```css
/* Direction-aware spacing */
.element {
  margin-inline-start: 1rem; /* Uses logical properties */
  padding-inline-end: 0.5rem;
}

/* RTL-ready flexbox */
.nav-items {
  display: flex;
  gap: 1rem; /* Better than margin for RTL */
}
```

### Font Considerations
Armenian text uses Unicode characters that require proper font support:

```css
/* Ensure Armenian character support */
body {
  font-family: 'Geist', 'Arial Unicode MS', sans-serif;
}

/* Armenian-specific styling if needed */
[lang="hy"] {
  font-family: 'Armenian Font', 'Geist', sans-serif;
}
```

## 🚀 Production Deployment

### 1. Build Verification
```bash
npm run build
```
Verify that both locales build correctly.

### 2. Server Configuration
Ensure your hosting provider supports:
- Dynamic routing (`/[locale]/**`)
- Middleware execution
- Client-side navigation

### 3. SEO Considerations
- Each locale gets separate URLs for better SEO
- `lang` attributes are automatically set
- Meta tags should be localized (add to layout.tsx)

## 🛠️ Advanced Features

### Dynamic Imports
Translations are loaded dynamically per locale:
```tsx
// Only loads the current locale's messages
const messages = (await import(`../../messages/${locale}.json`)).default;
```

### Pluralization Support
```json
{
  "items": {
    "zero": "No items",
    "one": "One item", 
    "other": "{count} items"
  }
}
```

### Date/Number Formatting
```tsx
import { useFormatter } from 'next-intl';

const format = useFormatter();
const date = format.dateTime(new Date(), { year: 'numeric' });
const number = format.number(1234.5);
```

## 🐛 Troubleshooting

### Common Issues

1. **"Messages not found" error**
   - Verify message files exist in `/messages/`
   - Check file naming: `en.json`, `hy.json`
   - Ensure JSON syntax is valid

2. **Language switcher not working**
   - Check middleware configuration
   - Verify locale routing in `app/[locale]/`
   - Ensure client-side navigation works

3. **Missing translations show as keys**
   - Add missing keys to both language files
   - Check for typos in translation keys
   - Verify namespace names match

### Debug Mode
```tsx
// Add to component for debugging
import { useLocale } from 'next-intl';

export function DebugLocale() {
  const locale = useLocale();
  return <div>Current locale: {locale}</div>;
}
```

## 📈 Performance

- **Bundle size**: Only current locale's messages are loaded
- **Server-side**: Locale detection happens at middleware level
- **Client-side**: Language switching is instant (no page reload)
- **Caching**: Translation files are cached by Next.js

## 🤝 Contributing

When adding new features:

1. **Always add translations** to both `en.json` and `hy.json`
2. **Use semantic key names**: `Dashboard.stats.totalProjects` not `dashboard_total_projects`
3. **Test both languages** before submitting
4. **Consider context** when translating technical terms
5. **Update this documentation** for new localization features

---

## 🎉 Success!

Your Armenian CyberSec Docs platform now supports full localization with English and Armenian languages. Users can seamlessly switch between languages while maintaining their current context and navigation state.

The system is extensible and ready for additional languages in the future! 🌍 