---
id: deployment-troubleshooting-guide
title: Deployment Troubleshooting Guide
category: guides
lastUpdated: 2026-01-17
maintainedBy: ai-agent
version: 1.0.0
relatedDocs:
  - id: cicd-deployment-guide
    type: see-also
  - id: docker-configuration-guide
    type: references
  - id: vm-setup-guide
    type: references
tags:
  - troubleshooting
  - debugging
  - deployment
---

# Deployment Troubleshooting Guide

## Overview

This guide covers common issues encountered during CI/CD pipeline execution and deployment, with solutions and debugging steps.

---

## Issue Categories

```mermaid
flowchart TB
    subgraph Build["Build Issues"]
        B1[OOM during build]
        B2[GHCR auth failure]
        B3[Dockerfile errors]
    end

    subgraph Deploy["Deploy Issues"]
        D1[SSH connection failed]
        D2[Image pull failed]
        D3[Container won't start]
    end

    subgraph Runtime["Runtime Issues"]
        R1[Health check fails]
        R2[Database connection]
        R3[Workers not running]
    end

    subgraph Infra["Infrastructure Issues"]
        I1[Port conflicts]
        I2[Volume issues]
        I3[Permission denied]
    end
```

---

## Build Issues

### OOM During Build

**Symptoms:**
- Build fails with "FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed"
- Build process killed unexpectedly

**Diagnosis:**

```mermaid
flowchart TB
    A[Build OOM] --> B{Node memory set?}
    B -->|No| C[Add NODE_OPTIONS]
    B -->|Yes| D{Runner has enough RAM?}
    D -->|No| E[Use larger runner]
    D -->|Yes| F[Increase memory limit]
```

**Solutions:**

1. **Check Dockerfile has memory setting:**
   ```dockerfile
   ENV NODE_OPTIONS=--max-old-space-size=1536
   ```

2. **Increase memory limit:**
   ```dockerfile
   ENV NODE_OPTIONS=--max-old-space-size=2048
   ```

3. **Use larger GitHub Actions runner:**
   ```yaml
   runs-on: ubuntu-latest-large  # If available
   ```

---

### GHCR Authentication Failure

**Symptoms:**
- "unauthorized: authentication required"
- "denied: permission denied"

**Diagnosis:**

```mermaid
flowchart TB
    A[GHCR Auth Failed] --> B{PAT exists?}
    B -->|No| C[Create PAT]
    B -->|Yes| D{PAT has scopes?}
    D -->|No| E[Add read/write:packages]
    D -->|Yes| F{PAT expired?}
    F -->|Yes| G[Regenerate PAT]
    F -->|No| H{Username correct?}
    H -->|No| I[Fix GHCR_USERNAME]
    H -->|Yes| J[Check repo visibility]
```

**Solutions:**

1. **Create/regenerate PAT:**
   - GitHub → Settings → Developer settings → PAT
   - Add scopes: `read:packages`, `write:packages`
   - Update `GHCR_PAT` secret

2. **Verify username matches:**
   ```yaml
   username: ${{ secrets.GHCR_USERNAME || 'tedahn-pknic' }}
   ```

3. **Check package visibility:**
   - Go to package settings
   - Ensure Actions has access

---

### Dockerfile Build Errors

**Symptoms:**
- "npm ci failed"
- "prisma generate failed"
- "Module not found"

**Solutions:**

1. **Missing dependencies:**
   ```bash
   # Test locally
   docker build -t test-build .
   ```

2. **Prisma schema issues:**
   ```bash
   # Ensure prisma folder is copied before npm ci
   COPY prisma ./prisma/
   RUN npm ci
   ```

3. **Node version mismatch:**
   ```dockerfile
   FROM node:20-alpine AS base  # Match local version
   ```

---

## Deployment Issues

### SSH Connection Failed

**Symptoms:**
- "Connection refused"
- "Permission denied (publickey)"
- "Connection timed out"

**Diagnosis Flow:**

```mermaid
flowchart TB
    A[SSH Failed] --> B{Timeout?}
    B -->|Yes| C{Firewall open?}
    C -->|No| D[Open port 22]
    C -->|Yes| E{VM running?}
    E -->|No| F[Start VM]
    E -->|Yes| G[Check VM_HOST]
    
    B -->|No| H{Permission denied?}
    H -->|Yes| I{Key correct?}
    I -->|No| J[Update SSH_PRIVATE_KEY]
    I -->|Yes| K{User exists?}
    K -->|No| L[Fix VM_USERNAME]
    K -->|Yes| M[Check key in VM metadata]
```

**Solutions:**

