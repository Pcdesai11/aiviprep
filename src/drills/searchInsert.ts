import type { Drill } from "../types";
import { code } from "./code";

export const searchInsert: Drill = {
  id: "search-insert",
  title: "Search insert position",
  mess: "Off-by-one",
  entry: "searchInsert",
  entryKind: "function",
  prompt: [
    "Support keeps a sorted list of released build numbers. Given that list and a build, return the index where it already sits, or the index where it should be inserted so the list stays sorted.",
    "The previous candidate rewrote the binary search after it hung. A few values that are already in the list come back right. Missing values, and anything that belongs at either end, do not.",
  ],
  rules: [
    "nums is sorted ascending and has no duplicates.",
    "An empty list returns 0.",
    "Keep the search binary.",
  ],
  starter: code`
    function searchInsert(nums, target) {
      // Right bound is exclusive so the insert index can be nums.length.
      // <= keeps a match from ending one step early.
      let lo = 0;
      let hi = nums.length;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (nums[mid] <= target) {
          lo = mid + 1;
        } else {
          hi = mid;
        }
      }
      return lo - 1;
    }
  `,
  solution: code`
    function searchInsert(nums, target) {
      let lo = 0;
      let hi = nums.length;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (nums[mid] < target) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    }
  `,
  annotations: [
    {
      title: "The comparison steps past a match",
      body: "nums[mid] <= target treats a found build like a value that belongs to its right, so lo moves one past the match. A lower-bound search moves right only when nums[mid] < target.",
    },
    {
      title: "Subtracting one does not repair it",
      body: "return lo - 1 undoes that extra step only in some of the cases where the target is present. Inserting before the first element returns -1. Inserting after the last element returns length - 1. An empty list returns -1 instead of 0.",
    },
    {
      title: "The comment describes the other algorithm",
      body: "The note above the loop is a real description of a lower-bound search. The comparison does the opposite. The samples that happen to pass are the ones where the extra step and the subtracted one cancel out.",
    },
  ],
  tests: [
    {
      id: "present-middle",
      name: "finds a build in the middle",
      visible: true,
      kind: "call",
      args: [[1, 3, 5, 6], 5],
      expected: 2,
    },
    {
      id: "present-end",
      name: "finds the last build",
      visible: true,
      kind: "call",
      args: [[1, 3, 5, 6], 6],
      expected: 3,
    },
    {
      id: "gap",
      name: "inserts in a gap",
      visible: true,
      kind: "call",
      args: [[1, 3, 5, 6], 2],
      expected: 1,
    },
    {
      id: "after-end",
      name: "inserts after the last build",
      visible: true,
      kind: "call",
      args: [[1, 3, 5, 6], 7],
      expected: 4,
    },
    {
      id: "before-start",
      name: "inserts before the first build",
      visible: true,
      kind: "call",
      args: [[1, 3, 5, 6], 0],
      expected: 0,
    },
    {
      id: "empty",
      name: "empty list returns 0",
      visible: false,
      kind: "call",
      args: [[], 3],
      expected: 0,
    },
    {
      id: "single-after",
      name: "inserts after the only build",
      visible: false,
      kind: "call",
      args: [[8], 9],
      expected: 1,
    },
    {
      id: "single-present",
      name: "finds the only build",
      visible: false,
      kind: "call",
      args: [[8], 8],
      expected: 0,
    },
  ],
};
