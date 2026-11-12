import { useSyncExternalStore } from "react";

type Media = { get: () => boolean; subscribe: (fn: () => void) => () => void };

const cache = new Map<string, Media>();
function media(query: string): Media {
  let entry = cache.get(query);
  if (!entry) {
    const list = window.matchMedia(query);
    entry = {
      get: () => list.matches,
      subscribe: (fn) => {
        list.addEventListener("change", fn);
        return () => list.removeEventListener("change", fn);
      },
    };
    cache.set(query, entry);
  }
  return entry;
}

function useMedia(query: string) {
  const source = media(query);
  return useSyncExternalStore(source.subscribe, source.get, () => false);
}

/**
 * Desktop e celular são desenhos diferentes. `mobile` abaixo de 760 px;
 * `wide` a partir de 1100 px, quando cabem as três colunas.
 */
export function useLayout() {
  return {
    mobile: useMedia("(max-width: 759px)"),
    wide: useMedia("(min-width: 1100px)"),
  };
}
