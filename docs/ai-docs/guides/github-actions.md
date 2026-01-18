---
id: github-actions-guide
title: GitHub Actions Workflows
category: guides
lastUpdated: 2026-01-17
maintainedBy: ai-agent
version: 1.0.0
relatedDocs:
  - id: cicd-deployment-guide
    type: see-also
  - id: docker-configuration-guide
    type: references
tags:
  - github-actions
  - cicd
  - automation
---

# GitHub Actions Workflows

## Overview

The SMILE application uses GitHub Actions for continuous integration and deployment. The workflows are modular and reusable, following the DRY principle.

---

## Workflow Files

| File | Type | Purpose |
|------|------|---------|
| `ci-cd.yml` | Orchestrator | Main workflow that coordinates all jobs |
| `build-node.yml` | Reusable | Builds and pushes Docker image to GHCR |
| `deploy-gcp-compute-vm-ssh.yml` | Reusable | Deploys to GCP VM via SSH |
| `setup-vm.yml` | Reusable | Provisions VM infrastructure |

---

## Pipeline Flow

### Complete Workflow Diagram

```mermaid
flowchart TB
    subgraph Trigger["Triggers"]
        T1[Push to develop]
        T2[Push to main]
        T3[PR to develop/main]
        T4[Manual Dispatch]
    end

    subgraph CheckChanges["check-changes Job"]
        C1[Checkout Code]
        C2[Path Filter]
        C3[Set Variables]
        C1 --> C2 --> C3
    end

    subgraph Outputs["Outputs"]
        O1[env-name]
        O2[docker-tag]
        O3[host-port]
        O4[container-name]
        O5[should-build]
        O6[should-deploy]
    end

    subgraph Provision["provision-infra Job"]
        P1[Setup Docker]
        P2[Create Volumes]
        P3[Setup Systemd]
        P1 --> P2 --> P3
    end

    subgraph Build["call-build Job"]
        B1[Checkout]
        B2[Setup Buildx]
        B3[Login GHCR]
        B4[Build Image]
        B5[Push Image]
        B1 --> B2 --> B3 --> B4 --> B5
    end

    subgraph DeployDev["deploy-dev Job"]
        DD1[Copy Scripts]
        DD2[Execute update-app.sh]
        DD3[Verify Health]
        DD1 --> DD2 --> DD3
    end

    subgraph DeployProd["deploy-prod Job"]
        DP1[Copy Scripts]
        DP2[Execute update-app.sh]
        DP3[Verify Health]
        DP1 --> DP2 --> DP3
    end

    Trigger --> CheckChanges
    CheckChanges --> Outputs
    Outputs --> Provision
    Outputs --> Build
    Build --> DeployDev
    Build --> DeployProd
    Provision -.->|on main only| DeployProd
```

---

## Workflow: ci-cd.yml

### Triggers

```yaml
on:
  push:
    branches:
      - develop
      - main
  pull_request:
    branches:
      - develop
      - main
  workflow_dispatch:
    # Manual trigger
```

### Environment Variables by Branch

```mermaid
flowchart LR
    subgraph Branch["Branch Detection"]
        A{Which Branch?}
    end

    subgraph Dev["develop Branch"]
        D1["env-name: dev"]
        D2["docker-tag: develop"]
        D3["host-port: 3001"]
        D4["container-name: smile-next-dev"]
    end

    subgraph Prod["main Branch"]
        P1["env-name: prod"]
        P2["docker-tag: latest"]
        P3["host-port: 3000"]
        P4["container-name: smile-next"]
    end

    subgraph PR["Pull Request"]
        R1["env-name: pr"]
        R2["docker-tag: pr-{number}"]
        R3["host-port: 0"]
        R4["container-name: smile-next-pr"]
    end

    A -->|develop| Dev
    A -->|main| Prod
    A -->|PR| PR
```

### Path Filters

The pipeline only runs when relevant files change:

