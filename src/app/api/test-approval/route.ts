import { NextResponse } from 'next/server';
import { verifyAuthToken, getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreFile } from '@/lib/firestore';

// Test endpoint to help debug approval flow
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    await verifyAuthToken(authHeader);
    const firestore = await getFirestore();
    
    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }

    // Get the file
    const fileDoc = await firestore.collection('files').doc(fileId).get();
    if (!fileDoc.exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileData = fileDoc.data() as FirestoreFile;

    // Get user profile to check word count before
    let userBefore = null;
    if (fileData.assignedTranslatorId) {
      const userDoc = await firestore.collection('userProfiles').doc(fileData.assignedTranslatorId).get();
      if (userDoc.exists) {
        userBefore = userDoc.data();
      }
    }

    // Call the approval endpoint
    const approvalResponse = await fetch(`${request.url.replace('/test-approval', '')}/files/${fileId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        approved: true,
        comments: 'Test approval via test endpoint'
      })
    });

    const approvalResult = await approvalResponse.json();

    // Get user profile to check word count after
    let userAfter = null;
    if (fileData.assignedTranslatorId) {
      const userDoc = await firestore.collection('userProfiles').doc(fileData.assignedTranslatorId).get();
      if (userDoc.exists) {
        userAfter = userDoc.data();
      }
    }

    return NextResponse.json({
      success: true,
      fileId,
      fileWordCount: fileData.wordCount,
      translatorId: fileData.assignedTranslatorId,
      wordCountBefore: userBefore?.totalWordsTranslated || 0,
      wordCountAfter: userAfter?.totalWordsTranslated || 0,
      approvalResult,
      test: 'approval-flow'
    });

  } catch (error) {
    console.error('Test approval error:', error);
    return NextResponse.json(
      { 
        error: 'Test approval failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 