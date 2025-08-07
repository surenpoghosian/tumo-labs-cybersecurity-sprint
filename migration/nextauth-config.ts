// NextAuth.js Configuration for Self-Hosted Authentication
import NextAuth, { NextAuthOptions, DefaultSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from './mongodb-client';
import jwt from 'jsonwebtoken';

// Extend the session type to include our custom fields
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'contributor' | 'bot' | 'moderator' | 'administrator';
      username?: string;
      githubUsername?: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: 'contributor' | 'bot' | 'moderator' | 'administrator';
    username?: string;
    githubUsername?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email',
        },
      },
    }),
  ],

  adapter: MongoDBAdapter(clientPromise),

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) {
        return false;
      }

      // Initialize user profile on first sign-in
      const client = await clientPromise;
      const db = client.db('armenian-docs');
      const users = db.collection('users');

      const existingUser = await users.findOne({ email: user.email });

      if (!existingUser) {
        // Create new user profile
        const username = user.email.split('@')[0];
        const newUser = {
          email: user.email,
          name: user.name || '',
          username,
          githubUsername: account?.provider === 'github' ? profile?.login : undefined,
          role: 'contributor',
          expertiseAreas: [],
          statistics: {
            totalCredits: 0,
            approvedTranslations: 0,
            rejectedTranslations: 0,
            totalWordsTranslated: 0,
            contributionCount: 0,
            certificatesEarned: 0,
          },
          certificates: [],
          currentFiles: {},
          contributedFiles: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          lastActive: new Date(),
        };

        await users.insertOne(newUser);
      } else {
        // Update last active
        await users.updateOne(
          { email: user.email },
          { 
            $set: { 
              lastActive: new Date(),
              githubUsername: account?.provider === 'github' ? 
                profile?.login : existingUser.githubUsername
            } 
          }
        );
      }

      return true;
    },

    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        const client = await clientPromise;
        const db = client.db('armenian-docs');
        const users = db.collection('users');

        const dbUser = await users.findOne({ email: user.email });

        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.username = dbUser.username;
          token.githubUsername = dbUser.githubUsername;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.username = token.username as string;
        session.user.githubUsername = token.githubUsername as string;
      }

      return session;
    },
  },

  events: {
    async signIn({ user }) {
      // Log sign-in event
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      // Log sign-out event
      console.log(`User signed out: ${token.email}`);
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

// Helper function to verify JWT tokens (for API routes)
export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    return { userId: decoded.sub };
  } catch (error) {
    return null;
  }
}

// Middleware helper for API routes
export async function withAuth(handler: Function) {
  return async (req: Request) => {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    const verified = await verifyToken(token);

    if (!verified) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add userId to request for handler
    (req as any).userId = verified.userId;
    return handler(req);
  };
}

export default NextAuth(authOptions);