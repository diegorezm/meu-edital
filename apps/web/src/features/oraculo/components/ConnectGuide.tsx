import { Chip } from "@meu-edital/ui";
import { useState } from "react";

type Assistant = "chatgpt" | "claude" | "perplexity" | "outra";

const names: Record<Assistant, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  perplexity: "Perplexity",
  outra: "Outra",
};

/** Passo a passo de cada IA. Os menus mudam de nome com o tempo: textos curtos. */
const steps: Record<Assistant, { steps: string[]; plan: string }> = {
  chatgpt: {
    steps: [
      "No chatgpt.com, abra Configurações, Apps e ligue o Modo desenvolvedor (em Configurações avançadas).",
      "Em Apps, toque em Criar. Dê o nome Meu Edital, cole o endereço e escolha OAuth.",
      "Numa conversa, ative o Meu Edital no menu + antes de pedir.",
    ],
    plan: "Precisa de um plano pago do ChatGPT.",
  },
  claude: {
    steps: [
      "No claude.ai, abra Configurações, Conectores e toque em Adicionar conector personalizado.",
      "Dê o nome Meu Edital, cole o endereço e toque em Adicionar.",
      "Toque em Conectar.",
    ],
    plan: "Funciona no plano grátis. Adicione pelo computador; depois ele aparece no celular também.",
  },
  perplexity: {
    steps: [
      "No perplexity.ai, abra Configurações, Conectores e toque em Adicionar personalizado.",
      "Escolha conector MCP remoto, dê o nome Meu Edital, cole o endereço e escolha OAuth.",
      "Toque em Adicionar e depois em Conectar.",
    ],
    plan: "Precisa do Perplexity Pro ou Max.",
  },
  outra: {
    steps: [
      "Procure por conectores, MCP ou integrações nas configurações da sua IA.",
      "Adicione um servidor MCP remoto com o endereço acima e autenticação OAuth.",
    ],
    plan: "Funciona em qualquer IA que aceite MCP remoto com OAuth.",
  },
};

/** Escolha da IA e o passo a passo para conectá-la ao Oráculo. */
export function ConnectGuide() {
  const [assistant, setAssistant] = useState<Assistant>("chatgpt");
  const guide = steps[assistant];
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Qual IA você usa?">
        {(Object.keys(names) as Assistant[]).map((key) => (
          <Chip key={key} pressed={assistant === key} onClick={() => setAssistant(key)} className="px-1">
            {names[key]}
          </Chip>
        ))}
      </div>
      <ol className="list-decimal space-y-1 pl-5 text-sm">
        {guide.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
        <li>A IA abre o Meu Edital: entre e toque em Permitir.</li>
      </ol>
      <p className="text-xs text-ink-muted">{guide.plan}</p>
      <p className="text-xs text-ink-muted">
        Depois, peça: <i>"Revise minha semana no Meu Edital"</i>. A IA só lê seu estudo e propõe; nada muda sem você
        aplicar.
      </p>
    </div>
  );
}
