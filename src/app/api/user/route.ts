import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreUserProfile } from '@/lib/firestore';
import { initializeNewUser, createSampleDataForNewUser } from '@/lib/userInitialization';

export async function GET() {
  try {
    const userId = await verifyAuthToken();
    
    // Initialize user profile if it doesn't exist
    const userProfile = await initializeNewUser(userId);

    return NextResponse.json(userProfile);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await verifyAuthToken();
    const body = await request.json();
    const { createSampleData = false, email, name } = body;
    
    // Initialize user with provided info
    const userProfile = await initializeNewUser(userId, email, name);

    // Optionally create sample data for new users
    if (createSampleData) {
      await createSampleDataForNewUser(userId);
    }

    return NextResponse.json({
      ...userProfile,
      sampleDataCreated: createSampleData
    }, { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error initializing user:', error);
    return NextResponse.json(
      { error: 'Failed to initialize user' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await verifyAuthToken();
    const firestore = await getFirestore();
    
    const body = await request.json();
    const { 
      email,
      name,
      username,
      githubUsername,
      expertiseAreas,
      role,
      totalCredits,
      approvedTranslations,
      rejectedTranslations,
      totalWordsTranslated,
      certificates,
      currentFiles,
      contributedFiles
    } = body;

    // Get current profile - initialize if it doesn't exist
    let currentProfile;
    try {
      const doc = await firestore.collection('userProfiles').doc(userId).get();
      if (!doc.exists) {
        currentProfile = await initializeNewUser(userId, email, name);
      } else {
        currentProfile = { id: userId, ...doc.data() } as FirestoreUserProfile;
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // If any error getting profile, initialize a new one
      currentProfile = await initializeNewUser(userId, email, name);
    }

    // Prepare update data
    const updateData: Partial<FirestoreUserProfile> = {
      updatedAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) {
      // Check if username is already taken
      if (username !== currentProfile?.username && username.trim() !== '') {
        const existingUser = await firestore
          .collection('userProfiles')
          .where('username', '==', username)
          .get();
        
        if (!existingUser.empty) {
          return NextResponse.json(
            { error: 'Username already taken' },
            { status: 400 }
          );
        }
      }
      updateData.username = username;
    }
    if (githubUsername !== undefined) updateData.githubUsername = githubUsername;
    if (expertiseAreas !== undefined) {
      if (!Array.isArray(expertiseAreas)) {
        return NextResponse.json(
          { error: 'Expertise areas must be an array' },
          { status: 400 }
        );
      }
      updateData.expertiseAreas = expertiseAreas;
    }

    // Only allow role changes by admins or moderators
    if (role !== undefined && role !== currentProfile?.role) {
      if (currentProfile?.role !== 'administrator' && currentProfile?.role !== 'moderator') {
        return NextResponse.json(
          { error: 'Insufficient permissions to change role' },
          { status: 403 }
        );
      }
      updateData.role = role;
      updateData.isModerator = role === 'moderator' || role === 'administrator';
    }

    // Update statistics (usually done by system, but allow manual updates for admin)
    if (totalCredits !== undefined) updateData.totalCredits = Math.max(0, totalCredits);
    if (approvedTranslations !== undefined) updateData.approvedTranslations = Math.max(0, approvedTranslations);
    if (rejectedTranslations !== undefined) updateData.rejectedTranslations = Math.max(0, rejectedTranslations);
    if (totalWordsTranslated !== undefined) updateData.totalWordsTranslated = Math.max(0, totalWordsTranslated);
    if (certificates !== undefined) updateData.certificates = Array.isArray(certificates) ? certificates : [];
    if (currentFiles !== undefined) updateData.currentFiles = currentFiles || {};
    if (contributedFiles !== undefined) updateData.contributedFiles = contributedFiles || {};

    // Update contribution count and certificates earned based on arrays
    if (certificates !== undefined) {
      updateData.certificatesEarned = Array.isArray(certificates) ? certificates.length : 0;
    }
    if (contributedFiles !== undefined) {
      updateData.contributionCount = contributedFiles ? Object.keys(contributedFiles).length : 0;
    }

    await firestore.collection('userProfiles').doc(userId).update(updateData);

    const updatedDoc = await firestore.collection('userProfiles').doc(userId).get();
    const updatedProfile: FirestoreUserProfile = {
      id: userId,
      ...updatedDoc.data()
    } as FirestoreUserProfile;

    return NextResponse.json(updatedProfile);

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' }, 
      { status: 500 }
    );
  }
} 