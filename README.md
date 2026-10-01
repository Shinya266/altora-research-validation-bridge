# ALTORA Research Validation Bridge

An independent prototype exploring evidence-governed hypothesis validation after automated feature discovery.

This is not a dotData product, official integration, reverse-engineered API, replacement for domain experts, or autonomous truth engine. It uses only a local CSV fixture and the Node.js standard library. It has no network, trading, VPS, AppDeploy, ALTORA-C, or private F-ARRAY dependency.

## Core idea

Discovery is not the endpoint:

`observation -> competing explanations -> evidence-bounded hypotheses -> pre-outcome freeze -> validation -> failure/survival -> research memory`

The prototype makes T0 evidence and frozen hypotheses explicit. Specialist output defaults to `HYPOTHESIS`; `FACT` requires provenance. Validation status is determined only by predefined criteria, never by language-model confidence. The v0 demo uses deterministic specialist text; it does not claim to demonstrate live LLM reasoning.

## Run

```text
npm test
npm run demo
```

The demo writes `demo-output/research-records.json` and `demo-output/research-report.md`. It produces one `SURVIVED`, one `FAILED`, and one `SURVIVED` noise-artifact hypothesis on the local temporal fixture. The test suite also exercises `INCONCLUSIVE`.

## Review map

- [ARCHITECTURE_PROVENANCE.md](ARCHITECTURE_PROVENANCE.md)
- [TECHNICAL_OVERVIEW.md](TECHNICAL_OVERVIEW.md)
- [DEMO_WALKTHROUGH.md](DEMO_WALKTHROUGH.md)
- [LIMITATIONS.md](LIMITATIONS.md)
- [REVIEW_EVIDENCE.md](REVIEW_EVIDENCE.md)
