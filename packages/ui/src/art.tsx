/// <reference types="vite/client" />
import manifest from "../art/manifesto.json";

export type ArtKey = keyof typeof manifest;

const urls = import.meta.glob<string>("../art/**/*.{svg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

/** URL da ilustração pela chave do manifesto. Componentes nunca usam o caminho. */
export function artUrl(key: ArtKey): string {
  return urls[`../art/${manifest[key]}`];
}

/** Ilustração no quadro padrão de 200 por 210. Decorativa quando não há `alt`. */
export function Art({ name, alt = "", className }: { name: ArtKey; alt?: string; className?: string }) {
  return (
    <img
      src={artUrl(name)}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      width={200}
      height={210}
      className={className}
    />
  );
}
