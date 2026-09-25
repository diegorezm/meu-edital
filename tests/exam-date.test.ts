import assert from "node:assert/strict";
import test from "node:test";
import {
  displayExamDate,
  formatExamDateInput,
  parseExamDate,
} from "../src/features/concursos/utils/examDate";

test("formata a data exibida e preserva o formato salvo", () => {
  assert.equal(displayExamDate("2028-02-29"), "29/02/2028");
  assert.equal(parseExamDate("29/02/2028"), "2028-02-29");
  assert.equal(parseExamDate(""), "");
});

test("rejeita datas inexistentes e formata os dígitos digitados", () => {
  assert.equal(parseExamDate("29/02/2027"), null);
  assert.equal(parseExamDate("31/04/2027"), null);
  assert.equal(parseExamDate("1/1/2027"), null);
  assert.equal(formatExamDateInput("29022028"), "29/02/2028");
});
