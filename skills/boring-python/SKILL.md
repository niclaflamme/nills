---
name: boring-python
description: Write, refactor, and review Python with a preference for explicit, straightforward code that a Go reader can follow. Use when creating or changing Python code, or when asked to simplify clever or overly Pythonic code. Keep changes within the requested scope.
---

# Boring Python

Optimize for a reader who finds Go's explicit control flow easier to understand than compact, idiomatic Python. Favor code that can be read from top to bottom without mentally expanding expressions or chasing abstractions. A few extra lines are a good trade for obvious behavior.

## Control flow and expressions

- Default to ordinary `for` loops and `if` statements instead of comprehensions, generator expressions, `map`, `filter`, or `reduce`. Use named accumulators and intermediate values.
- Keep transformations, filtering, and side effects on separate lines. Avoid nested conditional expressions, assignment expressions (`:=`), and multiple statements on one line.
- Prefer early returns and guard clauses to deep nesting. Keep the normal path easy to follow.
- Use explicit conditions when the distinction matters: `value is None`, `count == 0`, or `len(items) == 0`. Plain boolean checks are fine. Do not silently conflate missing values with valid `0`, `False`, or empty values.
- Prefer named functions to lambdas containing business logic. A tiny callback such as a sort key is fine when extracting it would make the code harder to follow.
- Use straightforward iteration tools such as `enumerate` and `dict.items()` when they clarify intent. Do not emulate C-style indexing just to look less Pythonic.

## Whitespace and layout

Treat a function like prose: related statements form a paragraph, and a blank line marks a change of thought. Whitespace should expose the operation's structure without making the reader scroll through empty space.

- Use one blank line between meaningful stages such as reading input, checking a precondition, computing a value, and applying a change. Do not add a blank line after every statement or mechanically before every `if`, loop, or `return`.
- Keep tightly related statements together: a value and its immediate check, related initializations, or creating a record and appending it. Separate a completed guard clause from the normal path that follows.
- Do not put blank lines immediately inside a block's opening or at its end. Keep decorators attached to their definitions and comments attached to the statements they explain.
- Use four spaces per indentation level, never tabs. Use two blank lines between top-level functions and classes, and one between methods. Follow the repository's configured formatter where it specifies layout.
- Use ordinary spaces around assignments and binary operators and after commas. Do not pad assignments, dictionary entries, or inline comments into alignment columns that need maintenance when a name changes.
- Keep short calls on one line. When a call, signature, or collection becomes hard to scan, wrap inside parentheses or brackets, put one argument or item per line, and use a trailing comma. Avoid backslash continuations and extra indentation solely to align with a distant opening parenthesis.
- Respect the existing line-length setting. If none exists, target at most 100 columns for code. Break at meaningful boundaries or name an intermediate value instead of compressing an expression to fit. Do not introduce formatter configuration for a readability edit.
- Remove trailing whitespace and end files with a newline. Do not alter meaningful whitespace inside strings or reformat unrelated files as part of a local change.

