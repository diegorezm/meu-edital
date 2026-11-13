import { Sheet } from "@meu-edital/ui";
import privacidade from "../../../../../docs/legal/privacidade.md?raw";
import termos from "../../../../../docs/legal/termos.md?raw";
import { Markdown } from "./components/Markdown";

const sources = { termos, privacidade };

/** Termos de Uso e Política de Privacidade, públicos. */
export function LegalPage({ document }: { document: keyof typeof sources }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b-2 border-wood-dark bg-wood px-4 py-2">
        <a href="/" className="font-title text-display-md text-paper-raised">
          Meu Edital
        </a>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <Sheet>
          <Markdown source={sources[document]} />
        </Sheet>
      </main>
    </div>
  );
}
