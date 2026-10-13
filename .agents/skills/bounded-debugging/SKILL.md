---
name: bounded-debugging
description: Diagnose a recurring failure or stalled investigation using evidence and clear stop conditions; use when debugging repeats without new information.
---

# Bounded debugging

State the current symptom and the next hypothesis before running a check. Choose the smallest check that can separate plausible causes. Record what its result establishes, then change the hypothesis or fix the cause.

If two consecutive checks or repair attempts yield the same evidence, do not repeat them unchanged. Inspect a different source of evidence or explain the specific missing input or external condition. This is a loop guard, not a limit on useful progress: continue when each iteration adds information or verifies a focused fix.

After a fix, run the narrowest meaningful verification. Report what passed, what remains uncertain, and the next concrete step if the issue persists.
