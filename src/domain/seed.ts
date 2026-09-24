import { AppData, uid, today } from "./types";

export function createSeed(): AppData {
  const examId = uid();
  const names = [
    "Português",
    "Matemática",
    "Direito Administrativo",
    "Direito Constitucional",
    "Informática",
  ];
  const examples = [
    ["Interpretação de textos", "Crase", "Concordância"],
    ["Porcentagem", "Razão e proporção", "Estatística básica"],
    ["Lei 9.784/1999", "Atos administrativos", "Licitações"],
    ["Direitos fundamentais", "Administração pública", "Organização do Estado"],
    ["Segurança da informação", "Pacote Office", "Redes de computadores"],
  ];
  const subjects = names.map((name) => ({ id: uid(), examId, name }));
  const topics = subjects.flatMap((subject, i) =>
    examples[i].map((name) => ({
      id: uid(),
      subjectId: subject.id,
      name,
      studied: false,
    })),
  );
  return {
    version: 1,
    exams: [
      {
        id: examId,
        name: "DETRAN-SP",
        role: "Agente Estadual de Trânsito",
        board: "Avalia",
        examDate: "2026-11-15",
        hoursPerWeek: 25,
        createdAt: today(),
      },
    ],
    subjects,
    topics,
    planned: [],
    sessions: [],
    reviews: [],
    cycle: [],
    cyclePosition: {},
    activeExamId: examId,
    reviewOffsets: [1, 7, 30],
  };
}
