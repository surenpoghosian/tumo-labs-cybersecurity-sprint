// Firestore utility functions and types
import { getFirestore } from './firebaseAdmin';

// User Profiles (enhanced with statistics from MongoDB plan)
export interface FirestoreUserProfile {
  id: string;
  uId: string; // User ID for Firestore rules
  email: string;
  name: string;
  username: string; // Added from MongoDB plan
  githubUsername?: string;
  role: 'contributor' | 'bot' | 'moderator' | 'administrator'; // Added from MongoDB plan
  expertiseAreas: string[];
  isModerator: boolean;
  contributionCount: number;
  certificatesEarned: number;
  // Enhanced user statistics from MongoDB plan
  totalCredits: number;
  approvedTranslations: number;
  rejectedTranslations: number;
  totalWordsTranslated: number;
  certificates: string[]; // Array of certificate IDs
  currentFiles: Record<string, string>; // {fileId: fileName}
  contributedFiles: Record<string, string>; // {fileId: fileName}
  createdBy: string; // Firebase Auth UID
  createdAt: string;
  updatedAt: string;
  lastActive?: string;
}

// Enhanced Projects (aligned with MongoDB plan)
export interface FirestoreProject {
  id: string;
  uId: string; // User ID for Firestore rules
  title: string; // Changed from 'name' to match MongoDB plan
  version: string; // Added from MongoDB plan
  description: string;
  developedBy: string; // Added from MongoDB plan
  difficulty: number; // Changed to number to match MongoDB plan
  source: string; // Added from MongoDB plan (GitHub URL)
  categories: string[]; // Added from MongoDB plan
  status: 'not started' | 'in progress' | 'completed'; // Aligned with MongoDB plan
  files: string[]; // Array of file IDs
  createdBy: string; // Firebase Auth UID
  createdAt: string;
  updatedAt: string;
  // Keep some current fields that add value
  estimatedHours?: number;
  translationProgress?: number;
  availableForTranslation: boolean;
  // GitHub sync fields
  lastSyncedAt?: string;
  lastSyncSha?: string;
}

// File collection (new - core of file-based model)
export interface FirestoreFile {
  id: string;
  uId: string; // User ID for Firestore rules
  projectId: string;
  fileName: string;
  filePath: string;
  folderPath?: string; // Folder organization
  originalText: string; // Full file content
  translatedText: string; // Full translated content
  status: 'not taken' | 'in progress' | 'pending' | 'rejected' | 'accepted'; // From MongoDB plan
  assignedTranslatorId?: string;
  reviewerId?: string;
  translations: FirestoreTranslation[]; // Array of translation attempts
  wordCount: number;
  estimatedHours: number;
  actualHours: number;
  createdBy: string; // Firebase Auth UID
  createdAt: string;
  updatedAt: string;
  lastModified: string;
  // Enhanced storage and sync fields
  storageType?: 'firestore' | 'firebase_storage' | 'github_raw';
  contentUrl?: string; // For external storage
  fileSize?: number; // File size in bytes
  githubSha?: string; // For version tracking
  lastSyncedAt?: string; // Last sync from GitHub
}

// Translation (embedded in File or separate collection)
export interface FirestoreTranslation {
  id: string;
  text: string;
  comment: string;
  isHumanTranslated: boolean; // From MongoDB plan
  username: string; // Translator username
  userId: string; // Firebase Auth UID
  createdAt: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  reviewComments?: string[];
}

// Translation Memory Entry (keep current - it's good)
export interface TranslationMemoryEntry {
  id: string;
  uId: string; // User ID for Firestore rules
  originalText: string;
  translatedText: string;
  context: string;
  category: string;
  confidence: number;
  createdBy: string; // Firebase Auth UID
  createdAt: string;
  usageCount: number;
  lastUsed?: string;
}

