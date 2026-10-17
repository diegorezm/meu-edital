import type { StarterSubject } from "@meu-edital/domain";

/** Concursos frequentes, para preencher o nome com um toque. */
export const popularExams = [
  "INSS",
  "Banco do Brasil",
  "Caixa",
  "Polícia Federal",
  "PRF",
  "Receita Federal",
  "TJ",
  "TRT",
];

/** Matérias que mais caem, com assuntos iniciais em ordem de edital. */
export const commonSubjects: StarterSubject[] = [
  {
    name: "Português",
    topics: [
      "Interpretação de textos",
      "Ortografia e acentuação",
      "Classes de palavras",
      "Concordância",
      "Regência",
      "Crase",
      "Pontuação",
    ],
  },
  {
    name: "Raciocínio Lógico",
    topics: [
      "Proposições e conectivos",
      "Equivalências lógicas",
      "Argumentação",
      "Análise combinatória",
      "Probabilidade",
    ],
  },
  {
    name: "Matemática",
    topics: [
      "Razão e proporção",
      "Porcentagem",
      "Regra de três",
      "Juros simples e compostos",
      "Estatística básica",
    ],
  },
  {
    name: "Informática",
    topics: [
      "Sistemas operacionais",
      "Pacote Office",
      "Internet e navegadores",
      "Segurança da informação",
      "Redes de computadores",
    ],
  },
  {
    name: "Direito Constitucional",
    topics: [
      "Princípios fundamentais",
      "Direitos e garantias fundamentais",
      "Organização do Estado",
      "Administração pública",
      "Poderes",
    ],
  },
  {
    name: "Direito Administrativo",
    topics: [
      "Princípios da administração",
      "Atos administrativos",
      "Poderes administrativos",
      "Agentes públicos",
      "Licitações e contratos",
      "Lei 9.784/1999",
    ],
  },
  {
    name: "Atualidades",
    topics: ["Política", "Economia", "Meio ambiente", "Tecnologia"],
  },
  {
    name: "Ética no Serviço Público",
    topics: ["Decreto 1.171/1994", "Lei 8.112/1990 (deveres)", "Improbidade"],
  },
  {
    name: "Direito Penal",
    topics: [
      "Aplicação da lei penal",
      "Crime",
      "Imputabilidade",
      "Crimes contra a administração pública",
    ],
  },
  {
    name: "Inglês",
    topics: ["Interpretação de textos", "Vocabulário", "Gramática"],
  },
];

export const hourOptions = [5, 10, 15, 20, 25, 30, 40];
