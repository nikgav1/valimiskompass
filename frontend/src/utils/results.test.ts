import { describe, expect, it } from "vitest";
import { sortMatches, toResultArray } from "./results";

describe("results utils", () => {
  it("normalizes backend object results into an array", () => {
    const raw = {
      "101": {
        party: "A",
        name: "Alice",
        candidateNumber: "101",
        percent: 88.5,
      },
      "202": {
        party: "B",
        name: "Bob",
        candidateNumber: "202",
        percent: 62.25,
      },
    };

    const result = toResultArray(raw);
    expect(result).toHaveLength(2);
    expect(result?.map((x) => x.candidateNumber).sort()).toEqual(["101", "202"]);
  });

  it("sorts matches by percent for both UI sort orders", () => {
    const matches = [
      { party: "A", name: "Alice", candidateNumber: "101", percent: 90 },
      { party: "B", name: "Bob", candidateNumber: "202", percent: 55 },
      { party: "C", name: "Charlie", candidateNumber: "303", percent: null },
    ];

    const desc = sortMatches(matches, "desc").map((m) => m.candidateNumber);
    const asc = sortMatches(matches, "asc").map((m) => m.candidateNumber);

    expect(desc).toEqual(["101", "202", "303"]);
    expect(asc).toEqual(["303", "202", "101"]);
  });
});
