import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

interface RequestOptions {
  method?: string;
  body?: any;
  requireAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, requireAuth = false } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add authorization header if required
  if (requireAuth) {
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }
    } catch (error) {
      console.error('Error getting auth session:', error);
      throw new Error('Authentication required');
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data.data as T;
}

// Public API calls
export const publicApi = {
  getEvents: () => apiRequest('/events'),
  getEvent: (eventId: string) => apiRequest(`/events/${eventId}`),
  registerForEvent: (eventId: string, data: any) =>
    apiRequest(`/events/${eventId}/register`, { method: 'POST', body: data }),
};

// Protected API calls
export const staffApi = {
  scanAttendance: (data: any) =>
    apiRequest('/attendance/scan', { method: 'POST', body: data, requireAuth: true }),
};

export const adminApi = {
  getEvents: () => apiRequest('/admin/events', { requireAuth: true }),
  createEvent: (data: any) =>
    apiRequest('/admin/events', { method: 'POST', body: data, requireAuth: true }),
  updateEvent: (eventId: string, data: any) =>
    apiRequest(`/admin/events/${eventId}`, { method: 'PUT', body: data, requireAuth: true }),
  getRegistrations: (eventId: string, emailFilter?: string) => {
    const query = emailFilter ? `?email=${encodeURIComponent(emailFilter)}` : '';
    return apiRequest(`/admin/events/${eventId}/registrations${query}`, { requireAuth: true });
  },
  exportRegistrations: (eventId: string) =>
    apiRequest(`/admin/events/${eventId}/export`, { requireAuth: true }),
  resendQR: (eventId: string, email: string) =>
    apiRequest(`/admin/events/${eventId}/resend-qr`, {
      method: 'POST',
      body: { email },
      requireAuth: true,
    }),
};

