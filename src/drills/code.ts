/** Dedent a starter or solution so the drill files can stay indented. */
export function code(strings: TemplateStringsArray, ...values: unknown[]): string {
  if (values.length > 0) {
    throw new Error("Drill source templates do not interpolate.");
  }
  const raw = strings.raw[0].replace(/^\n/, "").replace(/\s*$/, "");
  const lines = raw.split("\n");
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^[ \t]*/)?.[0].length ?? 0);
  const min = indents.length > 0 ? Math.min(...indents) : 0;
  return lines.map((line) => (line.length >= min ? line.slice(min) : line.trimStart())).join("\n");
}
