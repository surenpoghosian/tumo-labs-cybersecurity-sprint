# Complete Cloud Independence Migration Guide

## Overview
This guide provides step-by-step instructions for migrating the Armenian Docs Translation platform from cloud services (Firebase, Vercel, Cloudflare) to a fully self-hosted infrastructure.

## Pre-Migration Checklist

### 1. Infrastructure Requirements
- [ ] Server with minimum 8GB RAM, 4 CPU cores
- [ ] 100GB+ SSD storage for documents and backups
- [ ] Docker and Docker Compose installed
- [ ] Domain name with DNS control
- [ ] SSL certificate (or Let's Encrypt setup)

### 2. Backup Current Data
```bash
# Export Firestore data
firebase firestore:export gs://your-backup-bucket/backup-$(date +%Y%m%d)

# Download Firebase Auth users
firebase auth:export users.json --format=json
```

## Phase 1: Infrastructure Setup (Weeks 1-2)

### 1.1 Docker Environment Setup

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/cache:/var/cache/nginx
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - app
    restart: unless-stopped

  app:
    build: .
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/armenian-docs
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    volumes:
      - ./uploads:/app/uploads
      - ./certificates:/app/certificates
    depends_on:
      - mongo
      - redis
      - minio
    restart: unless-stopped
    scale: 3  # Run 3 instances for load balancing

  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
      - ./mongo/init:/docker-entrypoint-initdb.d
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USER}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
      - MONGO_INITDB_DATABASE=armenian-docs
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

  minio:
    image: minio/minio
    volumes:
      - minio_data:/data
    environment:
      - MINIO_ROOT_USER=${MINIO_ROOT_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
    command: server /data --console-address ":9001"
    ports:
      - "9001:9001"  # MinIO console
    restart: unless-stopped

  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    ports:
      - "3001:3000"
    restart: unless-stopped

volumes:
  mongo_data:
  redis_data:
  minio_data:
  prometheus_data:
  grafana_data:
```

### 1.2 NGINX Configuration

Create `nginx/nginx.conf`:
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Security
    server_tokens off;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

    # Cache
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m max_size=1g inactive=60m;

    # Upstream
    upstream app_backend {
        least_conn;
        server app:3000 max_fails=3 fail_timeout=30s;
    }

    server {
        listen 80;
        server_name translate.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name translate.yourdomain.com;

        # SSL
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API routes with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Auth routes with stricter rate limiting
        location /api/auth/ {
            limit_req zone=auth burst=5 nodelay;
            proxy_pass http://app_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files with caching
        location /_next/static/ {
            proxy_cache app_cache;
            proxy_cache_valid 200 365d;
            proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
            add_header Cache-Control "public, immutable";
            proxy_pass http://app_backend;
        }

        # Main app
        location / {
            proxy_pass http://app_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

### 1.3 SSL Certificate Setup

```bash
# Using Let's Encrypt with Certbot
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  certbot/certbot certonly \
  --standalone \
  -d translate.yourdomain.com \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive
```

## Phase 2: Database Migration (Weeks 3-4)

### 2.1 Run Migration Script

```bash
# Install dependencies
npm install mongodb firebase-admin

# Set environment variables
export MONGODB_URI=mongodb://localhost:27017/armenian-docs
export FIREBASE_PROJECT_ID=your-project-id
export FIREBASE_CLIENT_EMAIL=your-client-email
export FIREBASE_PRIVATE_KEY="your-private-key"

# Run migration
node migration/firestore-to-mongodb.js
```

### 2.2 Verify Migration

```javascript
// migration/verify-migration.js
const { MongoClient } = require('mongodb');

async function verifyMigration() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  
  const db = client.db('armenian-docs');
  
  const collections = [
    'users',
    'projects',
    'documents',
    'certificates',
    'reviews',
    'translation_memory'
  ];
  
  for (const collection of collections) {
    const count = await db.collection(collection).countDocuments();
    console.log(`${collection}: ${count} documents`);
  }
  
  await client.close();
}

