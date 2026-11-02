import { useEffect, useRef, useState } from "react";
import { Breakdown } from "./components/Breakdown";
import { Editor } from "./components/Editor";
import { Results } from "./components/Results";
import { Timer } from "./components/Timer";
import { drills } from "./drills";
import { createRunner, type Runner } from "./runner/client";
import type { TestResult } from "./types";

const STORAGE_PREFIX = "aiviprep.draft.";

function storageKey(id: string): string {
  return `${STORAGE_PREFIX}${id}`;
}

function loadDraft(id: string, starter: string): string {
  try {
    const stored = sessionStorage.getItem(storageKey(id));
    return stored === null ? starter : stored;
  } catch {
    return starter;
  }
}

function persistDraft(id: string, starter: string, value: string) {
  try {
    if (value === starter) sessionStorage.removeItem(storageKey(id));
    else sessionStorage.setItem(storageKey(id), value);
  } catch {
    // Private mode and full storage can reject writes. The tab still works.
  }
}

export function App() {
  const [selectedId, setSelectedId] = useState(drills[0].id);
  const [codes, setCodes] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const drill of drills) initial[drill.id] = loadDraft(drill.id, drill.starter);
    return initial;
  });
  const [results, setResults] = useState<Record<string, TestResult[] | null>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [ranSource, setRanSource] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [runningId, setRunningId] = useState<string | null>(null);
  const runnerRef = useRef<Runner | null>(null);
  const tokenRef = useRef(0);

  const drill = drills.find((item) => item.id === selectedId) ?? drills[0];
  const code = codes[drill.id] ?? drill.starter;
  const drillResults = results[drill.id] ?? null;
  const error = errors[drill.id] ?? null;
  const running = runningId === drill.id;
  const stale = drillResults !== null && ranSource[drill.id] !== code;

  useEffect(() => {
    const runner = createRunner();
    runnerRef.current = runner;
    return () => {
      runner.dispose();
      if (runnerRef.current === runner) runnerRef.current = null;
    };
  }, []);

  useEffect(() => {
    document.title = `${drill.title} · AiviPrep`;
  }, [drill.title]);

  function updateCode(next: string) {
    setCodes((current) => ({ ...current, [drill.id]: next }));
    setErrors((current) => ({ ...current, [drill.id]: null }));
    persistDraft(drill.id, drill.starter, next);
  }

  function selectDrill(id: string) {
    if (id === selectedId) return;
    tokenRef.current += 1;
    runnerRef.current?.cancel();
    setRunningId(null);
    setSelectedId(id);
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(".rail button[aria-current='true']")
        ?.scrollIntoView({ inline: "nearest", block: "nearest" });
    });
  }

  function reset() {
    tokenRef.current += 1;
    runnerRef.current?.cancel();
    setRunningId(null);
    updateCode(drill.starter);
    setResults((current) => ({ ...current, [drill.id]: null }));
    setRanSource((current) => {
      const next = { ...current };
      delete next[drill.id];
      return next;
    });
  }

  async function run() {
    const runner = runnerRef.current;
    if (!runner || runningId) return;
    const token = ++tokenRef.current;
    const drillId = drill.id;
    const source = codes[drillId] ?? drill.starter;
    setRunningId(drillId);
    setErrors((current) => ({ ...current, [drillId]: null }));
    const response = await runner.run({
      code: source,
      entry: drill.entry,
      entryKind: drill.entryKind,
      tests: drill.tests,
    });
    if (token !== tokenRef.current) return;
    setRunningId(null);
    if (!response.ok) {
      if (response.cancelled) return;
      setErrors((current) => ({ ...current, [drillId]: response.error }));
      setResults((current) => ({ ...current, [drillId]: null }));
      return;
    }
    setResults((current) => ({ ...current, [drillId]: response.results }));
    setRanSource((current) => ({ ...current, [drillId]: source }));
  }

  return (
    <div className="sheet">
      <a className="skip" href="#drill">
        Skip to the drill
      </a>
      <header className="topbar">
        <div className="brand">
          <p className="wordmark">AiviPrep</p>
          <p className="tagline">Practice for interviews that hand you broken code.</p>
        </div>
        <Timer />
      </header>
      <div className="workspace">
        <nav className="rail" aria-label="Drills">
          <p className="rail-label">Drills</p>
          <ul>
            {drills.map((item) => {
              const edited = (codes[item.id] ?? item.starter) !== item.starter;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={item.id === drill.id ? "true" : undefined}
                    onClick={() => selectDrill(item.id)}
                  >
                    <span className="mess">{item.mess}</span>
                    <span className="drill-name">
                      {item.title}
                      {edited ? <span className="edited">Edited</span> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <main id="drill" className="main">
          <p className="kicker">{drill.mess}</p>
          <h1>{drill.title}</h1>
          <div className="prompt">
            {drill.prompt.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <ul className="rules">
            {drill.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <p className="entry">
            Define <code>{drill.entryKind === "class" ? `class ${drill.entry}` : drill.entry}</code>
            . The runner reads that name. Leave imports and exports out.
          </p>
          {error ? (
            <p className="banner" role="status">
              {error}
            </p>
          ) : null}
          <div className="toolbar">
            <p className="hint">Ctrl or ⌘ + Enter runs the tests. Tab inserts two spaces.</p>
            <div className="toolbar-actions">
              <button type="button" className="ghost" onClick={reset}>
                Reset starter
              </button>
              <button type="button" className="run" onClick={run} disabled={running}>
                {running ? "Running…" : "Run tests"}
              </button>
            </div>
          </div>
          <Editor value={code} onChange={updateCode} onRun={run} />
          <Results tests={drill.tests} results={drillResults} stale={stale} />
          <Breakdown
            drill={drill}
            open={revealed[drill.id] ?? false}
            onToggle={() =>
              setRevealed((current) => ({ ...current, [drill.id]: !current[drill.id] }))
            }
          />
        </main>
      </div>
    </div>
  );
}
