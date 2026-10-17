import assert from "node:assert/strict";
import test from "node:test";
import { buildCycle, createSeed, removeSubject, replaceCycle } from "@meu-edital/domain";
import { fromRemote, settingsRow, tables } from "../src/global/store/remoteSchema";
import { diffData } from "../src/global/store/sync";
import { formatDuration, formatShortDate } from "../src/global/utils/formatDuration";
import { normalizeText } from "../src/global/utils/normalizeText";

const userId = "user-1";

test("primeira sincronização grava tudo com pais antes dos filhos", () => {
  const data = createSeed();
  data.topics.push({
    id: "0-sub",
    subjectId: data.subjects[0].id,
    parentId: data.topics[0].id,
    name: "Subassunto",
    studied: false,
  });
  const ops = diffData(null, data, userId);
  assert.deepEqual(
    ops.map((op) => (op.kind === "settings" ? "settings" : op.table)),
    ["exams", "subjects", "topics", "cycle_items", "settings"],
  );
  const topics = ops.find((op) => op.kind === "upsert" && op.table === "topics");
  const ids = topics?.kind === "upsert" ? topics.rows.map((row) => row.id) : [];
  assert.ok(ids.indexOf(data.topics[0].id) < ids.indexOf("0-sub"));
});

test("só envia o que mudou e exclui filhos antes dos pais", () => {
  const before = createSeed();
  const examId = before.activeExamId!;
  assert.equal(diffData(before, before, userId).length, 0);
  const after = replaceCycle(
    removeSubject(before, before.subjects[0].id),
    examId,
    buildCycle(removeSubject(before, before.subjects[0].id), examId),
  );
  const ops = diffData(before, after, userId);
  const deletes = ops.filter((op) => op.kind === "delete").map((op) => op.kind === "delete" && op.table);
  assert.deepEqual(deletes, ["cycle_items", "topics", "subjects"]);
  assert.ok(ops.some((op) => op.kind === "upsert" && op.table === "cycle_items"));
  assert.ok(!ops.some((op) => op.kind === "upsert" && op.table === "subjects"));
});

test("converte linhas do banco de volta para o modelo do app", () => {
  const data = createSeed();
  data.exams[0].board = undefined;
  const rows = Object.fromEntries(
    tables.map((table) => [table.name, table.rows(data).map(table.toRow)]),
  ) as Parameters<typeof fromRemote>[0];
  const restored = fromRemote(rows, settingsRow(data, userId));
  // Comparação via JSON: campos ausentes e `undefined` são equivalentes no cache.
  const plain = (value: unknown) => JSON.parse(JSON.stringify(value));
  assert.deepEqual(plain(restored), plain(data));
});

test("formata durações e datas curtas", () => {
  assert.equal(formatDuration(45), "45min");
  assert.equal(formatDuration(150), "2h30");
  assert.equal(formatDuration(120), "2h");
  assert.equal(formatShortDate("2026-09-21"), "21 set");
  assert.equal(normalizeText(" Matemática ").trim(), "matematica");
});
