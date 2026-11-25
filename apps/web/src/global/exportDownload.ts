import { apiFetch } from "./http";

/**
 * Baixa a exportação (JSON ou CSV) usando `apiFetch`, para enviar o token
 * Bearer no app nativo e o cookie na web.
 */
export async function downloadExport(format: "json" | "csv"): Promise<void> {
  const response = await apiFetch(`/api/export?formato=${format}`);
  if (!response.ok) throw new Error("Não deu para baixar seus dados agora.");
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = /filename="([^"]+)"/.exec(disposition);
  const filename = match?.[1] ?? `meu-edital.${format}`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
