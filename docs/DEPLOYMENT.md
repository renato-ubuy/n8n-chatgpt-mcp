# 🚀 Right API - Production Deployment Guide

## 📋 Table of Contents

- [Overview](#-overview)
- [Infrastructure Requirements](#-infrastructure-requirements)
- [Deployment Options](#-deployment-options)
- [Docker Deployment](#-docker-deployment)
- [Kubernetes Deployment](#-kubernetes-deployment)
- [Cloud Provider Setup](#-cloud-provider-setup)
- [Security Configuration](#-security-configuration)
- [Monitoring & Observability](#-monitoring--observability)
- [Backup & Recovery](#-backup--recovery)
- [Scaling Strategies](#-scaling-strategies)

## 🎯 Overview

This guide covers production deployment of Right API Gateway with enterprise-grade security, monitoring, and scalability.

### Deployment Architecture

```mermaid
graph TB
    A[Load Balancer] --> B[Traefik Gateway]
    B --> C[Right API Instances]
    C --> D[PostgreSQL Cluster]
    C --> E[Redis Cluster]
    C --> F[Plugin Registry]
    
    G[Monitoring Stack] --> C
    H[Log Aggregation] --> C
    I[Backup System] --> D
    
    style A fill:#ff6b6b
    style B fill:#4ecdc4
    style C fill:#45b7d1
    style D fill:#96ceb4
    style E fill:#feca57
```

## 🏗️ Infrastructure Requirements

### Minimum Production Requirements

| Component | Minimum | Recommended | Enterprise |
|-----------|---------|-------------|------------|
| **CPU** | 2 cores | 4 cores | 8+ cores |
| **Memory** | 4GB RAM | 8GB RAM | 16+ GB RAM |
| **Storage** | 50GB SSD | 100GB SSD | 500+ GB SSD |
| **Network** | 100 Mbps | 1 Gbps | 10+ Gbps |
| **Database** | PostgreSQL 13+ | PostgreSQL 15+ | PostgreSQL 15+ HA |
| **Cache** | Redis 6+ | Redis 7+ | Redis 7+ Cluster |

### Supported Platforms

- ✅ **Docker** (Recommended)
- ✅ **Kubernetes**
- ✅ **AWS ECS/EKS**
- ✅ **Google Cloud Run/GKE**
- ✅ **Azure Container Instances/AKS**
- ✅ **Bare Metal/VPS**

## 🐳 Docker Deployment

### Quick Production Setup

#### 1. Prepare Environment

```bash
# Create project directory
mkdir right-api-production
cd right-api-production

# Download production configs
curl -O https://raw.githubusercontent.com/right-api/mcp-gateway/main/docker-compose.prod.yml
curl -O https://raw.githubusercontent.com/right-api/mcp-gateway/main/.env.production
```

#### 2. Configure Environment

```bash
# Copy and edit environment variables
cp .env.production .env
nano .env
```

**Essential Configuration:**
```bash
# Domain Configuration
DOMAIN=your-domain.com
EMAIL=admin@your-domain.com

# Database Configuration
POSTGRES_DB=rightapi_prod
POSTGRES_USER=rightapi_user
POSTGRES_PASSWORD=your-secure-db-password

# Redis Configuration
REDIS_PASSWORD=your-secure-redis-password

# Application Configuration
JWT_SECRET=your-256-bit-jwt-secret
ENCRYPTION_KEY=your-256-bit-encryption-key
ADMIN_API_KEY=your-secure-admin-api-key

# External Services
SMTP_HOST=your-smtp-host
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

#### 3. Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    command:
      - --api.dashboard=true
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.tlschallenge=true
      - --certificatesresolvers.letsencrypt.acme.email=${EMAIL}
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
      - --global.sendAnonymousUsage=false
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.traefik.rule=Host(`traefik.${DOMAIN}`)"
      - "traefik.http.routers.traefik.entrypoints=websecure"
      - "traefik.http.routers.traefik.tls.certresolver=letsencrypt"
      - "traefik.http.routers.traefik.service=api@internal"

  gateway:
    image: rightapi/gateway:latest
    container_name: right-api-gateway
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - DOMAIN=${DOMAIN}
    depends_on:
      - postgres
      - redis
    networks:
      - traefik
      - internal
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.gateway.rule=Host(`api.${DOMAIN}`)"
      - "traefik.http.routers.gateway.entrypoints=websecure"
      - "traefik.http.routers.gateway.tls.certresolver=letsencrypt"
      - "traefik.http.services.gateway.loadbalancer.server.port=3000"

  web:
    image: rightapi/web:latest
    container_name: right-api-web
    restart: unless-stopped
    environment:
      - NEXT_PUBLIC_API_URL=https://api.${DOMAIN}
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`${DOMAIN}`)"
      - "traefik.http.routers.web.entrypoints=websecure"
      - "traefik.http.routers.web.tls.certresolver=letsencrypt"

  postgres:
    image: postgres:15-alpine
    container_name: right-api-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: right-api-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - internal
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  prometheus:
    image: prom/prometheus:latest
    container_name: right-api-prometheus
    restart: unless-stopped
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - internal
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.prometheus.rule=Host(`metrics.${DOMAIN}`)"
      - "traefik.http.routers.prometheus.entrypoints=websecure"
      - "traefik.http.routers.prometheus.tls.certresolver=letsencrypt"

  grafana:
    image: grafana/grafana:latest
    container_name: right-api-grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - internal
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grafana.rule=Host(`dashboard.${DOMAIN}`)"
      - "traefik.http.routers.grafana.entrypoints=websecure"
      - "traefik.http.routers.grafana.tls.certresolver=letsencrypt"

volumes:
  letsencrypt:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  traefik:
    external: true
  internal:
    internal: true
```

#### 4. Deploy

```bash
# Create external network
docker network create traefik

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs gateway
```

## ☸️ Kubernetes Deployment

### Helm Chart Installation

#### 1. Add Helm Repository

```bash
helm repo add right-api https://charts.right-api.com
helm repo update
```

#### 2. Create Values File

```yaml
# values.prod.yaml
global:
  domain: your-domain.com
  
gateway:
  replicaCount: 3
  image:
    repository: rightapi/gateway
    tag: "latest"
  
  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
    limits:
      memory: "1Gi"
      cpu: "1000m"
      
  env:
    NODE_ENV: "production"
    LOG_LEVEL: "info"
    
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70

postgresql:
  enabled: true
  architecture: replication
  primary:
    persistence:
      size: 100Gi
      storageClass: "fast-ssd"
  readReplicas:
    replicaCount: 2

redis:
  enabled: true
  architecture: replication
  master:
    persistence:
      size: 10Gi
      storageClass: "fast-ssd"

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: api.your-domain.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: right-api-tls
      hosts:
        - api.your-domain.com

monitoring:
  prometheus:
    enabled: true
  grafana:
    enabled: true
  serviceMonitor:
    enabled: true
```

#### 3. Install Chart

```bash
# Create namespace
kubectl create namespace right-api

# Install with Helm
helm install right-api right-api/gateway \
  --namespace right-api \
  --values values.prod.yaml \
  --wait
```

#### 4. Verify Deployment

```bash
# Check pods
kubectl get pods -n right-api

# Check services
kubectl get svc -n right-api

# Check ingress
kubectl get ingress -n right-api

# View logs
kubectl logs -f deployment/right-api-gateway -n right-api
```

## ☁️ Cloud Provider Setup

### AWS ECS Deployment

#### 1. Create ECS Task Definition

```json
{
  "family": "right-api-gateway",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/right-api-task-role",
  "containerDefinitions": [
    {
      "name": "gateway",
      "image": "rightapi/gateway:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "postgresql://user:pass@rds-endpoint:5432/db"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/aws/ecs/right-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 2. Create ECS Service

```bash
aws ecs create-service \
  --cluster right-api-cluster \
  --service-name right-api-gateway \
  --task-definition right-api-gateway:1 \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345,subnet-67890],securityGroups=[sg-abcdef],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:region:account:targetgroup/right-api-tg/1234567890123456,containerName=gateway,containerPort=3000"
```

### Google Cloud Run

```bash
# Deploy to Cloud Run
gcloud run deploy right-api-gateway \
  --image gcr.io/project-id/right-api-gateway:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 100 \
  --set-env-vars NODE_ENV=production,DATABASE_URL=postgresql://... \
  --set-cloudsql-instances project-id:region:instance-name
```

### Azure Container Instances

```bash
# Create resource group
az group create --name right-api-rg --location eastus

# Deploy container
az container create \
  --resource-group right-api-rg \
  --name right-api-gateway \
  --image rightapi/gateway:latest \
  --dns-name-label right-api-gateway \
  --ports 3000 \
  --environment-variables NODE_ENV=production \
  --secure-environment-variables DATABASE_URL=postgresql://... \
  --cpu 2 \
  --memory 4
```

## 🔒 Security Configuration

### SSL/TLS Configuration

#### Let's Encrypt with Traefik

```yaml
# traefik.yml
certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@your-domain.com
      storage: /letsencrypt/acme.json
      tlsChallenge: {}
      # Alternative: DNS Challenge
      # dnsChallenge:
      #   provider: cloudflare
      #   resolvers:
      #     - "1.1.1.1:53"
      #     - "8.8.8.8:53"
```

### Firewall Rules

```bash
# UFW Configuration
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Environment Security

```bash
# Secure environment file permissions
chmod 600 .env
chown root:root .env

# Use Docker secrets for sensitive data
echo "your-db-password" | docker secret create db_password -
echo "your-jwt-secret" | docker secret create jwt_secret -
```

## 📊 Monitoring & Observability

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "right-api-rules.yml"

scrape_configs:
  - job_name: 'right-api-gateway'
    static_configs:
      - targets: ['gateway:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'traefik'
    static_configs:
      - targets: ['traefik:8080']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Grafana Dashboards

Import our pre-built dashboards:

1. **Right API Overview** (ID: 15001)
2. **Plugin Performance** (ID: 15002)
3. **Workflow Metrics** (ID: 15003)
4. **Infrastructure Health** (ID: 15004)

### Log Management

#### Centralized Logging with ELK Stack

```yaml
# filebeat.yml
filebeat.inputs:
- type: container
  paths:
    - '/var/lib/docker/containers/*/*.log'
  processors:
    - add_docker_metadata: ~

output.logstash:
  hosts: ["logstash:5044"]
```

#### Log Rotation

```bash
# /etc/logrotate.d/right-api
/var/log/right-api/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 right-api right-api
    postrotate
        docker kill -s HUP right-api-gateway
    endscript
}
```

## 💾 Backup & Recovery

### Database Backup

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="right-api-postgres"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
docker exec $DB_CONTAINER pg_dump -U rightapi_user rightapi_prod | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Cleanup old backups (keep last 30 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-backup-bucket/postgres/
```

### Automated Backup with Cron

```bash
# Add to crontab
crontab -e

# Backup database every 6 hours
0 */6 * * * /opt/right-api/scripts/backup-database.sh
```

### Disaster Recovery Plan

1. **Database Recovery**
```bash
# Restore from backup
gunzip -c backup_20250707_120000.sql.gz | docker exec -i right-api-postgres psql -U rightapi_user -d rightapi_prod
```

2. **Full System Recovery**
```bash
# Restore from infrastructure as code
git clone https://github.com/your-org/right-api-infrastructure
cd right-api-infrastructure
terraform apply
ansible-playbook -i inventory/production site.yml
```

## 📈 Scaling Strategies

### Horizontal Scaling

#### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.swarm.yml right-api

# Scale services
docker service scale right-api_gateway=5
```

#### Kubernetes HPA

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: right-api-gateway-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: right-api-gateway
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Vertical Scaling

#### Resource Monitoring

```bash
# Monitor resource usage
docker stats right-api-gateway

# Kubernetes resource monitoring
kubectl top pods -n right-api
kubectl top nodes
```

#### Automatic Resource Adjustment

```yaml
# Kubernetes VPA
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: right-api-gateway-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: right-api-gateway
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: gateway
      maxAllowed:
        cpu: 2
        memory: 4Gi
      minAllowed:
        cpu: 500m
        memory: 512Mi
```

## 🎯 Performance Optimization

### Database Optimization

```sql
-- PostgreSQL performance tuning
-- /etc/postgresql/postgresql.conf

shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Redis Optimization

```bash
# redis.conf optimizations
maxmemory 512mb
maxmemory-policy allkeys-lru
tcp-keepalive 300
timeout 0
```

### CDN Configuration

```yaml
# CloudFlare settings
ssl: "strict"
cache_level: "aggressive"
browser_cache_ttl: 31536000
rocket_loader: "on"
minify:
  css: "on"
  html: "on"
  js: "on"
```

## 🚨 Health Checks & Alerts

### Health Check Endpoints

```typescript
// Health check implementation
app.get('/health', async (req, res) => {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkPluginRegistry(),
    checkExternalServices()
  ]);
  
  const status = checks.every(check => 
    check.status === 'fulfilled' && check.value.healthy
  ) ? 'healthy' : 'unhealthy';
  
  res.status(status === 'healthy' ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    checks: checks.map(check => ({
      status: check.status,
      result: check.status === 'fulfilled' ? check.value : check.reason
    }))
  });
});
```

### Alerting Rules

```yaml
# prometheus-rules.yml
groups:
- name: right-api-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      
  - alert: DatabaseConnectionFailed
    expr: up{job="postgres"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Database connection failed"
```

---

**Ready for production?** Follow our [Security Checklist](./SECURITY.md) and [Performance Tuning Guide](./PERFORMANCE.md) before going live.