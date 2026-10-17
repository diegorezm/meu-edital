import { z } from "zod";

/** Extrai o JSON de uma resposta, aceitando um bloco ```json``` com texto ao redor. */
export function extractJson(text: string): unknown {
  const pasted = text.trim();
  const codeBlock = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(pasted);
  const clean = (codeBlock?.[1] || pasted).trim();
  try {
    return JSON.parse(clean);
  } catch (cause) {
    const detail = cause instanceof Error ? ` Detalhe: ${cause.message}` : "";
    throw new Error(
      `A resposta não é um JSON válido. Confira o texto colado e as aspas duplas.${detail}`,
    );
  }
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
export const positiveSchema = z.number().finite().positive();
