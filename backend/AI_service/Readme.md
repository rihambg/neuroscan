# NeuroScan — Intégration AI Service 🧠


---

## Ce qui a changé

Le `ai-service` n'est plus un placeholder. Il utilise maintenant un vrai modèle de Deep Learning (ONNX) qui :
- **Classifie** l'IRM en 4 classes : `glioma`, `meningioma`, `notumor`, `pituitary`
- **Segmente** la tumeur et génère un masque PNG binaire

Le contrat d'interface **n'a pas changé** — le frontend et les autres services n'ont pas besoin d'être modifiés.

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
    Dockerfile        ← ne pas modifier
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
  "inferenceVersion": "v1.0.0",
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
[AI] ❌ Fichier ONNX introuvable
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

*Modèle entraîné dans le cadre du projet Deep Learning — Master 1 I2A Pro — UMBB 2025/2026*