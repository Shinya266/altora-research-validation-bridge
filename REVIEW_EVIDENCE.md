# Final external-review evidence

This audit is based on `demo-output/research-records.json`, `src/core.js`, `src/demo.js`, and the executable tests. The demo is deterministic software-mechanics evidence, not scientific evidence that the fixture relationship is causal.

| Invariant | Source | Test | Demo evidence | Status |
|---|---|---|---|---|
| T0 information is bounded | `src/demo.js`: `t0 = rows.filter(...)`, `freezeHypothesis(...)` | `core.test.js`: freeze lifecycle | `governanceChecks.t0Rows=20`; freezes contain T0 evidence/facts only | PASS |
| T1 is unavailable during T0 | `src/demo.js`: validation receives `temporalBoundary.resultUnavailableAtT0=true` only after freeze | `core.test.js`: validation after freeze | Every validation has `train=T0`, `validation=T1`, `resultUnavailableAtT0=true` | PASS |
| Criteria exist before outcome | `src/core.js`: `createHypothesis`, `freezeHypothesis`, `validateHypothesis` | `core.test.js`: freeze/validation lifecycle | `allFalsificationCriteriaFrozenBeforeValidation=true`; frozen criteria are copied into each validation | PASS |
| H2 failed by predefined criterion | `src/core.js`: `correlation_at_most` branch | `core.test.js`: FAILED lifecycle | H2 criterion `correlation <= -0.4`; T1 observed `0.9996851605515977`; status `FAILED` | PASS |
| Failure was not invented after T1 | `src/core.js`: validation compares observation to frozen criterion; `createFailureRecord` copies criterion | `core.test.js`: failure requires FAILED validation | Failure record stores `failedCriterion={type:correlation_at_most,threshold:-0.4}` and observed T1 evidence | PASS |
| Illegal freeze mutation rejected | `src/core.js`: `attemptFreezeMutation` and `verifyFreeze` | `core.test.js`: `immutable_freeze_mutation_rejected` | `governanceChecks.illegalMutationRejected=true` | PASS |
| Freeze hash deterministic | `src/core.js`: deterministic signal/hypothesis IDs, `freezeHashBody`, `sha256`, `verifyFreeze` | `core.test.js`: two equal-content freezes have equal hashes; demo rerun produced identical three hashes | `governanceChecks.freezeHashReproducible=true`; current stable hashes begin `9008327d...`, `ffb97f2b...`, `eaa96b42...` | PASS |
| Unsupported FACT rejected | `src/core.js`: `statement` requires non-empty provenance for FACT | `core.test.js`: unsupported FACT promotion | `governanceChecks.unsupportedFactRejected=true` | PASS |
| Accepted FACT has provenance | `src/demo.js`: row-backed H1 statement | `core.test.js`: FACT with provenance accepted | H1 frozen fact provenance is `local-temporal-observations-v1:T0:rows` | PASS |
| Specialist output is not FACT by default | `src/core.js`: `createSpecialistPass` maps FACT input to HYPOTHESIS | `core.test.js`: specialist output defaults non-FACT | All demo specialist statuses are `HYPOTHESIS` | PASS |
| Competing explanations preserved | `src/demo.js`: H1, H2, H3 | `core.test.js`: independent hypothesis IDs | H1 stable mechanism, H2 inverse alternative, H3 sampling/noise artifact each have separate freeze IDs | PASS |
| Counter/missing evidence survives freeze | `src/core.js`: freeze fields; `src/demo.js`: hypothesis fields | `core.test.js`: freeze preservation | Every current freeze contains `COUNTER_EVIDENCE` and `MISSING_EVIDENCE` entries | PASS |
| Reflection is post-outcome | `src/demo.js`: `validateHypothesis` precedes `createReflection` | `core.test.js`: reflection requires outcome | Each reflection `outcomeId` equals a completed validation ID | PASS |
| Reflection cannot rewrite T0 | `src/core.js`: freeze hash verification | `core.test.js`: freeze remains valid after reflection path | `governanceChecks.reflectionCannotRewriteT0=true`; original freeze hashes remain valid | PASS |
| Failed hypothesis remains queryable | `src/demo.js`: hypotheses retained; failure is appended separately | `core.test.js`: failure references hypothesis | `governanceChecks.failedHypothesisStillStored=true`; failed H2 remains in `hypotheses[]` and `failures[]` | PASS |
| Prior-failure warning deterministic | `src/core.js`: `priorFailureWarning` matches tags and criterion | `core.test.js`: deterministic tag/criterion match | `priorFailureWarnings[0].type=PRIOR_FAILURE_WARNING`, referencing the failed record | PASS |

## Critical answers

### A. What this does beyond “four LLM agents and summarize”

It creates an explicit pre-result boundary, requires provenance for FACT, preserves competing hypotheses, stores counter/missing evidence, evaluates only against predefined criteria, records failure as a first-class result, keeps reflection separate from T0, and surfaces deterministic prior failures. A normal summary pipeline does not necessarily enforce any of those invariants.

### B. Executable invariants versus documentation

Executable: provenance-gated FACT, specialist status downgrade, freeze hash verification, mutation rejection, predefined lifecycle status, failure creation only for FAILED, reflection requiring an outcome, deterministic warning, no network/execution imports in the core demo.

Documentation only: the architectural analogy to ALTORA/Terminal, the claim that these mechanisms are useful in scientific research, and any claim about real-world causal validity.

### C. Deterministic/demo-dependent parts

The specialist text, signal discovery fixture, hypotheses, and criteria are deterministic. No LLM is invoked. The prototype proves governance mechanics, not model-generated reasoning quality.

### D. Scientific meaning

The demo is not scientifically meaningful evidence for the relationship. It is suitable as a transparent process-integrity demonstration: T0/T1 separation, predefined criteria, failure accounting, and post-result reflection are inspectable.

### E. Strongest legitimate claim

This is a runnable, domain-neutral prototype showing that evidence-bounded hypotheses can be frozen before held-out validation and that failures/reflections can be persisted without rewriting the frozen T0 state.

### F. Overstated claims to avoid

Do not claim causal discovery, scientific validity, production readiness, autonomous truth, live LLM reasoning, semantic prior-failure equivalence, official dotData integration, or representation of dotData internals.

### G. Five-minute reading order

1. `demo-output/research-report.md`
2. `demo-output/research-records.json`
3. `src/core.js`
4. `src/demo.js`
5. `tests/core.test.js`
6. `ARCHITECTURE_PROVENANCE.md`
7. `LIMITATIONS.md`

### H. Independent verification

Yes, with the included `package.json`, source, tests, fixture, and demo artifacts. A reviewer can run `npm test` and `npm run demo` without private ALTORA/Terminal code or network access.

### I. SEND_PACKAGE privacy scan

The package contains none of the prohibited deployment, credential, private-source, customer, or account materials. References to “VPS”, “ALTORA”, and “dotData” are provenance/limitation statements only; they do not expose private implementation or claim affiliation.

### J. Documentation claims checked

README and technical documents state that this is an independent prototype, not an official dotData integration, not a claim about dotData internal architecture, limited to a small local observational fixture, and not an autonomous truth engine. They also state that specialist reasoning is candidate reasoning rather than fact.
