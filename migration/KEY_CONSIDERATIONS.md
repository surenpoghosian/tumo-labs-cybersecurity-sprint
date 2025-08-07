# Key Considerations for Cloud Independence Migration

## Critical Areas Requiring Special Attention

### 1. **Authentication Migration Impacts**

#### User Experience Considerations:
- **Session Management**: NextAuth sessions work differently than Firebase Auth
  - Firebase tokens auto-refresh; NextAuth requires explicit refresh
  - Solution: Implement token refresh middleware
  - User impact: May need to re-login more frequently initially

- **OAuth Redirect URLs**: Must update in Google/GitHub OAuth apps
  - Old: `https://your-app.firebaseapp.com/__/auth/handler`
  - New: `https://translate.yourdomain.com/api/auth/callback/[provider]`

#### Code Changes Required:
```typescript
// Before (Firebase)
const user = auth.currentUser;
const token = await user.getIdToken();

// After (NextAuth)
const session = await getSession();
const token = await getIdToken(); // Custom implementation
```

### 2. **Real-time Features**

The current app uses auto-save functionality that may rely on Firestore's real-time capabilities.

**Solutions:**
1. **Server-Sent Events (SSE)** for auto-save status
2. **WebSockets** via Socket.io for real-time collaboration
3. **Polling** with optimistic UI updates

**Implementation:**
```typescript
// Auto-save with Redis + SSE
app.post('/api/autosave', async (req, res) => {
  const { fileId, content } = req.body;
  
  // Save to Redis for quick access
  await redis.setJSON(`autosave:${fileId}`, { content, timestamp: Date.now() }, 300);
  
  // Persist to MongoDB periodically
  if (shouldPersist()) {
    await saveToMongoDB(fileId, content);
  }
  
  // Notify via SSE
  sendSSE(userId, { type: 'autosave', status: 'saved' });
});
```

### 3. **File Storage Strategy**

Currently storing file content in Firestore, which has a 1MB document limit.

**MinIO Implementation:**
```typescript
// File storage service
class FileStorageService {
  private minioClient: Minio.Client;
  
  async storeDocument(fileId: string, content: string): Promise<string> {
    const buffer = Buffer.from(content);
    
    if (buffer.length > 1024 * 1024) { // > 1MB
      // Store in MinIO
      const objectName = `documents/${fileId}`;
      await this.minioClient.putObject('armenian-docs', objectName, buffer);
      return `minio://${objectName}`;
    } else {
      // Store in MongoDB directly
      return 'mongodb://inline';
    }
  }
}
```

### 4. **Performance Optimizations**

#### Caching Strategy:
```typescript
// Multi-level caching
async function getProject(projectId: string) {
  // L1: Memory cache (for same process)
  if (memoryCache.has(projectId)) {
    return memoryCache.get(projectId);
  }
  
  // L2: Redis cache
  const cached = await redis.getJSON(`project:${projectId}`);
  if (cached) {
    memoryCache.set(projectId, cached);
    return cached;
  }
  
  // L3: MongoDB
  const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });
  
  // Cache for future requests
  await redis.setJSON(`project:${projectId}`, project, 300);
  memoryCache.set(projectId, project);
  
  return project;
}
```

#### Database Indexes (Critical for Performance):
```javascript
// Must create these indexes for performance parity with Firestore
db.collection('documents').createIndex({ projectId: 1, status: 1 });
db.collection('documents').createIndex({ assignedTranslatorId: 1, status: 1 });
db.collection('documents').createIndex({ 'visibility': 1, 'publishedAt': -1 }); // For public docs
db.collection('users').createIndex({ email: 1 }, { unique: true });
db.collection('certificates').createIndex({ verificationCode: 1 }, { unique: true });
```

### 5. **Security Considerations**

#### API Authentication:
```typescript
// Middleware to verify JWT tokens
export async function authMiddleware(req: Request) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
    req.userId = decoded.sub;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

#### Rate Limiting:
```typescript
// Apply rate limiting to prevent abuse
app.use('/api/translations', async (req, res, next) => {
  const identifier = req.userId || req.ip;
  const { allowed, remaining, resetAt } = await checkRateLimit(
    `api:translations:${identifier}`,
    100, // 100 requests
    3600  // per hour
  );
  
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', resetAt);
  
  if (!allowed) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  next();
});
```

