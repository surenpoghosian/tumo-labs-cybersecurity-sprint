/* eslint-disable @typescript-eslint/no-unused-vars */
import { getFirestore } from './firebaseAdmin';
import { FirestoreUserProfile, FirestoreFile, FirestoreProject, FirestoreCertificate, TranslationMemoryEntry } from './firestore';

export async function initializeNewUser(userId: string, userEmail?: string, userName?: string): Promise<FirestoreUserProfile> {
  const firestore = await getFirestore();
  
  // Check if user profile already exists
  const existingProfile = await firestore.collection('userProfiles').doc(userId).get();
  
  if (existingProfile.exists) {
    // Update last active and return existing profile
    const profileData = existingProfile.data() as FirestoreUserProfile;
    await firestore.collection('userProfiles').doc(userId).update({
      lastActive: new Date().toISOString()
    });
    return {
      ...profileData,
      id: userId
    };
  }

  // Create default user profile for new user
  const defaultProfile: Omit<FirestoreUserProfile, 'id'> = {
    uId: userId,
    email: userEmail || '',
    name: userName || 'New User',
    username: '', // Will be set when user completes profile
    githubUsername: '',
    role: 'contributor',
    expertiseAreas: [],
    isModerator: false,
    contributionCount: 0,
    certificatesEarned: 0,
    totalCredits: 0,
    approvedTranslations: 0,
    rejectedTranslations: 0,
    totalWordsTranslated: 0,
    certificates: [],
    currentFiles: {},
    contributedFiles: {},
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastActive: new Date().toISOString()
  };

  // Create the user profile
  await firestore.collection('userProfiles').doc(userId).set(defaultProfile);

  return {
    id: userId,
    ...defaultProfile
  };
}

export async function getUserDashboardData(userId: string) {
  const firestore = await getFirestore();
  
  try {
    // Initialize user if needed
    const userProfile = await initializeNewUser(userId);

    // Get user's current files with error handling
    let currentFiles: FirestoreFile[] = [];
    try {
      const filesSnapshot = await firestore
        .collection('files')
        .where('assignedTranslatorId', '==', userId)
        .where('status', 'in', ['in progress', 'pending'])
        .limit(10)
        .get();
      
      filesSnapshot.forEach((doc) => {
        currentFiles.push({
          id: doc.id,
          ...doc.data()
        } as FirestoreFile);
      });
    } catch (error) {
      console.log('No current files found for user:', userId);
      currentFiles = [];
    }

    // Get user's recent projects with error handling
    let recentProjects: FirestoreProject[] = [];
    try {
      const projectsSnapshot = await firestore
        .collection('projects')
        .where('availableForTranslation', '==', true)
        .limit(5)
        .get();
      
      projectsSnapshot.forEach((doc) => {
        recentProjects.push({
          id: doc.id,
          ...doc.data()
        } as FirestoreProject);
      });
    } catch (error) {
      console.log('No projects found');
      recentProjects = [];
    }

    // Get user's certificates with error handling
    let certificates: FirestoreCertificate[] = [];
    try {
      const certsSnapshot = await firestore
        .collection('certificates')
        .where('userId', '==', userId)
        .limit(5)
        .get();
      
      certsSnapshot.forEach((doc) => {
        certificates.push({
          id: doc.id,
          ...doc.data()
        } as FirestoreCertificate);
      });
    } catch (error) {
      console.log('No certificates found for user:', userId);
      certificates = [];
    }

    // Get user's recent translation memory entries with error handling
    let translationMemory: TranslationMemoryEntry[] = [];
    try {
      const tmSnapshot = await firestore
        .collection('translationMemory')
        .where('createdBy', '==', userId)
        .limit(10)
        .get();
      
      tmSnapshot.forEach((doc) => {
        translationMemory.push({
          id: doc.id,
          ...doc.data()
        } as TranslationMemoryEntry);
      });
    } catch (error) {
      console.log('No translation memory found for user:', userId);
      translationMemory = [];
    }

    // Calculate statistics safely
    const stats = {
      totalFiles: currentFiles.length,
      filesInProgress: currentFiles.filter(f => f.status === 'in progress').length,
      filesPending: currentFiles.filter(f => f.status === 'pending').length,
      totalCertificates: certificates.length,
      totalCredits: userProfile.totalCredits || 0,
      wordsTranslated: userProfile.totalWordsTranslated || 0,
      approvedTranslations: userProfile.approvedTranslations || 0,
      rejectedTranslations: userProfile.rejectedTranslations || 0
    };

    return {
      user: userProfile,
      stats,
      currentFiles,
      recentProjects,
      certificates,
      translationMemory,
      isEmpty: currentFiles.length === 0 && certificates.length === 0 && translationMemory.length === 0
    };

  } catch (error) {
    console.error('Error getting dashboard data:', error);
    
    // Return safe empty state if there's any error
    const userProfile = await initializeNewUser(userId);
    return {
      user: userProfile,
      stats: {
        totalFiles: 0,
        filesInProgress: 0,
        filesPending: 0,
        totalCertificates: 0,
        totalCredits: 0,
        wordsTranslated: 0,
        approvedTranslations: 0,
        rejectedTranslations: 0
      },
      currentFiles: [],
      recentProjects: [],
      certificates: [],
      translationMemory: [],
      isEmpty: true
    };
  }
}

export async function createSampleDataForNewUser(userId: string): Promise<void> {
  const firestore = await getFirestore();
  
  try {
    // Add some sample translation memory entries to get the user started
    const sampleTMEntries = [
      {
        uId: userId,
        originalText: "authentication",
        translatedText: "նույնականացում",
        context: "user login process",
        category: "cybersecurity",
        confidence: 0.95,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        usageCount: 0,
        lastUsed: new Date().toISOString()
      },
      {
        uId: userId,
        originalText: "vulnerability",
        translatedText: "խոցելիություն",
        context: "security weakness",
        category: "cybersecurity",
        confidence: 0.98,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        usageCount: 0,
        lastUsed: new Date().toISOString()
      },
      {
        uId: userId,
        originalText: "encryption",
        translatedText: "գաղտնագրում",
        context: "data protection",
        category: "cybersecurity",
        confidence: 0.96,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        usageCount: 0,
        lastUsed: new Date().toISOString()
      }
    ];

    // Add sample translation memory entries
    const batch = firestore.batch();
    sampleTMEntries.forEach((entry) => {
      const docRef = firestore.collection('translationMemory').doc();
      batch.set(docRef, entry);
    });

    await batch.commit();
    console.log('Sample data created for new user:', userId);

  } catch (error) {
    console.error('Error creating sample data:', error);
    // Don't throw error - sample data creation is optional
  }
} 