import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSpecialistPass, createHypothesis, discoverSignals, freezeHypothesis, validateHypothesis, createFailureRecord, createReflection, priorFailureWarning, statement, attemptFreezeMutation } from './core.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const csv = fs.readFileSync(path.join(root, 'datasets', 'local-temporal-observations.csv'), 'utf8').trim().split(/\r?\n/);
const [header, ...lines] = csv; const keys = header.split(',');
const rows = lines.map(line => Object.fromEntries(line.split(',').map((v, i) => [keys[i], Number.isNaN(Number(v)) ? v : Number(v)])));
const t0 = rows.filter(r => r.split === 'T0'); const t1 = rows.filter(r => r.split === 'T1');
const features = ['signal_feature', 'noise_feature'];
const signals = discoverSignals(rows, { datasetId: 'local-temporal-observations-v1', target: 'target', features, t0Rows: t0 });
const evidence = [{ type: 'LOCAL_DATASET', provenance: 'datasets/local-temporal-observations.csv', description: 'Rows available before the T0 freeze and held-out T1 rows.' }];
const passes = [];
for (const s of signals) {
  passes.push(createSpecialistPass({ signal: s.signal, role: 'DOMAIN_SPECIALIST', observation: `Association=${s.correlation?.toFixed(3)}`, reasoning: 'A stable mechanism may connect the discovered feature to the target.', statements: [{ text: 'A mechanism may explain the association.', status: 'HYPOTHESIS' }], falsificationCriteria: ['Held-out association does not meet the predefined threshold'], missingEvidence: ['Domain intervention'] }));
  passes.push(createSpecialistPass({ signal: s.signal, role: 'STATISTICIAN', observation: `T0 correlation=${s.correlation?.toFixed(3)}`, reasoning: 'Sampling, confounding, leakage, and instability must be considered.', statements: [{ text: 'The association may be a statistical artifact.', status: 'HYPOTHESIS' }], falsificationCriteria: ['Held-out data separates from T0'], missingEvidence: ['Independent replication'] }));
}
const signal = signals.find(x => x.signal.feature === 'signal_feature').signal;
const noiseSignal = signals.find(x => x.signal.feature === 'noise_feature').signal;
const hypotheses = [
  createHypothesis({ signal, label: 'H1 causal/domain mechanism', mechanism: 'signal_feature remains positively associated with target in held-out T1 rows.', supportingStatements: [statement({ text: 'T0 contains a positive feature-target association.', status: 'FACT', provenance: ['local-temporal-observations-v1:T0:rows'] })], counterEvidence: [{ type: 'COUNTER_EVIDENCE', text: 'T0 association alone does not establish causality.' }], missingEvidence: [{ type: 'MISSING_EVIDENCE', text: 'Independent replication or intervention.' }], falsificationCriteria: [{ type: 'correlation_at_least', threshold: 0.75 }], expectedObservations: ['T1 correlation >= 0.75'], tags: { featureFamily: 'signal', mechanismFamily: 'stable-association', datasetDomain: 'local-temporal' }, confidenceAtT0: 0.55 }),
  createHypothesis({ signal, label: 'H2 inverse alternative', mechanism: 'The observed relation is actually negative out of sample.', supportingStatements: [statement({ text: 'An inverse explanation remains logically possible.', status: 'HYPOTHESIS' })], counterEvidence: [{ type: 'COUNTER_EVIDENCE', text: 'T0 correlation is positive, which weighs against an inverse explanation.' }], missingEvidence: [{ type: 'MISSING_EVIDENCE', text: 'A preregistered independent replication.' }], falsificationCriteria: [{ type: 'correlation_at_most', threshold: -0.4 }], expectedObservations: ['T1 correlation <= -0.4'], tags: { featureFamily: 'signal', mechanismFamily: 'alternative', datasetDomain: 'local-temporal' }, confidenceAtT0: 0.2 }),
  createHypothesis({ signal: noiseSignal, label: 'H3 unstable/noise artifact', mechanism: 'The noise feature association disappears to near-zero in T1.', supportingStatements: [statement({ text: 'A finite-sample artifact is possible.', status: 'HYPOTHESIS' })], counterEvidence: [{ type: 'COUNTER_EVIDENCE', text: 'The T0 noise correlation is not itself proof of instability.' }], missingEvidence: [{ type: 'MISSING_EVIDENCE', text: 'A second held-out dataset.' }], falsificationCriteria: [{ type: 'absolute_correlation_below', threshold: 0.15 }], expectedObservations: ['absolute T1 correlation < 0.15'], tags: { featureFamily: 'noise', mechanismFamily: 'sampling-artifact', datasetDomain: 'local-temporal' }, confidenceAtT0: 0.25 })
];
const records = { signal, evidence, specialistPasses: passes, hypotheses: [], freezes: [], validations: [], failures: [], reflections: [], priorFailureWarnings: [] };
for (const h of hypotheses) {
  const freeze = freezeHypothesis(h, { evidenceAvailableAtT0: evidence, factsAtT0: h.supportingStatements.filter(x => x.status === 'FACT'), inferencesAtT0: [], hypothesisAtT0: { label: h.label, mechanism: h.mechanism }, counterEvidenceAtT0: h.counterEvidence, missingEvidenceAtT0: h.missingEvidence, confidenceAtT0: h.confidenceAtT0 });
  const validation = validateHypothesis(h, freeze, t1, { feature: h.feature, target: 'target', temporalBoundary: { train: 'T0', validation: 'T1', resultUnavailableAtT0: true } });
  records.hypotheses.push(h); records.freezes.push(freeze); records.validations.push(validation);
  if (validation.status === 'FAILED') records.failures.push(createFailureRecord(h, validation, validation.observations, 'The predefined T1 criterion was not met.', 'Do not treat T0 association as stable without out-of-sample support.'));
  records.reflections.push(createReflection(h, validation, { whatWasExpected: h.expectedObservations, whatOccurred: validation.observations, whatWasWrong: validation.status === 'FAILED' ? 'The predefined criterion failed.' : null, whatWasMissing: h.missingEvidence, whatWasLearned: `Lifecycle=${validation.status}; confidence was not used as truth authority.`, proposedNextExperiments: ['Repeat on an independent temporal slice'] }));
  const warning = priorFailureWarning(h, records.failures); if (warning) records.priorFailureWarnings.push(warning);
}
const failedHypothesis = records.hypotheses.find(h => records.validations.find(v => v.hypothesisId === h.hypothesisId)?.status === 'FAILED');
const priorCandidate = createHypothesis({ signal, label: 'H2 follow-up candidate', mechanism: failedHypothesis.mechanism, supportingStatements: [], falsificationCriteria: failedHypothesis.falsificationCriteria, expectedObservations: failedHypothesis.expectedObservations, tags: failedHypothesis.tags });
records.priorFailureWarnings.push(priorFailureWarning(priorCandidate, records.failures));
records.priorFailureWarnings = records.priorFailureWarnings.filter(Boolean);
let illegalMutationRejected = false;
try { attemptFreezeMutation(records.freezes[0], { hypothesisAtT0: { tampered: true } }); } catch { illegalMutationRejected = true; }
let reflectionCannotRewriteT0 = false;
try { attemptFreezeMutation(records.freezes[0], { whatWasLearned: 'post-outcome rewrite attempt' }); } catch { reflectionCannotRewriteT0 = true; }
let unsupportedFactRejected = false;
try { statement({ text: 'unproven model output', status: 'FACT' }); } catch { unsupportedFactRejected = true; }
records.governanceChecks = {
  t0Rows: t0.length, t1Rows: t1.length, resultUnavailableAtT0: true,
  allFalsificationCriteriaFrozenBeforeValidation: records.freezes.length === records.hypotheses.length,
  illegalMutationRejected, reflectionCannotRewriteT0, unsupportedFactRejected,
  freezeHashReproducible: records.freezes.every(f => f.contentHash === freezeHypothesis(records.hypotheses.find(h => h.hypothesisId === f.hypothesisId), { evidenceAvailableAtT0: f.evidenceAvailableAtT0, factsAtT0: f.factsAtT0, inferencesAtT0: f.inferencesAtT0, hypothesisAtT0: f.hypothesisAtT0, counterEvidenceAtT0: f.counterEvidenceAtT0, missingEvidenceAtT0: f.missingEvidenceAtT0, confidenceAtT0: f.confidenceAtT0 }).contentHash),
  failedHypothesisStillStored: records.hypotheses.some(h => h.hypothesisId === failedHypothesis.hypothesisId)
};
records.illegalMutationRejected = illegalMutationRejected;
const outDir = path.join(root, 'demo-output'); fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'research-records.json'), JSON.stringify(records, null, 2));
const report = `# ALTORA Research Validation Bridge — demo\n\n## SIGNAL DISCOVERED\n- Feature: ${signal.feature}\n- Dataset: local-temporal-observations-v1\n- T0 rows: ${t0.length}; T1 rows: ${t1.length}\n- Association at T0: ${signal.association.toFixed(3)}\n\n## BEFORE RESULT: T0 FREEZE\nThree competing hypotheses were frozen before held-out validation. T0 freeze hashes are listed in the records artifact. Specialist outputs defaulted to HYPOTHESIS; only row-backed statements were FACT. Counter-evidence and missing evidence were stored in each freeze.\n\n## SPECIALIST PERSPECTIVES\n${passes.map(p => `- ${p.role}: ${p.reasoning}`).join('\n')}\n\n## F-ARRAY CLASSIFICATION\nFACT, INFERENCE, HYPOTHESIS, UNKNOWN were kept distinct. Counter-evidence, missing evidence, alternative models, contradiction and what-would-break-this were preserved as fields.\n\n## AFTER RESULT: VALIDATION\n${records.validations.map(v => `- ${records.hypotheses.find(h => h.hypothesisId === v.hypothesisId).label}: **${v.status}**; T1 correlation=${v.observations.correlation?.toFixed(3)}; criterion=${JSON.stringify(v.predefinedCriterion)}`).join('\n')}\n\n## FAILURE ACCOUNTING\n${records.failures.length ? records.failures.map(f => `- ${f.failureType}: observed correlation=${f.evidence.correlation?.toFixed(3)} did not meet ${JSON.stringify(f.failedCriterion)}; ${f.reusableLesson}`).join('\n') : '- No failed hypothesis in this run.'}\n\n## REFLECTION\nReflections were written after outcomes and contain proposed next experiments. They do not modify freezes.\n\n## INTEGRITY\n- Governance checks: ${JSON.stringify(records.governanceChecks)}\n- Prior failure warning: ${records.priorFailureWarnings.length ? 'present' : 'none'}\n\n## NEXT EXPERIMENT\nRepeat the surviving candidate on an independent temporal slice and add an intervention or external replication before making a causal claim.\n`;
fs.writeFileSync(path.join(outDir, 'research-report.md'), report);
console.log(JSON.stringify({ output: outDir, outcomes: records.validations.map(v => v.status), illegalMutationRejected: records.illegalMutationRejected }, null, 2));