See [the whitespace example](references/readability-examples.md#whitespace-as-paragraphs) for grouping related statements without spreading every line apart.

## Naming things

Adapted from [TigerBeetle's TigerStyle naming guidance](https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md#naming-things), with Python-specific conventions below.

- Name the domain concept or operation precisely. Use the same term for the same concept across code and documentation; do not give one term several meanings.
- Spell out words: `configuration`, `request`, `message`, and `index` instead of `cfg`, `req`, `msg`, and `i`. Established vocabulary such as `id`, `http`, and `url` is fine.
- Put the subject first, then units and qualifiers: `timeout_seconds`, `payload_bytes_max`, `retry_count_max`. Keep related names consistent.
- Distinguish position, quantity, and extent: `record_index`, `record_count`, `record_size_bytes`. Avoid ambiguous `size` or `length` when the unit matters.
- Prefer complementary names such as `source` and `target`. Semantic clarity matters more than matching name lengths.
- A private helper used by one operation may share its prefix, such as `import_orders` and `_import_orders_validate_header`, when this clarifies ownership.

### Python application

- Use `snake_case` for functions, variables, and modules, `PascalCase` for classes, and `UPPER_SNAKE_CASE` for constants. Preserve established project acronym casing and required framework names.
- Name functions for observable actions: `parse_invoice`, `calculate_total`, `fetch_customer`, or `save_order`. Avoid vague `process`, `handle`, and `do_work` where a specific verb fits. A name such as `get_customer` should not conceal creation or persistence.
- Use nouns for values, plural nouns for collections, and positive predicates for booleans: `invoice`, `invoices`, `is_ready`, `has_access`, `can_retry`. Avoid double negatives such as `not is_not_ready`.
- Replace placeholder names like `data`, `result`, and `temp` when the domain is known: `response_body`, `invoice_total`, or `normalized_email`. Do not repeat context already clear from the receiver: `invoice.total` usually needs no `invoice_total` attribute.
- Make easy-to-confuse arguments explicit at call sites: `copy_records(source=archive, target=working_directory)`. Consider keyword-only parameters for new APIs where swapped arguments would be hard to detect.
- Treat public parameter names, serialized fields, database columns, and framework hooks as contracts. A naming cleanup must not silently break keyword callers or stored data. Rename internal uses consistently within the requested scope.

## Functions, data, and abstractions

- Use concrete parameter and return annotations at function boundaries. Follow the project's supported Python version. Avoid elaborate type machinery unless the actual interface requires it.
- Give functions one understandable responsibility. Use the helper-function criteria below before extracting parts of a straightforward sequence.
- Prefer explicit parameters and return values to hidden state, mutable globals, or functions whose return type changes according to flags.
- Use ordinary functions for operations and simple records for data. A dataclass is appropriate for a record; a class is appropriate when it owns meaningful state or enforces invariants.
- Avoid speculative base classes, registries, factories, dependency injection frameworks, fluent chains, and generic utility layers for a single concrete use case.
- Avoid custom decorators, descriptors, metaclasses, dynamic attribute access, monkey patching, and operator overloading for ordinary application logic. Preserve framework-required mechanisms and established public interfaces.
- Do not replace a clear, familiar standard-library operation with hand-written machinery. Explicit code should expose the business logic, not reimplement library internals.

### Helper functions

A helper should earn the reader's jump to another definition. Prefer keeping code together until an extraction makes the operation easier to understand as a whole.

- Extract a helper when it encapsulates a meaningful operation, centralizes a shared domain rule, or isolates substantial parsing, calculation, or external-system details behind a clear contract. One caller is enough when the helper hides meaningful complexity; several callers are not proof of a good abstraction.
- Judge the call site: can the reader understand the result, possible failure, and relevant side effects from the name and contract without opening the helper? If they must inspect several definitions just to understand an ordinary loop, keep more of the operation inline.
- Do not extract helpers solely to shorten a function, replace an obvious expression, satisfy a line-count target, or make a private detail individually testable. A short helper is justified when it gives a real domain policy one authoritative name and implementation.
- Reuse shared meaning, not merely similar syntax. A little duplication is preferable to a generic helper full of mode flags, callbacks, or special cases for unrelated callers. Do not predict future reuse or automatically move helpers into `utils.py`.
- Pass the inputs the helper actually needs and return a concrete result. Prefer pure calculation where practical. Make mutation and I/O apparent in names and contracts; do not pass a mutable context dictionary between stages or hide dependencies in closures and globals.
- Keep a helper in the owning module, near its caller, and private with a leading underscore when it is an implementation detail. Prefer ordinary module-level functions; use nested functions when a closure or callback has a concrete purpose. Move shared code only when actual callers justify a separate module.
- Avoid chains of functions that merely forward the same arguments. Preserve useful wrappers that enforce a real boundary, adapt an external API, or maintain a public contract. When inlining an existing helper, check every caller and preserve behavior and supported interfaces.

See [the helper examples](references/readability-examples.md#helpers-must-earn-the-jump) for a needless wrapper, a useful small policy function, and guidance on where the boundary belongs.

### Larger functions

- A longer function is acceptable when it implements one coherent operation in a clear sequence. Do not impose an arbitrary line limit or split code just to fit on a screen.
- Keep the operation's ordering, decisions, and state changes easy to find. Use blank lines between meaningful stages instead of banner comments or helpers named `step_one` and `step_two`.
- Reconsider a function that mixes unrelated policies, repeatedly changes levels of detail, has deeply nested branches, or requires keeping many unrelated values in mind. More lines alone are not evidence of those problems.
- Do not force every conditional into a parent function. A parser should own its validation branches; the caller should own the sequence of reading, parsing, and storing.
- If an extraction needs many parameters carrying unrelated state or depends on hidden call order, reconsider the responsibility boundary.
- Keep transaction boundaries, resource lifetimes, and exception handling intact when extracting code. A smaller function is not an improvement if it changes behavior or makes the operation harder to trace.

## Comments and docstrings

The default is no explanatory comment. Make the code carry its meaning. Treat a comment that explains confusing code as a prompt to improve the code first, not as a completed readability fix.

- Before adding a comment, try a better name, a named constant, a simpler expression, or clearer control flow. Do not extract a trivial helper solely to replace a comment with a function name.
- Delete narration such as `# Increment the count`, `# Loop over users`, and `# Return the result`. Avoid section banners, change-history notes, commented-out code, and docstrings that repeat a signature.
- Preserve information the code cannot communicate: why an unusual rule exists, an external protocol constraint, a concurrency hazard, a measured performance tradeoff, or the reason an obvious alternative is incorrect. Put that explanation beside the relevant decision.
- Write short, specific comments that identify the constraint and its consequence. Add a stable source or issue reference when available. Never invent a requirement, benchmark, incident, or citation to justify code.
- A comment is not validation. If a condition must hold, enforce it at the appropriate boundary and test it when warranted. Do not replace input validation with Python assertions that may be disabled.
- Use docstrings for non-obvious caller contracts: units, side effects, mutation, ordering, exceptions, or missing-value behavior. Avoid repeating annotations and documenting every local helper by habit. Preserve required public API documentation.
- Keep a TODO only when it identifies concrete unfinished work and a removal condition or tracked issue. Do not use vague TODOs as a substitute for completing the requested task.
- When changing code, update or remove affected comments in the same change. If a comment and the implementation disagree, investigate the intended behavior before deciding which is wrong. Preserve legal notices and required tool directives; explain narrow suppressions when their reason is not obvious.

Read [the worked examples](references/readability-examples.md) when refactoring a larger function or deciding whether to add comments. They show a cohesive longer function, a meaningful extraction, over-fragmentation, and comments replaced by code.

## Errors and resources

- Use standard Python exceptions. Do not introduce Go-style `(value, error)` tuples or a custom `Result` system solely to imitate Go.
- Catch specific exceptions only where the function can recover or add useful context. Keep the `try` block small. Preserve causes with `raise ... from error` when translating exceptions.
- Do not swallow failures, turn unexpected failures into successful-looking empty results, or catch `Exception` routinely.
- Keep `with` for resource management and `async`/`await` where the application needs it. Do not expand these into fragile manual cleanup or blocking substitutes.
- Make external calls and mutations visible as ordinary statements. Avoid hiding them in properties, comprehensions, or deceptively pure helpers.

## Scope and correctness

- Apply these preferences to new and meaningfully changed Python code. Do not rewrite unrelated code or add tooling and dependencies just to enforce the style.
- When refactoring, preserve public interfaces, output ordering, missing-value behavior, exception behavior, side effects, and resource lifetime. Preserve laziness where materializing an iterable would change behavior or memory use.
- Respect framework contracts and demonstrated performance requirements. Keep necessary vectorized operations, streaming generators, or specialized constructs; simplify surrounding code and explain any non-obvious necessity briefly.

## Tests and review

- The user dislikes mock tests. Do not add mocks, patches, or interaction-only assertions. Prefer backend unit tests exercising real logic with concrete inputs and observable outputs.
- Use temporary files or a real local test dependency when appropriate. Keep pure decision logic separable from external I/O when that improves both design and testing. Do not create a fake architecture just to avoid calling something a mock.
- Run existing relevant checks. Add focused tests for changed behavior or meaningful regression risks; do not add tests merely to assert formatting or the presence of these style choices. If required external verification is unavailable, state the limitation.
- In a requested review, distinguish readability preferences from correctness defects. Do not label harmless Python idioms as bugs.
- Before finishing, scan for compressed logic, hidden side effects, unnecessary abstractions, comments compensating for unclear code, needless fragmentation, and semantic changes introduced by simplification. Prefer the version the reader can understand with the fewest mental steps.

## Example: expand business logic

Compact:

```python
def active_emails(users: list[User]) -> list[str]:
    return [u.email.strip().lower() for u in users if u.active and u.email is not None]
```

Preferred:

```python
def active_emails(users: list[User]) -> list[str]:
    emails: list[str] = []

    for user in users:
        if not user.active:
            continue

        if user.email is None:
            continue

        email = user.email.strip().lower()
        emails.append(email)

    return emails
```

Both versions retain an empty email string after normalization. Do not add validation or change that behavior during a readability-only refactor.
