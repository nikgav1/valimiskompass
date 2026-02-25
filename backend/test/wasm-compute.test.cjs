const test = require("node:test");
const assert = require("node:assert/strict");
const wasm = require("../../wasm/pkg");

test("compute_matches returns expected percentages for sample data", () => {
  const answers = [1, 0, -1, 0.5];
  const politicians = [
    {
      party: "Aligned Party",
      name: "Alice",
      candidateNumber: "101",
      positions: [1, 0, -1, 0.5],
    },
    {
      party: "Opposite Party",
      name: "Bob",
      candidateNumber: "202",
      positions: [-1, 0, 1, -0.5],
    },
    {
      party: "No Data Party",
      name: "Charlie",
      candidateNumber: "303",
      positions: [null, null, null, null],
    },
  ];

  const raw = wasm.compute_matches(
    JSON.stringify(answers),
    JSON.stringify(politicians),
    answers.length
  );
  const result = JSON.parse(raw);

  assert.equal(result["101"].percent, 100);
  assert.equal(result["202"].percent, 0);
  assert.equal(result["303"].percent, null);
});
