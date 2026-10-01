# Demo walkthrough

1. `npm test` verifies provenance gating, specialist defaults, independent hypotheses, freeze hashing, all lifecycle states, failure accounting, reflection separation, and deterministic prior-failure warnings.
2. `npm run demo` reads `datasets/local-temporal-observations.csv`.
3. T0 rows produce a discovered signal and specialist perspectives.
4. H1, H2, and H3 are frozen before T1 is read by validation.
5. Validation applies each predefined correlation criterion.
6. `demo-output/research-report.md` shows the research process; `research-records.json` contains the inspectable records.
