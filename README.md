# nills

**Nic’s skills. One repo, every computer, whichever coding agent is open.**

nills is a Git-backed collection of reusable agent skills and a small CLI for
linking them into the tools you use. Keep the originals here, edit them once,
and pull the same workflows onto your other computers.

```sh
nills link       # Make this computer’s skill links match its profile
nills sync       # Pull committed updates, then refresh the links
nills doctor     # Explain what is linked and what needs attention
```

> **Status:** The skills and local web library are implemented. The CLI, Makefile,
> and profile configuration below describe the planned interface and have not
> been implemented yet.

## Browse the library

A local web UI lets you search the collection, bookmark skills, read formatted
guides, and follow links into their supporting files. It includes a source view,
copyable starting prompts, light and dark themes, and a mobile layout.

Requires [Bun](https://bun.sh/) and [Node.js](https://nodejs.org/) 22.12 or newer.
From this checkout:

```sh
bun install
bun run dev
```

Open the local URL printed by Vite, normally `http://127.0.0.1:5173`.
Use `⌘K`, `Ctrl+K`, or `/` to focus search. Search includes guide and reference
contents. Bookmarks and theme preferences stay in this browser.

The catalog is generated from `skills/`; add or edit a skill and the development
page reloads automatically. Display names and prompts come from the skill's
`agents/openai.yaml` when present. An optional `metadata.category` in `SKILL.md`
sets its discipline; otherwise the library infers one from its name and description.
Hidden files and symlinks are excluded from the web catalog. Binary assets are
listed without a text preview. Skill scripts are displayed as source, not executed.

```sh
bun run test            # Catalog discovery and document navigation
bun run build           # Type checking and static production build into dist/
bun run preview         # Serve the production build locally
```

The production build bundles the skill files and fonts and needs no backend or
third-party requests to browse. Rebuild after changing skills. Static output can
be hosted under a subdirectory. Each skill and supporting file has a shareable
URL fragment. The library reads the collection; linking skills remains part of
the planned CLI.

For desktop and mobile browser checks, install Playwright Chromium once with
`bunx playwright install chromium`, then run `bun run test:browser`. Alternatively,
set `NILLS_CHROME_PATH` to an existing Chrome executable when running that command.

## The idea

The repository holds the real skill files. Each agent discovers them through a
symlink to an individual skill directory:

```text
~/code/nills/skills/review-pr/           ← edit and version this directory
    ↑                         ↑
~/.agents/skills/review-pr     ~/.claude/skills/review-pr
```

Linking the whole skill directory keeps scripts, references, and assets together.
Linking individual skills lets nills coexist with skills installed by other tools.
The agent’s top-level skills directory stays a regular directory.

Git moves committed changes between computers. Symlinks connect an agent to its
local checkout. Editing through either path changes the same local files; it
doesn’t update another computer until you commit, push, and sync there.

## Included skills

| Skill | Purpose |
| --- | --- |
| [boring-python](skills/boring-python/SKILL.md) | Write, refactor, and review Python using explicit control flow and straightforward code that a Go reader can follow. |
| [asd-ste100](skills/asd-ste100/SKILL.md) | Clarify technical English using STE-inspired guidance while preserving facts, conditions, permissions, and uncertainty. |
| [tigerstyle](skills/tigerstyle/SKILL.md) | Improve code with precise names, clear interfaces, explicit invariants, and deliberate resource limits, adapted to the project's language. |

Each skill includes examples and Codex interface metadata:

- **boring-python:** [readability examples](skills/boring-python/references/readability-examples.md)
  and [interface metadata](skills/boring-python/agents/openai.yaml).
- **asd-ste100:** [meaning-preservation examples](skills/asd-ste100/references/meaning-preservation.md)
  and [interface metadata](skills/asd-ste100/agents/openai.yaml).
  Adapted from [danyuchn/asd-ste100-skill](https://github.com/danyuchn/asd-ste100-skill)
  with its [MIT notice](skills/asd-ste100/LICENSE).
- **tigerstyle:** [application examples](skills/tigerstyle/references/application-examples.md)
  and [interface metadata](skills/tigerstyle/agents/openai.yaml).
  Inspired by [TigerStyle](https://tigerstyle.dev/) and
  [TigerBeetle's original guide](https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md).

## Planned quick start

Requirements: macOS or Linux, Git, Make, and Go for building. Once installed, the
CLI needs Git for syncing and no language runtime. The first release targets
macOS and Linux; Windows support can follow separately.

Replace `<repository-url>` with the URL of your fork or shared nills repository:

```sh
git clone <repository-url> ~/code/nills
cd ~/code/nills
make install
```

`make install` builds a standalone `nills` executable and installs it into
`~/.local/bin`. Add that directory to your shell’s PATH once if necessary:

```sh
export PATH="$HOME/.local/bin:$PATH"
```

Save that line in your shell configuration to make it persistent. A custom
installation directory should work with `make install PREFIX=/usr/local` when
you have permission to write there. Installation only installs the executable;
linking is a separate command.

On the work computer:

```sh
nills init --repo "$PWD" --profile work
nills link --dry-run
nills link
nills doctor
```

On the home computer, repeat the clone and installation, then:

```sh
nills init --repo "$PWD" --profile home
nills link
nills doctor
```

After setup, commands work from any directory. Each computer remembers its own
checkout path and profile, so the repository can live somewhere different on
each machine.

## Agent support

The proposed defaults use the shared user skill directory where supported:

| Agent | Default destination | Profile |
| --- | --- | --- |
| Codex | `~/.agents/skills/<name>` | Work and home |
| Claude Code | `~/.claude/skills/<name>` | Work |
| Kimi Code CLI | `~/.agents/skills/<name>` | Home |
| Grok CLI / Grok Build | `~/.agents/skills/<name>` | Home |

These paths follow the current [Codex documentation](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills),
[Claude Code documentation](https://code.claude.com/docs/en/skills#where-skills-live),
[Kimi Code CLI documentation](https://moonshotai.github.io/kimi-code/en/customization/skills),
and [Grok Build documentation](https://github.com/xai-org/grok-build/blob/main/crates/codegen/xai-grok-pager/docs/user-guide/08-skills.md).
Checked October 4, 2026. Grok here means the local coding CLI, rather than the
Grok website or mobile app.

Codex, Kimi, and Grok resolve to one shared destination: nills creates each link
there once. Claude gets a second link to the same source. Selecting an agent
chooses where to link; any other installed tool that scans that directory may
also discover the skill. Profiles select a computer’s skill set, rather than
enforcing isolation between agents.

Codex and Claude explicitly document support for symlinked skill folders. Kimi
and Grok document these discovery roots; their actual symlink discovery must be
verified in the supported CLI versions before release. Older versions can use
different roots or precedence rules. Machine-local path overrides should support
legacy Codex `~/.codex/skills`, Kimi-specific directories, and Grok
`~/.grok/skills` without changing the shared repository.

## Commands

| Command | Intended behavior |
| --- | --- |
| `nills init --repo PATH --profile NAME` | Register an existing checkout and save this computer’s profile. Create no skill links. |
| `nills list` | List repository skills and whether the active profile selects them. |
| `nills link` | Validate skills and reconcile the complete set of nills-owned links with the active profile. Works offline. |
| `nills link --profile work` | Reconcile with another profile and remember it after successful application. |
| `nills link --dry-run` | Show link creations, removals, and conflicts without writing files. Can also preview `--profile NAME`. |
| `nills sync` | Fetch the configured Git upstream, fast-forward the checkout, validate, and reconcile links. |
| `nills unlink` | Remove this checkout’s recorded, verified nills-owned links. Keep the source skills and configuration. |
| `nills unlink --dry-run` | Preview the managed links that would be removed. |
| `nills doctor` | Report configuration, Git state, validation errors, missing or conflicting links, duplicate discovery, and agent compatibility concerns. |
| `nills --help` / `nills --version` | Show usage or the installed CLI version. |

Commands print the actual source and destination paths. Conflicts and incomplete
operations return a nonzero exit status with a concrete next step. `doctor`
inspects and explains; it does not repair files automatically.

### What sync means

`nills sync` receives published changes. It checks for a clean checkout,
including untracked files, an attached branch, and a configured upstream before
updating. It fetches and allows a fast-forward only; it leaves local commits
intact and stops when the histories have diverged.

Sync never commits, pushes, stashes, rebases, or resets your work. A network
failure stops sync; `nills link` remains available offline. Invalid incoming
skills or link conflicts stop reconciliation and report the updated Git commit
and the links left unchanged. The checkout is not silently rolled back.
Already-linked skill contents reflect the Git update immediately, even if link
reconciliation fails.

New skills get linked, removed or renamed skills have their old managed links
removed, and existing links keep pointing at the same local sources.

## Sharing and editing

Edit skills in the checkout, then publish them using Git:

```sh
cd ~/code/nills
# Edit skills/review-pr/SKILL.md and its supporting files.
nills link --dry-run
git diff
git add skills/review-pr
git commit -m "Improve the PR review workflow"
git push
```

On the other computer:

```sh
nills sync
```

Content edits already reach the local agent through its symlink. Linking again
is needed when the selected skills, names, destinations, or checkout path change.
Start a new agent session if its skill catalog does not refresh.

To share with someone else, give them the repository URL. They clone it,
install nills, and select or add a profile. Their local paths and link state stay
on their computer. Forks use their own configured Git upstream.

## Repository layout

Proposed structure:

```text
nills/
├── README.md
├── Makefile
├── go.mod
├── go.sum
├── nills.json                    # Shared profile definitions
├── cmd/nills/main.go             # Command entry point
├── internal/                    # Config, skills, linking, Git, diagnostics
└── skills/
    └── review-pr/
        ├── SKILL.md
        ├── references/          # Optional background material
        ├── scripts/             # Optional helpers
        └── assets/              # Optional templates or other files
```

Skill folders follow the [Agent Skills specification](https://agentskills.io/specification).
Each direct child of `skills/` is one skill, with a unique lowercase name that
matches its folder and a nonempty description:

```markdown
---
name: review-pr
description: Review a pull request for correctness, regressions, and missing checks.
---

Read the diff and the relevant surrounding code. Report actionable findings
with file locations, explain their impact, and summarize what you verified.
```

Keep reusable instructions portable across agents. Reference supporting files
relative to the skill directory and explain required tools or credentials.
Agent-specific metadata can live alongside a skill, such as `agents/openai.yaml`;
nills links files as authored and does not translate prompts or frontmatter.

### Shared profiles

The planned repository configuration, `nills.json`:

```json
{
  "version": 1,
  "profiles": {
    "work": {
      "agents": ["codex", "claude"],
      "skills": ["*"]
    },
    "home": {
      "agents": ["codex", "kimi", "grok"],
      "skills": ["*"]
    }
  }
}
```

`["*"]` selects every skill. Otherwise, `skills` is an explicit list of names,
such as `["review-pr", "ship-pr"]`. No glob language or inheritance is needed
for the first version. Unknown profiles, agents, or skill names are errors.

The profile is shared; the choice of active profile is local. Selecting a work
profile does not make repository contents private. Keep company-only skills in
an appropriate separate repository if this collection is shared publicly.

### Machine-local configuration

Store configuration under `${XDG_CONFIG_HOME:-~/.config}/nills/config.json`:

```json
{
  "version": 1,
  "repo": "~/code/nills",
  "profile": "home"
}
```

An optional `paths` object maps agent names to custom skill roots. Resolve `~`
on the current computer and require absolute paths after expansion. Built-in
paths use the OS home directory; custom agent data roots require an explicit
override. Deduplicate destinations after resolving their filesystem paths.

Keep the ownership ledger at
`${XDG_STATE_HOME:-~/.local/state}/nills/links.json`, outside the Git checkout.
It records the registered checkout, link destinations, and expected targets.
The first version manages one registered skills checkout per computer.

## Linking rules

- Create absolute symlinks to individual skill directories in the local checkout.
- Repeated linking is a no-op when everything already matches.
- Preflight the whole operation before changing any links. Existing directories,
  files, and unowned links are conflicts, including broken symlinks.
- Never replace an agent’s skills root or overwrite an existing skill. Show the
  collision and let the user move or resolve it explicitly.
- Modify or remove a link only when the ledger records it and its current
  symlink target still matches that record. Never follow it to delete contents.
- An unrecorded link already pointing at the correct source can remain, but
  stays unmanaged. Report it rather than silently claiming ownership.
- Remove stale managed links during reconciliation, including links no longer
  selected after a profile change. Preserve unrelated skills and directories.
- Validate skill names and source paths; reject traversal, duplicate names,
  reserved target names, and source directories escaping the checkout.
- Serialize configuration and link changes, write state atomically, and report
  partial filesystem failures accurately so rerunning can recover safely.

If you move the checkout, register its new path with `nills init`, then run
`nills link`. Preserve the old ledger during re-registration so recorded broken
links can be verified and replaced. If the ledger is missing, `doctor` should
explain the unmanaged links; automatic deletion is disabled for those entries.

The planned first migration is manual: copy the personal skills you want from
your existing agent directories into `skills/`, review and commit them, then
move the old folders out of discovery roots before linking. Leave bundled,
plugin-managed, and system skills with their existing installers.

## Implementation plan

Use **Go** for a small standalone executable. Use the standard library for CLI
arguments, JSON configuration, filesystem operations, and Git subprocesses,
with a maintained YAML parser for skill frontmatter. Invoke Git directly with
argument arrays, rather than constructing shell commands.

1. **Core and installation.** Add the Go entry point, help/version output,
   configuration schemas, profile resolution, and `init`/`list`. Add
   `make build`, `make test`, `make install`, and `make uninstall`. Uninstall
   removes the executable only; run `nills unlink` first to remove skill links.
2. **Local linking.** Implement skill validation, a dry-run planner, the
   ownership ledger, safe reconciliation, profile switching, and `unlink`.
   Deliver a useful offline CLI at this stage.
3. **Sync and diagnostics.** Add upstream-aware, fast-forward-only Git updates
   and `doctor`. Make command results clear when Git succeeds but linking fails.
4. **Verify and migrate.** Test temporary home directories and local Git remotes:
   repeat runs, collisions, tampered and dangling links, profile switches,
   renames, moved checkouts, paths with spaces, dirty trees, divergent branches,
   and interrupted operations. Verify real skill discovery and invocation in
   Codex, Claude Code, Kimi, and Grok; record tested versions and any overrides.
   Then migrate the selected personal skills on each computer.

The first release is complete when a fresh clone can be installed with
`make install`, linked using either profile, updated from another computer with
`nills sync`, and unlinked without changing unrelated skills.

Later additions can include release binaries, shell completions, an explicit
skill import command, multiple source repositories, and project-scoped links.
The initial version keeps the workflow to Git, profiles, and symlinks.
