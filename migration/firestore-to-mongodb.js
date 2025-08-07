// Firestore to MongoDB Migration Script
const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');

class FirestoreToMongoMigration {
  constructor(firebaseConfig, mongoUri) {
    this.firebaseApp = admin.initializeApp(firebaseConfig);
    this.firestore = admin.firestore();
    this.mongoUri = mongoUri;
    this.mappings = {
      userIdMap: new Map(), // Firebase UID -> MongoDB ObjectId
      projectIdMap: new Map(),
      fileIdMap: new Map(),
      certificateIdMap: new Map()
    };
  }

  async connect() {
    this.mongoClient = new MongoClient(this.mongoUri);
    await this.mongoClient.connect();
    this.db = this.mongoClient.db('armenian-docs');
    console.log('Connected to MongoDB');
  }

  async migrateUsers() {
    console.log('Migrating users...');
    const userProfiles = await this.firestore.collection('userProfiles').get();
    const users = this.db.collection('users');
    
    for (const doc of userProfiles.docs) {
      const data = doc.data();
      const mongoUser = {
        uid: data.uId || doc.id,
        email: data.email,
        name: data.name,
        username: data.username,
        githubUsername: data.githubUsername,
        role: data.role || 'contributor',
        expertiseAreas: data.expertiseAreas || [],
        statistics: {
          totalCredits: data.totalCredits || 0,
          approvedTranslations: data.approvedTranslations || 0,
          rejectedTranslations: data.rejectedTranslations || 0,
          totalWordsTranslated: data.totalWordsTranslated || 0,
          contributionCount: data.contributionCount || 0,
          certificatesEarned: data.certificatesEarned || 0
        },
        certificates: [], // Will update after certificates migration
        currentFiles: data.currentFiles || {},
        contributedFiles: data.contributedFiles || {},
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastActive: data.lastActive ? new Date(data.lastActive) : null
      };
      
      const result = await users.insertOne(mongoUser);
      this.mappings.userIdMap.set(doc.id, result.insertedId);
    }
    
    console.log(`Migrated ${userProfiles.size} users`);
  }

  async migrateProjects() {
    console.log('Migrating projects...');
    const projects = await this.firestore.collection('projects').get();
    const mongoProjects = this.db.collection('projects');
    
    for (const doc of projects.docs) {
      const data = doc.data();
      const userId = this.mappings.userIdMap.get(data.uId) || null;
      
      const mongoProject = {
        userId,
        title: data.title,
        version: data.version,
        description: data.description,
        developedBy: data.developedBy,
        difficulty: data.difficulty,
        source: data.source,
        categories: data.categories || [],
        status: data.status || 'not started',
        files: [], // Will update after files migration
        estimatedHours: data.estimatedHours || 0,
        translationProgress: data.translationProgress || 0,
        availableForTranslation: data.availableForTranslation !== false,
        lastSyncedAt: data.lastSyncedAt ? new Date(data.lastSyncedAt) : null,
        lastSyncSha: data.lastSyncSha,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      };
      
      const result = await mongoProjects.insertOne(mongoProject);
      this.mappings.projectIdMap.set(doc.id, result.insertedId);
    }
    
    console.log(`Migrated ${projects.size} projects`);
  }

