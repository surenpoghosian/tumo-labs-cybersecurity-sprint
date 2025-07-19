import type { ServiceAccount } from 'firebase-admin';

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
    if (firebaseAdmin.apps.length > 0) {
      isFirebaseAdminInitialized = true;
      return true;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    // Check if all required environment variables are present
    if (!projectId || !clientEmail || !privateKey) {
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