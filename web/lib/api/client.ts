"use client";

/* ────────────────────────────────────────────────────────────────── */
/*  Low-level HTTP helpers shared by every hook                       */
/* ────────────────────────────────────────────────────────────────── */

function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR on Vercel
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR
}

async function getAuthHeader(): Promise<Record<string, string>> {
  if (typeof window !== "undefined") return {};
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return {
      Cookie: cookieStore.toString(),
    };
  } catch {
    return {};
  }
}

export async function apiFetch<T>(url: string): Promise<T> {
  const fullUrl = url.startsWith("http") ? url : `${getBaseUrl()}${url}`;
  const authHeader = await getAuthHeader();

  const res = await fetch(fullUrl, {
    headers: {
      ...authHeader,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function apiMutate<T>(
  url: string,
  method: string,
  body?: unknown
): Promise<T> {
  const fullUrl = url.startsWith("http") ? url : `${getBaseUrl()}${url}`;
  const authHeader = await getAuthHeader();

  const res = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return res.json();
}
