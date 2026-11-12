import { Mascot, Sheet, textLinkClass } from "@meu-edital/ui";
import { Link } from "@tanstack/react-router";

/** Página ainda sem desenho aprovado. */
export function UnderConstruction({ title, soon }: { title: string; soon?: string }) {
  return (
    <Sheet title={title} className="mx-auto max-w-xl">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Mascot pose="dormindo" className="w-36" />
        <p>{soon ?? "Esta sala da guilda ainda está em obra. Volte em breve."}</p>
        <Link to="/" className={textLinkClass}>
          Voltar ao início
        </Link>
      </div>
    </Sheet>
  );
}