  async migrateFiles() {
    console.log('Migrating files...');
    const files = await this.firestore.collection('files').get();
    const mongoDocuments = this.db.collection('documents');
    
    for (const doc of files.docs) {
      const data = doc.data();
      const userId = this.mappings.userIdMap.get(data.uId) || null;
      const projectId = this.mappings.projectIdMap.get(data.projectId) || null;
      const assignedTranslatorId = data.assignedTranslatorId ? 
        this.mappings.userIdMap.get(data.assignedTranslatorId) : null;
      const reviewerId = data.reviewerId ? 
        this.mappings.userIdMap.get(data.reviewerId) : null;
      
      // Handle translations array
      const translations = (data.translations || []).map(t => ({
        text: t.text,
        comment: t.comment,
        isHumanTranslated: t.isHumanTranslated !== false,
        username: t.username,
        userId: this.mappings.userIdMap.get(t.userId) || null,
        createdAt: new Date(t.createdAt),
        status: t.status || 'draft',
        reviewComments: t.reviewComments || []
      }));
      
      const mongoDocument = {
        projectId,
        userId,
        fileName: data.fileName,
        filePath: data.filePath,
        folderPath: data.folderPath,
        originalText: data.originalText,
        translatedText: data.translatedText,
        status: data.status,
        assignedTranslatorId,
        reviewerId,
        translations,
        metadata: {
          wordCount: data.wordCount || 0,
          estimatedHours: data.estimatedHours || 0,
          actualHours: data.actualHours || 0,
          fileSize: data.fileSize,
          storageType: this.mapStorageType(data.storageType),
          contentUrl: data.contentUrl,
          githubSha: data.githubSha,
          lastSyncedAt: data.lastSyncedAt ? new Date(data.lastSyncedAt) : null
        },
        visibility: data.visibility || 'public',
        seo: {
          title: data.seoTitle,
          description: data.seoDescription,
          keywords: data.seoKeywords || []
        },
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null
      };
      
      const result = await mongoDocuments.insertOne(mongoDocument);
      this.mappings.fileIdMap.set(doc.id, result.insertedId);
    }
    
    // Update project files references
    await this.updateProjectFileReferences();
    
    console.log(`Migrated ${files.size} files`);
  }

  async updateProjectFileReferences() {
    const projects = await this.firestore.collection('projects').get();
    const mongoProjects = this.db.collection('projects');
    
    for (const doc of projects.docs) {
      const data = doc.data();
      const mongoProjectId = this.mappings.projectIdMap.get(doc.id);
      
      if (mongoProjectId && data.files) {
        const fileIds = data.files.map(fId => this.mappings.fileIdMap.get(fId)).filter(Boolean);
        await mongoProjects.updateOne(
          { _id: mongoProjectId },
          { $set: { files: fileIds } }
        );
      }
    }
  }

  async migrateCertificates() {
    console.log('Migrating certificates...');
    const certificates = await this.firestore.collection('certificates').get();
    const mongoCertificates = this.db.collection('certificates');
    
    for (const doc of certificates.docs) {
      const data = doc.data();
      const userId = this.mappings.userIdMap.get(data.userId) || null;
      const projectId = this.mappings.projectIdMap.get(data.projectId) || null;
      const fileId = data.fileId ? this.mappings.fileIdMap.get(data.fileId) : null;
      
      const mongoCertificate = {
        userId,
        username: data.username,
        fullName: data.fullName,
        projectId,
        projectName: data.projectName,
        fileId,
        githubRepo: data.githubRepo,
        prUrl: data.prUrl,
        mergedAt: data.mergedAt ? new Date(data.mergedAt) : null,
        type: data.type,
        certificateType: data.certificateType,
        category: data.category,
        verificationCode: data.verificationCode,
        pdfPath: `/certificates/${data.verificationCode}.pdf`, // Local path
        metadata: {
          wordsTranslated: data.wordsTranslated || 0,
          filesCompleted: data.filesCompleted || 0,
          reviewsPassed: data.reviewsPassed || 0
        },
        createdAt: new Date(data.createdAt)
      };
      
      const result = await mongoCertificates.insertOne(mongoCertificate);
      this.mappings.certificateIdMap.set(doc.id, result.insertedId);
    }
    
    // Update user certificate references
    await this.updateUserCertificateReferences();
    
    console.log(`Migrated ${certificates.size} certificates`);
  }

  async updateUserCertificateReferences() {
    const userProfiles = await this.firestore.collection('userProfiles').get();
    const users = this.db.collection('users');
    
    for (const doc of userProfiles.docs) {
      const data = doc.data();
      const mongoUserId = this.mappings.userIdMap.get(doc.id);
      
      if (mongoUserId && data.certificates) {
        const certificateIds = data.certificates
          .map(cId => this.mappings.certificateIdMap.get(cId))
          .filter(Boolean);
        
        await users.updateOne(
          { _id: mongoUserId },
          { $set: { certificates: certificateIds } }
        );
      }
    }
  }

