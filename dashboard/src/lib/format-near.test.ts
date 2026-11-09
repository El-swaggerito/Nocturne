import { describe, expect, it } from "vitest";

import { parseNearToYoctoNear } from "./format-near";

describe("parseNearToYoctoNear", () => {
  it.each([
    ["1", "1000000000000000000000000"],
    ["0.1", "100000000000000000000000"],
    ["10.5", "10500000000000000000000000"],
    [
      "1.000000000000000000000001",
      "1000000000000000000000001",
    ],
    [
      "0.000000000000000000000001",
      "1",
    ],
  ])("converts %s exactly", (input, expected) => {
    expect(parseNearToYoctoNear(input)).toBe(expected);
  });

  it.each([
    "",
    "0",
    "-1",
    "1.0000000000000000000000001",
    "1e3",
    "1,000",
    ".5",
    "01",
  ])("rejects invalid amount %s", (input) => {
    expect(() => parseNearToYoctoNear(input)).toThrow();
  });
});
