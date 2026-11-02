# AiviPrep

Practice the interview where you are handed messy code and asked to make it correct.

Companies already do this: a starter that almost works, a prompt that sounds reasonable, and tests that catch the part you trusted. AiviPrep is a small local app for that format. Six JavaScript drills ship with it. There is no account and no server. Your edits stay in the browser tab.

Repository: [github.com/Pcdesai11/aiviprep](https://github.com/Pcdesai11/aiviprep)

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the app on port 5173 |
| `npm run check` | Runs every starter and every solution against its tests |
| `npm run build` | Typechecks, then writes a static bundle to `dist/` |
| `npm run preview` | Serves that bundle on port 4173 |

## A session

1. Pick a drill. The list names the kind of mess, then the prompt gives you the job.
2. The editor opens on the starter. Some of it is plausible. Something in it is wrong.
3. Edit and run. Ctrl or ⌘ + Enter runs too. Tab inserts two spaces. Visible tests are named before you run. At least one test stays unnamed until you run.
4. After a run, each test shows passed or failed, with the actual value next to the expected value. A hidden test’s name appears then.
5. Show the breakdown when you want the review. It explains the starter and shows a clean solution. Your editor is left as you wrote it.
6. Reset starter throws away the edit for that drill. Until then, a refresh keeps the draft for the life of the tab.

A countdown sits in the header. It stays off until you turn it on, then you can start 15, 25, or 45 minutes. When it hits zero, the editor stays open. It is a personal timer, not a proctored mock interview.

## Dark mode

**Dark mode** in the header switches the page. **Light mode** switches it back. The choice is saved in this browser. Until you pick one, the app follows your system setting, including a change while the tab is open.

The wordmark, titles, and prompts use Fraunces. The rest of the interface uses Figtree. Code uses JetBrains Mono.

## Drills

| Drill | The mess | Entry |
| --- | --- | --- |
| Search insert position | Off-by-one in a binary search over a sorted list of builds | `searchInsert` |
| Unique in order | The preview is right, and the function rewrites the caller’s array | `uniqueInOrder` |
| Apply transfers | A name and a comment agree with each other, and the money still moves backward | `applyTransfers` |
| Group anagrams | A leftover helper sits beside the real bug in the key that actually runs | `groupAnagrams` |
| Encode runs | The last run of a status stream is never written | `encodeRuns` |
| Cart checkout | Validation, a coupon, tax, and shipping are tangled in one method | `class Cart` |

Each starter already passes at least one visible test and fails at least one. The solution passes every test, including the ones that stay hidden until a run.

## How your code runs

The page never evaluates your code on the main thread. A web worker compiles it and runs the tests. If a run has not finished in one second, the worker is stopped, so a loop cannot freeze the page.

Define the entry the prompt names, and leave imports and exports out. The runner looks up that one function, or `new Cart()` for the class drill, and calls it with plain data.

## Limits

- JavaScript only. Other languages, accounts, and scored mock interviews are later.
- One entry point per drill. No imports, no exports, no extra files.
- A run that does not finish in 1 second is stopped. Tests that did not run are not scored.
- Hidden tests are hidden in the interface until a run. They are still in the app, so reading the source reveals them.
- Drafts last for the browser tab (`sessionStorage`). Closing the tab clears them. The theme choice lasts (`localStorage`).
- Comparison is structural. Group anagrams also fixes the order of groups, and the prompt says so.
- Files over 30,000 characters are rejected. The editor is plain text, with line numbers and no syntax highlighting.
