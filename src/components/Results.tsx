import type { TestCase, TestResult } from "../types";

type ResultsProps = {
  tests: TestCase[];
  results: TestResult[] | null;
  stale: boolean;
};

export function formatValue(value: unknown): string {
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "string") return JSON.stringify(value);
  try {
    return JSON.stringify(value, null, 2) ?? "undefined";
  } catch {
    return String(value);
  }
}

function formatInline(value: unknown): string {
  if (typeof value === "undefined") return "undefined";
  try {
    const text = JSON.stringify(value);
    return text ?? "undefined";
  } catch {
    return String(value);
  }
}

function isShort(value: unknown): boolean {
  return formatInline(value).length <= 72;
}

function isStructured(value: unknown): boolean {
  return typeof value === "object" && value !== null;
}

export function Results({ tests, results, stale }: ResultsProps) {
  const hidden = tests.filter((test) => !test.visible).length;
  const visible = tests.length - hidden;
  const byId = new Map(results?.map((result) => [result.id, result]));
  const passed = results?.filter((result) => result.pass).length ?? 0;
  const hiddenFailed = results?.filter((result) => !result.visible && !result.pass).length ?? 0;

  return (
    <section className="results" aria-live="polite">
      <div className="section-head">
        <h2>Tests</h2>
        {results ? (
          <p>
            {passed} of {results.length} passed
            {hiddenFailed > 0
              ? ` · ${hiddenFailed} hidden ${hiddenFailed === 1 ? "test" : "tests"} failed`
              : ""}
          </p>
        ) : (
          <p>
            {visible} visible · {hidden} hidden until you run
          </p>
        )}
      </div>
      {stale ? <p className="stale">Edited since this run.</p> : null}
      <ul className="test-list">
        {tests.map((test, index) => {
          const result = byId.get(test.id);
          const revealedName = result ? result.name : test.visible ? test.name : "Hidden test";
          return (
            <li key={test.id} className={result ? (result.pass ? "test pass" : "test fail") : "test idle"}>
              <div className="test-head">
                <span className="status">
                  {result ? (result.pass ? "Passed" : "Failed") : "Not run"}
                </span>
                <span className="test-name">{revealedName}</span>
                {!test.visible && !result ? <span className="lock">Hidden</span> : null}
                {!test.visible && result ? <span className="lock">Was hidden</span> : null}
                <span className="sr-only">Test {index + 1}</span>
              </div>
              {result ? <ResultBody result={result} /> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ResultBody({ result }: { result: TestResult }) {
  if (result.error) {
    return (
      <div className="result-body">
        <p className="error-line">{result.error}</p>
        <Pair label="Expected" value={result.expected} />
      </div>
    );
  }

  const compact =
    result.pass &&
    !isStructured(result.actual) &&
    !isStructured(result.expected) &&
    isShort(result.actual) &&
    isShort(result.expected);

  if (compact) {
    return (
      <p className="match">
        <span>Actual {formatInline(result.actual)}</span>
        <span>Expected {formatInline(result.expected)}</span>
      </p>
    );
  }

  return (
    <div className="result-body">
      {result.argumentNote ? <p className="note">{result.argumentNote}</p> : null}
      {result.returnMatched && result.argumentNote ? (
        <p className="quiet">Return value matched.</p>
      ) : (
        <div className="pair">
          <Pair label="Actual" value={result.actual} />
          <Pair label="Expected" value={result.expected} />
        </div>
      )}
      {result.argumentNote ? (
        <div className="pair">
          <Pair label="Argument after the call" value={result.argumentActual} />
          <Pair label="Argument before the call" value={result.argumentExpected} />
        </div>
      ) : null}
    </div>
  );
}

function Pair({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="pair-label">{label}</p>
      <pre>{formatValue(value)}</pre>
    </div>
  );
}
