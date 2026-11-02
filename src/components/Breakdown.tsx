import type { Drill } from "../types";

type BreakdownProps = {
  drill: Drill;
  open: boolean;
  onToggle: () => void;
};

export function Breakdown({ drill, open, onToggle }: BreakdownProps) {
  return (
    <section className="breakdown-wrap">
      <button
        type="button"
        className="ghost reveal"
        aria-expanded={open}
        onClick={onToggle}
      >
        {open ? "Hide the breakdown" : "Show the breakdown"}
      </button>
      {open ? (
        <div className="breakdown" id="breakdown">
          <h2>What was wrong</h2>
          <ol className="notes">
            {drill.annotations.map((note) => (
              <li key={note.title}>
                <h3>{note.title}</h3>
                <p>{note.body}</p>
              </li>
            ))}
          </ol>
          <h2>Clean solution</h2>
          <pre className="solution">
            <code>{drill.solution}</code>
          </pre>
        </div>
      ) : null}
    </section>
  );
}
