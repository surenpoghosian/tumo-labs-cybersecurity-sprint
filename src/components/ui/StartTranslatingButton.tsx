'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function StartTranslatingButton() {
  const { user } = useAuth();
  const t = useTranslations('HomePage.hero');
  const href = user ? '/dashboard' : '/auth/login';

  return (
    <Link href={href}>
      <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
        {t('startTranslating')}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </Link>
  );
} 