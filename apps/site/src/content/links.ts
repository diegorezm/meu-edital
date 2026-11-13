/** Endereço do app, definido no build (`PUBLIC_APP_URL`). */
export const APP = import.meta.env.PUBLIC_APP_URL ?? "https://meu-edital-preview.diegommrez12.workers.dev";

/** Com o cadastro fechado (`PUBLIC_WAITLIST=1`), os convites levam à lista de espera. */
export const waitlist = import.meta.env.PUBLIC_WAITLIST === "1";

/** O app abre direto em criar conta ou entrar conforme o parâmetro. */
export const appUrl = (conta: "criar" | "entrar") => `${APP}/?conta=${conta}`;

/** Destino do convite principal: a lista de espera ou criar conta. */
export const ctaUrl = waitlist ? "/#lista" : appUrl("criar");