  async migrateReviews() {
    console.log('Migrating reviews...');
    const reviews = await this.firestore.collection('reviews').get();
    const mongoReviews = this.db.collection('reviews');
    
    for (const doc of reviews.docs) {
      const data = doc.data();
      const fileId = this.mappings.fileIdMap.get(data.fileId) || null;
      const reviewerId = this.mappings.userIdMap.get(data.reviewerId) || null;
      const userId = this.mappings.userIdMap.get(data.uId) || null;
      
      const mongoReview = {
        fileId,
        translationId: data.translationId,
        reviewerId,
        userId,
        status: data.status,
        priority: data.priority || 'medium',
        scores: {
          securityAccuracy: data.securityAccuracyScore,
          languageQuality: data.languageQualityScore
        },
        comments: data.comments,
        reviewType: data.reviewType,
        category: data.category,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedReviewTime: data.estimatedReviewTime,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt || data.createdAt)
      };
      
      await mongoReviews.insertOne(mongoReview);
    }
    
    console.log(`Migrated ${reviews.size} reviews`);
  }

  async migrateTranslationMemory() {
    console.log('Migrating translation memory...');
    const memory = await this.firestore.collection('translationMemory').get();
    const mongoMemory = this.db.collection('translation_memory');
    
    for (const doc of memory.docs) {
      const data = doc.data();
      const userId = this.mappings.userIdMap.get(data.uId || data.createdBy) || null;
      
      const mongoEntry = {
        userId,
        originalText: data.originalText,
        translatedText: data.translatedText,
        context: data.context,
        category: data.category,
        confidence: data.confidence || 0.8,
        usageCount: data.usageCount || 0,
        projectId: null, // Can be updated if needed
        fileId: null, // Can be updated if needed
        createdAt: new Date(data.createdAt),
        lastUsed: data.lastUsed ? new Date(data.lastUsed) : null
      };
      
      await mongoMemory.insertOne(mongoEntry);
    }
    
    console.log(`Migrated ${memory.size} translation memory entries`);
  }

  async createIndexes() {
    console.log('Creating indexes...');
    const { indexes } = require('./mongodb-schemas');
    
    for (const [collection, indexList] of Object.entries(indexes)) {
      for (const index of indexList) {
        await this.db.collection(collection).createIndex(index);
      }
    }
    
    console.log('Indexes created successfully');
  }

  mapStorageType(firestoreType) {
    switch (firestoreType) {
      case 'firestore':
        return 'database';
      case 'firebase_storage':
        return 'minio'; // Will use MinIO for file storage
      case 'github_raw':
        return 'filesystem';
      default:
        return 'database';
    }
  }

  async runMigration() {
    try {
      await this.connect();
      
      // Run migrations in order
      await this.migrateUsers();
      await this.migrateProjects();
      await this.migrateFiles();
      await this.migrateCertificates();
      await this.migrateReviews();
      await this.migrateTranslationMemory();
      
      // Create indexes
      await this.createIndexes();
      
      console.log('Migration completed successfully!');
      
      // Save mapping for reference
      const fs = require('fs');
      fs.writeFileSync(
        'migration-mappings.json',
        JSON.stringify({
          userIdMap: Array.from(this.mappings.userIdMap.entries()),
          projectIdMap: Array.from(this.mappings.projectIdMap.entries()),
          fileIdMap: Array.from(this.mappings.fileIdMap.entries()),
          certificateIdMap: Array.from(this.mappings.certificateIdMap.entries())
        }, null, 2)
      );
      
    } catch (error) {
      console.error('Migration failed:', error);
      // Re-throw so process exits non-zero in CLI
      throw error;
    } finally {
      await this.mongoClient.close();
    }
  }
}

// Usage
if (require.main === module) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase Admin credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }

  const migration = new FirestoreToMongoMigration(
    {
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    },
    process.env.MONGODB_URI || 'mongodb://localhost:27017/armenian-docs'
  );

  migration.runMigration().catch(console.error);
}

module.exports = FirestoreToMongoMigration;