// Certificates (enhanced to match MongoDB plan)
export interface FirestoreCertificate {
  id: string;
  uId: string; // User ID for Firestore rules
  userId: string; // Firebase Auth UID
  username: string; // Added for easier reference
  fullName: string; // From MongoDB plan
  projectId: string;
  projectName: string;
  fileId?: string; // For file-based certificates
  githubRepo: string;
  prUrl?: string;
  mergedAt?: string;
  type: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'sigma' | 'alpha'; // From MongoDB plan
  certificateType: 'translation' | 'review' | 'contribution'; // Keep current
  category: string;
  verificationCode: string;
  pdfUrl: string;
  createdBy: string; // Firebase Auth UID
  createdAt: string;
}

// Translation Sessions (keep for tracking work sessions)
export interface FirestoreTranslationSession {
  id: string;
  uId: string; // User ID for Firestore rules
  fileId: string; // Changed from projectId to fileId
  userId: string;
  startTime: string;
  endTime?: string;
  wordsTranslated: number;
  autoSaves: number;
  createdBy: string; // Firebase Auth UID
  lastActivity?: string;
}

// Reviews (adapted for file-based model)
export interface FirestoreReview {
  id: string;
  uId: string; // User ID for Firestore rules
  fileId: string; // Changed from translationProjectId
  translationId: string; // Specific translation being reviewed
  reviewerId: string;
  status: 'pending' | 'in-progress' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  securityAccuracyScore?: number;
  languageQualityScore?: number;
  comments: string;
  createdBy: string; // Firebase Auth UID
  createdAt: string;
  dueDate?: string;
  estimatedReviewTime?: number;
  reviewType: 'translation' | 'content' | 'security';
  category: string;
}

// Review Comments (adapted for file-based model)
export interface FirestoreReviewComment {
  id: string;
  uId: string; // User ID for Firestore rules
  reviewId: string;
  fileId: string;
  translationId: string;
  lineNumber?: number; // For specific line comments
  commentText: string;
  type: 'suggestion' | 'correction' | 'question' | 'approval';
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  createdBy: string; // Firebase Auth UID
  createdAt: string;
}

// Autosave data (adapted for file-based model)
export interface FirestoreAutosave {
  id: string;
  uId: string; // User ID for Firestore rules
  fileId: string; // Changed from translationProjectId
  translationId?: string; // Optional specific translation
  content: string;
  timestamp: string;
  createdBy: string; // Firebase Auth UID
}

// Utility functions for common Firestore operations
export async function addTranslationEntry(entry: Omit<TranslationMemoryEntry, 'id'>): Promise<string> {
  const firestore = await getFirestore();
  const docRef = await firestore.collection('translationMemory').add(entry);
  return docRef.id;
}

export async function getTranslationEntries(userId: string): Promise<TranslationMemoryEntry[]> {
  const firestore = await getFirestore();
  const snapshot = await firestore
    .collection('translationMemory')
    .where('createdBy', '==', userId)
    .get();
  
  const entries: TranslationMemoryEntry[] = [];
  snapshot.forEach((doc) => {
    entries.push({
      id: doc.id,
      ...doc.data()
    } as TranslationMemoryEntry);
  });
  
  return entries;
}

// New utility functions for file-based operations
export async function getProjectFiles(projectId: string, userId: string): Promise<FirestoreFile[]> {
  const firestore = await getFirestore();
  const snapshot = await firestore
    .collection('files')
    .where('projectId', '==', projectId)
    .where('uId', '==', userId)
    .get();
  
  const files: FirestoreFile[] = [];
  snapshot.forEach((doc) => {
    files.push({
      id: doc.id,
      ...doc.data()
    } as FirestoreFile);
  });
  
  return files;
}

export async function updateUserStats(userId: string, stats: Partial<FirestoreUserProfile>): Promise<void> {
  const firestore = await getFirestore();
  await firestore
    .collection('userProfiles')
    .doc(userId)
    .update({
      ...stats,
      updatedAt: new Date().toISOString()
    });
} 