const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function apiUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

export async function apiFetch(path, options = {}) {
  const { headers, body, ...rest } = options;
  const defaultHeaders = {};
  if (body && !(body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }
  return fetch(apiUrl(path), {
    credentials: "include",
    ...rest,
    body,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  });
}

export { API_BASE };
