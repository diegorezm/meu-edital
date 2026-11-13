import type { McpTool } from "../types";
import { contextoDeEstudo } from "./contextoDeEstudo";
import { proporAlteracoes } from "./proporAlteracoes";
import { proporConcurso } from "./proporConcurso";

/** Registro das ferramentas do Oráculo, com o escopo que cada uma exige. */
export const TOOLS: { tool: McpTool; scope: "estudo:ler" | "estudo:propor" }[] = [
  { tool: contextoDeEstudo, scope: "estudo:ler" },
  { tool: proporAlteracoes, scope: "estudo:propor" },
  { tool: proporConcurso, scope: "estudo:propor" },
];
