# NeuroScan 🧠
**Brain MRI Consultation Platform — BRISC 2025**

A full-stack microservices platform for professional brain MRI management, connecting patients with specialist neurologists.

---

## Quick Start (Windows)

### Prerequisites
- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) — **must be running**
- That's it!

### Start
```bat
double-click start.bat
```
Or from a terminal:
```bat
docker-compose up -d
```

### Access
| Service | URL |
|---|---|
| **NeuroScan App** | http://localhost |
| Traefik Dashboard | http://localhost:8080 |
| RabbitMQ Management | http://localhost:15672 |
| Consul UI | http://localhost:8500 |

### Demo Accounts (Password: `Password123!`)
| Role | Email |
|---|---|
| 🩺 Doctor | dr.martin@neuroscan.com |
| 🩺 Doctor | dr.benali@neuroscan.com |
| 🏥 Patient | patient.ali@mail.com |
| 🏥 Patient | patient.sophie@mail.com |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Traefik (Port 80)                   │
│                  Reverse Proxy / Router                  │
└───┬──────────┬──────────┬──────────┬───────────┬────────┘
    │          │          │          │           │
Frontend  Auth Svc  Business   MRI Svc   AI Svc  Notif Svc
:3000      :3001     :3002      :3003    :3004    :3005
    │          │          │          │           │
    └──────────┴──────────┴──────────┴───────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
      PostgreSQL       RabbitMQ          Consul
       :5432            :5672            :8500
```

## Services

| Service | Port | Description |
|---|---|---|
| `frontend` | 3000 | React SPA |
| `auth-service` | 3001 | JWT auth, registration, login |
| `business-service` | 3002 | Doctor/patient CRUD, link requests |
| `mri-service` | 3003 | MRI upload, diagnosis management |
| `ai-service` | 3004 | **Placeholder** — replace with real model |
| `notification-service` | 3005 | RabbitMQ consumer + SSE push |

---

## The AI Model

NeuroScan — AI Service Integration 🧠

---

The ai-service uses a Deep Learning model (ONNX) that:

- Classifies MRI scans into 4 classes: glioma, meningioma, notumor, pituitary
- Segments the tumor and generates a binary PNG mask

---

## Received Files

| File                        | Destination in the project                            |
| --------------------------- | ----------------------------------------------------- |
| `multitask_brain.onnx`      | `backend/ai-service/models/multitask_brain.onnx`      |
| `multitask_brain.onnx.data` | `backend/ai-service/models/multitask_brain.onnx.data` |
| `index.js`                  | `backend/ai-service/src/index.js`                     |
| `package.json`              | `backend/ai-service/package.json`                     |


> ⚠️ The .onnx and .onnx.data files must both be in the same models/ folder. Do not separate them.

---

## Final Folder Structure

```
backend/
  ai-service/
    models/
      multitask_brain.onnx
      multitask_brain.onnx.data
    src/
      index.js
    package.json
    Dockerfile        
```

---

## Installation

```bash
cd backend/ai-service
npm install
```

---

## Run the Full Project

```bash
# From the root of the NeuroScan project
docker-compose up -d
```

---

## Verify AI Service

### 1. Model Status
```bash
curl http://localhost:3004/api/ai/status
```
Expected response:
```json
{
  "status": "ready",
  "inferenceVersion": "v2.0.0",
  "supportedClasses": ["glioma", "meningioma", "notumor", "pituitary"]
}
```
> If `"status": "loading"` appears, wait 10–15 seconds and retry.

### 2. Health Check
```bash
curl http://localhost:3004/health
```
Expected response:
```json
{
  "status": "healthy",
  "service": "ai-service",
  "modelReady": true
}
```

### 3. Analysis Test (requires JWT token)
```bash
curl -X POST http://localhost:3004/api/ai/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "scanId": "test-scan-001",
    "patientId": "test-patient-001",
    "filePath": "/uploads/an_mri.jpg",
    "metadata": {}
  }'
```
Expected response:
```json
{
  "requestId": "uuid",
  "scanId": "test-scan-001",
  "patientId": "test-patient-001",
  "predictedClass": "glioma",
  "confidence": 87.4,
  "segmentationMaskPath": "/uploads/masks/mask_test-scan-001_xxxxx.png",
  "processingTimestamp": "2025-01-01T00:00:00Z",
  "inferenceVersion": "v1.0.0"
}
```

---

## Get a JWT Token

This curl command is for Linux:
```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.martin@neuroscan.com",
    "password": "Password123!"
  }'
```

---

## How It Works

```
MRI Image
   ↓
Resize 256×256 + ImageNet normalization
   ↓
