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
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40" />
        <Dialog.Content
          className={clsx(
            "fixed z-50 max-h-[85dvh] overflow-y-auto border-2 border-ink bg-paper px-4 pt-9 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-inset-rule),var(--shadow-sheet)]",
            "inset-x-0 bottom-0 rounded-t-[10px]",
            "md:inset-auto md:top-1/2 md:left-1/2 md:w-[min(32rem,calc(100vw-2rem))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded",
          )}
        >
          <Dialog.Title className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <Ribbon>{title}</Ribbon>
          </Dialog.Title>
          {description ? (
            <Dialog.Description className="mb-3 text-sm text-ink-muted">{description}</Dialog.Description>
          ) : (
            <Dialog.Description className="sr-only">{title}</Dialog.Description>
          )}
          {children}
          <Dialog.Close
            className="absolute top-2 right-2 grid size-11 place-items-center rounded text-ink-muted hover:text-ink"
            aria-label="Fechar"
          >
            <Icon name="close" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
