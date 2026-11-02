import type { EntryKind, TestCase, TestResult } from "../types";

export type RunResponse =
  | { ok: true; results: TestResult[] }
  | { ok: false; error: string; timedOut?: boolean; cancelled?: boolean };

export type Runner = {
  run: (request: {
    code: string;
    entry: string;
    entryKind: EntryKind;
    tests: TestCase[];
  }) => Promise<RunResponse>;
  cancel: () => void;
  dispose: () => void;
};

const TIMEOUT_MS = 1000;
const STARTUP_MS = 8000;

const CANCELLED: RunResponse = { ok: false, cancelled: true, error: "Cancelled." };

type Pending = {
  resolve: (value: RunResponse) => void;
  timer: number;
};

type Waiter = {
  start: () => void;
  fail: (response: RunResponse) => void;
};

/**
 * Keeps one warm worker. Each run posts the student's code into that worker.
 * If the worker does not answer within a second, it is terminated so a tight
 * loop cannot freeze the page. Nothing here evaluates the student's code.
 */
export function createRunner(): Runner {
  let generation = 0;
  let ready = false;
  let disposed = false;
  let nextId = 1;
  const pending = new Map<number, Pending>();
  const waiters: Waiter[] = [];
  let worker = spawn();

  function spawn(): Worker {
    const next = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    next.onmessage = (event: MessageEvent<RunResponse & { id: number; ready?: boolean }>) => {
      if (next !== worker || disposed) return;
      if (event.data.ready) {
        ready = true;
        const queued = waiters.splice(0, waiters.length);
        for (const waiter of queued) waiter.start();
        return;
      }
      const job = pending.get(event.data.id);
      if (!job) return;
      window.clearTimeout(job.timer);
      pending.delete(event.data.id);
      if (event.data.ok) {
        job.resolve({ ok: true, results: event.data.results });
        return;
      }
      job.resolve({
        ok: false,
        error: event.data.error ?? "The runner failed.",
        timedOut: event.data.timedOut,
        cancelled: event.data.cancelled,
      });
    };
    next.onerror = (event) => {
      event.preventDefault();
      if (next !== worker || disposed) return;
      const message = event.message || "The runner failed to start.";
      const response: RunResponse = { ok: false, error: message };
      rejectPending(response);
      failWaiters(response);
    };
    return next;
  }

  function rejectPending(response: RunResponse) {
    for (const [id, job] of pending) {
      window.clearTimeout(job.timer);
      pending.delete(id);
      job.resolve(response);
    }
  }

  function restart() {
    ready = false;
    const previous = worker;
    worker = spawn();
    previous.terminate();
  }

  function failWaiters(response: RunResponse) {
    const queued = waiters.splice(0, waiters.length);
    for (const waiter of queued) waiter.fail(response);
  }

  return {
    run(request) {
      if (disposed) return Promise.resolve(CANCELLED);
      const myGeneration = generation;
      const id = nextId++;
      return new Promise((resolve) => {
        let opened = false;
        let startupTimer = 0;
        const waiter: Waiter = {
          start() {
            if (opened) return;
            opened = true;
            window.clearTimeout(startupTimer);
            if (disposed || myGeneration !== generation) {
              resolve(CANCELLED);
              return;
            }
            const timer = window.setTimeout(() => {
              if (!pending.has(id)) return;
              pending.delete(id);
              restart();
              resolve({
                ok: false,
                timedOut: true,
                error:
                  "Stopped after 1 second. The page is fine — the code is likely stuck in a loop.",
              });
            }, TIMEOUT_MS);
            pending.set(id, { resolve, timer });
            worker.postMessage({ id, ...request });
          },
          fail(response) {
            if (opened) return;
            opened = true;
            window.clearTimeout(startupTimer);
            const index = waiters.indexOf(waiter);
            if (index >= 0) waiters.splice(index, 1);
            resolve(response);
          },
        };
        startupTimer = window.setTimeout(() => {
          waiter.fail({ ok: false, error: "The runner didn't start." });
        }, STARTUP_MS);
        if (ready) waiter.start();
        else waiters.push(waiter);
      });
    },
    cancel() {
      generation += 1;
      rejectPending(CANCELLED);
      failWaiters(CANCELLED);
      if (!disposed) restart();
    },
    dispose() {
      disposed = true;
      generation += 1;
      rejectPending(CANCELLED);
      failWaiters(CANCELLED);
      worker.terminate();
    },
  };
}
