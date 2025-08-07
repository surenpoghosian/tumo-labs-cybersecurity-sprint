'use client';

import React, { createContext, useContext } from 'react';
import { useSession, signIn, signOut, SessionProvider } from 'next-auth/react';

interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: 'contributor' | 'bot' | 'moderator' | 'administrator';
  username?: string;
  githubUsername?: string;
  getIdToken?: () => Promise<string>;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const signInWithGoogle = async () => {
    await signIn('google');
  };

  const signInWithGitHub = async () => {
    await signIn('github');
  };

  const logout = async () => {
    await signOut();
  };

  const nextAuthUser = (session?.user as AuthUser) || null;
  const value: AuthContextType = {
    user: nextAuthUser
      ? {
          ...nextAuthUser,
          getIdToken: async () => {
            const res = await fetch('/api/auth/token');
            if (!res.ok) throw new Error('Failed to get token');
            const data = await res.json();
            return data.token as string;
          },
        }
      : null,
    loading: status === 'loading',
    signInWithGoogle,
    signInWithGitHub,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SessionProvider>
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  );
};