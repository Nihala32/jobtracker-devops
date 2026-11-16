// Where the .NET API runs.
// - On your laptop (localhost) the UI talks to the Docker Compose API on port 8080.
// - Anywhere else (the published site on GitHub Pages) it talks to the live API.
const LOCAL_API = 'http://localhost:8080/api';

// The live API on Vercel (keep /api at the end).
export const LIVE_API = 'https://ai-jobtracker-api.vercel.app/api';

const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);

export const API_BASE = isLocal ? LOCAL_API : LIVE_API;
