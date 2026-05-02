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

##  the AI Model 

# NeuroScan — Intégration AI Service 🧠


---


Le `ai-service` utilise un  modèle de Deep Learning (ONNX) qui :
- **Classifie** l'IRM en 4 classes : `glioma`, `meningioma`, `notumor`, `pituitary`
- **Segmente** la tumeur et génère un masque PNG binaire


---

## Fichiers reçus

| Fichier | Destination dans le projet |
|---|---|
| `multitask_brain.onnx` | `backend/ai-service/models/multitask_brain.onnx` |
| `multitask_brain.onnx.data` | `backend/ai-service/models/multitask_brain.onnx.data` |
| `index.js` | `backend/ai-service/src/index.js` |
| `package.json` | `backend/ai-service/package.json` |

> ⚠️ Les deux fichiers `.onnx` et `.onnx.data` doivent **obligatoirement** être dans le même dossier `models/`. Ne les sépare pas.

---

## Structure finale du dossier ai-service

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

## Lancer le projet complet

```bash
# À la racine du projet NeuroScan
docker-compose up -d
```

---

## Vérifier que l'AI service fonctionne

### 1. Statut du modèle
```bash
curl http://localhost:3004/api/ai/status
```
Réponse attendue :
```json
{
  "status": "ready",
  "inferenceVersion": "v2.0.0",
  "supportedClasses": ["glioma", "meningioma", "notumor", "pituitary"]
}
```
> Si tu vois `"status": "loading"` — attends 10-15 secondes et réessaie, le modèle est en cours de chargement.

### 2. Health check
```bash
curl http://localhost:3004/health
```
Réponse attendue :
```json
{
  "status": "healthy",
  "service": "ai-service",
  "modelReady": true
}
```

### 3. Test d'analyse (nécessite un token JWT doctor)
```bash
curl -X POST http://localhost:3004/api/ai/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TON_TOKEN_JWT" \
  -d '{
    "scanId": "test-scan-001",
    "patientId": "test-patient-001",
    "filePath": "/uploads/une_irm.jpg",
    "metadata": {}
  }'
```
Réponse attendue :
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

## Comment obtenir un token JWT pour tester

Lance le projet, puis connecte-toi avec le compte médecin :
this curl is for linux
```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.martin@neuroscan.com",
    "password": "Password123!"
  }'
```

Copie le token JWT dans la réponse et utilise-le dans le header `Authorization: Bearer <token>`.

---

## Comment ça marche (pour comprendre)

```
Image IRM reçue
      ↓
Resize 256×256 + Normalisation ImageNet
      ↓
Modèle ONNX (EfficientNet-B4 + U-Net + scSE)
      ↓
   ┌──────────────────────────────┐
   │  Segmentation (1, 1, 256, 256) │  → sigmoid → seuil 0.5 → masque PNG
   │  Classification (1, 4)         │  → softmax → classe + confiance
   └──────────────────────────────┘
```

Le modèle a été entraîné sur le dataset **BRISC 2025** (6000 IRM cérébrales) avec les résultats suivants :
- Test Dice Score : **0.8699**
- Test Accuracy   : **97.9%**

---

## Problèmes fréquents

### Le modèle ne se charge pas
```
[AI]  Fichier ONNX introuvable
```
→ Vérifie que `multitask_brain.onnx` ET `multitask_brain.onnx.data` sont bien dans `backend/ai-service/models/`

### Erreur 503 sur /api/ai/analyze
```json
{ "error": "Modèle en cours de chargement." }
```
→ Le modèle met ~10 secondes à charger au démarrage. Attends et réessaie.

### Erreur sur l'image
```
Image introuvable : /uploads/xxx.jpg
```
→ Le `filePath` envoyé dans la requête doit correspondre à un fichier réellement présent dans le volume Docker `/uploads/`.

### RabbitMQ ne se connecte pas
→ Normal au démarrage, le service retry automatiquement 15 fois toutes les 8 secondes. Vérifie que RabbitMQ est bien lancé avec `docker-compose ps`.

---

## Variables d'environnement (optionnel)

Toutes ont des valeurs par défaut, mais peuvent être surchargées dans `docker-compose.yml` :

| Variable | Défaut | Description |
|---|---|---|
| `PORT` | `3004` | Port du service |
| `RABBITMQ_URL` | `amqp://neuroscan:neuroscan_pass@...` | URL RabbitMQ |
| `UPLOADS_DIR` | `/uploads` | Dossier des IRM uploadées |
| `JWT_SECRET` | `neuroscan_super_secret_jwt_key_2025` | Clé JWT |

---

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



---

*BRISC 2025 — Academic Project*
