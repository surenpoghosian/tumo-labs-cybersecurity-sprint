import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface TranslationMemoryEntry {
  uId: string,
  id?: string;
  originalText: string;
  translatedText: string;
  context: string;
  category: string;
  confidence: number;
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

// Simple function to add translation memory entry
export const addTranslationEntry = async (entry: Omit<TranslationMemoryEntry, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'translationMemory'), entry);
  return docRef.id;
};

// Simple function to get all translation memory entries
export const getTranslationEntries = async (): Promise<TranslationMemoryEntry[]> => {
  const querySnapshot = await getDocs(collection(db, 'translationMemory'));
  const entries: TranslationMemoryEntry[] = [];
  
  querySnapshot.forEach((doc) => {
    entries.push({
      id: doc.id,
      ...doc.data()
    } as TranslationMemoryEntry);
  });
  
  return entries;
}; 