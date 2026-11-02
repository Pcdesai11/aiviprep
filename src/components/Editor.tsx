import { useEffect, useRef, type KeyboardEvent } from "react";

type EditorProps = {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
};

export function Editor({ value, onChange, onRun }: EditorProps) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLPreElement>(null);
  const cursor = useRef<number | null>(null);
  const lineCount = value.split("\n").length;

  useEffect(() => {
    const text = textRef.current;
    const gutter = gutterRef.current;
    if (!text || !gutter) return;
    gutter.scrollTop = text.scrollTop;
    if (cursor.current === null) return;
    text.selectionStart = cursor.current;
    text.selectionEnd = cursor.current;
    cursor.current = null;
  }, [value]);

  function syncScroll() {
    const text = textRef.current;
    const gutter = gutterRef.current;
    if (!text || !gutter) return;
    gutter.scrollTop = text.scrollTop;
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      onRun();
      return;
    }
    if (event.key !== "Tab") return;
    event.preventDefault();
    const element = event.currentTarget;
    const start = element.selectionStart;
    const end = element.selectionEnd;

    if (event.shiftKey) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const removed = value.slice(lineStart, start).match(/ {1,2}$/)?.[0].length ?? 0;
      if (removed === 0) return;
      cursor.current = start - removed;
      onChange(value.slice(0, start - removed) + value.slice(end));
      return;
    }

    cursor.current = start + 2;
    onChange(value.slice(0, start) + "  " + value.slice(end));
  }

  return (
    <div className="editor">
      <pre ref={gutterRef} className="gutter" aria-hidden="true">
        {Array.from({ length: lineCount }, (_, index) => String(index + 1)).join("\n")}
      </pre>
      <textarea
        ref={textRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        onScroll={syncScroll}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
        aria-label="Code editor"
      />
    </div>
  );
}
