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

## Replacing the AI Model (Friend 1)

The AI service is a **replaceable placeholder**. To integrate the real model:

1. Open `backend/ai-service/src/index.js`
2. Replace the `simulateAnalysis()` function with real inference
3. Keep the **same input/output contract**:

**Input** (POST `/api/ai/analyze`):
```json
{
  "scanId": "uuid",
  "patientId": "uuid",
  "filePath": "/uploads/filename.jpg",
  "metadata": { "scanDate": "2025-01-01", "doctorNotes": "..." }
}
```

**Output** (unchanged contract):
```json
{
  "requestId": "uuid",
  "scanId": "uuid",
  "patientId": "uuid",
  "predictedClass": "glioma | meningioma | pituitary | no_tumor",
  "confidence": 87.4,
  "segmentationMaskPath": "/uploads/masks/mask.png",
  "processingTimestamp": "2025-01-01T00:00:00Z",
  "inferenceVersion": "v1.0.0"
}
```

The frontend and business logic need **zero changes**.

---

## Database

- **Engine**: PostgreSQL 15
- **Schema**: auto-applied from `database/migrations/`
- **Seed data**: applied automatically on first start

### Tables
- `users` — all accounts
- `doctors` — doctor profiles + credentials
- `patients` — patient profiles + assignment
- `link_requests` — doctor-patient connection requests
- `mri_scans` — uploaded scan metadata
- `ai_analyses` — AI results per scan
- `diagnoses` — doctor reports
- `notifications` — notification inbox
- `event_logs` — async event audit
- `audit_logs` — action audit trail

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

## Team

| Role | Responsibility |
|---|---|
| You | Backend + Frontend (this repo) |
| Friend 1 | Deep learning model → replace `ai-service/src/index.js` |
| Friend 2 | DevOps/deployment → use `docker-compose.yml` |
| Friend 3 | Database + testing → see `database/migrations/` |
| Friend 4 | Documentation → see this README + `/docs` |

---

*BRISC 2025 — Academic Project*
