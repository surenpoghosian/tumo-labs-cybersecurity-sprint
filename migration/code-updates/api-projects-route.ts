import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { redis } from '@/lib/redis';

// MongoDB type definitions
interface Project {
  _id?: ObjectId;
  userId: ObjectId;
  title: string;
  version: string;
  description: string;
  developedBy: string;
  difficulty: number;
  source: string;
  categories: string[];
  status: 'not started' | 'in progress' | 'completed';
  files: ObjectId[];
  estimatedHours: number;
  translationProgress: number;
  availableForTranslation: boolean;
  lastSyncedAt?: Date;
  lastSyncSha?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: Request) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Redis cache first
    const cacheKey = `projects:available`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return NextResponse.json({
        success: true,
        data: JSON.parse(cached),
        meta: {
          cached: true,
        }
      });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('armenian-docs');
    const projectsCollection = db.collection<Project>('projects');
    const documentsCollection = db.collection('documents');

    // Get all available projects
    const projects = await projectsCollection
      .find({ availableForTranslation: true })
      .toArray();

    // Process each project and calculate real statistics
    const enrichedProjects = await Promise.all(
      projects.map(async (project) => {
        // Get files for this project to calculate real progress
        const files = await documentsCollection
          .find({ projectId: project._id })
          .toArray();

        const totalFiles = files.length;
        const completedFiles = files.filter(
          file => file.status === 'accepted' || file.status === 'pending'
        ).length;
        
        const totalWords = files.reduce((sum, file) => sum + (file.metadata?.wordCount || 0), 0);
        const estimatedHours = files.reduce((sum, file) => sum + (file.metadata?.estimatedHours || 0), 0);

        // Calculate real translation progress
        const translationProgress = totalFiles > 0 
          ? Math.round((completedFiles / totalFiles) * 100) 
          : 0;

        return {
          id: project._id?.toString(),
          ...project,
          _id: undefined, // Remove MongoDB _id from response
          files: files.map(f => f._id.toString()),
          translationProgress,
          estimatedHours: estimatedHours || project.estimatedHours || 0,
        };
      })
    );

    // Cache the results for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(enrichedProjects));

    return NextResponse.json({
      success: true,
      data: enrichedProjects,
      meta: {
        total: enrichedProjects.length,
        available: enrichedProjects.filter(p => p.availableForTranslation).length,
        isEmpty: enrichedProjects.length === 0,
        cached: false,
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch projects',
        success: false,
        data: [],
        meta: {
          total: 0,
          available: 0,
          isEmpty: true
        }
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = new ObjectId(session.user.id);
    const body = await request.json();
    
    const { 
      title,
      version,
      description,
      developedBy,
      difficulty,
      source,
      categories,
      estimatedHours,
      availableForTranslation = true
    } = body;

    // Validate required fields
    if (!title || !version || !description || !developedBy || difficulty === undefined || !source || !categories) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: title, version, description, developedBy, difficulty, source, categories',
          success: false
        },
        { status: 400 }
      );
    }

    // Validate categories is an array
    if (!Array.isArray(categories)) {
      return NextResponse.json(
        { 
          error: 'Categories must be an array',
          success: false
        },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('armenian-docs');
    const projectsCollection = db.collection<Project>('projects');

    // Create new project document
    const projectData: Omit<Project, '_id'> = {
      userId,
      title: title.trim(),
      version: version.trim(),
      description: description.trim(),
      developedBy: developedBy.trim(),
      difficulty: Math.max(1, Math.min(5, Number(difficulty))),
      source: source.trim(),
      categories: categories.filter((cat: string) => cat && cat.trim()),
      status: 'not started',
      files: [],
      estimatedHours: Math.max(0, estimatedHours || 0),
      translationProgress: 0,
      availableForTranslation,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await projectsCollection.insertOne(projectData);

    // Invalidate cache
    await redis.del('projects:available');

    // Log activity
    await db.collection('activity_logs').insertOne({
      userId,
      action: 'project_created',
      projectId: result.insertedId,
      projectTitle: projectData.title,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...projectData,
      },
      message: 'Project created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create project',
        success: false
      }, 
      { status: 500 }
    );
  }
}