import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreFile, updateUserStats } from '@/lib/firestore';
import { verifyNextAuthBearerToken } from '@/lib/auth-server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

function isObjectId(val: unknown): val is { toString: () => string } {
  return !!val && typeof (val as { toString: unknown }).toString === 'function';
}

function serializeDoc(doc: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc)) {
    if (key === '_id' && isObjectId(value)) {
      result.id = value.toString();
      continue;
    }
    result[key] = isObjectId(value) ? value.toString() : value;
  }
  return result;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';

    if (process.env.USE_MONGO === 'true') {
      const authRes = await verifyNextAuthBearerToken(authHeader);
      if (!authRes.success || !authRes.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const client = await clientPromise;
      const db = client.db('armenian-docs');
      const documents = db.collection('documents');
      const url = new URL(request.url);
      const statusFilter = url.searchParams.get('status');

      let query: Record<string, unknown> = {};
      if (statusFilter === 'accepted') {
        query.status = 'accepted';
      } else {
        query = { $or: [ { userId: new ObjectId(authRes.userId) }, { assignedTranslatorId: new ObjectId(authRes.userId) } ] };
      }
      const files = await documents.find(query).toArray();
      const serialized = files.map((f) => serializeDoc(f as unknown as Record<string, unknown>));

      const stats = {
        total: files.length,
        available: files.filter(f => f.status === 'not taken').length,
        inProgress: files.filter(f => f.status === 'in progress').length,
        pending: files.filter(f => f.status === 'pending').length,
        accepted: files.filter(f => f.status === 'accepted').length,
        rejected: files.filter(f => f.status === 'rejected').length,
      };

      return NextResponse.json({ success: true, data: serialized, meta: { ...stats, isEmpty: files.length === 0, userId: authRes.userId } });
    }

    const userId = await verifyAuthToken(authHeader);
    const firestore = await getFirestore();
    
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status');

    let files: FirestoreFile[] = [];

    try {
      // Get files based on filter
      let snapshot;
      
      if (statusFilter === 'accepted') {
        // For approved documents view, get all accepted files
        snapshot = await firestore
          .collection('files')
          .where('status', '==', 'accepted')
          .get();
      } else {
        // Get all files accessible to the user (assigned or available)
        snapshot = await firestore
          .collection('files')
          .where('uId', '==', userId)
          .get();
      }

      snapshot.forEach((doc) => {
        const data = doc.data();
        files.push({
          ...data,
          id: doc.id,
        } as FirestoreFile);
      });

      // Also get files assigned to the user
      const assignedSnapshot = await firestore
        .collection('files')
        .where('assignedTranslatorId', '==', userId)
        .get();

      assignedSnapshot.forEach((doc) => {
        const data = doc.data();
        // Avoid duplicates
        if (!files.find(f => f.id === doc.id)) {
          files.push({
            ...data,
            id: doc.id,
          } as FirestoreFile);
        }
      });

    } catch (err) {
      console.log('No files found or collection does not exist for user:', userId, err);
      files = [];
    }

    // Categorize files for better response
    const fileStats = {
      total: files?.length,
      available: files.filter(f => f.status === 'not taken')?.length,
      inProgress: files.filter(f => f.status === 'in progress')?.length,
      pending: files.filter(f => f.status === 'pending')?.length,
      accepted: files.filter(f => f.status === 'accepted')?.length,
      rejected: files.filter(f => f.status === 'rejected')?.length
    };

    return NextResponse.json({
      success: true,
      data: files,
      meta: {
        ...fileStats,
        isEmpty: files?.length === 0,
        userId
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch files',
        success: false,
        data: [],
        meta: {
          total: 0,
          available: 0,
          inProgress: 0,
          pending: 0,
          accepted: 0,
          rejected: 0,
          isEmpty: true
        }
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';

    if (process.env.USE_MONGO === 'true') {
      const authRes = await verifyNextAuthBearerToken(authHeader);
      if (!authRes.success || !authRes.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const body = await request.json();
      const { projectId, fileName, filePath, originalText, wordCount, estimatedHours } = body;
      if (!projectId || !fileName || !filePath || !originalText) {
        return NextResponse.json({ error: 'Missing required fields: projectId, fileName, filePath, originalText', success: false }, { status: 400 });
      }
      if (!originalText.trim()) {
        return NextResponse.json({ error: 'Original text cannot be empty', success: false }, { status: 400 });
      }
      const calculatedWordCount = wordCount || originalText.trim().split(/\s+/).filter((w: string) => w?.length > 0)?.length;
      const calculatedEstimatedHours = estimatedHours || Math.max(0.5, Math.ceil(calculatedWordCount / 250));

      const client = await clientPromise;
      const db = client.db('armenian-docs');
      const documents = db.collection('documents');
      const fileData = {
        userId: new ObjectId(authRes.userId),
        projectId: new ObjectId(projectId),
        fileName: fileName.trim(),
        filePath: filePath.trim(),
        originalText: originalText.trim(),
        translatedText: '',
        status: 'not taken',
        translations: [],
        metadata: {
          wordCount: calculatedWordCount,
          estimatedHours: calculatedEstimatedHours,
          actualHours: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastModified: new Date(),
        visibility: 'private',
      };
      const result = await documents.insertOne(fileData);
      return NextResponse.json({ success: true, data: { id: result.insertedId.toString(), ...fileData }, message: 'File created successfully' }, { status: 201 });
    }

    const userId = await verifyAuthToken(authHeader);
    const firestore = await getFirestore();
    
    const body = await request.json();
    const { 
      projectId, 
      fileName, 
      filePath, 
      originalText,
      wordCount,
      estimatedHours 
    } = body;

    // Validate required fields
    if (!projectId || !fileName || !filePath || !originalText) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: projectId, fileName, filePath, originalText',
          success: false
        },
        { status: 400 }
      );
    }

    // Validate originalText is not empty
    if (!originalText.trim()) {
      return NextResponse.json(
        { 
          error: 'Original text cannot be empty',
          success: false
        },
        { status: 400 }
      );
    }

    // Calculate word count if not provided
    const calculatedWordCount = wordCount || originalText.trim().split(/\s+/).filter((word: string) => word?.length > 0)?.length;
    const calculatedEstimatedHours = estimatedHours || Math.max(0.5, Math.ceil(calculatedWordCount / 250)); // ~250 words per hour, minimum 0.5 hours

    // Create new file document
    const fileData: Omit<FirestoreFile, 'id'> = {
      uId: userId,
      projectId: projectId.trim(),
      fileName: fileName.trim(),
      filePath: filePath.trim(),
      originalText: originalText.trim(),
      translatedText: '',
      status: 'not taken',
      translations: [],
      wordCount: calculatedWordCount,
      estimatedHours: calculatedEstimatedHours,
      actualHours: 0,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      visibility: 'private' // Default to private until approved
    };

    const docRef = await firestore.collection('files').add(fileData);

    // Update user's current files (only if not already in progress files)
    try {
      await updateUserStats(userId, {
        currentFiles: { [docRef.id]: fileName.trim() }
      });
    } catch (error) {
      // Don't fail file creation if user stats update fails
      console.warn('Failed to update user stats:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...fileData
      },
      message: 'File created successfully'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error creating file:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create file',
        success: false
      }, 
      { status: 500 }
    );
  }
} 