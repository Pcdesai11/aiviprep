import { deepEqual } from "./deepEqual";
import type { EntryKind, TestCase, TestResult } from "../types";

const ENTRY_NAME = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const MAX_SOURCE_CHARS = 30_000;

/**
 * Run a drill's source against its tests.
 * This uses `new Function` and is imported only by the web worker and the
 * local check script — never by the page's main thread.
 */
export function execute(
  code: string,
  entry: string,
  entryKind: EntryKind,
  tests: TestCase[],
): TestResult[] {
  if (!ENTRY_NAME.test(entry)) {
    throw new Error("Invalid entry name.");
  }
  if (code.length > MAX_SOURCE_CHARS) {
    throw new Error("That file is too large for this runner (30,000 characters).");
  }

  let exported: unknown;
  try {
    const runner = new Function(
      "postMessage",
      "onmessage",
      "addEventListener",
      "removeEventListener",
      "close",
      "importScripts",
      `"use strict";\n${code}\nreturn typeof ${entry} === "undefined" ? undefined : ${entry};`,
    );
    exported = runner();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(message);
  }

  if (typeof exported !== "function") {
    const noun = entryKind === "class" ? "a class" : "a function";
    throw new Error(`Define ${noun} named ${entry}.`);
  }

  return tests.map((test) =>
    runTest(exported as (...args: unknown[]) => unknown, test),
  );
}

function runTest(
  exported: (...args: unknown[]) => unknown,
  test: TestCase,
): TestResult {
  const base = {
    id: test.id,
    name: test.name,
    visible: test.visible,
    expected: test.expected,
  };

  try {
    if (test.kind === "class") {
      const Ctor = exported as unknown as new () => Record<string, unknown>;
      const instance = new Ctor();
      let returned: unknown;
      for (const call of test.calls) {
        const method = instance[call.method];
        if (typeof method !== "function") {
          throw new Error(`Missing ${call.method}().`);
        }
        const args = call.args.map((arg) => structuredClone(arg));
        returned = (method as (...args: unknown[]) => unknown).apply(instance, args);
      }
      return {
        ...base,
        pass: deepEqual(returned, test.expected),
        actual: returned,
        returnMatched: deepEqual(returned, test.expected),
      };
    }

    const args = test.args.map((arg) => structuredClone(arg));
    if (test.freezeArgs) {
      for (const index of test.freezeArgs) deepFreeze(args[index]);
    }
    const returned = exported(...args);
    const returnMatched = deepEqual(returned, test.expected);

    let argumentNote: string | undefined;
    let argumentActual: unknown;
    let argumentExpected: unknown;
    if (test.preserveArgs) {
      for (const index of test.preserveArgs) {
        if (!deepEqual(args[index], test.args[index])) {
          argumentNote = "The call changed an argument the caller still needed.";
          argumentActual = args[index];
          argumentExpected = test.args[index];
          break;
        }
      }
    }

    return {
      ...base,
      pass: returnMatched && argumentNote === undefined,
      actual: returned,
      returnMatched,
      argumentNote,
      argumentActual,
      argumentExpected,
    };
  } catch (error) {
    return {
      ...base,
      pass: false,
      returnMatched: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function deepFreeze(value: unknown): void {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return;
  Object.freeze(value);
  if (Array.isArray(value)) {
    for (const item of value) deepFreeze(item);
    return;
  }
  for (const key of Object.keys(value as Record<string, unknown>)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
}
