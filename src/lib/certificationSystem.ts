// Certificate system based on word count milestones
import { getFirestore } from './firebaseAdmin';
import { FirestoreCertificate, FirestoreUserProfile } from './firestore';

export interface CertificateTier {
  id: string;
  name: string;
  description: string;
  wordsRequired: number;
  type: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'sigma' | 'alpha';
  color: string;
  icon: string;
  benefits: string[];
}

export const CERTIFICATE_TIERS: CertificateTier[] = [
  {
    id: 'bronze',
    name: 'Bronze Translator',
    description: 'First steps in Armenian cybersecurity translation',
    wordsRequired: 500,
    type: 'bronze',
    color: 'orange-600',
    icon: '🥉',
    benefits: [
      'Recognition as contributing translator',
      'Access to translation memory',
      'Basic community features'
    ]
  },
  {
    id: 'silver',
    name: 'Silver Translator',
    description: 'Established contributor to Armenian cybersecurity docs',
    wordsRequired: 2500,
    type: 'silver',
    color: 'gray-400',
    icon: '🥈',
    benefits: [
      'All Bronze benefits',
      'Priority access to new projects',
      'Enhanced translation tools',
      'Contributor badge on profile'
    ]
  },
  {
    id: 'gold',
    name: 'Gold Translator',
    description: 'Expert Armenian cybersecurity translator',
    wordsRequired: 10000,
    type: 'gold',
    color: 'yellow-500',
    icon: '🥇',
    benefits: [
      'All Silver benefits',
      'Review privileges for junior translators',
      'Direct communication with project maintainers',
      'Featured on contributors page'
    ]
  },
  {
    id: 'platinum',
    name: 'Platinum Master',
    description: 'Elite translator with exceptional contributions',
    wordsRequired: 25000,
    type: 'platinum',
    color: 'purple-600',
    icon: '💎',
    benefits: [
      'All Gold benefits',
      'Mentorship program access',
      'Exclusive preview of new projects',
      'Voice in platform development decisions'
    ]
  },
  {
    id: 'diamond',
    name: 'Diamond Expert',
    description: 'Master of Armenian cybersecurity translation',
    wordsRequired: 50000,
    type: 'diamond',
    color: 'blue-600',
    icon: '💠',
    benefits: [
      'All Platinum benefits',
      'Co-authorship recognition on major projects',
      'Advisory board invitation',
      'Annual appreciation award'
    ]
  },
  {
    id: 'sigma',
    name: 'Sigma Legend',
    description: 'Legendary contributor to Armenian cybersecurity',
    wordsRequired: 100000,
    type: 'sigma',
    color: 'indigo-700',
    icon: '⭐',
    benefits: [
      'All Diamond benefits',
      'Permanent recognition in platform history',
      'Special mention in academic publications',
      'Lifetime achievement recognition'
    ]
  },
  {
    id: 'alpha',
    name: 'Alpha Pioneer',
    description: 'Ultimate pioneer of Armenian cybersecurity education',
    wordsRequired: 200000,
    type: 'alpha',
    color: 'red-600',
    icon: '🏆',
    benefits: [
      'All Sigma benefits',
      'Named scholarship program',
      'Permanent advisory role',
      'Legacy contributor status'
    ]
  }
];

export interface CertificationProgress {
  currentTier: CertificateTier | null;
  nextTier: CertificateTier | null;
  totalWords: number;
  wordsToNext: number;
  progressPercentage: number;
  availableCertificates: CertificateTier[];
  earnedCertificates: string[];
}

export function calculateCertificationProgress(userProfile: FirestoreUserProfile): CertificationProgress {
  const totalWords = userProfile.totalWordsTranslated || 0;
  const earnedCertificates = userProfile.certificates || [];
  
  // Find current tier (highest earned)
  let currentTier: CertificateTier | null = null;
  for (let i = CERTIFICATE_TIERS.length - 1; i >= 0; i--) {
    if (totalWords >= CERTIFICATE_TIERS[i].wordsRequired) {
      currentTier = CERTIFICATE_TIERS[i];
      break;
    }
  }
  
  // Find next tier
  let nextTier: CertificateTier | null = null;
  for (const tier of CERTIFICATE_TIERS) {
    if (totalWords < tier.wordsRequired) {
      nextTier = tier;
      break;
    }
  }
  
  // Calculate progress to next tier
  let wordsToNext = 0;
  let progressPercentage = 0;
  
  if (nextTier) {
    const previousTierWords = currentTier ? currentTier.wordsRequired : 0;
    const nextTierWords = nextTier.wordsRequired;
    const wordsInCurrentLevel = totalWords - previousTierWords;
    const wordsNeededForLevel = nextTierWords - previousTierWords;
    
    wordsToNext = nextTierWords - totalWords;
    progressPercentage = Math.min(100, (wordsInCurrentLevel / wordsNeededForLevel) * 100);
  } else {
    // User has reached the highest tier
    progressPercentage = 100;
  }
  
  // Find all available certificates (tiers user qualifies for but hasn't claimed)
  const availableCertificates = CERTIFICATE_TIERS.filter(tier => 
    totalWords >= tier.wordsRequired && !earnedCertificates.includes(tier.id)
  );
  
  return {
    currentTier,
    nextTier,
    totalWords,
    wordsToNext,
    progressPercentage,
    availableCertificates,
    earnedCertificates
  };
}