### 6. **Data Migration Validation**

**Critical Validation Steps:**
1. **Row counts** match between Firestore and MongoDB
2. **Data integrity** - all foreign keys resolve correctly
3. **User authentication** - users can log in with same credentials
4. **File content** - all translations are accessible
5. **Certificates** - verification codes still work

**Validation Script:**
```javascript
async function validateMigration() {
  const issues = [];
  
  // Check user accounts
  const firestoreUsers = await getFirestoreCount('userProfiles');
  const mongoUsers = await db.collection('users').countDocuments();
  
  if (firestoreUsers !== mongoUsers) {
    issues.push(`User count mismatch: Firestore=${firestoreUsers}, MongoDB=${mongoUsers}`);
  }
  
  // Check file content accessibility
  const files = await db.collection('documents').find({ translatedText: { $ne: "" } }).limit(10).toArray();
  
  for (const file of files) {
    if (file.metadata.storageType === 'minio') {
      const exists = await minioClient.statObject('armenian-docs', `documents/${file._id}`);
      if (!exists) {
        issues.push(`Missing MinIO object for file ${file._id}`);
      }
    }
  }
  
  return issues;
}
```

### 7. **Rollback Strategy**

**Database Sync During Transition:**
```javascript
// Dual-write during transition period
async function saveTranslation(data) {
  // Save to MongoDB (new)
  await mongoDb.collection('documents').updateOne(...);
  
  // Also save to Firestore (old) during transition
  if (process.env.DUAL_WRITE_ENABLED === 'true') {
    await firestore.collection('files').doc(data.id).update(...);
  }
}
```

### 8. **Monitoring and Alerting**

**Key Metrics to Monitor:**
- API response times (p50, p95, p99)
- Database query performance
- Redis hit/miss ratio
- MinIO storage usage
- SSL certificate expiration
- Authentication success/failure rates

**Prometheus Metrics:**
```typescript
// Custom metrics for monitoring
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Track translation operations
const translationOperations = new promClient.Counter({
  name: 'translation_operations_total',
  help: 'Total number of translation operations',
  labelNames: ['operation', 'status']
});
```

### 9. **SEO and Public Access**

The platform serves public documentation that needs to maintain SEO rankings.

**Considerations:**
- Maintain same URL structure
- Implement proper 301 redirects if URLs change
- Ensure meta tags are preserved
- Implement sitemap generation
- Add structured data for better search visibility

### 10. **Backup and Disaster Recovery**

**Automated Backup Strategy:**
```bash
#!/bin/bash
# Daily backup script

# MongoDB backup
mongodump --uri="${MONGODB_URI}" --gzip --archive="/backups/mongo-$(date +%Y%m%d).gz"

# MinIO backup
mc mirror minio/armenian-docs /backups/minio-$(date +%Y%m%d)/

# Redis backup (for critical data only)
redis-cli --rdb /backups/redis-$(date +%Y%m%d).rdb

# Rotate old backups (keep 30 days)
find /backups -name "*.gz" -mtime +30 -delete
```

## Migration Timeline Adjustments

Based on the complexity discovered, recommend adjusting timeline:

1. **Phase 1**: Infrastructure (2 weeks) ✓
2. **Phase 2**: Database Migration (3 weeks) - *Extended by 1 week*
3. **Phase 3**: Application Updates (2 weeks) - *Extended by 1 week*
4. **Phase 4**: Testing & Validation (2 weeks) - *Extended by 1 week*
5. **Phase 5**: Gradual Rollout (1 week) ✓

**Total: 10 weeks** (vs original 6 weeks)

## Success Criteria

- [ ] All users can authenticate successfully
- [ ] Translation workflow functions identically
- [ ] No data loss during migration
- [ ] Performance metrics meet or exceed current levels
- [ ] Zero downtime during cutover
- [ ] Rollback tested and ready
- [ ] Monitoring shows stable operation for 48 hours
- [ ] Backup and restore procedures verified

## Risk Mitigation

1. **Data Loss**: Multiple backup strategies, validation scripts
2. **Performance Degradation**: Extensive load testing, caching layers
3. **Security Vulnerabilities**: Security audit, penetration testing
4. **User Disruption**: Gradual rollout, feature flags
5. **Technical Debt**: Clean architecture, comprehensive documentation