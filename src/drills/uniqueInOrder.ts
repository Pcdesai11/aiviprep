import type { Drill } from "../types";
import { code } from "./code";

const left = { id: 1 };
const right = { id: 1 };

export const uniqueInOrder: Drill = {
  id: "unique-in-order",
  title: "Unique in order",
  mess: "Mutates its input",
  entry: "uniqueInOrder",
  entryKind: "function",
  prompt: [
    "The inbox builds a preview by collapsing consecutive duplicate notifications, then renders the original list under that preview. The preview text is right. The list under it comes back shorter.",
    "Collapse only consecutive duplicates. A value that shows up again later stays. Return a new array, and leave the array you were given alone.",
  ],
  rules: [
    "Compare items with ===.",
    "An empty list returns an empty list.",
    "[1, 2, 1] stays three items, because the 1s are not consecutive.",
  ],
  starter: code`
    function uniqueInOrder(items) {
      // Splicing avoids allocating a second list on the hot path.
      for (let i = 0; i < items.length; i++) {
        while (i + 1 < items.length && items[i] === items[i + 1]) {
          items.splice(i + 1, 1);
        }
      }
      return items;
    }
  `,
  solution: code`
    function uniqueInOrder(items) {
      const unique = [];
      for (const item of items) {
        if (unique.length === 0 || unique[unique.length - 1] !== item) {
          unique.push(item);
        }
      }
      return unique;
    }
  `,
  annotations: [
    {
      title: "The result is right, and the caller still loses data",
      body: "The splice loop does collapse consecutive duplicates, which is why a test that only checks the return value passes. splice writes into the array the caller still holds, and returning items hands that same reference back.",
    },
    {
      title: "Copying first is a fix; a new list is clearer",
      body: "items = items.slice() before the loop would protect the caller. Building a new array makes the contract obvious: the function never writes through the argument.",
    },
    {
      title: "Equality is reference equality",
      body: "=== collapses consecutive objects only when they are the same reference. Two distinct objects with the same fields both stay.",
    },
  ],
  tests: [
    {
      id: "runs",
      name: "collapses consecutive numbers",
      visible: true,
      kind: "call",
      args: [[1, 1, 2, 2, 3]],
      expected: [1, 2, 3],
    },
    {
      id: "later",
      name: "keeps a value that appears again later",
      visible: true,
      kind: "call",
      args: [["a", "b", "b", "a"]],
      expected: ["a", "b", "a"],
    },
    {
      id: "preserve",
      name: "does not rewrite the caller's array",
      visible: true,
      kind: "call",
      args: [[1, 1, 2]],
      preserveArgs: [0],
      expected: [1, 2],
    },
    {
      id: "empty",
      name: "empty list stays empty",
      visible: false,
      kind: "call",
      args: [[]],
      preserveArgs: [0],
      expected: [],
    },
    {
      id: "all-same",
      name: "collapses a run of identical values without editing the input",
      visible: false,
      kind: "call",
      args: [[7, 7, 7]],
      preserveArgs: [0],
      expected: [7],
    },
    {
      id: "objects",
      name: "distinct objects stay, even when their fields match",
      visible: false,
      kind: "call",
      args: [[left, right]],
      expected: [left, right],
    },
  ],
};
