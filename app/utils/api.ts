export type FetchOptions = {
  headers?: Record<string, string>;
  body?: any;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function apiRequest(path: string, options: FetchOptions = {}): Promise<any> {
  const url = `${BASE_URL}/api${path}`;
  const { method = "GET", headers = {}, body } = options;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
}

export const apiGet = (path: string, headers?: Record<string, string>) =>
  apiRequest(path, { method: "GET", headers });

export const apiPost = (path: string, body: any, headers?: Record<string, string>) =>
  apiRequest(path, { method: "POST", body, headers });

export const apiPut = (path: string, body: any, headers?: Record<string, string>) =>
  apiRequest(path, { method: "PUT", body, headers });

export const apiDelete = (path: string, body?: any, headers?: Record<string, string>) =>
  apiRequest(path, { method: "DELETE", body, headers });
