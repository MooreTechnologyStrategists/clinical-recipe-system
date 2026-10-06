import axios from 'axios';
// Each browser owns a private anonymous recipe space. No shared default profile.
const api = axios.create();
let memorySession;
function privateSession() {
  if (memorySession) return memorySession;
  try { const saved = localStorage.getItem('recipe-private-session-v1'); if (/^[0-9a-f]{64}$/.test(saved || '')) { memorySession = saved; return saved; } } catch {}
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  memorySession = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
  try { localStorage.setItem('recipe-private-session-v1', memorySession); } catch {}
  return memorySession;
}
api.interceptors.request.use(config => {
  const backend = process.env.REACT_APP_BACKEND_URL;
  if (!backend || new URL(config.url, window.location.origin).origin !== new URL(backend).origin) throw new Error('Recipe API is not configured for this destination');
  config.headers['X-Recipe-Session'] = privateSession();
  return config;
});
export default api;
