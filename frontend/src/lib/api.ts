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

export function resolveAssetUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return `${API_BASE_URL}${trimmed}`;
  }
  return `${API_BASE_URL}/${trimmed}`;
}

export async function uploadEventAsset(
  eventId: string,
  fileOrFiles: File | File[]
): Promise<{ urls: string[]; fullUrls: string[]; url: string; fullUrl: string }> {
  const formData = new FormData();
  if (Array.isArray(fileOrFiles)) {
    for (const f of fileOrFiles) {
      formData.append('files', f);
    }
  } else {
    formData.append('files', fileOrFiles);
  }

  return apiFetch<{ urls: string[]; fullUrls: string[]; url: string; fullUrl: string }>(
    `/api/events/${eventId}/upload-asset`,
    {
      method: 'POST',
      body: formData,
      auth: true,
    }
  );
}
