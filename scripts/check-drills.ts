import { drills } from "../src/drills/index";
import { execute } from "../src/runner/execute";

const mustPass: Record<string, string[]> = {
  "search-insert": ["present-middle", "present-end", "single-present"],
  "unique-in-order": ["runs", "later", "empty", "objects"],
  "apply-transfers": ["none", "round-trip", "frozen"],
  "group-anagrams": ["sample", "empty"],
  "encode-runs": ["empty"],
  "cart-checkout": ["under", "exact"],
};

const mustFail: Record<string, string[]> = {
  "search-insert": ["gap", "after-end", "before-start", "empty", "single-after"],
  "unique-in-order": ["preserve", "all-same"],
  "apply-transfers": ["one-way", "new-account", "chain"],
  "group-anagrams": ["singles", "prefix", "collision"],
  "encode-runs": ["sample", "singles", "one-run", "one-char", "tail", "long"],
  "cart-checkout": ["tax-shipping", "coupon", "empty", "full-coupon"],
};

const messes = new Set([
  "Off-by-one",
  "Mutates its input",
  "Misleading name",
  "Dead code",
  "Broken edge case",
  "Mixed concerns",
]);

let failed = 0;

function fail(message: string) {
  console.error(message);
  failed += 1;
}

if (drills.length < 6) fail(`expected at least 6 drills, found ${drills.length}`);

const seenMess = new Set(drills.map((drill) => drill.mess));
for (const mess of messes) {
  if (!seenMess.has(mess)) fail(`missing mess: ${mess}`);
}

const ids = new Set<string>();
for (const drill of drills) {
  if (ids.has(drill.id)) fail(`duplicate id ${drill.id}`);
  ids.add(drill.id);
  if (drill.starter.trim() === drill.solution.trim()) fail(`${drill.id} starter matches solution`);
  const hidden = drill.tests.filter((test) => !test.visible);
  if (hidden.length < 1) fail(`${drill.id} has no hidden test`);

  let starter;
  let solution;
  try {
    starter = execute(drill.starter, drill.entry, drill.entryKind, drill.tests);
  } catch (error) {
    fail(`${drill.id} starter threw: ${error instanceof Error ? error.message : error}`);
    continue;
  }
  try {
    solution = execute(drill.solution, drill.entry, drill.entryKind, drill.tests);
  } catch (error) {
    fail(`${drill.id} solution threw: ${error instanceof Error ? error.message : error}`);
    continue;
  }

  const starterById = new Map(starter.map((result) => [result.id, result]));
  const solutionFails = solution.filter((result) => !result.pass);
  if (solutionFails.length > 0) {
    fail(
      `${drill.id} solution failed ${solutionFails
        .map((result) => `${result.id} actual=${JSON.stringify(result.actual)} error=${result.error ?? ""}`)
        .join("; ")}`,
    );
  }

  for (const id of mustPass[drill.id] ?? []) {
    const result = starterById.get(id);
    if (!result?.pass) {
      fail(
        `${drill.id} starter should pass ${id} actual=${JSON.stringify(result?.actual)} error=${result?.error ?? ""}`,
      );
    }
  }
  for (const id of mustFail[drill.id] ?? []) {
    const result = starterById.get(id);
    if (!result || result.pass) fail(`${drill.id} starter should fail ${id}`);
  }

  const visible = starter.filter((result) => result.visible);
  const visiblePass = visible.filter((result) => result.pass).length;
  const visibleFail = visible.length - visiblePass;
  if (visiblePass < 1 || visibleFail < 1) {
    fail(`${drill.id} visible results pass=${visiblePass} fail=${visibleFail}`);
  }

  console.log(
    `${drill.title}: starter ${visiblePass} passed / ${visibleFail} failed visible; solution ${
      solutionFails.length === 0 ? "ok" : "FAILED"
    }`,
  );
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log("\nAll drills behave as designed.");
