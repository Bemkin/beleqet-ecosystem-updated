/**
 * Base API URL for the Beleqet NestJS backend.
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

/**
 * Custom fetch wrapper to simplify REST requests to the backend.
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}/${endpoint.replace(/^\//, '')}`;
  
  // Set headers dynamically
  const headers = new Headers(options.headers || {});
  
  // Retrieve token from localStorage if in browser environment
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('beleqet_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Only set Content-Type to JSON if body is not FormData (e.g. file upload)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred during the API request.';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Fallback if not json
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}
