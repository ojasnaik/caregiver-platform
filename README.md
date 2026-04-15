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

Create a `.env` file in the project root:

```
MONGODB_URI=<MongoDB Atlas connection string>
PORT=5000
GEMINI_API_KEY=<Google Gemini API key>
```

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
