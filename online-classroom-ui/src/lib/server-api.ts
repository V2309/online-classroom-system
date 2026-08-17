import { cookies } from "next/headers";

/**
 * serverFetch - Helper thực hiện gọi API từ Server Components sang NestJS Backend.
 * Tự động đọc và forward cookie `session` từ request của client sang NestJS.
 */
export async function serverFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cookieStore = cookies();
  const session = cookieStore.get("session")?.value;

  const baseUrl = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
  const formattedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${formattedEndpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(session ? { Cookie: `session=${session}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    cache: options.cache ?? "no-store",
  });

  let json: any = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const error: any = new Error(
      json?.message || `API error (${response.status}): ${response.statusText}`
    );
    error.status = response.status;
    error.data = json;
    throw error;
  }

  // Tự động unwrap format response chuẩn { statusCode, message, data }
  if (json && typeof json === "object" && "data" in json) {
    return json.data as T;
  }

  return json as T;
}
