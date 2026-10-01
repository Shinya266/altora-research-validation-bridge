# Technical overview

The prototype is a small Node.js module with four layers:

1. `discoverSignals` scans T0 rows and emits provenance-bearing `DiscoveredSignal` records.
2. `createSpecialistPass` supports four non-authoritative roles; the deterministic demo instantiates domain-specialist and statistician passes so the mechanics remain reproducible.
3. `freezeHypothesis` creates a content-hashed T0 snapshot. `attemptFreezeMutation` rejects changed content.
4. `validateHypothesis`, `createFailureRecord`, and `createReflection` implement predefined outcomes and post-result learning.

Persistence is JSON artifacts for auditability. No network or database is required. The data fixture is local and temporally split into T0 and T1. The demo report labels before-result and after-result sections.

This is an executable governance-mechanics demonstration, not evidence that an LLM discovered a scientifically valid relationship.
