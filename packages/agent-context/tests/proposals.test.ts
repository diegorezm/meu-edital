import { describe, expect, it } from "vitest";
import { createSeed, emptyData, getCycleItems, subjectWeight } from "@meu-edital/domain";
import {
  applyProposal,
  isExpired,
  MAX_PROPOSAL_BYTES,
  previewProposal,
  ProposalInputSchema,
  proposalExpiry,
  proposalSize,
} from "../src";

describe("propostas", () => {
  it("aceita só o formato previsto", () => {
    const ok = ProposalInputSchema.safeParse({
      reason: "Matemática está fraca.",
      payload: { kind: "changes", changes: [{ op: "setSubjectWeight", subject: "Matemática", weight: 3 }] },
    });
    expect(ok.success).toBe(true);
    const bad = ProposalInputSchema.safeParse({ reason: "x", payload: { kind: "apagarTudo" } });
    expect(bad.success).toBe(false);
    expect(ProposalInputSchema.safeParse({ reason: "", payload: { kind: "changes", changes: [] } }).success).toBe(false);
  });

  it("mostra prévia e aplica alterações pelo domínio", () => {
    const data = createSeed();
    const examId = data.activeExamId!;
    const payload = { kind: "changes" as const, changes: [{ op: "setSubjectWeight" as const, subject: "Português", weight: 5 }] };
    expect(previewProposal(data, examId, payload)[0]).toMatchObject({ title: "Peso de Português", before: "1", after: "5" });
    expect(subjectWeight(applyProposal(data, examId, payload).subjects[0])).toBe(5);
  });

  it("prévia de importação diz o que é novo e o que é atualizado", () => {
    const data = createSeed();
    const examId = data.activeExamId!;
    const payload = {
      kind: "syllabus" as const,
      syllabus: {
        exam: "DETRAN-SP",
        role: "Agente",
        subjects: [
          { name: "Português", topics: [{ name: "Crase" }] },
          { name: "Legislação de Trânsito", questions: 20, topics: [{ name: "CTB", subtopics: [{ name: "Infrações" }] }] },
        ],
      },
    };
    const preview = previewProposal(data, examId, payload);
    expect(preview.map((p) => p.title)).toEqual(["Atualizar Português", "Nova matéria: Legislação de Trânsito"]);
    expect(preview[1].after).toBe("2 assuntos no edital · 20 questões");
    expect(applyProposal(data, examId, payload).subjects.some((s) => s.name === "Legislação de Trânsito")).toBe(true);
  });

  it("recusa referência inexistente na prévia", () => {
    const data = createSeed();
    expect(() =>
      previewProposal(data, data.activeExamId!, {
        kind: "changes",
        changes: [{ op: "setSubjectWeight", subject: "Biologia", weight: 2 }],
      }),
    ).toThrow(/Não encontramos/);
  });

  it("cria matéria nova e deixa a jornada citá-la na mesma proposta", () => {
    const data = createSeed();
    const examId = data.activeExamId!;
    const payload = {
      kind: "changes" as const,
      changes: [
        {
          op: "addSubject" as const,
          subject: "Legislação de Trânsito",
          questions: 20,
          topics: ["CTB", "Infrações", "ctb"],
          cycleMinutes: 30,
        },
        {
          op: "setCycle" as const,
          blocks: [
            { subject: "Português", minutes: 60 },
            { subject: "Legislação de Trânsito", minutes: 45 },
          ],
        },
      ],
    };
    const preview = previewProposal(data, examId, payload);
    expect(preview[0]).toMatchObject({
      title: "Nova matéria: Legislação de Trânsito",
      before: "não existe",
      after: "3 assuntos · 20 questões · entra na jornada com 30 min",
    });
    const next = applyProposal(data, examId, payload);
    const created = next.subjects.find((s) => s.name === "Legislação de Trânsito")!;
    expect(created).toMatchObject({ examId, questions: 20, pointsPerQuestion: 1 });
    expect(next.topics.filter((t) => t.subjectId === created.id).map((t) => t.name)).toEqual(["CTB", "Infrações"]);
    expect(getCycleItems(next, examId).map((i) => i.minutes)).toEqual([60, 45]);
  });

  it("matéria nova sem assuntos ganha o assunto genérico e entra no fim da jornada", () => {
    const data = createSeed();
    const examId = data.activeExamId!;
    const before = getCycleItems(data, examId).length;
    const next = applyProposal(data, examId, {
      kind: "changes",
      changes: [{ op: "addSubject", subject: "Ética", weight: 2, cycleMinutes: 20 }],
    });
    const created = next.subjects.find((s) => s.name === "Ética")!;
    expect(subjectWeight(created)).toBe(2);
    expect(next.topics.filter((t) => t.subjectId === created.id)).toHaveLength(1);
    expect(getCycleItems(next, examId)).toHaveLength(before + 1);
    expect(getCycleItems(next, examId).at(-1)).toMatchObject({ subjectId: created.id, minutes: 20 });
  });

  it("recusa matéria que já existe no concurso", () => {
    const data = createSeed();
    expect(() =>
      previewProposal(data, data.activeExamId!, {
        kind: "changes",
        changes: [{ op: "addSubject", subject: "português" }],
      }),
    ).toThrow(/já existe/);
  });

  it("propõe um concurso novo, que vira o ativo com jornada pronta", () => {
    const payload = {
      kind: "exam" as const,
      exam: {
        name: "INSS",
        role: "Técnico do Seguro Social",
        examDate: "2027-03-14",
        hoursPerWeek: 15,
        subjects: [
          { name: "Português", questions: 15, topics: ["Crase"] },
          { name: "Direito Previdenciário", weight: 3 },
        ],
      },
    };
    expect(ProposalInputSchema.safeParse({ reason: "Edital novo.", payload }).success).toBe(true);
    expect(previewProposal(emptyData(), "", payload).map((p) => p.title)).toEqual([
      "Novo concurso: INSS",
      "Nova matéria: Português",
      "Nova matéria: Direito Previdenciário",
    ]);
    const next = applyProposal(emptyData(), "", payload);
    const exam = next.exams.find((e) => e.name === "INSS")!;
    expect(next.activeExamId).toBe(exam.id);
    expect(exam).toMatchObject({ hoursPerWeek: 15, examDate: "2027-03-14", role: "Técnico do Seguro Social" });
    expect(subjectWeight(next.subjects.find((s) => s.name === "Direito Previdenciário")!)).toBe(3);
    expect(getCycleItems(next, exam.id).length).toBeGreaterThan(0);
  });

  it("recusa concurso com nome repetido ou data inválida", () => {
    const data = createSeed();
    expect(() =>
      previewProposal(data, data.activeExamId!, {
        kind: "exam",
        exam: { name: data.exams[0].name.toUpperCase(), hoursPerWeek: 10, subjects: [{ name: "Português" }] },
      }),
    ).toThrow(/Já existe um concurso/);
    const bad = ProposalInputSchema.safeParse({
      reason: "x",
      payload: { kind: "exam", exam: { name: "X", examDate: "2027-02-30", hoursPerWeek: 10, subjects: [{ name: "A" }] } },
    });
    expect(bad.success).toBe(false);
  });

  it("expira em 7 dias e mede o tamanho", () => {
    const created = Date.UTC(2026, 10, 12);
    const expires = proposalExpiry(created);
    expect(isExpired({ expiresAt: expires }, expires - 1)).toBe(false);
    expect(isExpired({ expiresAt: expires }, expires)).toBe(true);
    expect(proposalSize({ a: "é" })).toBe(10);
    expect(proposalSize({ a: "é" })).toBeLessThan(MAX_PROPOSAL_BYTES);
  });
});
