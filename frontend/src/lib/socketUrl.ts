/** Socket.IO server = API origin (Nest serves WS on same port). */
export function getSocketBaseUrl(): string {
  const raw =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:5001/api/v1';
  try {
    const base = raw.replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '') || 'http://localhost:5001';
    return new URL(base).origin;
  } catch {
    return 'http://localhost:5001';
  }
}