ONNX Model (EfficientNet-B4 + U-Net + scSE)
   ↓
┌──────────────────────────────┐
│ Segmentation (1,1,256,256)  │ → sigmoid → threshold 0.5 → PNG mask
│ Classification (1,4)        │ → softmax → class + confidence
└──────────────────────────────┘
```

---

## Common Issues

### The model does not load
```
[AI] ONNX file not found
```
→ Make sure `multitask_brain.onnx` AND `multitask_brain.onnx.data` are both in `backend/ai-service/models/`

### 503 error on /api/ai/analyze
```json
{ "error": "Model is loading." }
```
→ The model takes ~10 seconds to load on startup. Wait and retry.

### Image error
```
Image not found: /uploads/xxx.jpg
```
→ The `filePath` sent in the request must correspond to a file actually present in the Docker volume `/uploads/`.

### RabbitMQ fails to connect
→ This is normal at startup — the service automatically retries 15 times every 8 seconds. Check that RabbitMQ is running with `docker-compose ps`.

---

## Environment Variables (optional)

All have default values, but can be overridden in `docker-compose.yml`:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3004` | Service port |
| `RABBITMQ_URL` | `amqp://neuroscan:neuroscan_pass@...` | RabbitMQ URL |
| `UPLOADS_DIR` | `/uploads` | MRI upload directory |
| `JWT_SECRET` | `neuroscan_super_secret_jwt_key_2025` | JWT key |

---

## API Endpoints

### Auth Service (`/api/auth`)
```
POST /api/auth/register          Register doctor or patient
POST /api/auth/login             Login
POST /api/auth/validate          Validate JWT token
GET  /api/auth/me                Current user info
POST /api/auth/create-patient    Doctor creates patient account
```

### Business Service (`/api/business`)
```
GET  /api/business/doctors               List doctors
GET  /api/business/doctors/:id           Doctor profile
GET  /api/business/doctors/me/profile    My doctor profile
GET  /api/business/doctors/me/patients   My patients list
PUT  /api/business/doctors/me/profile    Update my profile

GET  /api/business/patients/me/profile         My patient profile
GET  /api/business/patients/me/assigned-doctor My doctor
PUT  /api/business/patients/me/profile         Update profile
GET  /api/business/patients/:id                Patient by ID (doctor)

POST /api/business/links/request    Send connection request
PUT  /api/business/links/:id/accept Accept request
PUT  /api/business/links/:id/reject Reject request
GET  /api/business/links/incoming   Incoming requests
GET  /api/business/links/outgoing   Outgoing requests

GET  /api/business/dashboard/doctor   Doctor dashboard stats
GET  /api/business/dashboard/patient  Patient dashboard stats
```

### MRI Service (`/api/mri`)
```
POST /api/mri/scans/upload              Upload MRI file
GET  /api/mri/scans/patient/:patientId  Patient scan history
GET  /api/mri/scans/:id                 Single scan details
PUT  /api/mri/scans/:id/status          Update scan status

POST /api/mri/diagnoses                 Create/update diagnosis
GET  /api/mri/diagnoses/scan/:scanId    Diagnosis for scan
GET  /api/mri/diagnoses/patient/:id     All patient diagnoses
```

### AI Service (`/api/ai`)
```
POST /api/ai/analyze    Run AI analysis on scan
GET  /api/ai/status     Model status info
```

### Notification Service (`/api/notifications`)
```
GET  /api/notifications            All notifications
PUT  /api/notifications/:id/read   Mark one read
PUT  /api/notifications/read-all   Mark all read
GET  /api/notifications/stream     SSE stream
```

---

## RabbitMQ Events

| Queue | Event | Producer | Consumer |
|---|---|---|---|
| `neuroscan.mri.upload` | MRI uploaded | mri-service | notification-service |
| `neuroscan.ai.process` | AI request | mri-service | ai-service |
| `neuroscan.notification` | All notifications | all services | notification-service |
| `neuroscan.status.update` | Scan status changed | mri-service | notification-service |

---

## Development (without Docker)

```bash
# 1. Start infrastructure only
docker-compose up -d postgres rabbitmq consul traefik

# 2. Auth service
cd backend/auth-service && npm install && npm run dev

# 3. Business service
cd backend/business-service && npm install && npm run dev

# 4. MRI service
cd backend/mri-service && npm install && npm run dev

# 5. AI service
cd backend/ai-service && npm install && npm run dev

# 6. Notification service
cd backend/notification-service && npm install && npm run dev

# 7. Frontend
cd frontend && npm install && npm start
```

---

*BRISC 2025 — Academic Project*