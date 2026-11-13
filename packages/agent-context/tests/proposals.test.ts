import { describe, expect, it } from "vitest";
import { createSeed, subjectWeight } from "@meu-edital/domain";
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

  it("expira em 7 dias e mede o tamanho", () => {
    const created = Date.UTC(2026, 10, 12);
    const expires = proposalExpiry(created);
    expect(isExpired({ expiresAt: expires }, expires - 1)).toBe(false);
    expect(isExpired({ expiresAt: expires }, expires)).toBe(true);
    expect(proposalSize({ a: "é" })).toBe(10);
    expect(proposalSize({ a: "é" })).toBeLessThan(MAX_PROPOSAL_BYTES);
  });
});
