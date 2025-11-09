# Data Model: Deployment Infrastructure

**Phase**: 1 - Design  
**Date**: 2025-11-09

## Overview

This document defines the configuration schemas and data structures used across the deployment infrastructure. These models are not stored in databases but exist as configuration files, environment variables, and CI/CD metadata.

---

## 1. Environment Configuration

Represents a deployment environment (dev, staging, production) with all necessary configuration and credentials.

### Schema

```typescript
interface EnvironmentConfig {
  // Identity
  name: 'development' | 'staging' | 'production';
  shortName: 'dev' | 'staging' | 'prod';  // Used in scripts
  
  // Firebase Configuration
  firebase: {
    projectId: string;                      // e.g., 'hamaaser-dev'
    apiKey: string;                         // Public API key
    authDomain: string;                     // e.g., 'hamaaser-dev.firebaseapp.com'
    storageBucket: string;                  // e.g., 'hamaaser-dev.appspot.com'
    messagingSenderId: string;
    appId: string;
  };
  
  // Stripe Configuration
  stripe: {
    publishableKey: string;                 // Public key (pk_test_* or pk_live_*)
    mode: 'test' | 'live';                  // Determines key type
    webhookEndpoint: string;                // Webhook URL for this environment
  };
  
  // Deployment Targets
  targets: {
    dashboard: {
      url: string;                          // e.g., 'https://staging-dashboard.hamaaser.org'
      vercelProjectId: string;
    };
    mobile: {
      bundleIdentifier: string;             // iOS: com.hamaaser.app
      packageName: string;                  // Android: com.hamaaser.app
      easProfile: string;                   // 'development' | 'staging' | 'production'
      updateChannel: string;                // For OTA updates
    };
    functions: {
      region: string;                       // e.g., 'us-central1'
      runtime: 'nodejs20';
    };
  };
  
  // Feature Flags
  features: {
    maintenanceMode: boolean;
    enableAnalytics: boolean;
    enableErrorReporting: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}
```

### Storage Location

- **File**: `config/environments/{env}.json` (NO SECRETS)
- **Secrets**: Stored separately in GitHub Secrets, Firebase Secrets, Vercel Environment Variables

### Example (staging.json)

```json
{
  "name": "staging",
  "shortName": "staging",
  "firebase": {
    "projectId": "hamaaser-staging",
    "apiKey": "AIzaSyC...",
    "authDomain": "hamaaser-staging.firebaseapp.com",
    "storageBucket": "hamaaser-staging.appspot.com",
    "messagingSenderId": "123456789",
    "appId": "1:123456789:web:abc123"
  },
  "stripe": {
    "publishableKey": "pk_test_...",
    "mode": "test",
    "webhookEndpoint": "https://staging-api.hamaaser.org/webhooks/stripe"
  },
  "targets": {
    "dashboard": {
      "url": "https://staging-dashboard.hamaaser.org",
      "vercelProjectId": "prj_abc123"
    },
    "mobile": {
      "bundleIdentifier": "com.hamaaser.app.staging",
      "packageName": "com.hamaaser.app.staging",
      "easProfile": "staging",
      "updateChannel": "staging"
    },
    "functions": {
      "region": "us-central1",
      "runtime": "nodejs20"
    }
  },
  "features": {
    "maintenanceMode": false,
    "enableAnalytics": true,
    "enableErrorReporting": true,
    "logLevel": "debug"
  }
}
```

### Validation Rules

- `name` must match one of the allowed environments
- `firebase.projectId` must be unique per environment
- `stripe.publishableKey` must start with `pk_test_` for non-production, `pk_live_` for production
- `targets.dashboard.url` must be valid HTTPS URL
- `targets.mobile.bundleIdentifier` must match iOS app ID
- `targets.mobile.packageName` must match Android package name

---

## 2. Deployment Record

Represents a single deployment event with status, metadata, and results.

### Schema

