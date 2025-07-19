'use client';

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useTranslations } from 'next-intl';

export function Navigation() {
  const t = useTranslations('HomePage');
  const tNav = useTranslations('Navigation');

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-8 w-8 text-orange-600" />
          <span className="text-xl font-bold text-gray-900">{t('title')}</span>
        </div>
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/#features" className="text-gray-600 hover:text-blue-600">
            {t('features.title')}
          </Link>
          <Link href="/#process" className="text-gray-600 hover:text-blue-600">
            {t('process.title')}
          </Link>
          <Link href="/#community" className="text-gray-600 hover:text-blue-600">
            {t('community.title')}
          </Link>
          <LanguageSwitcher />
          <Link href="/dashboard">
            <Button variant="outline">{tNav('dashboard')}</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
} 