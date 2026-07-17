// Central API base URL for all backend calls.
// Set VITE_API_URL at build time (e.g. https://your-backend.example.com) for deployed
// environments. Falls back to the local dev backend when unset. VITE_* values are
// inlined into the client bundle at build time and are PUBLIC — never put secrets here.
const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE = raw.replace(/\/+$/, '');
