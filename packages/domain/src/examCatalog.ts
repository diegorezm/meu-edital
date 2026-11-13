import type { StarterSubject } from "./onboarding";

export type CatalogExam = {
  /** Chave estável, para referência. */
  id: string;
  name: string;
  role: string;
  board?: string;
  /** Área, para agrupar no catálogo. */
  area: "Previdência e INSS" | "Bancos" | "Polícia" | "Tribunais" | "Fiscal" | "Geral";
  subjects: StarterSubject[];
};

/**
 * Catálogo de editais prontos: concursos populares com matérias, número de
 * questões e assuntos, para começar sem importar nada. É um ponto de
 * partida baseado em editais recentes; o estudante confere com o edital
 * dele no Edital (ou importa pelo Oráculo) e ajusta.
 */
export const EXAM_CATALOG: CatalogExam[] = [
  {
    id: "inss-tecnico",
    name: "INSS",
    role: "Técnico do Seguro Social",
    board: "Cebraspe",
    area: "Previdência e INSS",
    subjects: [
      { name: "Português", questions: 15, topics: ["Interpretação de textos", "Ortografia", "Crase", "Concordância", "Regência", "Pontuação"] },
      { name: "Direito Previdenciário", questions: 30, topics: ["Seguridade social", "Segurados e dependentes", "Benefícios", "Custeio", "Lei 8.213/1991"] },
      { name: "Direito Constitucional", questions: 10, topics: ["Direitos e garantias fundamentais", "Organização do Estado", "Administração pública"] },
      { name: "Direito Administrativo", questions: 10, topics: ["Atos administrativos", "Agentes públicos", "Lei 9.784/1999"] },
      { name: "Raciocínio Lógico", questions: 10, topics: ["Proposições", "Porcentagem", "Análise combinatória"] },
      { name: "Informática", questions: 10, topics: ["Windows", "Planilhas", "Segurança da informação"] },
      { name: "Ética no Serviço Público", questions: 5, topics: ["Decreto 1.171/1994", "Lei 8.112/1990"] },
    ],
  },
  {
    id: "bb-escriturario",
    name: "Banco do Brasil",
    role: "Escriturário",
    board: "Cesgranrio",
    area: "Bancos",
    subjects: [
      { name: "Português", questions: 10, topics: ["Interpretação de textos", "Concordância", "Pontuação"] },
      { name: "Matemática Financeira", questions: 5, topics: ["Juros simples", "Juros compostos", "Amortização"] },
      { name: "Conhecimentos Bancários", questions: 10, topics: ["Sistema Financeiro Nacional", "Produtos bancários", "Prevenção à lavagem de dinheiro"] },
      { name: "Vendas e Negociação", questions: 15, topics: ["Marketing", "Técnicas de vendas", "Código de Defesa do Consumidor"] },
      { name: "Informática", questions: 15, topics: ["Navegadores", "Planilhas", "Segurança da informação"] },
      { name: "Inglês", questions: 5, topics: ["Interpretação de textos"] },
    ],
  },
  {
    id: "caixa-tecnico",
    name: "Caixa",
    role: "Técnico Bancário",
    board: "Cesgranrio",
    area: "Bancos",
    subjects: [
      { name: "Português", questions: 10, topics: ["Interpretação de textos", "Coesão", "Concordância"] },
      { name: "Matemática Financeira", questions: 10, topics: ["Juros", "Descontos", "Taxas"] },
      { name: "Conhecimentos Bancários", questions: 15, topics: ["Sistema Financeiro Nacional", "Mercado financeiro", "Garantias"] },
      { name: "Atendimento e Vendas", questions: 10, topics: ["Atendimento ao cliente", "Ética nas vendas"] },
      { name: "Informática", questions: 10, topics: ["Segurança", "Aplicativos de escritório"] },
    ],
  },
  {
    id: "pf-agente",
    name: "Polícia Federal",
    role: "Agente",
    board: "Cebraspe",
    area: "Polícia",
    subjects: [
      { name: "Português", questions: 20, topics: ["Interpretação de textos", "Sintaxe", "Pontuação"] },
      { name: "Direito Constitucional", questions: 15, topics: ["Direitos fundamentais", "Segurança pública"] },
      { name: "Direito Administrativo", questions: 15, topics: ["Poderes administrativos", "Atos administrativos"] },
      { name: "Direito Penal", questions: 15, topics: ["Teoria do crime", "Crimes contra a administração pública"] },
      { name: "Direito Processual Penal", questions: 15, topics: ["Inquérito policial", "Prisões"] },
      { name: "Raciocínio Lógico", questions: 10, topics: ["Lógica proposicional", "Probabilidade"] },
      { name: "Informática", questions: 20, topics: ["Redes", "Segurança da informação", "Banco de dados"] },
    ],
  },
  {
    id: "prf-policial",
    name: "PRF",
    role: "Policial Rodoviário Federal",
    board: "Cebraspe",
    area: "Polícia",
    subjects: [
      { name: "Português", questions: 20, topics: ["Interpretação de textos", "Morfossintaxe"] },
      { name: "Legislação de Trânsito", questions: 30, topics: ["CTB", "Resoluções do Contran", "Infrações"] },
      { name: "Direito Constitucional", questions: 10, topics: ["Direitos fundamentais", "Segurança pública"] },
      { name: "Direito Penal", questions: 10, topics: ["Crimes de trânsito", "Teoria do crime"] },
      { name: "Raciocínio Lógico", questions: 10, topics: ["Proposições", "Probabilidade"] },
      { name: "Física", questions: 10, topics: ["Cinemática", "Dinâmica"] },
    ],
  },
  {
    id: "pc-escrivao",
    name: "Polícia Civil",
    role: "Escrivão",
    area: "Polícia",
    subjects: [
      { name: "Português", questions: 15, topics: ["Interpretação de textos", "Redação oficial"] },
      { name: "Direito Penal", questions: 15, topics: ["Teoria do crime", "Crimes contra a pessoa"] },
      { name: "Direito Processual Penal", questions: 15, topics: ["Inquérito policial", "Ação penal"] },
      { name: "Direito Constitucional", questions: 10, topics: ["Direitos fundamentais"] },
      { name: "Informática", questions: 10, topics: ["Aplicativos de escritório", "Segurança"] },
    ],
  },
  {
    id: "trt-tecnico",
    name: "TRT",
    role: "Técnico Judiciário",
    board: "FCC",
    area: "Tribunais",
    subjects: [
      { name: "Português", questions: 10, topics: ["Interpretação de textos", "Crase", "Concordância"] },
      { name: "Direito do Trabalho", questions: 10, topics: ["Contrato de trabalho", "Jornada", "Férias"] },
      { name: "Direito Processual do Trabalho", questions: 10, topics: ["Procedimentos", "Recursos"] },
      { name: "Direito Constitucional", questions: 8, topics: ["Direitos sociais", "Poder Judiciário"] },
      { name: "Direito Administrativo", questions: 8, topics: ["Lei 8.112/1990", "Atos administrativos"] },
      { name: "Raciocínio Lógico", questions: 6, topics: ["Proposições", "Sequências"] },
    ],
  },
  {
    id: "tjsp-escrevente",
    name: "TJ-SP",
    role: "Escrevente Técnico Judiciário",
    board: "Vunesp",
    area: "Tribunais",
    subjects: [
      { name: "Português", questions: 24, topics: ["Interpretação de textos", "Gramática", "Redação oficial"] },
      { name: "Direito Processual Civil", questions: 10, topics: ["Atos processuais", "Prazos"] },
      { name: "Direito Processual Penal", questions: 10, topics: ["Inquérito", "Ação penal"] },
      { name: "Direito Penal", questions: 6, topics: ["Crimes contra a administração pública"] },
      { name: "Normas da Corregedoria", questions: 8, topics: ["Normas de serviço"] },
      { name: "Matemática", questions: 10, topics: ["Porcentagem", "Razão e proporção"] },
      { name: "Informática", questions: 10, topics: ["Windows", "Planilhas", "Correio eletrônico"] },
    ],
  },
  {
    id: "receita-auditor",
    name: "Receita Federal",
    role: "Auditor-Fiscal",
    board: "FGV",
    area: "Fiscal",
    subjects: [
      { name: "Português", questions: 10, topics: ["Interpretação de textos", "Coesão e coerência"] },
      { name: "Direito Tributário", questions: 20, topics: ["Competência tributária", "Obrigação tributária", "Crédito tributário"] },
      { name: "Contabilidade", questions: 20, topics: ["Balanço patrimonial", "DRE", "Lançamentos"] },
      { name: "Legislação Tributária", questions: 20, topics: ["Imposto de renda", "IPI", "Contribuições"] },
      { name: "Direito Constitucional", questions: 10, topics: ["Sistema tributário nacional", "Direitos fundamentais"] },
      { name: "Direito Administrativo", questions: 10, topics: ["Atos administrativos", "Licitações"] },
    ],
  },
  {
    id: "sefaz-auditor",
    name: "Sefaz",
    role: "Auditor Fiscal estadual",
    area: "Fiscal",
    subjects: [
      { name: "Português", questions: 10, topics: ["Interpretação de textos"] },
      { name: "Direito Tributário", questions: 20, topics: ["ICMS", "Código Tributário Nacional"] },
      { name: "Contabilidade", questions: 20, topics: ["Contabilidade geral", "Custos"] },
      { name: "Auditoria", questions: 10, topics: ["Normas de auditoria", "Amostragem"] },
      { name: "Matemática Financeira", questions: 10, topics: ["Juros", "Séries"] },
    ],
  },
  {
    id: "ibge-agente",
    name: "IBGE",
    role: "Agente Censitário",
    area: "Geral",
    subjects: [
      { name: "Português", questions: 10, topics: ["Interpretação de textos", "Pontuação"] },
      { name: "Raciocínio Lógico", questions: 10, topics: ["Proposições", "Problemas"] },
      { name: "Conhecimentos Técnicos", questions: 20, topics: ["Geografia do Brasil", "Atividades censitárias"] },
      { name: "Ética no Serviço Público", questions: 10, topics: ["Código de ética"] },
    ],
  },
  {
    id: "prefeitura-administrativo",
    name: "Prefeitura",
    role: "Assistente Administrativo",
    area: "Geral",
    subjects: [
      { name: "Português", questions: 10, topics: ["Interpretação de textos", "Ortografia", "Concordância"] },
      { name: "Matemática", questions: 10, topics: ["Porcentagem", "Regra de três"] },
      { name: "Noções de Administração", questions: 10, topics: ["Arquivologia", "Atendimento ao público"] },
      { name: "Informática", questions: 10, topics: ["Aplicativos de escritório", "Internet"] },
      { name: "Legislação Municipal", questions: 10, topics: ["Lei orgânica", "Estatuto dos servidores"] },
    ],
  },
];

/** Os mais procurados, para os atalhos do primeiro passo. */
export const POPULAR_EXAMS = EXAM_CATALOG.filter((e) =>
  ["inss-tecnico", "bb-escriturario", "pf-agente", "receita-auditor", "trt-tecnico"].includes(e.id),
);
