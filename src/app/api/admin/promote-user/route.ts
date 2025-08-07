import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreUserProfile } from '@/lib/firestore';

function isAdmin(userId: string): boolean {
  const allowlist = (process.env.ADMIN_USER_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return allowlist.includes(userId);
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const userId = await verifyAuthToken(authHeader);
    const firestore = await getFirestore();
    
    const body = await request.json();
    const { targetUserId, role = 'moderator' } = body;
    
    // Restrict to admins only via allowlist
    if (!isAdmin(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    // Update the user's role and moderator status
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