import { z } from "zod";

/** Extrai o JSON de uma resposta, aceitando blocos ```json``` com texto ao redor. */
export function extractJson(text: string): unknown {
  const pasted = text.trim();
  const candidates: string[] = [];
  // Tenta primeiro blocos explicitamente marcados com ```json, depois blocos genéricos, depois o texto todo.
  for (const match of pasted.matchAll(/```json\s*([\s\S]*?)\s*```/gi)) candidates.push(match[1].trim());
  for (const match of pasted.matchAll(/```(?:[a-z]*)\s*([\s\S]*?)\s*```/gi)) candidates.push(match[1].trim());
  const firstBrace = pasted.indexOf("{");
  const lastBrace = pasted.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) candidates.push(pasted.slice(firstBrace, lastBrace + 1));
  candidates.push(pasted);

  let lastCause: unknown;
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch (cause) {
      lastCause = cause;
    }
  }
  const detail = lastCause instanceof Error ? ` Detalhe: ${lastCause.message}` : "";
  throw new Error(
    `A resposta não é um JSON válido. Confira o texto colado e as aspas duplas.${detail}`,
    { cause: lastCause },
  );
}

/** Valida a resposta de um agente e devolve uma mensagem de erro legível. */
export function parseWith<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(
    typeof input === "string" ? extractJson(input) : input,
  );
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path.join(".") || "conteúdo";
    const reason =
      issue?.code === "invalid_type"
        ? "tipo incorreto ou campo ausente"
        : issue?.code === "unrecognized_keys"
          ? "contém campos não previstos"
          : issue?.code === "too_small"
            ? "valor vazio ou abaixo do mínimo"
            : issue?.code === "too_big"
              ? "valor acima do máximo"
              : "valor não permitido";
    throw new Error(`Formato inválido em '${field}': ${reason}.`);
  }
  return result.data;
}

export const nameSchema = z
  .string()
  .trim()
  .min(1, "O nome não pode ficar vazio.")
  .max(1024);
export const positiveSchema = z.number().finite().positive().max(100_000);