verifyMigration().catch(console.error);
```

## Phase 3: Application Updates (Week 5)

### 3.1 Update Environment Variables

Create `.env.production`:
```env
# Database
MONGODB_URI=mongodb://mongo:27017/armenian-docs
REDIS_URL=redis://redis:6379

# Authentication
NEXTAUTH_URL=https://translate.yourdomain.com
NEXTAUTH_SECRET=generate-a-secure-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Storage
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=your-minio-access-key
MINIO_SECRET_KEY=your-minio-secret-key
MINIO_BUCKET=armenian-docs

# Monitoring
SENTRY_DSN=optional-sentry-dsn
```

### 3.2 Update Application Code

Key changes needed:
1. Replace Firebase imports with MongoDB/NextAuth
2. Update API routes to use MongoDB
3. Add Redis caching layer
4. Implement file storage with MinIO

### 3.3 Create Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create directories for uploads and certificates
RUN mkdir -p /app/uploads /app/certificates
RUN chown -R nextjs:nodejs /app/uploads /app/certificates

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

## Phase 4: Testing & Validation (Week 6)

### 4.1 Functional Testing Checklist

- [ ] User authentication (Google/GitHub OAuth)
- [ ] Project browsing and search
- [ ] File upload and translation workflow
- [ ] Review system functionality
- [ ] Certificate generation and verification
- [ ] Translation memory search
- [ ] API endpoints response times
- [ ] File storage and retrieval
- [ ] Public documentation access

### 4.2 Performance Testing

```bash
# Load testing with k6
k6 run --vus 100 --duration 30s performance-test.js
```

### 4.3 Security Checklist

- [ ] SSL certificate properly configured
- [ ] Database authentication enabled
- [ ] API rate limiting working
- [ ] CORS headers configured
- [ ] Environment variables secured
- [ ] Backup strategy implemented
- [ ] Monitoring alerts configured

## Phase 5: DNS Cutover (Week 6)

### 5.1 Blue-Green Deployment

1. Keep existing Firebase app running
2. Deploy new self-hosted infrastructure
3. Test with subdomain (e.g., beta.translate.yourdomain.com)
4. Gradually migrate traffic using DNS weights
5. Monitor for issues
6. Complete cutover when stable

### 5.2 Rollback Plan

If issues arise:
1. Revert DNS to Firebase hosting
2. Debug issues on staging environment
3. Fix and redeploy
4. Attempt cutover again

## Post-Migration Tasks

### 1. Monitoring Setup

Configure alerts for:
- Server CPU/Memory usage > 80%
- Database connection failures
- API response time > 1s
- Error rate > 1%
- SSL certificate expiration

### 2. Backup Strategy

```bash
# Daily MongoDB backup
mongodump --uri="$MONGODB_URI" --out=/backups/$(date +%Y%m%d)

# Weekly full system backup
tar -czf /backups/full-backup-$(date +%Y%m%d).tar.gz /app /data
```

### 3. Maintenance Scripts

Create cron jobs for:
- Daily database backups
- Weekly log rotation
- Monthly SSL certificate renewal
- Quarterly security updates

## Troubleshooting

### Common Issues

1. **Authentication failures**
   - Check NextAuth configuration
   - Verify OAuth callback URLs
   - Check JWT secret

2. **Database connection issues**
   - Verify MongoDB is running
   - Check connection string
   - Review firewall rules

3. **File upload problems**
   - Check MinIO configuration
   - Verify bucket permissions
   - Check file size limits

4. **Performance issues**
   - Review NGINX caching
   - Check Redis connectivity
   - Monitor database indexes

## Conclusion

This migration provides:
- Complete independence from cloud vendors
- Full control over infrastructure
- Cost-effective scaling
- Enhanced security and privacy
- Better performance for local users

Remember to:
- Test thoroughly before cutover
- Keep backups of all data
- Monitor closely after migration
- Document any custom changes