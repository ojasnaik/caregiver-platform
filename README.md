# Caregiver Platform

A community platform for single caregivers to connect, share resources, and get AI-powered support.

## Features

- **Discussions**: topic-based community forums with replies and likes
- **Resources**: admin-curated links and guides
- **AI Support Chat**: RAG-powered chatbot that answers questions using real community posts and resources

## Tech Stack

### Frontend
- React 19 + Vite
- Tailwind CSS
- React Router v6

### Backend
- Node.js + Express
- MongoDB Atlas (via Mongoose)

### AI Pipeline

The support chat uses a full Retrieval-Augmented Generation (RAG) pipeline:

1. **Embeddings**: Community posts and resources are automatically embedded on save using [`Xenova/all-MiniLM-L6-v2`](https://huggingface.co/Xenova/all-MiniLM-L6-v2) (runs locally via `@xenova/transformers`, no API key needed)
2. **Vector Search**: Relevant content is retrieved from MongoDB Atlas using vector similarity search
3. **Reranking**: Results are reranked with a cross-encoder model (`Xenova/bge-reranker-base`) to improve relevance
4. **Generation**: Google Gemini 2.5 Flash generates the final response grounded in the retrieved context

## Setup

### Prerequisites
- Node.js 18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster with vector search indexes configured
- A [Google Gemini](https://aistudio.google.com/) API key

### Environment Variables

Copy `.env.example` to `.env` in the project root and fill in the values:

```
# Backend
MONGODB_URI=<MongoDB Atlas connection string>
PORT=5000
GEMINI_API_KEY=<Google Gemini API key>
GROQ_API_KEY=<Groq API key>        # optional — used for chat history compaction
CORS_ORIGINS=                       # comma-separated allowed origins in prod; blank = allow all
NODE_ENV=development                # set to "production" on the deployed backend

# Frontend (Vite, build-time)
VITE_API_URL=                       # deployed backend URL; blank = http://localhost:5000
```

All backend API calls go through a single base URL defined in [`src/config.js`](src/config.js),
read from `VITE_API_URL` at build time (falls back to `http://localhost:5000` for local dev).
`VITE_*` values are inlined into the client bundle and are **public** — never put secrets there.

### MongoDB Atlas Vector Search Indexes

Create two vector search indexes in Atlas on the `caregiver-app` database:

| Collection  | Index Name       | Field       | Dimensions |
|-------------|------------------|-------------|------------|
| `posts`     | `posts_index`    | `embedding` | 384        |
| `resources` | `resources_index`| `embedding` | 384        |

### Install & Run

```bash
# Install dependencies
npm install

# Run frontend (port 5173) and backend (port 5000) together
npm run dev:full

# Or run separately
npm run dev      # frontend only
npm run server   # backend only
```

> **Note:** The embedding model downloads and loads on first chat request. This can take ~1 minute on cold start.

## Deployment

The app deploys as **two independent pieces** — a static frontend and a containerized
backend — talking to a shared MongoDB Atlas cluster:

```
Vercel (React static)  ──HTTPS /api/*──▶  Backend container  ──▶  MongoDB Atlas
  VITE_API_URL                             (Docker, any host)      (+ Vector Search)
```

Why split? The RAG pipeline runs two transformer models in-process via
`@xenova/transformers` (the `bge-reranker-base` cross-encoder alone is ~1 GB and needs
~1 GB RAM). That exceeds serverless limits, so the backend runs as a **long-lived
container** while Vercel serves the static SPA.

### 1. Backend — any container host

The [`Dockerfile`](Dockerfile) is platform-independent and runs on Render, Railway,
Fly.io, Google Cloud Run, DigitalOcean App Platform, AWS ECS, or a plain VM. It
pre-bakes the models at build time so cold starts don't re-download them.

```bash
docker build -t caregiver-api .
docker run -p 5000:5000 --env-file .env caregiver-api
# verify:
curl http://localhost:5000/api/health   # -> {"status":"ok","db":"connected"}
```

Set these environment variables on the host: `MONGODB_URI`, `GEMINI_API_KEY`,
`GROQ_API_KEY` (optional), `NODE_ENV=production`, and `CORS_ORIGINS` (your Vercel
URL, e.g. `https://your-app.vercel.app`). **Provision at least 1 GB RAM** — the
reranker will OOM on 512 MB instances (or remove it to rely on vector-search
ordering only). Hosts that don't build from a Dockerfile can use `npm start`
(runs the server) after `npm ci`.

### 2. Frontend — Vercel

1. Import the repo in Vercel; framework preset **Vite** (build `npm run build`, output `dist`).
2. Set the env var **`VITE_API_URL`** = your backend URL (Production + Preview).
3. Deploy. [`vercel.json`](vercel.json) rewrites all routes to `index.html` for client-side routing.
4. Update the backend's `CORS_ORIGINS` with the final Vercel domain and redeploy the backend.

### 3. MongoDB Atlas

- Create the two [vector search indexes](#mongodb-atlas-vector-search-indexes).
- Allow the backend's egress (or `0.0.0.0/0`) in **Network Access**; use a least-privilege DB user.
- If your backend host sleeps when idle, ping `/api/health` periodically to avoid the cold-start model reload.

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for step-by-step Atlas and environment setup.
