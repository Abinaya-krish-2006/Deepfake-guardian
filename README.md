# DeepFake Guardian

> **Detect. Verify. Stay Safe.**

DeepFake Guardian is a cybersecurity web application that detects deepfakes and AI manipulation in images and videos using the official **AI or Not** detection API. It features a React (Vite) frontend with a modern digital safety design and a Python (FastAPI) backend, with Firebase Authentication and Cloud Firestore for persistent user scan history.

---

## Features

- **Multimodal AI Detection**: Detects synthetic media in images (`JPG`, `JPEG`, `PNG`, `WEBP`) and videos (`MP4`, `MOV`, `WEBM`).
- **Official AI or Not Integration**: Connects via backend Bearer authentication to `/v2/image/sync` and `/v2/video/sync`.
- **Probabilistic & Responsible AI**: Results are framed cautiously ("Likely Authentic", "Potentially Manipulated", "Unable to Determine") with explicit disclaimers—never declaring "100% real" or "100% fake".
- **Development Fallback (`demo` mode)**: Supports local testing without incurring API credits when `DETECTION_MODE=demo`, prominently watermarked in the UI.
- **Firebase Authentication**: Email and password registration and login via the Firebase Web SDK.
- **Firestore Scan History**: Secure per-user scan records under `users/{userId}/scans/{scanId}` guarded by Firestore security rules.
- **Deployment Ready**: Configured for immediate deployment on **Render** (backend) and **Vercel** (frontend).

---

## Directory Structure

```
deepfake-guardian/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app, CORS, routes (/api/health, /api/analyze)
│   │   └── services/
│   │       ├── __init__.py
│   │       └── aiornot_service.py   # AI or Not API integration (image & video sync v2)
│   ├── .env.example
│   ├── render.yaml                  # Render deployment configuration
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── shield.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ScanUpload.jsx       # Media drag-and-drop & previews
│   │   │   ├── ResultCard.jsx       # Probabilistic result UI & disclaimers
│   │   │   ├── DashboardStats.jsx   # Live Firestore stats
│   │   │   ├── HistoryList.jsx      # Historical scan ledger
│   │   │   ├── AuthModal.jsx        # Login/Register modal
│   │   │   └── Footer.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── firebase/
│   │   │   ├── config.js
│   │   │   ├── auth.js
│   │   │   └── firestore.js
│   │   ├── services/
│   │   │   └── api.js               # FormData POST to FastAPI
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── vercel.json                  # Vercel SPA routing
│   └── vite.config.js
├── firestore.rules                  # Firestore security rules (auth-restricted)
└── .gitignore
```

---

## Required Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `AIORNOT_API_KEY` | Secret API key from [aiornot.com](https://www.aiornot.com) | *(Your secret key)* |
| `DETECTION_MODE` | Detection mode: `ai` (live API) or `demo` (fallback) | `ai` |
| `MAX_FILE_SIZE_MB` | Maximum file size in MB | `50` |
| `MAX_VIDEO_DURATION_SECONDS` | Maximum allowed video duration in seconds | `60` |
| `CORS_ORIGINS` | Allowed origins (comma-separated for multiple) | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Backend URL | `http://localhost:8000` |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | *(From Firebase Console)* |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `your-project` |
| `VITE_FIREBASE_STORAGE_BUCKET`| Firebase Storage Bucket | `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Firebase Sender ID | *(Numeric ID)* |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:123456:web:...` |

---

## Running Locally

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```

FastAPI Swagger documentation will be available at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

The frontend will run at `http://localhost:5173`.

---

## Deployment Instructions

### Backend → Render

1. Go to [Render Dashboard](https://dashboard.render.com) and click **New + Web Service**.
2. Connect your GitHub repository.
3. Select **Root Directory**: `backend`.
4. Set **Build Command**: `pip install -r requirements.txt`.
5. Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
6. Add Environment Variables:
   - `AIORNOT_API_KEY`: *(Paste your AI or Not key)*
   - `DETECTION_MODE`: `ai`
   - `MAX_FILE_SIZE_MB`: `50`
   - `MAX_VIDEO_DURATION_SECONDS`: `60`
   - `CORS_ORIGINS`: `https://YOUR-VERCEL-FRONTEND-URL.vercel.app`

### Frontend → Vercel

1. Go to [Vercel Dashboard](https://vercel.com) and click **Add New Project**.
2. Select your GitHub repository.
3. Set **Root Directory**: `frontend`.
4. Framework Preset: **Vite**.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Add Environment Variables:
   - `VITE_API_BASE_URL`: `https://YOUR-RENDER-BACKEND-URL.onrender.com`
   - `VITE_FIREBASE_API_KEY`: *(Your Firebase API Key)*
   - `VITE_FIREBASE_AUTH_DOMAIN`: *(Your Firebase Auth Domain)*
   - `VITE_FIREBASE_PROJECT_ID`: *(Your Firebase Project ID)*
   - `VITE_FIREBASE_STORAGE_BUCKET`: *(Your Firebase Storage Bucket)*
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: *(Your Firebase Sender ID)*
   - `VITE_FIREBASE_APP_ID`: *(Your Firebase App ID)*
8. Click **Deploy**.
