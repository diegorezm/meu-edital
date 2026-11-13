import { BottomSheet, Button, buttonClass, Notice, textLinkClass } from "@meu-edital/ui";
import { Link } from "@tanstack/react-router";
import { apiUrl } from "../http";
import { useStore } from "../store/useStore";
import { LEGAL_PATHS, LEGAL_TITLES } from "./legal";
import { useLegalGate } from "./useLegalGate";

/**
 * Pede o aceite dos termos e da privacidade quando há versão nova com
 * mudança relevante. Não fecha sem aceitar; exportar os dados e excluir a
 * conta continuam ao alcance.
 */
export function LegalGate() {
  const store = useStore();
  const { pending, accept, busy, error } = useLegalGate(() => void store.syncNow());
  if (pending.length === 0) return null;
  const first = pending.every((p) => p.first);

  return (
    <BottomSheet
      open
      onOpenChange={() => undefined}
      dismissible={false}
      title={first ? "Antes de começar" : "Termos atualizados"}
      description={
        first
          ? "Para usar o Meu Edital, leia e aceite os documentos abaixo."
          : "Mudamos alguns pontos. Leia o resumo e aceite para continuar."
      }
    >
      <div className="grid gap-4">
        {pending.map((p) => (
          <section key={p.document} className="grid gap-1">
            <h3 className="font-bold">
              <Link to={LEGAL_PATHS[p.document]} target="_blank" className={textLinkClass}>
                {LEGAL_TITLES[p.document]}
              </Link>
            </h3>
            {!p.first && (
              <ul className="list-disc pl-5 text-sm">
                {p.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <Notice>
          Se preferir não aceitar, você ainda pode exportar seus dados ou excluir a conta.
        </Notice>
        {error && <Notice tone="error">{error}</Notice>}
        <Button onClick={() => void accept()} disabled={busy}>
          Aceitar e continuar
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <a href={apiUrl("/api/export?formato=json")} download className={buttonClass("quiet")}>
            Exportar meus dados
          </a>
          <Link to="/conta" className={textLinkClass}>
            Excluir conta
          </Link>
        </div>
      </div>
    </BottomSheet>
  );
}
