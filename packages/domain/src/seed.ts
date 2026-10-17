import { buildCycle } from "./cycle";
import { AppData, emptyData, today, uid } from "./types";

/** Dados de demonstração usados no modo local, sem conta. */
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
  const data: AppData = {
    ...emptyData(),
    exams: [
      {
        id: examId,
        name: "DETRAN-SP",
        role: "Agente Estadual de Trânsito",
        board: "Avalia",
        examDate: "2026-11-15",
        hoursPerWeek: 25,
        createdAt: today(),
        cyclePosition: 0,
        cycleLaps: 0,
      },
    ],
    subjects,
    topics,
    activeExamId: examId,
  };
  return { ...data, cycle: buildCycle(data, examId) };
}
