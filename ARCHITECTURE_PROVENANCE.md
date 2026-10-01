# Architecture provenance

This project transfers concepts; it does not copy private production source.

| Concept | Source system | Source file/symbol | Original domain | Reused | Changed | Classification |
|---|---|---|---|---|---|---|
| Dynamic operator subset | Current ALTORA Core | `server/index.mjs`: `selectFArrayOperators`, `fArray` | Market/world reasoning | Select relevant operators and use reasoning passes | Domain-neutral operators and fixed local records | Reimplemented concept |
| Epistemic firewall | Current ALTORA Core | `server/index.mjs`: `systemPrompt` | Current factual reasoning | FACT/INFERENCE/HYPOTHESIS/UNKNOWN separation and provenance gate | No market prompts; explicit runtime validator | Adapted concept |
| Contradiction and break search | Current ALTORA Core | F-ARRAY operator pool | Structural reasoning | Counter-evidence, missing evidence, alternative model, what-would-break-this | Stored as research fields | Reimplemented concept |
| Canonical pre-outcome boundary | Later PUMP/Bitget Terminal | RC2 discovery/freeze/forward pipeline and immutable manifests | Market research | T0 freeze before result, temporal boundary, predefined validation | Generic rows and criteria; no slots/prices/finality | Reimplemented concept |
| Failure accounting | Later Terminal and ALTORA-C audit patterns | Quarantine/failure artifacts and governed records | Market/data quality and sales governance | First-class failure records and reusable lessons | Generic failure types; no proprietary schemas | Reimplemented concept |
| Reflection and epoch memory | Current ALTORA Core | `paper-runtime.mjs`, `server/index.mjs`: outcome/reflection/epoch flow | Paper research | Post-outcome reflection and deterministic memory fields | No SQLite or model provider in v0 | Adapted concept |

## Explicit non-reuse

No VPS source, Docker image, SQLite data, private prompt, credential, F-ARRAY repository, PUMP/Bitget source, ALTORA-C source, or AppDeploy deployment was copied into this repository.
