import { NextResponse } from 'next/server';
import { verifyAuthToken, getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreUserProfile } from '@/lib/firestore';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const userId = await verifyAuthToken(authHeader);
    const firestore = await getFirestore();

    // Get the current user profile
    const userDoc = await firestore.collection('userProfiles').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({
        error: 'User profile not found. Please log in first.'
      }, { status: 404 });
    }

    const userProfile = userDoc.data() as FirestoreUserProfile;
    const currentWords = userProfile.totalWordsTranslated || 0;

    // Add 1000 words for testing certificate system
    const wordsToAdd = 1000;
    const newTotal = currentWords + wordsToAdd;

    await firestore.collection('userProfiles').doc(userId).update({
      totalWordsTranslated: newTotal,
      approvedTranslations: (userProfile.approvedTranslations || 0) + 1,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Added ${wordsToAdd} words for testing`,
      data: {
        previousTotal: currentWords,
        wordsAdded: wordsToAdd,
        newTotal: newTotal,
        note: 'You can now claim certificates based on your word count!'
      }
    });

  } catch (error) {
    console.error('Test seed error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to add test words',
      success: false
    }, { status: 500 });
  }
} 