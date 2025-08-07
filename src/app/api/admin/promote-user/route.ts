import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreUserProfile } from '@/lib/firestore';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const requesterId = await verifyAuthToken(authHeader);
    const firestore = await getFirestore();
    
    const body = await request.json();
    const { targetUserId, role = 'moderator' } = body;
    
    // Only administrators can promote other users
    const requesterDoc = await firestore.collection('userProfiles').doc(requesterId).get();
    const requester = requesterDoc.exists ? (requesterDoc.data() as FirestoreUserProfile) : null;
    if (!requester || requester.role !== 'administrator') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can promote users' },
        { status: 403 }
      );
    }
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    if (!['moderator', 'administrator'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be either "moderator" or "administrator"' },
        { status: 400 }
      );
    }

    // Get the target user's profile
    const userDoc = await firestore.collection('userProfiles').doc(targetUserId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update the target user's role and moderator status
    const updateData = {
      role: role,
      isModerator: true,
      updatedAt: new Date().toISOString(),
    };

    await firestore.collection('userProfiles').doc(targetUserId).update(updateData);

    // Get the updated profile
    const updatedDoc = await firestore.collection('userProfiles').doc(targetUserId).get();
    const updatedProfile = { id: targetUserId, ...updatedDoc.data() } as FirestoreUserProfile;

    return NextResponse.json({
      success: true,
      message: `User promoted to ${role} successfully`,
      user: {
        id: updatedProfile.id,
        name: updatedProfile.name,
        email: updatedProfile.email,
        role: updatedProfile.role,
        isModerator: updatedProfile.isModerator
      }
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error promoting user:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to promote user',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 