```yaml
filters:
  src:
    - 'src/**'
    - 'public/**'
    - 'package*.json'
    - 'Dockerfile'
    - 'next.config.*'
    - '.env*'
    - 'prisma/**'
  infra:
    - 'scripts/deploy/**'
    - 'docker-compose.*.yml'
    - '.github/workflows/deploy-gcp-compute-vm-ssh.yml'
    - '.github/workflows/setup-vm.yml'
```

### Job Dependencies

```mermaid
flowchart TB
    A[check-changes] --> B[provision-infra]
    A --> C[call-build]
    B -.->|on main| D[deploy-prod]
    C --> E[deploy-dev]
    C --> D
    
    style A fill:#e1f5fe
    style C fill:#fff3e0
    style E fill:#e8f5e9
    style D fill:#fce4ec
```

---

## Workflow: build-node.yml

### Purpose

Reusable workflow that builds the Docker image and pushes it to GitHub Container Registry (GHCR).

### Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `docker-tag` | string | Yes | Tag for the Docker image |
| `image-name` | string | Yes | Full image name (e.g., ghcr.io/org/repo) |

### Build Process

```mermaid
sequenceDiagram
    participant GHA as GitHub Actions
    participant Buildx as Docker Buildx
    participant GHCR as GitHub Container Registry

    GHA->>GHA: Checkout code
    GHA->>Buildx: Setup Buildx
    GHA->>GHCR: Login with PAT
    GHA->>GHA: Extract metadata
    GHA->>Buildx: Build image (linux/amd64)
    Buildx->>Buildx: Use GHA cache
    Buildx->>GHCR: Push image
    GHCR-->>GHA: Image pushed successfully
```

### Image Tags

Each build produces two tags:

1. **Primary tag**: Based on input (e.g., `develop`, `latest`, `pr-123`)
2. **SHA tag**: `{branch}-{short-sha}` (e.g., `develop-abc1234`)

### Caching

Uses GitHub Actions cache for Docker layers:

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

---

## Workflow: deploy-gcp-compute-vm-ssh.yml

### Purpose

Reusable workflow that deploys the application to a GCP Compute VM via SSH.

### Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `environment` | string | Yes | Environment name (dev/prod) |
| `port` | string | Yes | Host port for the application |
| `docker-tag` | string | Yes | Docker image tag to deploy |
| `container-name` | string | Yes | Name for the container |
| `image-name` | string | Yes | Full image name |

### Deployment Process

```mermaid
sequenceDiagram
    participant GHA as GitHub Actions
    participant SSH as SSH Connection
    participant VM as GCP VM
    participant Docker as Docker

    GHA->>SSH: Connect to VM
    SSH->>VM: Prepare directory
    GHA->>VM: SCP scripts & compose files
    GHA->>SSH: Execute update-app.sh
    SSH->>VM: Source .env
    VM->>Docker: Login to GHCR
    Docker->>Docker: Pull image
    Docker->>Docker: Stop old containers
    Docker->>Docker: Start new stack
    GHA->>SSH: Verify deployment
    SSH->>VM: Health check
    VM-->>GHA: Deployment successful
```

### Deployment Steps Detail

1. **Prepare Directory**
   ```bash
   mkdir -p ~/smile-next
   # Preserve .env file
   rm -rf ~/smile-next/scripts
   ```

2. **Copy Files**
   - `scripts/deploy/*`
   - `docker-compose.dev.yml`
   - `docker-compose.prod.yml`

3. **Execute Deploy**
   ```bash
   bash scripts/deploy/update-app.sh $ENV $TAG $IMAGE $CONTAINER $PORT
   ```

4. **Verify Health**
   ```bash
   bash scripts/deploy/verify-deployment.sh $CONTAINER
   ```

---

## Workflow: setup-vm.yml

### Purpose

Provisions infrastructure on the VM (Docker, volumes, systemd service).

### Triggers

- Called by `ci-cd.yml` when infrastructure changes on main branch
- Can be triggered manually via `workflow_dispatch`

### Provisioning Steps

