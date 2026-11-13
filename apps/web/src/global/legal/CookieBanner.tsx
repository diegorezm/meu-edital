import { BottomSheet, Button, Sheet, textLinkClass } from "@meu-edital/ui";
import { ConsentToggle } from "./ConsentToggle";
import { useCookieBanner } from "./useCookieBanner";

/** Aviso de cookies e as preferências por categoria. Não bloqueia o app. */
export function CookieBanner() {
  const banner = useCookieBanner();
  return (
    <>
      {banner.visible && (
        <div
          role="region"
          aria-label="Cookies"
          className="fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-30 md:inset-x-auto md:bottom-4 md:left-4 md:w-96"
        >
          <Sheet>
            <p className="mb-3 text-sm">
              Usamos cookies necessários para manter você conectado. Com a sua permissão, também medimos o
              uso do app para melhorá-lo.{" "}
              <a href="/privacidade" className={textLinkClass}>
                Política de Privacidade
              </a>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="quiet" className="px-1" onClick={() => void banner.rejectAll()}>
                Recusar
              </Button>
              <Button variant="quiet" className="px-1" onClick={banner.customize}>
                Personalizar
              </Button>
              <Button variant="quiet" className="px-1" onClick={() => void banner.acceptAll()}>
                Aceitar
              </Button>
            </div>
          </Sheet>
        </div>
      )}
      <BottomSheet
        open={banner.editing}
        onOpenChange={(open) => !open && banner.close()}
        title="Cookies"
        description="Escolha o que pode rodar no app. Dá para mudar quando quiser, em Conta."
      >
        <div className="grid gap-3">
          <ConsentToggle
            label="Necessários"
            description="Mantêm você conectado. Sem eles o app não funciona."
            checked
            disabled
          />
          <ConsentToggle
            label="Erros"
            description="Relatórios de falhas, sem dados pessoais, para a gente corrigir problemas."
            checked={banner.draft.erros}
            onChange={(erros) => banner.setDraft({ ...banner.draft, erros })}
          />
          <ConsentToggle
            label="Análise"
            description="Estatísticas de uso, para entender o que funciona e melhorar o app."
            checked={banner.draft.analise}
            onChange={(analise) => banner.setDraft({ ...banner.draft, analise })}
          />
          <Button onClick={() => void banner.saveDraft()}>Salvar escolhas</Button>
        </div>
      </BottomSheet>
    </>
  );
}
