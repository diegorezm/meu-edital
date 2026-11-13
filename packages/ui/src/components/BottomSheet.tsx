import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { Ribbon } from "./Ribbon";

/**
 * Folha que sobe da base no celular e vira diálogo centrado no desktop.
 * O comportamento (foco preso, Esc, leitor de tela) vem do Radix.
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  dismissible = true,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Falso para uma decisão obrigatória: sem botão de fechar, Esc nem clique fora. */
  dismissible?: boolean;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40" />
        <Dialog.Content
          onEscapeKeyDown={dismissible ? undefined : (e) => e.preventDefault()}
          onPointerDownOutside={dismissible ? undefined : (e) => e.preventDefault()}
          className={clsx(
            "fixed z-50 flex max-h-[85dvh] flex-col border-2 border-ink bg-paper pt-9 shadow-[var(--shadow-inset-rule),var(--shadow-sheet)]",
            "inset-x-0 bottom-0 rounded-t-[10px]",
            "md:inset-auto md:top-1/2 md:left-1/2 md:w-[min(32rem,calc(100vw-2rem))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded",
          )}
        >
          <Dialog.Title className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <Ribbon>{title}</Ribbon>
          </Dialog.Title>
          {/* A rolagem fica por dentro, para a faixa pendurada não ser cortada. */}
          <div className="overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {description ? (
              <Dialog.Description className="mb-3 text-sm text-ink-muted">{description}</Dialog.Description>
            ) : (
              <Dialog.Description className="sr-only">{title}</Dialog.Description>
            )}
            {children}
          </div>
          {dismissible && (
            <Dialog.Close
              className="absolute top-2 right-2 grid size-11 place-items-center rounded text-ink-muted hover:text-ink"
              aria-label="Fechar"
            >
              <Icon name="close" />
            </Dialog.Close>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
