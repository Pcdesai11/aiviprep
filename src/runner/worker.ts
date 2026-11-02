import { execute } from "./execute";
import type { RunRequest } from "../types";

type WorkerScope = {
  onmessage: ((event: MessageEvent<RunRequest>) => void) | null;
  postMessage: (message: unknown) => void;
};

const scope = self as unknown as WorkerScope;

scope.postMessage({ id: 0, ready: true });

scope.onmessage = (event) => {
  const { id, code, entry, entryKind, tests } = event.data;
  try {
    const results = execute(code, entry, entryKind, tests);
    scope.postMessage({ id, ok: true, results });
  } catch (error) {
    scope.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
