import UnifiedLoader from '@/components/ui/UnifiedLoader';

export default function Loading() {
  return (
    <UnifiedLoader 
      message="Loading..."
      showHeader={true}
      theme="orange"
    />
  );
} 