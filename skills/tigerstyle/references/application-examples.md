# Application examples

These are original examples for this adaptation. The proposed names describe
their actual roles; they are not universal spellings to impose on every project.

## Names explain roles

In a TypeScript skill catalog:

| Vague name | More informative name | What becomes visible |
| --- | --- | --- |
| `inside(root, path)` | `isPathWithinDirectory(directoryPath, candidatePath)` | A boolean containment check and the two path roles. |
| `frontmatter(source, path)` | `parseSkillFrontmatter(skillSource, skillFilePath)` | Parsing a skill document and retaining a diagnostic location. |
| `readFiles(directory, root)` | `readSkillFiles(directoryPath, skillDirectoryPath)` | The current traversal location versus the origin for relative paths. |
| `data` after a file read | `fileBytes` | Raw bytes, before decoding or parsing. |
| `size` | `fileCount` or `fileSizeBytes` | Whether the value counts files or measures their storage. |

`parseSkillFrontmatter` should not secretly read a file. `readSkillFiles` makes
its filesystem work clear. Keep the exported `loadCatalog` name when its callers
already depend on it; internal cleanup does not require an API rename.

Related limits can group naturally:

```typescript
const payloadBytesMax = 4096;
const payloadBytesUsed = payload.byteLength;
```

The same idea in Python follows Python's existing convention:

```python
payload_bytes_max = 4096
payload_bytes_used = len(payload)
```

The `payload` in each example is a byte buffer. A string's character count would
not be a substitute for its encoded byte count. These names describe an example
requirement; they do not establish a new limit for another application.

## Interfaces prevent swapped arguments

A call such as `copyRange(0, 100, 200)` hides three integer roles. For a new
TypeScript API, an options object can make them explicit:

```typescript
copyRange({
  sourceOffsetBytes: 0,
  targetOffsetBytes: 100,
  byteCount: 200,
});
```

This is useful when offsets can be confused. It does not require wrapping every
ordinary argument in an object. An existing public signature needs compatibility
planning before changing it.

## Boundaries are behavior

Suppose the documented contract permits at most 64 attempts, including the
initial attempt. Use `attemptCountMax` rather than `retryCountMax`; retries
exclude the initial attempt.

| Attempts completed | Another attempt allowed? |
| --- | --- |
| 0 | Yes |
| 63 | Yes |
| 64 | No |

Tests should cover the boundary and the externally visible outcome after the
limit. They should not merely assert that a constant has a particular name.
Adding this limit to an unlimited operation changes behavior and requires a
requirements decision; it is not a style cleanup.

## State has one owner

For a library filter, keep the selected discipline and search text as state.
Derive the matching skills from those values and the catalog. Storing another
mutable `matchingSkills` list requires keeping it synchronized whenever any
input changes.

Memoization may reduce repeated computation when useful. It does not replace
the underlying ownership rule, and a cache that survives source changes needs
an explicit invalidation mechanism.

## Checks preserve recovery

Suppose an application's reload contract keeps the last valid configuration when
a new configuration is invalid. Validate the candidate before replacing the
active configuration. Report the invalid candidate through the existing error
handling path and keep the valid configuration available.

An assertion that terminates the process would change this recovery contract.
A useful regression test checks that a rejected reload reports its error and
leaves the previous configuration intact. Do not invent fallback state or
silently accept invalid input to keep the operation running.