export async function awardCertificate(
  userId: string, 
  tierId: string, 
  projectId?: string, 
  fileId?: string
): Promise<FirestoreCertificate | null> {
  const firestore = await getFirestore();
  
  try {
    const tier = CERTIFICATE_TIERS.find(t => t.id === tierId);
    if (!tier) {
      throw new Error(`Certificate tier ${tierId} not found`);
    }
    
    // Get user profile
    const userDoc = await firestore.collection('userProfiles').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('User profile not found');
    }
    
    const userProfile = userDoc.data() as FirestoreUserProfile;
    
    // Check if user qualifies for this certificate
    if ((userProfile.totalWordsTranslated || 0) < tier.wordsRequired) {
      throw new Error(`User does not qualify for ${tier.name} (needs ${tier.wordsRequired} words, has ${userProfile.totalWordsTranslated || 0})`);
    }
    
    // Check if certificate already exists
    const existingCerts = userProfile.certificates || [];
    if (existingCerts.includes(tierId)) {
      console.log(`User ${userId} already has ${tier.name} certificate`);
      return null;
    }
    
    // Generate verification code
    const verificationCode = `CYBS-${tier.type.toUpperCase()}-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    
    // Create certificate document
    const certificateData: Omit<FirestoreCertificate, 'id'> = {
      uId: userId,
      userId: userId,
      username: userProfile.username || userProfile.name || 'Unknown',
      fullName: userProfile.name || 'Unknown User',
      projectId: projectId || 'milestone-achievement',
      projectName: projectId ? 'Project Translation' : `${tier.name} Milestone`,
      fileId: fileId,
      githubRepo: 'armenian-docs-translate',
      type: tier.type,
      certificateType: 'translation',
      category: 'Word Count Milestone',
      verificationCode,
      pdfUrl: `/certificates/${tierId}-${userId}.pdf`, // Will be generated on download
      createdBy: userId,
      createdAt: new Date().toISOString()
    };
    
    // Add certificate to collection
    const certRef = await firestore.collection('certificates').add(certificateData);
    
    // Update user profile with new certificate
    const updatedCertificates = [...existingCerts, tierId];
    await firestore.collection('userProfiles').doc(userId).update({
      certificates: updatedCertificates,
      certificatesEarned: updatedCertificates.length,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`Awarded ${tier.name} certificate to user ${userId}`);
    
    return {
      id: certRef.id,
      ...certificateData
    };
    
  } catch (error) {
    console.error('Error awarding certificate:', error);
    throw error;
  }
}

export async function checkAndAwardMilestoneCertificates(userId: string): Promise<FirestoreCertificate[]> {
  const firestore = await getFirestore();
  
  try {
    // Get user profile
    const userDoc = await firestore.collection('userProfiles').doc(userId).get();
    if (!userDoc.exists) {
      return [];
    }
    
    const userProfile = userDoc.data() as FirestoreUserProfile;
    const progress = calculateCertificationProgress(userProfile);
    
    // Award all available certificates
    const awardedCertificates: FirestoreCertificate[] = [];
    
    for (const tier of progress.availableCertificates) {
      try {
        const certificate = await awardCertificate(userId, tier.id);
        if (certificate) {
          awardedCertificates.push(certificate);
        }
      } catch (error) {
        console.error(`Failed to award ${tier.name} to user ${userId}:`, error);
      }
    }
    
    return awardedCertificates;
    
  } catch (error) {
    console.error('Error checking milestone certificates:', error);
    return [];
  }
}

export function getCertificateTierById(tierId: string): CertificateTier | null {
  return CERTIFICATE_TIERS.find(tier => tier.id === tierId) || null;
}

export function getNextMilestone(currentWords: number): CertificateTier | null {
  return CERTIFICATE_TIERS.find(tier => currentWords < tier.wordsRequired) || null;
} 