```mermaid
flowchart TB
    A[SSH to VM] --> B{Docker Installed?}
    B -->|No| C[Install Docker]
    B -->|Yes| D[Skip Install]
    C --> E{Docker Compose Plugin?}
    D --> E
    E -->|No| F[Install Plugin]
    E -->|Yes| G[Skip Install]
    F --> H[Create Volumes]
    G --> H
    H --> I{Systemd Service Exists?}
    I -->|No| J[Create Service]
    I -->|Yes| K[Reload Daemon]
    J --> L[Enable Service]
    K --> L
    L --> M[Setup Complete]
```

### Created Resources

| Resource | Name | Description |
|----------|------|-------------|
| Docker Volume | `app_postgres_data` | PostgreSQL data (dev only) |
| Docker Volume | `app_redis_data` | Redis data |
| Systemd Service | `smile-next-{env}.service` | Container management |

---

## Required Secrets

### GitHub Repository Secrets

| Secret | Description | How to Create |
|--------|-------------|---------------|
| `GHCR_PAT` | Personal Access Token for GHCR | GitHub → Settings → Developer Settings → PAT |
| `GHCR_USERNAME` | GitHub username | Your GitHub username |
| `VM_HOST` | VM IP or hostname | From GCP Console |
| `VM_USERNAME` | SSH username | e.g., `your-gcp-username` |
| `SSH_PRIVATE_KEY` | Private SSH key | Generate with `ssh-keygen` |

### PAT Required Scopes

For `GHCR_PAT`:
- `read:packages`
- `write:packages`
- `delete:packages` (optional)

### GitHub Environments

Configure in Repository Settings → Environments:

1. **dev**
   - No protection rules
   - Auto-deploy on push

2. **prod**
   - Optional: Required reviewers
   - Optional: Wait timer

---

## Workflow Customization

### Adding a New Environment

1. Update `check-changes` job in `ci-cd.yml`:
   ```yaml
   elif [ "${{ github.ref }}" == "refs/heads/staging" ]; then
     echo "env-name=staging" >> $GITHUB_OUTPUT
     echo "docker-tag=staging" >> $GITHUB_OUTPUT
     echo "host-port=3002" >> $GITHUB_OUTPUT
     echo "container-name=smile-next-staging" >> $GITHUB_OUTPUT
   ```

2. Add new deploy job:
   ```yaml
   deploy-staging:
     needs: [check-changes, call-build]
     if: github.ref == 'refs/heads/staging'
     uses: ./.github/workflows/deploy-gcp-compute-vm-ssh.yml
     # ...
   ```

3. Create GitHub Environment `staging`
4. Set environment-specific secrets

### Modifying Build Settings

Update `build-node.yml`:

```yaml
# Add multi-platform support
platforms: linux/amd64,linux/arm64

# Change cache strategy
cache-from: type=registry,ref=${{ inputs.image-name }}:cache
cache-to: type=registry,ref=${{ inputs.image-name }}:cache,mode=max
```

---

## Debugging Workflows

### View Workflow Runs

1. Go to repository → Actions tab
2. Select workflow run
3. Click on job to see logs

### Re-run Failed Jobs

1. Open failed workflow run
2. Click "Re-run failed jobs"
3. Or click "Re-run all jobs"

### Manual Trigger

1. Go to Actions → "Deploy SMILE Next Application"
2. Click "Run workflow"
3. Select branch
4. Click "Run workflow"

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Build fails with OOM | Node.js memory limit | Increase `NODE_OPTIONS` in Dockerfile |
| GHCR login fails | PAT expired/invalid | Regenerate PAT, update secret |
| SSH connection fails | Wrong key or IP | Verify secrets match VM |
| Health check timeout | App slow to start | Increase retry count in verify script |

---

## Related Documentation

- [CI/CD Overview](./cicd-deployment.md) - Main overview
- [Docker Configuration](./docker-configuration.md) - Docker setup details
- [VM Setup Guide](./vm-setup.md) - Environment configuration
- [Troubleshooting](./deployment-troubleshooting.md) - Common issues

---

*This document is maintained by AI agents. Last updated: 2026-01-17*
