'use client';

import { BookOpen, ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import LocaleSwitcher from './LocaleSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface UserProfile {
  isModerator?: boolean;
  role?: string;
}

interface AppHeaderProps {
  currentPage?: 'home' | 'dashboard' | 'projects' | 'docs' | 'certificates' | 'moderation' | 'translations' | 'mobile-restricted';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigation = useTranslations("Navigation");
  const router = useRouter();

  // Close mobile menu when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowUserMenu(false);
    };

    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu]);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link 
              href={authUser ? '/dashboard' : '/'} 
              className="flex items-center space-x-2 group" 
              title="Go home"
            >
              <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-orange-600 group-hover:text-orange-700 transition-colors" />
              <span className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-orange-700 transition-colors">
                <span className="hidden sm:inline">Armenian CyberSec Docs</span>
                <span className="sm:hidden">Armenian Docs</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {showNavLinks && (
            <nav className="hidden md:flex items-center space-x-6">
              {currentPage === 'home' ? (
                <div className="flex items-center space-x-8">
                  <a href="#features" className="text-gray-600 hover:text-gray-900">{navigation("features")}</a>
                  <a href="#process" className="text-gray-600 hover:text-gray-900">{navigation("howItWorks")}</a>
                  <a href="#community" className="text-gray-600 hover:text-gray-900">{navigation("community")}</a>
                  <Link href="/dashboard">
                    <Button variant="outline" className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm text-gray-900">
                      {navigation('dashboard')}
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <Link 
                    href="/docs" 
                    className={currentPage === 'docs' ? 'text-orange-600 font-medium' : 'text-gray-600 hover:text-orange-600 transition-colors'}
                  >
                    {navigation('documentation')}
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className={currentPage === 'dashboard' ? 'text-orange-600 font-medium' : 'text-gray-600 hover:text-orange-600 transition-colors'}
                  >
                    {navigation('dashboard')}
                  </Link>
                  <Link 
                    href="/projects" 
                    className={currentPage === 'projects' ? 'text-orange-600 font-medium' : 'text-gray-600 hover:text-orange-600 transition-colors'}
                  >
                    {navigation('projects')}
                  </Link>
                  <Link 
                    href="/certificates" 
                    className={currentPage === 'certificates' ? 'text-orange-600 font-medium' : 'text-gray-600 hover:text-orange-600 transition-colors'}
                  >
                    {navigation('certificates')}
                  </Link>
                  {currentPage === 'translations' && (
                    <Link 
                      href="/translations" 
                      className="text-orange-600 font-medium"
                    >
                      {navigation('translations')}
                    </Link>
                  )}
                  {(userProfile?.isModerator || userProfile?.role === 'administrator') && (
                    <Link 
                      href="/moderation" 
                      className={currentPage === 'moderation' ? 'text-orange-600 font-medium' : 'text-gray-600 hover:text-orange-600 transition-colors'}
                    >
                      {navigation('moderation')}
                    </Link>
                  )}
                </>
              )}
              
              {/* Language Switcher */}
              <div className="border-l border-gray-200 pl-4">
                <LocaleSwitcher />
              </div>
              
              {/* User Menu - only visible when authenticated and not on landing page */}
              {authUser && currentPage !== 'home' && (
                <div className="relative border-l border-gray-200 pl-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserMenu(!showUserMenu);
                    }}
                    className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1 hover:bg-gray-200 transition-colors"
                  >
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {authUser?.displayName?.charAt(0) || authUser?.email?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm font-medium hidden lg:block">
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
                          <span>{navigation("signOut")}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </nav>
          )}

          {/* Mobile Menu Button and Controls */}
          {showNavLinks && (
            <div className="md:hidden flex items-center space-x-3">
              {/* Locale Switcher on Mobile */}
              <LocaleSwitcher />
              
              {/* User Avatar on Mobile */}
              {authUser && currentPage !== 'home' && (
                <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {authUser?.displayName?.charAt(0) || authUser?.email?.charAt(0) || 'U'}
                </div>
              )}
              
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {showNavLinks && mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {currentPage === 'home' ? (
                <>
                  <a 
                    href="#features" 
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </a>
                  <a 
                    href="#process" 
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    How It Works
                  </a>
                  <a 
                    href="#community" 
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Community
                  </a>
                  <Link href="/dashboard">
                    <div className="block px-3 py-2">
                      <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                        Dashboard
                      </Button>
                    </div>
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    href="/docs"
                    className={`block px-3 py-2 rounded-md ${
                      currentPage === 'docs' 
                        ? 'text-orange-600 bg-orange-50 font-medium' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Documentation
                  </Link>
                  <Link 
                    href="/dashboard"
                    className={`block px-3 py-2 rounded-md ${
                      currentPage === 'dashboard' 
                        ? 'text-orange-600 bg-orange-50 font-medium' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/projects"
                    className={`block px-3 py-2 rounded-md ${
                      currentPage === 'projects' 
                        ? 'text-orange-600 bg-orange-50 font-medium' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Projects
                  </Link>
                  <Link 
                    href="/certificates"
                    className={`block px-3 py-2 rounded-md ${
                      currentPage === 'certificates' 
                        ? 'text-orange-600 bg-orange-50 font-medium' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Certificates
                  </Link>
                  {currentPage === 'translations' && (
                    <Link 
                      href="/translations"
                      className="block px-3 py-2 rounded-md text-orange-600 bg-orange-50 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Translations
                    </Link>
                  )}
                  {(userProfile?.isModerator || userProfile?.role === 'administrator') && (
                    <Link 
                      href="/moderation"
                      className={`block px-3 py-2 rounded-md ${
                        currentPage === 'moderation' 
                          ? 'text-orange-600 bg-orange-50 font-medium' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Moderation
                    </Link>
                  )}
                  
                  {/* User Actions in Mobile Menu */}
                  {authUser && (
                    <div className="border-t border-gray-200 mt-3 pt-3">
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium text-gray-900">
                          {authUser?.displayName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500">{authUser?.email}</p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await logout();
                            router.push('/');
                          } catch (error) {
                            console.error('Logout error:', error);
                          }
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 