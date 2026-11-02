import type { Drill } from "../types";
import { code } from "./code";

export const applyTransfers: Drill = {
  id: "apply-transfers",
  title: "Apply transfers",
  mess: "Misleading name",
  entry: "applyTransfers",
  entryKind: "function",
  prompt: [
    "Each transfer is { from, to, amount } in cents. The amount leaves from and arrives in to. An account missing from the opening balances starts at 0.",
    "Review approved this. creditAccount is increased, debitAccount is decreased, and the comment above those lines says the same thing. Yesterday every payment posted in the wrong direction.",
  ],
  rules: [
    "Return a new balances object and leave the one you were given unchanged.",
    "Amounts are non-negative integers.",
    "A transfer followed by its exact reverse lands back on the opening balances.",
  ],
  starter: code`
    function applyTransfers(balances, transfers) {
      const next = { ...balances };
      for (const transfer of transfers) {
        // creditAccount receives the funds. debitAccount sends them.
        const creditAccount = transfer.from;
        const debitAccount = transfer.to;
        next[creditAccount] = (next[creditAccount] ?? 0) + transfer.amount;
        next[debitAccount] = (next[debitAccount] ?? 0) - transfer.amount;
      }
      return next;
    }
  `,
  solution: code`
    function applyTransfers(balances, transfers) {
      const next = { ...balances };
      for (const transfer of transfers) {
        const from = transfer.from;
        const to = transfer.to;
        next[from] = (next[from] ?? 0) - transfer.amount;
        next[to] = (next[to] ?? 0) + transfer.amount;
      }
      return next;
    }
  `,
  annotations: [
    {
      title: "The names, the comment, and the arithmetic all agree",
      body: "creditAccount is increased and debitAccount is decreased. That matches the comment. The mistake is the binding above the arithmetic: transfer.from is the account that pays, and it was stored in creditAccount.",
    },
    {
      title: "A round trip hides it",
      body: "Reverse a reversed transfer and the two errors cancel. A payment out and the matching refund land on the original balances either way. One transfer, traced on paper, does not: A should end lower, and in the starter A ends higher.",
    },
    {
      title: "The copy is fine",
      body: "The shallow copy already protects the caller's object. The bug is the direction of the money, including an account that did not exist yet and should appear with a positive balance.",
    },
  ],
  tests: [
    {
      id: "none",
      name: "no transfers returns the same balances",
      visible: true,
      kind: "call",
      args: [{ A: 50 }, []],
      expected: { A: 50 },
    },
    {
      id: "one-way",
      name: "moves 10 cents from A to B",
      visible: true,
      kind: "call",
      args: [{ A: 100, B: 40 }, [{ from: "A", to: "B", amount: 10 }]],
      expected: { A: 90, B: 50 },
    },
    {
      id: "round-trip",
      name: "a payment and its refund restore the opening balances",
      visible: true,
      kind: "call",
      args: [
        { A: 100, B: 100 },
        [
          { from: "A", to: "B", amount: 25 },
          { from: "B", to: "A", amount: 25 },
        ],
      ],
      expected: { A: 100, B: 100 },
    },
    {
      id: "new-account",
      name: "creates the destination account from zero",
      visible: false,
      kind: "call",
      args: [{ A: 20 }, [{ from: "A", to: "C", amount: 5 }]],
      expected: { A: 15, C: 5 },
    },
    {
      id: "chain",
      name: "applies a chain of two transfers",
      visible: false,
      kind: "call",
      args: [
        { A: 30, B: 10, C: 1 },
        [
          { from: "A", to: "B", amount: 10 },
          { from: "B", to: "C", amount: 4 },
        ],
      ],
      expected: { A: 20, B: 16, C: 5 },
    },
    {
      id: "frozen",
      name: "does not change the balances it was given",
      visible: false,
      kind: "call",
      args: [
        { A: 80, B: 20 },
        [
          { from: "A", to: "B", amount: 15 },
          { from: "B", to: "A", amount: 15 },
        ],
      ],
      freezeArgs: [0, 1],
      expected: { A: 80, B: 20 },
    },
  ],
};
