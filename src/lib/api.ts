import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE_URL = "https://relyonmails2.com/backend/api";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  token?: string;
  [key: string]: any;
}

async function request<T = any>(
  path: string,
  options: { method?: string; body?: any } = {}
): Promise<ApiResponse<T>> {
  const token = await AsyncStorage.getItem("lms_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, message: text };
  }
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body: any) => request<T>(path, { method: "POST", body }),
  put: <T = any>(path: string, body: any) => request<T>(path, { method: "PUT", body }),
  delete: <T = any>(path: string) => request<T>(path, { method: "DELETE" }),
};