```typescript
interface DeploymentRecord {
  // Identity
  id: string;                               // UUID
  timestamp: string;                        // ISO 8601
  environment: 'development' | 'staging' | 'production';
  
  // Version Information
  version: {
    commit: string;                         // Git commit SHA
    branch: string;                         // Git branch name
    tag?: string;                           // Git tag (for prod releases)
    buildNumber: number;                    // Auto-incremented
  };
  
  // Deployer Information
  triggeredBy: {
    type: 'manual' | 'automated' | 'rollback';
    user?: string;                          // GitHub username
    automationSource?: 'github-actions' | 'local-script';
  };
  
  // Deployment Status
  status: 'pending' | 'in-progress' | 'success' | 'partial-success' | 'failed' | 'rolled-back';
  
  // Platform Results
  platforms: {
    mobile: DeploymentPlatformResult;
    dashboard: DeploymentPlatformResult;
    functions: DeploymentPlatformResult;
  };
  
  // Timing
  duration: {
    startedAt: string;                      // ISO 8601
    completedAt?: string;                   // ISO 8601
    totalSeconds?: number;
  };
  
  // Rollback Information
  rollback?: {
    reason: string;
    automatic: boolean;
    previousDeploymentId: string;
    rolledBackAt: string;                   // ISO 8601
  };
}

interface DeploymentPlatformResult {
  status: 'pending' | 'in-progress' | 'success' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  durationSeconds?: number;
  error?: {
    message: string;
    stack?: string;
    exitCode?: number;
  };
  artifacts?: {
    buildUrl?: string;                      // EAS Build URL
    deploymentUrl?: string;                 // Vercel deployment URL
    functionNames?: string[];               // Deployed function names
  };
  tests?: {
    passed: number;
    failed: number;
    skipped: number;
    results: TestResult[];
  };
}

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;                         // Milliseconds
  error?: string;
}
```

### Storage Location

- **File**: `.deployments/{timestamp}-{environment}.json` (git-ignored)
- **CI/CD**: Stored as GitHub Actions artifacts for 30 days
- **Optional**: Can be persisted to Firestore for deployment analytics dashboard

### Example

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-11-09T14:30:00Z",
  "environment": "staging",
  "version": {
    "commit": "abc123def456",
    "branch": "main",
    "buildNumber": 42
  },
  "triggeredBy": {
    "type": "automated",
    "automationSource": "github-actions"
  },
  "status": "success",
  "platforms": {
    "mobile": {
      "status": "success",
      "startedAt": "2025-11-09T14:30:10Z",
      "completedAt": "2025-11-09T14:45:00Z",
      "durationSeconds": 890,
      "artifacts": {
        "buildUrl": "https://expo.dev/builds/..."
      }
    },
    "dashboard": {
      "status": "success",
      "startedAt": "2025-11-09T14:30:05Z",
      "completedAt": "2025-11-09T14:35:20Z",
      "durationSeconds": 315,
      "artifacts": {
        "deploymentUrl": "https://staging-dashboard.hamaaser.org"
      }
    },
    "functions": {
      "status": "success",
      "startedAt": "2025-11-09T14:30:02Z",
      "completedAt": "2025-11-09T14:32:45Z",
      "durationSeconds": 163,
      "artifacts": {
        "functionNames": ["createPaymentIntent", "handleWebhook", "generateReceipt"]
      }
    }
  },
  "duration": {
    "startedAt": "2025-11-09T14:30:00Z",
    "completedAt": "2025-11-09T14:45:00Z",
    "totalSeconds": 900
  }
}
```

---

## 3. Secret Configuration

Represents a secret (API key, credential) with metadata about where it's stored and used.

### Schema

```typescript
interface SecretConfig {
  // Identity
  name: string;                             // e.g., 'STRIPE_SECRET_KEY'
  description: string;
  
  // Storage
  storage: {
    github?: boolean;                       // Stored in GitHub Secrets
    firebase?: boolean;                     // Stored in Firebase Functions Secrets
    vercel?: boolean;                       // Stored in Vercel Environment Variables
  };
  
  // Usage
  usage: {
    platforms: ('mobile' | 'dashboard' | 'functions')[];
    environments: ('development' | 'staging' | 'production')[];
    required: boolean;                      // Deployment fails if missing
  };
  
