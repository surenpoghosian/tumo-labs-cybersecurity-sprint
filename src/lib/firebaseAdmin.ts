import type { ServiceAccount } from 'firebase-admin';
import { NextResponse } from 'next/server';

// Lazy import Firebase Admin to avoid initialization issues
let admin: typeof import('firebase-admin') | null = null;
let isFirebaseAdminInitialized = false;
let initializationError: Error | null = null;

async function getFirebaseAdmin() {
  if (admin) return admin;
  
  try {
    // Dynamic import to avoid issues with SSR and bundling
    admin = await import('firebase-admin');
    return admin;
  } catch (error) {
    console.error('Failed to import Firebase Admin SDK:', error);
    throw new Error('Firebase Admin SDK is not available');
  }
}

async function initializeFirebaseAdmin() {
  if (isFirebaseAdminInitialized) return true;
  if (initializationError) return false;

  try {
    const firebaseAdmin = await getFirebaseAdmin();
    
    // Check if already initialized
    if (firebaseAdmin.apps?.length > 0) {
      isFirebaseAdminInitialized = true;
      return true;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    // Check if all required environment variables are present
    if (!projectId || !clientEmail || !privateKey) {
      // In local development we may be using the Firebase emulator and therefore
      // not have a full service-account key in environment variables. In that
      // scenario we still want to initialise the Admin SDK so that server-side
      // code (e.g. API routes) can talk to the emulator. The Admin SDK accepts
      // an initialisation _without_ credentials when the emulator host env
      // variables are present (or when we only need access to the local
      // Firestore emulator).
      // If we detect we are in development **and** either the Firestore
      // emulator is configured or a public projectId exists, fall back to a
      // minimal initialisation instead of aborting.
      if (
        process.env.NODE_ENV === 'development' &&
        (process.env.FIRESTORE_EMULATOR_HOST || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
      ) {
        try {
          const fallbackProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project';
          firebaseAdmin.initializeApp({ projectId: fallbackProjectId });
          isFirebaseAdminInitialized = true;
          console.log('[firebaseAdmin] Initialised Admin SDK with emulator fallback');
          return true;
        } catch (err) {
          console.error('[firebaseAdmin] Failed to initialise with emulator fallback:', err);
          // continue to original warning / return false path below
        }
      }

      console.warn('Firebase Admin SDK not initialized: Missing environment variables');
      console.warn('Required variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
      return false;
    }

    // Validate the private key format
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      console.error('Invalid private key format. Make sure it includes the full PEM format.');
      return false;
    }

    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey,
    };

    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount),
      projectId,
    });

    isFirebaseAdminInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
    return true;
  } catch (error) {
    initializationError = error as Error;
    console.error('Failed to initialize Firebase Admin SDK:', error);
    return false;
  }
}

// Initialize on module load but don't throw
initializeFirebaseAdmin().catch((error) => {
  console.error('Firebase Admin initialization failed on module load:', error);
});

export async function getAuth() {
  try {
    const firebaseAdmin = await getFirebaseAdmin();
    const initialized = await initializeFirebaseAdmin();
    
    if (!initialized) {
      throw new Error('Firebase Admin SDK is not initialized. Please check your environment variables.');
    }
    
    return firebaseAdmin.auth();
  } catch (error) {
    console.error('Failed to get Firebase Auth:', error);
    throw new Error('Firebase Admin SDK is not available');
  }
}

export async function isFirebaseAdminAvailable(): Promise<boolean> {
  try {
    await getFirebaseAdmin();
    return await initializeFirebaseAdmin();
  } catch {
    return false;
  }
}

// Legacy sync export for backward compatibility (but will always return false in problematic environments)
export const isFirebaseAdminAvailableSync = (): boolean => {
  return isFirebaseAdminInitialized && !initializationError;
};

// Export admin for direct access if needed
export { admin };

// Simplified auth function that throws on error - For development only
export async function verifyAuthToken(authHeader?: string): Promise<string> {
  if (!authHeader) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  
  if (!token) {
    throw new Error('Unauthorized');
  }

  const firebaseAdminAvailable = await isFirebaseAdminAvailable();
  
  if (firebaseAdminAvailable) {
    try {
      const auth = await getAuth();
      const decodedToken = await auth.verifyIdToken(token);
      return decodedToken.uid;
    } catch (authError) {
      console.error('Token verification failed:', authError);
      throw new Error('Unauthorized');
    }
  } else {
    console.warn('Firebase Admin not available - authentication disabled for development');
    // In development without proper Firebase setup, you could extract user ID from token payload
    // This is not secure and should only be used for development
    throw new Error('Unauthorized');
  }
}

// Auth function with request parameter for legacy compatibility
export async function verifyAuthTokenWithRequest(request: Request): Promise<{ success: boolean; userId?: string; error?: NextResponse }> {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return {
        success: false,
        error: NextResponse.json({
          success: false,
          error: 'Authentication required. Please provide a valid Bearer token.',
          data: []
        }, { status: 401 })
      };
    }

    const firebaseAdminAvailable = await isFirebaseAdminAvailable();
    
    if (firebaseAdminAvailable) {
      try {
        const auth = await getAuth();
        const decodedToken = await auth.verifyIdToken(token);
        return { success: true, userId: decodedToken.uid };
      } catch (authError) {
        console.error('Token verification failed:', authError);
        return {
          success: false,
          error: NextResponse.json({
            success: false,
            error: 'Invalid authentication token. Please login again.',
            data: []
          }, { status: 401 })
        };
      }
    } else {
      console.warn('Firebase Admin not available');
      return {
        success: false,
        error: NextResponse.json({
          success: false,
          error: 'Authentication service unavailable. Please ensure Firebase Admin is properly configured.',
          data: []
        }, { status: 503 })
      };
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: NextResponse.json({
        success: false,
        error: 'Authentication failed'
      }, { status: 500 })
    };
  }
}

export async function getFirestore() {
  const admin = await import('firebase-admin');
  return admin.firestore();
}