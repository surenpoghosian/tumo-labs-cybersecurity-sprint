'use client';

import { BookOpen, ChevronDown, LogOut } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import LocaleSwitcher from './LocaleSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface UserProfile {
  isModerator?: boolean;
  role?: string;
}

interface AppHeaderProps {
  currentPage?: 'home' | 'dashboard' | 'projects' | 'docs' | 'certificates' | 'moderation' | 'translations';
  showNavLinks?: boolean;
  userProfile?: UserProfile | null;
}

export default function AppHeader({ 
  currentPage = 'home', 
  showNavLinks = true,
  userProfile 
}: AppHeaderProps) {
  const { user: authUser, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link 
            href={authUser ? '/dashboard' : '/'} 
            className="flex items-center space-x-2 group" 
            title="Go home"
          >
            <BookOpen className="h-8 w-8 text-orange-600 group-hover:text-orange-700 transition-colors" />
            <span className="text-xl font-bold text-gray-900 group-hover:text-orange-700 transition-colors">
              Armenian CyberSec Docs
            </span>
          </Link>
        </div>
        
        {showNavLinks && (
          <nav className="flex items-center space-x-6">
            {currentPage === 'home' ? (
              <div className="flex items-center space-x-8">
                <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
                <a href="#process" className="text-gray-600 hover:text-gray-900">How It Works</a>
                <a href="#community" className="text-gray-600 hover:text-gray-900">Community</a>
                <Link href="/dashboard">
                  <Button variant="outline" className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm text-gray-900">
                    Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Link 
                  href="/docs" 
                  className={currentPage === 'docs' ? 'text-orange-600 font-medium' : 'text-gray-600 hover:text-orange-600 transition-colors'}
                >
                  Documentation
                </Link>
                <Link 
                  href="/dashboard" 
                  className={currentPage === 'dashboard' ? 'text-orange-600 font-medium' : 'text-gray-600 hover:text-orange-600 transition-colors'}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/projects" 
                  className={currentPage === 'projects' ? 'text-orange-600 font-medium' : 'text-gray-600 hover:text-orange-600 transition-colors'}
                >
                  Projects
                </Link>
                <Link 
                  href="/certificates" 
                  className={currentPage === 'certificates' ? 'text-orange-600 font-medium' : 'text-gray-600 hover:text-orange-600 transition-colors'}
                >
                  Certificates
                </Link>
                {currentPage === 'translations' && (
                  <Link 
                    href="/translations" 
                    className="text-orange-600 font-medium"
                  >
                    Translations
                  </Link>
                )}
                {(userProfile?.isModerator || userProfile?.role === 'administrator') && (
                  <Link 
                    href="/moderation" 
                    className={currentPage === 'moderation' ? 'text-orange-600 font-medium' : 'text-gray-600 hover:text-orange-600 transition-colors'}
                  >
                    Moderation
                  </Link>
                )}
              </>
            )}
            
            {/* Language Switcher - always visible */}
            <div className="border-l border-gray-200 pl-4">
              <LocaleSwitcher />
            </div>
            
            {/* User Menu - only visible when authenticated and not on landing page */}
            {authUser && currentPage !== 'home' && (
              <div className="relative border-l border-gray-200 pl-4">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1 hover:bg-gray-200 transition-colors"
                >
                  <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {authUser?.displayName?.charAt(0) || authUser?.email?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-medium hidden md:block">
                    {authUser?.displayName || authUser?.email?.split('@')[0] || 'User'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
                
                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="p-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {authUser?.displayName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">{authUser?.email}</p>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={async () => {
                          try {
                            await logout();
                            router.push('/');
                          } catch (error) {
                            console.error('Logout error:', error);
                          }
                        }}
                        className="w-full flex items-center space-x-2 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
} 