import { describe, expect, it } from "vitest";
import { mapIndexToValue, valueToIndex } from "./answerScale";

describe("answerScale", () => {
  it("maps answer indices and values consistently", () => {
    expect(mapIndexToValue(0)).toBe(-1);
    expect(mapIndexToValue(4)).toBe(1);
    expect(mapIndexToValue(99)).toBe(0);

    expect(valueToIndex(-1)).toBe(0);
    expect(valueToIndex(0.5)).toBe(3);
    expect(valueToIndex(0.75)).toBeNull();
    expect(valueToIndex(null)).toBeNull();
  });
});
