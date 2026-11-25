/**
 * Ticket efêmero (30 s) assinado por HMAC-SHA256 para autenticar o upgrade
 * do WebSocket no app nativo sem expor o token Bearer permanente na URL.
 */
const TICKET_TTL_MS = 30_000;
const PURPOSE = "ws-ticket:v1";

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64Url = (text: string): Uint8Array | null => {
  try {
    const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (text.length % 4)) % 4);
    const binary = atob(padded);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
};

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`${PURPOSE}:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createWsTicket(userId: string, secret: string, now = Date.now()): Promise<string> {
  const payload = `${userId}.${now + TICKET_TTL_MS}`;
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifyWsTicket(ticket: string, secret: string, now = Date.now()): Promise<string | null> {
  const parts = ticket.split(".");
  if (parts.length !== 3) return null;
  const [userId, expText, sigText] = parts;
  const exp = Number(expText);
  if (!userId || !Number.isFinite(exp) || exp < now) return null;
  const sig = fromBase64Url(sigText);
  if (!sig) return null;
  const key = await hmacKey(secret);
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    sig,
    new TextEncoder().encode(`${userId}.${expText}`),
  );
  return ok ? userId : null;
}
