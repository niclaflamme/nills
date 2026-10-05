---
name: tigerstyle
description: Apply selected TigerStyle ideas when designing, refactoring, or reviewing code for clearer names, simpler interfaces, explicit invariants, resource bounds, and predictable performance. Use when asked for TigerStyle or a focused improvement to these qualities. Follow the project's language conventions, preserve recovery behavior, and do not introduce program-terminating checks.
metadata:
  category: Engineering
---

# TigerStyle

Use names and structure to make code easier to reason about. Start with the
operation's contract: its inputs, result, side effects, failure modes, and resource
lifetime. Improve that contract's expression within the requested scope.

Inspired by [TigerStyle](https://tigerstyle.dev/) and
[TigerBeetle's original guide](https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md).
The guidance below is a selective adaptation for application code. It is not the
full TigerBeetle coding standard.

## Naming things

- Name the domain concept, not its container type: `skillFiles` conveys more than
  `data`. Use the same term for the same concept in code, messages, and docs.
- Use nouns for values and verbs for operations. Make I/O and mutation apparent:
  `parseSkillFrontmatter`, `readSkillFiles`, `saveBookmarks`.
- Spell out words when abbreviations hide meaning. Keep familiar domain vocabulary
  such as `id`, `url`, and `http`, and names required by frameworks or protocols.
- Put the subject before its units and qualifiers when it groups related names
  usefully: `payloadBytesMax`, `payloadBytesUsed`, `requestTimeoutSeconds`.
- Distinguish an element's position, a quantity of elements, and a storage extent:
  `fileIndex`, `fileCount`, `fileSizeBytes`. Make inclusive and exclusive limits
  explicit in the contract. Choose deliberate rounding when converting units.
- Prefer positive boolean names: `isReadable`, `hasAccess`, `canRetry`. Preserve
  the distinction between capability, permission, and current state.
- Use complementary names such as `source` and `target` when they describe the
  roles accurately. Do not pad or distort names for visual symmetry.
- Name ownership when it matters: `borrowedBuffer`, `ownedBuffer`, `skillDirectory`.
  Avoid duplicating context already supplied by a receiver or namespace.
- Follow the language and repository's casing, acronym, and visibility conventions.
  Use `snake_case` in Python, ordinary Go names in Go, and established TypeScript
  casing in TypeScript. Do not introduce a competing naming system.
- Treat exported symbols, keyword parameters, serialized fields, database columns,
  CLI flags, and URLs as contracts. Rename internal callers consistently; use a
  deliberate migration when changing an external contract is requested.

Read [the naming examples](references/application-examples.md#names-explain-roles)
when deciding how much context belongs in a name.

## Structure and ownership

- Keep the operation's order and decisions visible. Let the owning function
  coordinate work; let helpers own cohesive parsing, calculation, or I/O tasks.
  A parser should keep the branches that validate its own input.
- Extract a helper when its name and contract let the caller stop thinking about
  meaningful details. Keep straightforward sequences together when splitting them
  would require more jumping between definitions.
- Keep values close to their use and state close to its owner. Prefer computed
  results over a second mutable copy that must stay synchronized.
- Make mutation, suspension, and resource cleanup visible. After an `await`,
  reconsider any assumption about shared state that could have changed.
- Keep interfaces small without discarding meaningful distinctions. Use named
  arguments, an options record, or distinct types when interchangeable positional
  arguments are easy to swap. Preserve framework-required signatures.
- Explain constraints the code cannot express: ordering dependencies, protocol
  behavior, or a measured tradeoff. Replace comments that translate vague names
  with better names rather than adding more narration.

## Invariants, limits, and failure

- Validate external input where it enters the system. Report failures through the
  project's normal error handling and preserve established recovery behavior.
  In Python, required validation must not depend on assertions disabled by `-O`.
- Do not introduce panics, aborts, forced process exits, or fatal runtime
  assertions. Surface a failed invariant through established error handling,
  rejecting or isolating the failing operation where the application supports it.
  Keep healthy state intact. Do not hide the failure or continue using corrupt
  state. Flag an existing fatal path rather than expanding it. Assertions in
  tests are fine.
- Derive resource limits from actual requirements. Specify units, the boundary,
  and what happens when it is reached. Retries, queues, concurrency, and externally
  driven work need a stopping or saturation policy when the task involves them.
- Reject overflow or excess work explicitly when that is the contract. Do not
  truncate data, clamp values, add arbitrary limits, or change retry behavior in a
  naming or readability edit.
- Test valid, invalid, and boundary states that can expose a real defect. Include
  zero, the last valid element, and the first invalid element when relevant.
- Give failures enough context to locate the problem. Preserve error causes and
  distinguish a supported empty result from an operation that failed.

Read [the boundary example](references/application-examples.md#boundaries-are-behavior)
when introducing a resource limit or checking index/count conversions.

## Performance and tools

- For a design with material scale, estimate work in terms of item count, bytes,
  external calls, and concurrency. Identify repeated work before optimizing local
  expressions. Label estimates as estimates and measure when evidence is needed.
- Batch work when it amortizes a real cost and respects latency, ordering, and
  memory requirements. Do not add caching without a concrete invalidation rule.
- Use existing tools and libraries when they meet the need. Evaluate a new
  dependency's benefit and maintenance cost; retain established dependencies
  during a style-only edit.
- Apply stronger systems constraints when the project requires them. Static
  allocation, fixed-width arithmetic, recursion bans, and hard function-length
  limits need a project-specific reason to become requirements. This adaptation
  does not adopt TigerBeetle's crash-on-invariant-failure policy.

## Apply and review

Inspect callers and existing conventions before editing. Choose the smallest
change that improves a concrete decision, name, or boundary. Keep formatting
with the configured formatter and run relevant existing checks.

In a review, distinguish correctness defects from naming preferences and explain
what a suggested name reveals. In a refactor, preserve outputs, side effects,
ordering, exceptions, and resource lifetime. Add tests for meaningful behavior or
regression risks, not for spelling or compliance with this skill.
