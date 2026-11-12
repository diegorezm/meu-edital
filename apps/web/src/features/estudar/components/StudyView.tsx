import { BottomSheet, buttonClass, Mascot, Sheet } from "@meu-edital/ui";
import { useLayout } from "@global/hooks/useLayout";
import { Link } from "@tanstack/react-router";
import type { Study } from "../hooks/useStudy";
import { RegisterForm } from "./RegisterForm";
import { TimerSheet } from "./TimerSheet";

/**
 * Estudar. Desktop: cronômetro e registro lado a lado. Celular: o
 * cronômetro, e o registro sobe da base ao tocar em Registrar.
 */
export function StudyView({ study }: { study: Study }) {
  const { mobile } = useLayout();
  if (!study.exam || !study.hasSubjects)
    return (
      <Sheet title="Estudar" className="mx-auto max-w-xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <Mascot pose="dormindo" className="w-36" />
          <p>Para estudar, primeiro monte seu concurso.</p>
          <Link to="/comecar" className={buttonClass()}>
            Começar
          </Link>
        </div>
      </Sheet>
    );

  if (mobile)
    return (
      <>
        <TimerSheet study={study} />
        <BottomSheet open={study.registering} onOpenChange={study.setRegistering} title="Registro">
          <RegisterForm study={study} />
        </BottomSheet>
      </>
    );

  return (
    <div className="grid items-start gap-[18px] lg:grid-cols-2">
      <TimerSheet study={study} />
      <Sheet title="Registro" tone="gold" ribbonSize="sm" className="pt-[26px]">
        {study.registering ? (
          <RegisterForm study={study} />
        ) : (
          <div className="flex flex-col gap-3 text-sm text-ink-muted">
            <p>Ao terminar, toque em Registrar. Os minutos do cronômetro já vêm preenchidos.</p>
            <p>Estudou sem o cronômetro? Registre direto: dá para escolher outra data também.</p>
          </div>
        )}
      </Sheet>
    </div>
  );
}