1. **Check firewall:**
   ```bash
   # GCP Console → VPC Network → Firewall
   # Ensure port 22 is open for your IP
   
   gcloud compute firewall-rules list
   ```

2. **Verify SSH key format:**
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   ...key content...
   -----END OPENSSH PRIVATE KEY-----
   ```

3. **Test connection locally:**
   ```bash
   ssh -i /path/to/key -v user@vm-ip
   ```

4. **Check VM metadata:**
   - GCP Console → Compute Engine → VM → Edit
   - SSH Keys → Verify public key is added

---

### Image Pull Failed

**Symptoms:**
- "manifest not found"
- "unauthorized"
- "pull access denied"

**Solutions:**

1. **Verify image exists:**
   ```bash
   # On VM
   docker manifest inspect ghcr.io/tedahn-pknic/new_smile_flask:develop
   ```

2. **Login to GHCR:**
   ```bash
   echo $GHCR_PAT | docker login ghcr.io -u USERNAME --password-stdin
   ```

3. **Check image visibility:**
   - GitHub → Packages → Settings
   - Ensure "Inherit access from source repository" or explicit access

---

### Container Won't Start

**Symptoms:**
- Container exits immediately
- "Restarting" status in docker ps
- Exit code 1 or 137

**Diagnosis:**

```mermaid
flowchart TB
    A[Container Exit] --> B[Check logs]
    B --> C{Exit code?}
    C -->|1| D[App error]
    C -->|137| E[OOM killed]
    C -->|127| F[Command not found]
    
    D --> G[Check env vars]
    E --> H[Increase memory limit]
    F --> I[Check CMD in Dockerfile]
```

**Debug Commands:**

```bash
# Check container logs
docker logs smile-app --tail 100

# Check exit code
docker inspect smile-app --format='{{.State.ExitCode}}'

# Check OOM status
docker inspect smile-app --format='{{.State.OOMKilled}}'

# Run with shell for debugging
docker run -it --entrypoint sh ghcr.io/.../new_smile_flask:develop
```

---

## Runtime Issues

### Health Check Fails

**Symptoms:**
- Deployment verification fails
- `/api/health` returns error
- "Health check failed after X seconds"

**Diagnosis:**

```mermaid
sequenceDiagram
    participant Deploy as Deployment
    participant App as Container
    participant Health as /api/health
    participant DB as Database
    participant Redis as Redis

    Deploy->>App: curl /api/health
    App->>Health: Handle request
    Health->>DB: Check connection
    alt DB Error
        DB-->>Health: Connection failed
        Health-->>App: 500 Error
    end
    Health->>Redis: Check connection
    alt Redis Error
        Redis-->>Health: Connection failed
        Health-->>App: 500 Error
    end
    Health-->>App: 200 OK
    App-->>Deploy: Response
```

**Debug Steps:**

```bash
# 1. Check if app is running
docker ps | grep smile-app

# 2. Check app logs
docker logs smile-app --tail 50

# 3. Test health endpoint from container
docker exec smile-app wget -qO- http://localhost:3000/api/health

# 4. Check database
docker exec smile-postgres pg_isready -U smile_user

# 5. Check redis
docker exec smile-redis redis-cli ping
```

**Common Causes:**

| Cause | Solution |
|-------|----------|
| Database not ready | Wait longer, check db healthcheck |
| Missing env vars | Verify .env file |
| Wrong DATABASE_URL | Use `db` not `localhost` |
| App startup slow | Increase health check timeout |

---

### Database Connection Issues

**Symptoms:**
- "ECONNREFUSED"
- "Connection timed out"
- "password authentication failed"

**Diagnosis:**

```mermaid
flowchart TB
    A[DB Connection Error] --> B{Container running?}
    B -->|No| C[Start db container]
    B -->|Yes| D{On same network?}
    D -->|No| E[Check docker network]
    D -->|Yes| F{Password correct?}
    F -->|No| G[Fix DB_PASSWORD in .env]
    F -->|Yes| H{Host correct?}
    H -->|No| I["Use 'db' not 'localhost'"]
    H -->|Yes| J[Check pg_hba.conf]
```

**Solutions:**

1. **Verify connection string:**
   ```bash
   # Correct format for Docker
   DATABASE_URL=postgresql://smile_user:password@db:5432/smile_new_db
   #                                            ^^^ container name, not localhost
   ```

2. **Test from app container:**
   ```bash
   docker exec smile-app sh -c 'nc -zv db 5432'
   ```

3. **Re-encode password (for SSH tunnel access):**
   ```bash
   docker exec smile-postgres psql -U smile_user -d postgres \
     -c "ALTER USER smile_user PASSWORD 'your-password';"
   ```

4. **Check PostgreSQL logs:**
   ```bash
   docker logs smile-postgres --tail 50
   ```

---

### Workers Not Running

**Symptoms:**
- Queue jobs not processing
- `/api/health/workers` shows disabled
- "Workers are not running" in logs

**Diagnosis:**

```mermaid
flowchart TB
    A[Workers Disabled] --> B{DISABLE_WORKERS set?}
    B -->|true| C[Set to false or remove]
    B -->|false| D{REDIS_URL set?}
    D -->|No| E[Add REDIS_URL to .env]
    D -->|Yes| F{Redis reachable?}
    F -->|No| G[Check Redis container]
    F -->|Yes| H[Check worker logs]
