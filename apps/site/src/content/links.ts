/** Endereço do app, definido no build (`PUBLIC_APP_URL`). */
const APP = import.meta.env.PUBLIC_APP_URL ?? "https://meu-edital-preview.diegommrez12.workers.dev";

/** O app abre direto em criar conta ou entrar conforme o parâmetro. */
export const appUrl = (conta: "criar" | "entrar") => `${APP}/?conta=${conta}`;
