import UnifiedLoader from '@/components/ui/UnifiedLoader';
import { useTranslations } from 'next-intl';

export default function Loading() {
  const common = useTranslations('Common');
  return (
    <UnifiedLoader
      message={common('loading')}
      showHeader={true}
      theme="orange"
    />
  );
} 