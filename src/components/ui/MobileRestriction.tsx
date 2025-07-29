'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, BookOpen, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { shouldRestrictMobile } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import AppHeader from './AppHeader';

interface MobileRestrictionProps {
  title?: string;
  description?: string;
  showHeader?: boolean;
  allowedActions?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
  }[];
}

export default function MobileRestriction({
  title,
  description,
  showHeader = true,
  allowedActions
}: MobileRestrictionProps) {
  const t = useTranslations('MobileRestriction');
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use translations as defaults if props are not provided
  const finalTitle = title || t('title');
  const finalDescription = description || t('description');
  const finalAllowedActions = allowedActions || [
    {
      label: t('actions.browseDocs'),
      href: "/docs",
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      label: t('actions.backHome'),
      href: "/",
      icon: <ArrowLeft className="h-4 w-4" />
    }
  ];

  useEffect(() => {
    // Check if mobile on client side
    setIsMobile(shouldRestrictMobile());
    setIsLoading(false);
  }, []);

  // Show loading or nothing while checking
  if (isLoading) {
    return null;
  }

  // Don't show restriction if not mobile
  if (!isMobile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      {showHeader && <AppHeader currentPage="mobile-restricted" />}
      
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
              <div className="flex items-center space-x-2">
                <Monitor className="h-8 w-8 text-orange-600" />
                <div className="w-px h-8 bg-orange-300"></div>
                <Smartphone className="h-6 w-6 text-orange-400" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              {finalTitle}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                {finalDescription}
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Monitor className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">{t('whyDesktop.title')}</p>
                    <p>{t('whyDesktop.description')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 text-center">
                {t('mobileActions')}
              </p>
              
              {finalAllowedActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start space-x-2 hover:bg-orange-50 hover:border-orange-200 mt-2"
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </Button>
                </Link>
              ))}
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 text-center">
                {t('contributionNote')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Hook to conditionally render content based on mobile restriction
export function useMobileRestriction() {
  const [shouldRestrict, setShouldRestrict] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setShouldRestrict(shouldRestrictMobile());
    setIsLoading(false);
  }, []);

  return { shouldRestrict, isLoading };
} 