export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4006'
).replace(/\/$/, '');

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('invitaciones_admin_token');
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('invitaciones_admin_token', token);
  } else {
    localStorage.removeItem('invitaciones_admin_token');
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = false, headers, ...rest } = options;
  const reqHeaders = new Headers(headers || {});

  if (!(rest.body instanceof FormData) && !reqHeaders.has('Content-Type')) {
    reqHeaders.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = getStoredToken();
    if (token) {
      reqHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: reqHeaders,
    cache: 'no-store',
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}`);
    }
    return (await res.blob()) as unknown as T;
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Error HTTP ${res.status}`);
  }
  return data as T;
}