  // Validation
  validation?: {
    pattern?: string;                       // Regex pattern (e.g., '^pk_test_')
    minLength?: number;
    expiresAt?: string;                     // ISO 8601 (for rotation reminders)
  };
  
  // Security
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  rotationPeriod?: number;                  // Days (e.g., 90 for quarterly rotation)
}
```

### Storage Location

- **File**: `config/secrets-schema.json` (schema only, NO VALUES)
- **Values**: Stored in GitHub Secrets, Firebase Secrets, Vercel Environment Variables

### Example (secrets-schema.json)

```json
{
  "secrets": [
    {
      "name": "STRIPE_SECRET_KEY",
      "description": "Stripe API secret key for payment processing",
      "storage": {
        "firebase": true
      },
      "usage": {
        "platforms": ["functions"],
        "environments": ["development", "staging", "production"],
        "required": true
      },
      "validation": {
        "pattern": "^sk_(test|live)_",
        "minLength": 32
      },
      "sensitivity": "critical",
      "rotationPeriod": 90
    },
    {
      "name": "EXPO_TOKEN",
      "description": "Expo authentication token for EAS builds",
      "storage": {
        "github": true
      },
      "usage": {
        "platforms": ["mobile"],
        "environments": ["staging", "production"],
        "required": true
      },
      "sensitivity": "high",
      "rotationPeriod": 180
    },
    {
      "name": "VERCEL_TOKEN",
      "description": "Vercel CLI authentication token",
      "storage": {
        "github": true
      },
      "usage": {
        "platforms": ["dashboard"],
        "environments": ["staging", "production"],
        "required": true
      },
      "sensitivity": "high",
      "rotationPeriod": 90
    },
    {
      "name": "FIREBASE_SERVICE_ACCOUNT",
      "description": "Firebase Admin SDK service account JSON",
      "storage": {
        "github": true,
        "vercel": true
      },
      "usage": {
        "platforms": ["dashboard", "functions"],
        "environments": ["development", "staging", "production"],
        "required": true
      },
      "sensitivity": "critical",
      "rotationPeriod": 90
    }
  ]
}
```

---

## 4. Build Artifact

Represents a compiled binary or bundle produced during the build process.

### Schema

```typescript
interface BuildArtifact {
  // Identity
  id: string;                               // UUID
  platform: 'ios' | 'android' | 'dashboard' | 'functions';
  type: 'ipa' | 'aab' | 'bundle' | 'compiled-functions';
  
  // Version
  version: {
    display: string;                        // e.g., '1.0.0'
    build: number;                          // e.g., 42
    commit: string;                         // Git commit SHA
  };
  
  // Build Information
  build: {
    profile: string;                        // EAS profile or build config
    environment: 'development' | 'staging' | 'production';
    builtAt: string;                        // ISO 8601
    builtBy: string;                        // User or automation
  };
  
  // Artifact Location
  location: {
    url?: string;                           // Download URL
    path?: string;                          // Local path (for CI artifacts)
    expiresAt?: string;                     // ISO 8601 (for temporary URLs)
  };
  
  // Metadata
  metadata: {
    size: number;                           // Bytes
    checksum: string;                       // SHA256
    signed: boolean;                        // Code signing status
    distribution?: 'internal' | 'store';    // Mobile only
  };
  
