export type EntryKind = "function" | "class";

export type CallTest = {
  id: string;
  name: string;
  visible: boolean;
  expected: unknown;
  kind: "call";
  args: unknown[];
  /** Arg indexes that must still deep-equal their original values after the call. */
  preserveArgs?: number[];
  /** Arg indexes frozen before the call so a write throws in strict mode. */
  freezeArgs?: number[];
};

export type ClassCall = {
  method: string;
  args: unknown[];
};

export type ClassTest = {
  id: string;
  name: string;
  visible: boolean;
  expected: unknown;
  kind: "class";
  calls: ClassCall[];
};

export type TestCase = CallTest | ClassTest;

export type Annotation = {
  title: string;
  body: string;
};

export type Drill = {
  id: string;
  title: string;
  mess: string;
  entry: string;
  entryKind: EntryKind;
  prompt: string[];
  rules: string[];
  starter: string;
  solution: string;
  annotations: Annotation[];
  tests: TestCase[];
};

export type TestResult = {
  id: string;
  name: string;
  visible: boolean;
  pass: boolean;
  expected: unknown;
  actual?: unknown;
  returnMatched?: boolean;
  error?: string;
  argumentNote?: string;
  argumentActual?: unknown;
  argumentExpected?: unknown;
};

export type RunRequest = {
  id: number;
  code: string;
  entry: string;
  entryKind: EntryKind;
  tests: TestCase[];
};
