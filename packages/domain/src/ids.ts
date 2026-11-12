// Disponível no navegador, no Node e no workerd. Declarado aqui para o
// domínio não depender dos tipos do DOM nem do Node.
declare const crypto: { getRandomValues<T extends Uint8Array>(array: T): T };

const hex = (byte: number) => byte.toString(16).padStart(2, "0");

/**
 * UUIDv7 gerado no próprio aparelho, o que permite criar registros offline.
 * A ordem de exibição não depende do id: use `position` e `order`.
 */
export function uid(now = Date.now()): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let time = now;
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = time % 256;
    time = Math.floor(time / 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const text = Array.from(bytes, hex).join("");
  return [
    text.slice(0, 8),
    text.slice(8, 12),
    text.slice(12, 16),
    text.slice(16, 20),
    text.slice(20),
  ].join("-");
}

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
