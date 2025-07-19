'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Languages } from 'lucide-react';

export function LocalizationDemo() {
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');
  const tNav = useTranslations('Navigation');
  const locale = useLocale();

  const currentLanguage = locale === 'hy' ? 'Armenian (Հայերեն)' : 'English';
  const currentFlag = locale === 'hy' ? '🇦🇲' : '🇺🇸';

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5 text-orange-600" />
          Localization Demo
          <Badge variant="outline" className="ml-auto">
            {currentFlag} {currentLanguage}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Current Language: {currentLanguage}
            </h4>
            <div className="space-y-2 text-sm">
              <p><strong>Dashboard Title:</strong> {t('title')}</p>
              <p><strong>Navigation Home:</strong> {tNav('home')}</p>
              <p><strong>Navigation Projects:</strong> {tNav('projects')}</p>
              <p><strong>Common Save:</strong> {tCommon('save')}</p>
              <p><strong>Common Loading:</strong> {tCommon('loading')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium mb-1">Navigation Translations:</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• {tNav('dashboard')}</li>
                <li>• {tNav('projects')}</li>
                <li>• {tNav('certificates')}</li>
                <li>• {tNav('profile')}</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-1">Common Actions:</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• {tCommon('save')}</li>
                <li>• {tCommon('cancel')}</li>
                <li>• {tCommon('submit')}</li>
                <li>• {tCommon('download')}</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>✨ Localization Features:</strong>
            </p>
            <ul className="text-sm text-orange-700 mt-1 space-y-1">
              <li>• Automatic language detection and routing</li>
              <li>• Complete UI translation (English ↔ Armenian)</li>
              <li>• URL-based locale switching (/en, /hy)</li>
              <li>• RTL-ready layout support</li>
              <li>• Cybersecurity terminology in Armenian</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 