# ALTORA Research Validation Bridge — demo

## SIGNAL DISCOVERED
- Feature: signal_feature
- Dataset: local-temporal-observations-v1
- T0 rows: 20; T1 rows: 20
- Association at T0: 1.000

## BEFORE RESULT: T0 FREEZE
Three competing hypotheses were frozen before held-out validation. T0 freeze hashes are listed in the records artifact. Specialist outputs defaulted to HYPOTHESIS; only row-backed statements were FACT. Counter-evidence and missing evidence were stored in each freeze.

## SPECIALIST PERSPECTIVES
- DOMAIN_SPECIALIST: A stable mechanism may connect the discovered feature to the target.
- STATISTICIAN: Sampling, confounding, leakage, and instability must be considered.
- DOMAIN_SPECIALIST: A stable mechanism may connect the discovered feature to the target.
- STATISTICIAN: Sampling, confounding, leakage, and instability must be considered.

## F-ARRAY CLASSIFICATION
FACT, INFERENCE, HYPOTHESIS, UNKNOWN were kept distinct. Counter-evidence, missing evidence, alternative models, contradiction and what-would-break-this were preserved as fields.

## AFTER RESULT: VALIDATION
- H1 causal/domain mechanism: **SURVIVED**; T1 correlation=1.000; criterion={"type":"correlation_at_least","threshold":0.75}
- H2 inverse alternative: **FAILED**; T1 correlation=1.000; criterion={"type":"correlation_at_most","threshold":-0.4}
- H3 unstable/noise artifact: **SURVIVED**; T1 correlation=-0.012; criterion={"type":"absolute_correlation_below","threshold":0.15}

## FAILURE ACCOUNTING
- correlation_at_most: observed correlation=1.000 did not meet {"type":"correlation_at_most","threshold":-0.4}; Do not treat T0 association as stable without out-of-sample support.

## REFLECTION
Reflections were written after outcomes and contain proposed next experiments. They do not modify freezes.

## INTEGRITY
- Governance checks: {"t0Rows":20,"t1Rows":20,"resultUnavailableAtT0":true,"allFalsificationCriteriaFrozenBeforeValidation":true,"illegalMutationRejected":true,"reflectionCannotRewriteT0":true,"unsupportedFactRejected":true,"freezeHashReproducible":true,"failedHypothesisStillStored":true}
- Prior failure warning: present

## NEXT EXPERIMENT
Repeat the surviving candidate on an independent temporal slice and add an intervention or external replication before making a causal claim.
