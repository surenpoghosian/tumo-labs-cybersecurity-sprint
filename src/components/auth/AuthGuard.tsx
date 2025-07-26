'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth/login' 
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Perform redirects after auth state is known, but keep the loader visible
  useEffect(() => {
    if (loading) return; // Wait until Firebase resolves auth state

    if (requireAuth && !user) {
      router.push(redirectTo);
    } else if (!requireAuth && user) {
      router.push('/dashboard');
    }
  }, [user, loading, requireAuth, redirectTo, router]);

  // Show unified loader whenever we're awaiting auth resolution OR redirecting
  const shouldDisplayLoader = loading || (requireAuth && !user) || (!requireAuth && user);

  if (shouldDisplayLoader) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-orange-600 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying authentication...</h2>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 