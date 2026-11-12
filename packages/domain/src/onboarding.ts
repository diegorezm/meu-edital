import { buildCycle } from "./cycle";
import { today } from "./dates";
import { uid } from "./ids";
import type { AppData, Subject, Topic } from "./types";

export type StarterSubject = {
  name: string;
  /** Assuntos iniciais, em ordem. Sem eles a matéria ganha um assunto genérico. */
  topics?: string[];
};

export type StartExamInput = {
  name: string;
  role?: string;
  /** Data da prova em AAAA-MM-DD, quando já é conhecida. */
  examDate?: string;
  hoursPerWeek: number;
  subjects: StarterSubject[];
};

export const GENERAL_TOPIC = "Conteúdo geral";

/**
 * Cria o primeiro concurso com matérias, assuntos e um ciclo pronto, deixando-o
 * ativo. Toda matéria recebe ao menos um assunto para que a primeira sessão já
 * possa ser registrada. Nomes de matéria repetidos ou vazios são ignorados.
 */
export function startExam(data: AppData, input: StartExamInput): AppData {
  const examId = uid();
  const seen = new Set<string>();
  const subjects: Subject[] = [];
  const topics: Topic[] = [];
  for (const starter of input.subjects) {
    const name = starter.name.trim();
    const key = name.toLocaleLowerCase("pt-BR");
    if (!name || seen.has(key)) continue;
    seen.add(key);
    const subject: Subject = { id: uid(), examId, name, position: subjects.length };
    subjects.push(subject);
    const names = (starter.topics || []).map((t) => t.trim()).filter(Boolean);
    (names.length ? names : [GENERAL_TOPIC]).forEach((topic, position) =>
      topics.push({ id: uid(), subjectId: subject.id, name: topic, position }),
    );
  }
  const next: AppData = {
    ...data,
    exams: [
      ...data.exams,
      {
        id: examId,
        name: input.name.trim(),
        role: input.role?.trim() || "",
        ...(input.examDate ? { examDate: input.examDate } : {}),
        hoursPerWeek: input.hoursPerWeek,
        createdAt: today(),
        cyclePosition: 0,
        cycleLaps: 0,
      },
    ],
    subjects: [...data.subjects, ...subjects],
    topics: [...data.topics, ...topics],
    activeExamId: examId,
  };
  return { ...next, cycle: [...next.cycle, ...buildCycle(next, examId)] };
}

/** Concurso de exemplo, para conhecer o app antes de montar o próprio edital. */
export const EXAMPLE_EXAM: StartExamInput = {
  name: "Concurso de exemplo",
  role: "Técnico",
  hoursPerWeek: 20,
  subjects: [
    { name: "Português", topics: ["Interpretação de textos", "Crase", "Concordância", "Pontuação"] },
    { name: "Raciocínio Lógico", topics: ["Proposições", "Porcentagem", "Probabilidade"] },
    { name: "Direito Constitucional", topics: ["Direitos fundamentais", "Organização do Estado"] },
    { name: "Direito Administrativo", topics: ["Atos administrativos", "Licitações", "Agentes públicos"] },
    { name: "Informática", topics: ["Segurança da informação", "Redes", "Planilhas"] },
  ],
};

/**
 * Concursos populares para o primeiro passo: nome, cargo comum e matérias
 * iniciais com assuntos. É um ponto de partida; o edital real pode ser
 * importado pelo Oráculo e tudo é editável.
 */
export const POPULAR_EXAMS: { name: string; role: string; subjects: StarterSubject[] }[] = [
  {
    name: "INSS",
    role: "Técnico do Seguro Social",
    subjects: [
      { name: "Português", topics: ["Interpretação de textos", "Ortografia", "Crase", "Concordância", "Regência", "Pontuação"] },
      { name: "Direito Previdenciário", topics: ["Seguridade social", "Segurados e dependentes", "Benefícios", "Custeio"] },
      { name: "Direito Constitucional", topics: ["Direitos e garantias fundamentais", "Organização do Estado", "Administração pública"] },
      { name: "Direito Administrativo", topics: ["Atos administrativos", "Agentes públicos", "Lei 9.784/1999"] },
      { name: "Raciocínio Lógico", topics: ["Proposições", "Porcentagem", "Análise combinatória"] },
      { name: "Informática", topics: ["Windows", "Planilhas", "Segurança da informação"] },
      { name: "Ética no Serviço Público", topics: ["Decreto 1.171/1994", "Lei 8.112/1990"] },
    ],
  },
  {
    name: "Banco do Brasil",
    role: "Escriturário",
    subjects: [
      { name: "Português", topics: ["Interpretação de textos", "Concordância", "Pontuação"] },
      { name: "Matemática Financeira", topics: ["Juros simples", "Juros compostos", "Amortização"] },
      { name: "Conhecimentos Bancários", topics: ["Sistema Financeiro Nacional", "Produtos bancários", "Prevenção à lavagem de dinheiro"] },
      { name: "Vendas e Negociação", topics: ["Marketing", "Técnicas de vendas", "Código de Defesa do Consumidor"] },
      { name: "Informática", topics: ["Navegadores", "Planilhas", "Segurança da informação"] },
      { name: "Inglês", topics: ["Interpretação de textos"] },
    ],
  },
  {
    name: "Polícia Federal",
    role: "Agente",
    subjects: [
      { name: "Português", topics: ["Interpretação de textos", "Sintaxe", "Pontuação"] },
      { name: "Direito Constitucional", topics: ["Direitos fundamentais", "Segurança pública"] },
      { name: "Direito Administrativo", topics: ["Poderes administrativos", "Atos administrativos"] },
      { name: "Direito Penal", topics: ["Teoria do crime", "Crimes contra a administração pública"] },
      { name: "Direito Processual Penal", topics: ["Inquérito policial", "Prisões"] },
      { name: "Raciocínio Lógico", topics: ["Lógica proposicional", "Probabilidade"] },
      { name: "Informática", topics: ["Redes", "Segurança da informação", "Banco de dados"] },
    ],
  },
  {
    name: "Receita Federal",
    role: "Auditor-Fiscal",
    subjects: [
      { name: "Português", topics: ["Interpretação de textos", "Coesão e coerência"] },
      { name: "Direito Tributário", topics: ["Competência tributária", "Obrigação tributária", "Crédito tributário"] },
      { name: "Contabilidade", topics: ["Balanço patrimonial", "DRE", "Lançamentos"] },
      { name: "Legislação Tributária", topics: ["Imposto de renda", "IPI", "Contribuições"] },
      { name: "Direito Constitucional", topics: ["Sistema tributário nacional", "Direitos fundamentais"] },
      { name: "Direito Administrativo", topics: ["Atos administrativos", "Licitações"] },
    ],
  },
  {
    name: "TRT",
    role: "Técnico Judiciário",
    subjects: [
      { name: "Português", topics: ["Interpretação de textos", "Crase", "Concordância"] },
      { name: "Direito do Trabalho", topics: ["Contrato de trabalho", "Jornada", "Férias"] },
      { name: "Direito Processual do Trabalho", topics: ["Procedimentos", "Recursos"] },
      { name: "Direito Constitucional", topics: ["Direitos sociais", "Poder Judiciário"] },
      { name: "Direito Administrativo", topics: ["Lei 8.112/1990", "Atos administrativos"] },
      { name: "Raciocínio Lógico", topics: ["Proposições", "Sequências"] },
    ],
  },
];
