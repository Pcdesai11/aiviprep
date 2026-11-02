import type { Drill } from "../types";
import { code } from "./code";

export const encodeRuns: Drill = {
  id: "encode-runs",
  title: "Encode runs",
  mess: "Broken edge case",
  entry: "encodeRuns",
  entryKind: "function",
  prompt: [
    "Status pages store a stream of characters as runs. aaabbc becomes a3b2c1: the character, then how many times it repeats in a row, including a run of one. An empty stream stays an empty string.",
    "The middle of a long line looks right. Whatever run is still open when the line ends never gets written.",
  ],
  rules: [
    "Counts are decimal, with no padding.",
    "A run of 10 or more is still one character plus the digits of the count.",
    "An empty string returns an empty string.",
  ],
  starter: code`
    function encodeRuns(stream) {
      let encoded = "";
      let count = 1;
      for (let i = 1; i < stream.length; i++) {
        if (stream[i] === stream[i - 1]) {
          count += 1;
        } else {
          encoded += stream[i - 1] + String(count);
          count = 1;
        }
      }
      return encoded;
    }
  `,
  solution: code`
    function encodeRuns(stream) {
      if (stream.length === 0) return "";
      let encoded = "";
      let count = 1;
      for (let i = 1; i < stream.length; i++) {
        if (stream[i] === stream[i - 1]) {
          count += 1;
        } else {
          encoded += stream[i - 1] + String(count);
          count = 1;
        }
      }
      encoded += stream[stream.length - 1] + String(count);
      return encoded;
    }
  `,
  annotations: [
    {
      title: "A run is written only when the next character differs",
      body: "The loop flushes the previous character when it sees a change. The last run has nothing after it, so it is never appended. aaabbc becomes a3b2, and the final c is dropped.",
    },
    {
      title: "A stream with one run never enters the else",
      body: "aaa only increments count. A single character never enters the loop. Both come back as an empty string. The empty input is the case that already works, because there is no open run to forget.",
    },
    {
      title: "Flush once after the loop",
      body: "After the loop, the last character and its count are still sitting in local variables. Write them the same way a change of character does. Guard the empty string first so there is a last character to read.",
    },
  ],
  tests: [
    {
      id: "empty",
      name: "empty stream stays empty",
      visible: true,
      kind: "call",
      args: [""],
      expected: "",
    },
    {
      id: "sample",
      name: "encodes aaabbc",
      visible: true,
      kind: "call",
      args: ["aaabbc"],
      expected: "a3b2c1",
    },
    {
      id: "singles",
      name: "encodes a run of one",
      visible: true,
      kind: "call",
      args: ["abc"],
      expected: "a1b1c1",
    },
    {
      id: "one-run",
      name: "encodes a stream that never changes character",
      visible: true,
      kind: "call",
      args: ["aaa"],
      expected: "a3",
    },
    {
      id: "one-char",
      name: "encodes a single character",
      visible: false,
      kind: "call",
      args: ["a"],
      expected: "a1",
    },
    {
      id: "tail",
      name: "writes the run that closes the stream",
      visible: false,
      kind: "call",
      args: ["abba"],
      expected: "a1b2a1",
    },
    {
      id: "long",
      name: "writes a run of 12 without padding",
      visible: false,
      kind: "call",
      args: ["a".repeat(12)],
      expected: "a12",
    },
  ],
};
