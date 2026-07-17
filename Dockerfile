# syntax=docker/dockerfile:1

# Platform-independent backend image for the Caregiver Platform API.
# Runs the Express server (server/index.js) with the local @xenova RAG models.
# Deployable to any container host: Render, Railway, Fly.io, Google Cloud Run,
# DigitalOcean App Platform, AWS ECS, a plain VM, etc.
#
# Build:  docker build -t caregiver-api .
# Run:    docker run -p 5000:5000 --env-file .env caregiver-api
#
# Requires ~1 GB RAM at runtime (the bge-reranker-base cross-encoder is large).

FROM node:20-slim

ENV NODE_ENV=production
WORKDIR /app

# Install dependencies first for better layer caching.
# (--omit=dev skips ESLint/Vite; the server's runtime deps are in "dependencies".)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the backend source. The frontend (src/) is built and hosted separately
# on Vercel and is intentionally excluded via .dockerignore.
COPY server ./server

# Pre-download the embedding + reranker models into the image so the first
# request after a cold start loads them from local disk instead of fetching
# them over the network. The cache lives inside the installed
# @xenova/transformers package and is preserved in this single-stage image.
RUN node server/prewarm.js

# The host injects PORT; server/index.js reads process.env.PORT (defaults 5000).
EXPOSE 5000
CMD ["node", "server/index.js"]
