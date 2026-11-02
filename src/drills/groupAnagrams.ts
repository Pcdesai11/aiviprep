import type { Drill } from "../types";
import { code } from "./code";

export const groupAnagrams: Drill = {
  id: "group-anagrams",
  title: "Group anagrams",
  mess: "Dead code",
  entry: "groupAnagrams",
  entryKind: "function",
  prompt: [
    "Group words that are anagrams of each other. A group appears at the moment its first word appears, and the words inside a group keep their original order.",
    "A frequency-count helper is still in the file. The path that actually runs builds a key by sorting characters. The sample from the ticket passes. Shorter words do not. Every character is a lowercase letter from a to z.",
  ],
  rules: [
    "Two words are anagrams when they use the same letters the same number of times.",
    "An empty list returns an empty list.",
    "A word is an anagram of itself, so it still appears, alone if nothing matches it.",
  ],
  starter: code`
    function groupAnagrams(words) {
      const groups = new Map();

      // Previous approach: pack a 26-letter count into a key.
      // Left in place in case sorted keys were too slow on long tokens.
      function countKey(word) {
        const counts = new Array(26).fill(0);
        for (const ch of word) {
          const code = ch.charCodeAt(0) - 97;
          if (code >= 0 && code < 26) counts[code] += 1;
        }
        return counts.join(",");
      }

      const retired = countKey;
      void retired;

      for (const word of words) {
        const chars = word.split("");
        chars.sort();
        // The last sorted character is redundant for lowercase anagrams.
        const key = chars.slice(0, -1).join("");
        const bucket = groups.get(key);
        if (bucket) bucket.push(word);
        else groups.set(key, [word]);
      }

      return Array.from(groups.values());
    }
  `,
  solution: code`
    function groupAnagrams(words) {
      const groups = new Map();
      for (const word of words) {
        const key = word.split("").sort().join("");
        const bucket = groups.get(key);
        if (bucket) bucket.push(word);
        else groups.set(key, [word]);
      }
      return Array.from(groups.values());
    }
  `,
  annotations: [
    {
      title: "The helper never runs",
      body: "countKey would have separated these words. Nothing in the live loop calls it. retired exists so the helper looks referenced. Deleting it does not fix the bug, and it does make the live path easier to read.",
    },
    {
      title: "The live key drops a character",
      body: "slice(0, -1) removes the last character of the sorted word. The comment calls that character redundant. It is not. \"a\" and \"b\" both become an empty key. \"abc\" and \"abd\" both become \"ab\".",
    },
    {
      title: "The ticket sample still passes",
      body: "eat, tea, tan, ate, nat, and bat do not collide once a character is removed, so the famous example stays green. A passing sample is not a proof that the key is the word.",
    },
  ],
  tests: [
    {
      id: "sample",
      name: "groups the ticket sample",
      visible: true,
      kind: "call",
      args: [["eat", "tea", "tan", "ate", "nat", "bat"]],
      expected: [
        ["eat", "tea", "ate"],
        ["tan", "nat"],
        ["bat"],
      ],
    },
    {
      id: "singles",
      name: "keeps single letters apart",
      visible: true,
      kind: "call",
      args: [["a", "b"]],
      expected: [["a"], ["b"]],
    },
    {
      id: "prefix",
      name: "does not merge words that only share a sorted prefix",
      visible: true,
      kind: "call",
      args: [["ab", "ba", "abc", "abd"]],
      expected: [["ab", "ba"], ["abc"], ["abd"]],
    },
    {
      id: "empty",
      name: "empty list returns an empty list",
      visible: false,
      kind: "call",
      args: [[]],
      expected: [],
    },
    {
      id: "collision",
      name: "separates ac / ca from ab",
      visible: false,
      kind: "call",
      args: [["ac", "ab", "ca"]],
      expected: [["ac", "ca"], ["ab"]],
    },
  ],
};
