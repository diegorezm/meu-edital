import { CheckBox, textLinkClass } from "@meu-edital/ui";
import { Link } from "@tanstack/react-router";

/** Aceite dos termos no cadastro. Começa desmarcado. */
export function TermsConsent({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-2 rounded text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink">
      <input
        type="checkbox"
        className="sr-only"
        aria-labelledby="aceite-termos"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="mt-0.5">
        <CheckBox checked={checked} />
      </span>
      <span id="aceite-termos">
        Li e aceito os{" "}
        <Link to="/termos" target="_blank" className={textLinkClass}>
          Termos de Uso
        </Link>{" "}
        e a{" "}
        <Link to="/privacidade" target="_blank" className={textLinkClass}>
          Política de Privacidade
        </Link>
        .
      </span>
    </label>
  );
}
