import { buildCycle } from "./cycle";
import { today } from "./dates";
import { uid } from "./ids";
import { type AppData, emptyData } from "./types";

/** Concurso de exemplo, usado nos testes e em demonstrações. */
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
  const subjects = names.map((name, position) => ({ id: uid(), examId, name, position }));
  const topics = subjects.flatMap((subject, i) =>
    examples[i].map((name, position) => ({
      id: uid(),
      subjectId: subject.id,
      name,
      position,
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
        examDate: "2027-05-16",
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