  // Deployment Status
  deployment?: {
    deployed: boolean;
    deployedAt?: string;                    // ISO 8601
    deploymentId?: string;                  // Reference to DeploymentRecord
  };
}
```

### Storage Location

- **Mobile (IPA/AAB)**: Expo EAS Build servers (accessible via URL)
- **Dashboard bundle**: Vercel build cache
- **Functions**: Firebase deployment history
- **Metadata**: `.artifacts/{artifact-id}.json` (git-ignored)

### Example

```json
{
  "id": "artifact-ios-42-abc123",
  "platform": "ios",
  "type": "ipa",
  "version": {
    "display": "1.0.0",
    "build": 42,
    "commit": "abc123def456"
  },
  "build": {
    "profile": "staging",
    "environment": "staging",
    "builtAt": "2025-11-09T14:35:00Z",
    "builtBy": "github-actions"
  },
  "location": {
    "url": "https://expo.dev/artifacts/eas/...",
    "expiresAt": "2025-12-09T14:35:00Z"
  },
  "metadata": {
    "size": 87654321,
    "checksum": "sha256:abc123...",
    "signed": true,
    "distribution": "internal"
  },
  "deployment": {
    "deployed": true,
    "deployedAt": "2025-11-09T14:40:00Z",
    "deploymentId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## 5. Alert Configuration

Represents an alert rule for monitoring and notifications.

### Schema

```typescript
interface AlertConfig {
  // Identity
  name: string;                             // e.g., 'deployment-failure'
  description: string;
  enabled: boolean;
  
  // Trigger Conditions
  trigger: {
    type: 'deployment-event' | 'error-rate' | 'performance' | 'availability';
    condition: string;                      // e.g., 'deployment.status === "failed"'
    threshold?: number;                     // For rate-based alerts
    window?: number;                        // Time window in minutes
  };
  
  // Notification Channels
  channels: {
    slack?: {
      enabled: boolean;
      webhookUrl: string;
      channel: string;                      // e.g., '#deployments'
    };
    email?: {
      enabled: boolean;
      recipients: string[];
    };
    github?: {
      enabled: boolean;
      createIssue: boolean;
      labels: string[];
    };
  };
  
  // Alert Severity
  severity: 'info' | 'warning' | 'error' | 'critical';
  
  // Alert Content
  template: {
    title: string;                          // Template with variables
    body: string;                           // Template with variables
    variables: string[];                    // Available variables
  };
}
```

### Storage Location

- **File**: `config/alerts.json`

### Example

```json
{
  "name": "deployment-failure",
  "description": "Alert when any deployment fails",
  "enabled": true,
  "trigger": {
    "type": "deployment-event",
    "condition": "deployment.status === 'failed'"
  },
  "channels": {
    "slack": {
      "enabled": true,
      "webhookUrl": "https://hooks.slack.com/services/...",
      "channel": "#deployments"
    },
    "email": {
      "enabled": true,
      "recipients": ["dev@hamaaser.org"]
    }
  },
  "severity": "critical",
  "template": {
    "title": "❌ Deployment Failed: {{environment}} - {{platform}}",
    "body": "Deployment to {{environment}} failed for {{platform}}.\n\nCommit: {{commit}}\nError: {{error.message}}\n\nView logs: {{logsUrl}}",
    "variables": ["environment", "platform", "commit", "error.message", "logsUrl"]
  }
}
```

---

## Relationships

```
EnvironmentConfig (1) ───< (N) DeploymentRecord
                    (1) ───< (N) SecretConfig
                    (1) ───< (N) BuildArtifact

DeploymentRecord (1) ───< (N) BuildArtifact
                 (1) ───< (N) TestResult

BuildArtifact (N) ───> (1) DeploymentRecord (optional)

AlertConfig (N) ───> (N) DeploymentRecord (triggers on)
```

## File System Structure

```
config/
├── environments/
│   ├── development.json          # EnvironmentConfig (dev)
│   ├── staging.json               # EnvironmentConfig (staging)
│   └── production.json            # EnvironmentConfig (prod)
├── secrets-schema.json            # SecretConfig[] (schema only)
└── alerts.json                    # AlertConfig[]

.deployments/                      # Git-ignored
├── 2025-11-09-14-30-staging.json  # DeploymentRecord
└── 2025-11-09-15-00-prod.json     # DeploymentRecord

.artifacts/                        # Git-ignored
├── artifact-ios-42-abc123.json    # BuildArtifact
└── artifact-android-42-abc123.json # BuildArtifact
```

## Validation Scripts

```bash
# Validate environment configuration
scripts/deploy/validate-config.sh [environment]

# Validate secrets configuration
scripts/deploy/check-secrets.sh [environment]

# Validate deployment record
scripts/deploy/validate-deployment.sh [deployment-id]
```
