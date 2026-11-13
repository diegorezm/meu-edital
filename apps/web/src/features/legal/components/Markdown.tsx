import { textLinkClass } from "@meu-edital/ui";
import type { ReactNode } from "react";

/**
 * Markdown mínimo dos documentos de `docs/legal/`: títulos, parágrafos,
 * listas, tabelas, negrito e links. Links para `x.md` viram a rota `/x`.
 */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    const bold = part.match(/^\*\*(.+)\*\*$/);
    if (bold) return <strong key={i}>{bold[1]}</strong>;
    const link = part.match(/^\[(.+)\]\((.+)\)$/);
    if (link) {
      const [, label, href] = link;
      const doc = href!.match(/^(\w+)\.md$/);
      return (
        <a key={i} href={doc ? `/${doc[1]}` : href} className={textLinkClass} rel="noreferrer">
          {label}
        </a>
      );
    }
    return part;
  });
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

export function Markdown({ source }: { source: string }) {
  // Título sempre vira bloco próprio, mesmo sem linha em branco depois.
  const blocks = source
    .trim()
    .replace(/^(#+ .*)$/gm, "$1\n")
    .split(/\n\s*\n/);
  return (
    <div className="grid gap-3">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const first = lines[0]!;
        if (first.startsWith("# ")) return <h1 key={i} className="font-title text-display-md">{inline(first.slice(2))}</h1>;
        if (first.startsWith("## ")) return <h2 key={i} className="mt-3 font-title text-display-sm">{inline(first.slice(3))}</h2>;
        if (first.startsWith("- "))
          return (
            <ul key={i} className="list-disc pl-5">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.slice(2))}</li>
              ))}
            </ul>
          );
        if (first.startsWith("|")) {
          const [head, , ...rows] = lines;
          return (
            <div key={i} className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {cells(head!).map((c, j) => (
                      <th key={j} className="border-b-2 border-ink p-2 text-left">{inline(c)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, r) => (
                    <tr key={r}>
                      {cells(row).map((c, j) => (
                        <td key={j} className="border-b border-rule p-2 align-top">{inline(c)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return <p key={i}>{inline(lines.join(" "))}</p>;
      })}
    </div>
  );
}
