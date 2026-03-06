# Production Environment Configuration

## Infrastructure

### Server Requirements
- **CPU**: 2 cores minimum
- **RAM**: 4GB minimum
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04 LTS or Docker-compatible OS

---

## Docker Configuration

### Production Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

USER node

CMD ["node", "dist/main.js"]
```

### Docker Compose (Production)
```yaml
version: '3.8'

services:
  backend:
    image: localhost:5000/agent-task-system:${VERSION:-latest}
    container_name: agent-task-prod
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=7d
    networks:
      - app-network
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:14-alpine
    container_name: agent-task-db-prod
    restart: always
    environment:
      - POSTGRES_DB=agent_task_prod
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: agent-task-redis-prod
    restart: always
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    container_name: agent-task-nginx-prod
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - app-network
    depends_on:
      - backend

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
```

---

## Environment Variables

### Required Variables
```bash
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@postgres:5432/agent_task_prod
DB_USER=agent_task_user
DB_PASSWORD=<secure-password>
DB_NAME=agent_task_prod

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=<secure-secret-key>
JWT_EXPIRES_IN=7d

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

---

## Deployment Process

### Pre-deployment Checklist
- [ ] All tests passed
- [ ] Code review completed
- [ ] Docker image built and tagged
- [ ] Database backup created
- [ ] Environment variables configured
- [ ] SSL certificates ready

### Deployment Steps

#### 1. Build Docker Image
```bash
# Build image
docker build -t localhost:5000/agent-task-system:v${VERSION} .

# Tag for production
docker tag localhost:5000/agent-task-system:v${VERSION} localhost:5000/agent-task-system:latest

# Push to registry
docker push localhost:5000/agent-task-system:v${VERSION}
docker push localhost:5000/agent-task-system:latest
```

#### 2. Deploy to Production
```bash
# Pull latest code
git pull origin main

# Backup database
docker exec agent-task-db-prod pg_dump -U ${DB_USER} ${DB_NAME} > backup_$(date +%Y%m%d_%H%M%S).sql

# Stop old containers
docker-compose -f docker-compose.prod.yml down

# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Start new containers
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
curl -f http://localhost/api/v1/health || exit 1
```

#### 3. Post-deployment Verification
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Test API endpoints
curl http://localhost/api/v1/health
curl http://localhost/api/v1/tasks -H "Authorization: Bearer ${TOKEN}"

# Monitor for 5 minutes
docker-compose -f docker-compose.prod.yml logs -f backend --tail=100
```

---

## Monitoring

### Health Check Script
```bash
#!/bin/bash
# health-check.sh

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health)

if [ $RESPONSE -eq 200 ]; then
    echo "✅ Health check passed"
    exit 0
else
    echo "❌ Health check failed: HTTP $RESPONSE"
    exit 1
fi
```

### Monitoring Metrics
- **Uptime**: Service availability
- **Response Time**: API latency
- **Error Rate**: HTTP 4xx/5xx responses
- **Database**: Connection pool, query performance
- **Redis**: Cache hit rate
- **System**: CPU, memory, disk usage

### Alerting Rules
- Service down > 1 minute
- Response time > 500ms
- Error rate > 5%
- Database connections exhausted
- Disk usage > 80%

---

## Rollback Procedure

### Immediate Rollback (Emergency)
```bash
# 1. Stop current version
docker-compose -f docker-compose.prod.yml down

# 2. Restore previous database backup
docker exec -i agent-task-db-prod psql -U ${DB_USER} ${DB_NAME} < backup_PREVIOUS.sql

# 3. Deploy previous version
docker-compose -f docker-compose.prod.yml up -d --force-recreate

# 4. Verify rollback
curl -f http://localhost/api/v1/health
```

### Complete Rollback with Database
```bash
# Estimated time: 5-10 minutes
./scripts/rollback.sh v${PREVIOUS_VERSION}
```

---

## Security Configuration

### Nginx Configuration
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    server {
        listen 80;
        server_name _;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name _;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Rate limiting
            limit_req zone=api burst=20 nodelay;
        }

        location /health {
            proxy_pass http://backend/api/v1/health;
            access_log off;
        }
    }

    # Rate limiting zone
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
```

### Firewall Rules
```bash
# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow SSH
ufw allow 22/tcp

# Deny direct access to application port
ufw deny 3000/tcp

# Enable firewall
ufw enable
```

---

## Performance Optimization

### Application Optimizations
- Enable compression (gzip)
- Implement caching (Redis)
- Database connection pooling
- Query optimization
- Indexing strategy

### System Optimizations
- Increase file descriptor limits
- Tune TCP parameters
- Optimize Docker networking
- Monitor resource usage

---

## Backup Strategy

### Automated Backups
```bash
# Daily database backup (retained for 30 days)
0 2 * * * docker exec agent-task-db-prod pg_dump -U ${DB_USER} ${DB_NAME} | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz

# Weekly full backup (retained for 90 days)
0 3 * * 0 tar -czf /backups/full_$(date +\%Y\%m\%d).tar.gz /app /etc/nginx /backups

# Cleanup old backups
0 4 * * * find /backups -name "db_*.sql.gz" -mtime +30 -delete
0 4 * * * find /backups -name "full_*.tar.gz" -mtime +90 -delete
```

---

## Support & Maintenance

### Log Rotation
```yaml
# /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### Update Process
```bash
# Security updates
apt update && apt upgrade -y

# Docker updates
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

---

_Last Updated: 2026-03-04 16:00_
_Version: 1.0_
_Status: Production Ready_
