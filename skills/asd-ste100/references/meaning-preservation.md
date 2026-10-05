# Meaning-preservation examples

These examples illustrate this skill's clarity guidance. They are original
software examples, not quotations from the official ASD-STE100 standard.

## Keep conditions attached to every action

**Source:**

> If validation succeeds, write the configuration and restart the worker.

**Rewrite:**

> If validation succeeds, do these steps:
>
> 1. Write the configuration.
> 2. Restart the worker.

**Check:** Both actions remain conditional. “If validation succeeds, write the
configuration. Restart the worker.” can make the restart unconditional.

## Preserve uncertainty without adding advice

**Source:**

> The request may have failed due to a possible format mismatch between the client and server.

**Rewrite:**

> The request may have failed. A format mismatch between the client and server may have caused the failure.

**Check:** The failure and proposed cause remain uncertain. Do not assert that
the request failed or that the client caused it. Do not add “Update the client”
unless the source establishes that remedy.

## Distinguish permission from capability

**Source:**

> The agent can delete cached files, but it must receive user approval before deleting shared files.

**Rewrite:**

> The agent can delete cached files. Before deleting shared files, the agent must receive user approval.

**Check:** Capability stays capability. The approval requirement still applies to
shared files. Do not turn the first sentence into an instruction to delete files
or claim that cached files never need approval.

## Preserve logical operators and exceptions

**Source:**

> Retry only if the request is idempotent and the retry budget is not exhausted, unless the server forbids retries.

**Rewrite:**

> Retry only if all these conditions hold:
>
> - The request is idempotent.
> - The retry budget is not exhausted.
> - The server does not forbid retries.

**Check:** All conditions remain necessary. “Only if” does not require a retry
whenever the conditions hold. Do not change it to “When these conditions hold,
retry.” Do not replace “all” with “any.”

## Keep limits and literal tokens exact

**Source:**

> Set `timeout_ms` to at least `5000` before invoking `nills sync --profile work`.

**Rewrite:** Keep this sentence as written.

**Check:** The parameter, lower bound, units implied by the identifier, command,
and order are already clear. “More than 5000” changes the boundary. Converting
the parameter to seconds or dropping the profile changes the instruction.

## Keep meaningful timing and state

**Source:**

> The worker has been running since 09:00 UTC.

**Rewrite:** Keep this sentence as written.

**Check:** “The worker started at 09:00 UTC” loses the statement that it still
runs. A tense preference does not justify that loss.

## Expose unresolved references

**Source:**

> The coordinator told the worker to restart after it saved the checkpoint.

**Rewrite:** Keep the unresolved sentence until its referent is known.

**Separate note:**

> Does “it” mean the coordinator or the worker?

**Check:** Both actors could save the checkpoint. Replacing “it” with a guessed
actor would produce a clearer sentence with unsupported meaning.

## Keep useful prose natural

**Source:**

> This change avoids repeated parsing by keeping the parsed configuration in memory until the configuration file changes.

**Rewrite:**

> This change keeps the parsed configuration in memory until the configuration file changes. It avoids repeated parsing.

**Check:** The lifetime and benefit remain intact. There is no need to add a
procedure, glossary, or claim about measured performance.