```

**Solutions:**

1. **Check environment:**
   ```bash
   # In .env
   DISABLE_WORKERS=false
   REDIS_URL=redis://redis:6379
   ```

2. **Test Redis:**
   ```bash
   docker exec smile-redis redis-cli ping
   ```

3. **Check worker status:**
   ```bash
   curl http://localhost:3001/api/health/workers
   ```

---

## Infrastructure Issues

### Port Conflicts

**Symptoms:**
- "Bind for 0.0.0.0:3001 failed: port is already allocated"
- Container starts but isn't accessible

**Solutions:**

```bash
# Find what's using the port
lsof -i :3001
netstat -tulpn | grep 3001

# Stop the conflicting process
kill -9 $(lsof -t -i:3001)

# Or use a different port
export PORT=3002
docker compose -f docker-compose.dev.yml up -d
```

---

### Volume Issues

**Symptoms:**
- "volume not found"
- Data not persisting
- Permission denied on volume

**Solutions:**

```bash
# Create missing volume
docker volume create app_postgres_data

# Check volume exists
docker volume ls | grep app_

# Inspect volume
docker volume inspect app_postgres_data

# Fix permissions (if needed)
docker run --rm -v app_postgres_data:/data alpine chown -R 1001:1001 /data
```

---

### Permission Denied

**Symptoms:**
- "Permission denied" during deploy
- Can't write to directory
- Docker command fails

**Solutions:**

1. **Docker socket permission:**
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

2. **Systemd service permission:**
   ```bash
   sudo chown -R $USER:$USER ~/smile-next
   ```

3. **File permissions:**
   ```bash
   chmod +x scripts/deploy/*.sh
   ```

---

## Debugging Commands Reference

### Container Debugging

```bash
# View all containers
docker ps -a

# View container logs
docker logs <container> --tail 100 -f

# Enter container shell
docker exec -it <container> sh

# Inspect container
docker inspect <container>

# View container resource usage
docker stats
```

### Network Debugging

```bash
# List networks
docker network ls

# Inspect network
docker network inspect smile-network

# Test connectivity from container
docker exec smile-app ping db
docker exec smile-app nc -zv redis 6379
```

### System Debugging

```bash
# Check disk space
df -h

# Check memory
free -h

# Check Docker disk usage
docker system df

# Cleanup unused resources
docker system prune -a
```

---

## Quick Fixes Cheatsheet

| Issue | Quick Fix |
|-------|-----------|
| SSH timeout | Check firewall, VM running |
| GHCR auth | Regenerate PAT, update secret |
| Container exits | Check logs: `docker logs smile-app` |
| DB connection | Use `db` not `localhost` in URL |
| Health check fails | Wait longer, check dependencies |
| Port conflict | `lsof -i :PORT` and kill process |
| Volume missing | `docker volume create <name>` |
| Permission denied | `sudo usermod -aG docker $USER` |
| Workers disabled | Set `DISABLE_WORKERS=false` |
| OOM killed | Increase memory limit in compose |

---

## Getting Help

### Collect Debug Info

```bash
# Create debug report
{
  echo "=== Docker Info ==="
  docker info
  echo "=== Container Status ==="
  docker ps -a
  echo "=== App Logs ==="
  docker logs smile-app --tail 50
  echo "=== DB Logs ==="
  docker logs smile-postgres --tail 20
  echo "=== Redis Logs ==="
  docker logs smile-redis --tail 20
  echo "=== System Resources ==="
  free -h
  df -h
} > debug-report.txt
```

### Escalation Path

1. Check this troubleshooting guide
2. Review container logs
3. Check GitHub Actions run logs
4. Search existing issues
5. Create new issue with debug report

---

## Related Documentation

- [CI/CD Overview](./cicd-deployment.md) - Pipeline overview
- [GitHub Actions](./github-actions.md) - Workflow details
- [Docker Configuration](./docker-configuration.md) - Container setup
- [VM Setup Guide](./vm-setup.md) - Environment configuration

---

*This document is maintained by AI agents. Last updated: 2026-01-17*
