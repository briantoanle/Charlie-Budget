export const APP_SESSION_COOKIE_NAME = "charlie_session";
export const APP_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

type SessionPayload = {
  sub: string;
  sid: string;
  iat: number;
  exp: number;
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

function toBase64Url(input: string): string {
  return bytesToBase64Url(new TextEncoder().encode(input));
}

function fromBase64Url(input: string): string {
  const base64 = input.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new TextDecoder().decode(bytes);
}

async function sign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );

  return bytesToBase64Url(new Uint8Array(signature));
}

function getSessionSecret(): string {
  const secret =
    process.env.SESSION_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!secret) {
    throw new Error(
      "Missing session secret. Set SESSION_SECRET in your environment."
    );
  }

  return secret;
}

export async function createSessionToken(userId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: userId,
    sid: crypto.randomUUID(),
    iat: now,
    exp: now + APP_SESSION_TTL_SECONDS,
  };

  const headerPart = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payloadPart = toBase64Url(JSON.stringify(payload));
  const body = `${headerPart}.${payloadPart}`;
  const signature = await sign(body, getSessionSecret());

  return `${body}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, signaturePart] = parts;

  try {
    const expectedSignature = await sign(
      `${headerPart}.${payloadPart}`,
      getSessionSecret()
    );

    if (expectedSignature !== signaturePart) {
      return null;
    }

    const payload = JSON.parse(fromBase64Url(payloadPart)) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);

    if (!payload.sub || !payload.sid || !payload.exp || payload.exp <= now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: APP_SESSION_TTL_SECONDS,
  };
}

export function clearSessionCookieOptions() {
  return {
    ...sessionCookieOptions(),
    maxAge: 0,
  };
}
