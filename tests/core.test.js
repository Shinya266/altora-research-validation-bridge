import test from 'node:test';
import assert from 'node:assert/strict';
import { createSignal, statement, createSpecialistPass, createHypothesis, freezeHypothesis, verifyFreeze, attemptFreezeMutation, validateHypothesis, createFailureRecord, createReflection, priorFailureWarning } from '../src/core.js';

const signal = createSignal({ signalId: 's1', datasetId: 'd1', feature: 'x', target: 'y', supportingEvidence: [{ provenance: 'fixture.csv:1-3' }] });
const rows = [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }, { x: 4, y: 4 }, { x: 5, y: 5 }];
const baseHypothesis = criterion => createHypothesis({ signal, label: 'candidate', mechanism: 'x may explain y', supportingStatements: [], falsificationCriteria: [criterion], expectedObservations: [], tags: { featureFamily: 'x', mechanismFamily: 'm' } });

test('unsupported FACT promotion is rejected', () => assert.throws(() => statement({ text: 'generated claim', status: 'FACT' }), /unsupported_FACT/));
test('FACT with provenance is accepted', () => assert.equal(statement({ text: 'row-backed fact', status: 'FACT', provenance: ['fixture.csv:1'] }).status, 'FACT'));
test('specialist output defaults to non-FACT', () => {
  const p = createSpecialistPass({ signal, role: 'STATISTICIAN', observation: 'r=1', reasoning: 'candidate artifact', statements: [{ text: 'possible leakage', status: 'FACT' }] });
  assert.equal(p.statements[0].status, 'HYPOTHESIS');
});
test('competing hypotheses remain independent', () => assert.notEqual(baseHypothesis({ type: 'correlation_at_least', threshold: .5 }).hypothesisId, baseHypothesis({ type: 'correlation_at_most', threshold: -.5 }).hypothesisId));
test('freeze is immutable and hash reproducible', () => {
  const h = baseHypothesis({ type: 'correlation_at_least', threshold: .5 });
  const f = freezeHypothesis(h, { evidenceAvailableAtT0: [{ provenance: 'fixture:T0' }] });
  assert.equal(verifyFreeze(f), true);
  assert.equal(f.contentHash, freezeHypothesis(h, { evidenceAvailableAtT0: [{ provenance: 'fixture:T0' }] }).contentHash);
  assert.throws(() => attemptFreezeMutation(f, { hypothesisAtT0: { changed: true } }), /immutable_freeze/);
  assert.equal(verifyFreeze(f), true);
});
test('validation lifecycle supports SURVIVED, FAILED, and INCONCLUSIVE', () => {
  const survivedH = baseHypothesis({ type: 'correlation_at_least', threshold: .5 });
  const failedH = baseHypothesis({ type: 'correlation_at_most', threshold: -.5 });
  const inconclusiveH = baseHypothesis({ type: 'correlation_at_least', threshold: 2 });
  const vs = h => validateHypothesis(h, freezeHypothesis(h, {}), rows, { feature: 'x', target: 'y', temporalBoundary: { resultUnavailableAtT0: true } });
  assert.equal(vs(survivedH).status, 'SURVIVED'); assert.equal(vs(failedH).status, 'FAILED');
  assert.equal(validateHypothesis(inconclusiveH, freezeHypothesis(inconclusiveH, {}), [], { feature: 'x', target: 'y', temporalBoundary: {} }).status, 'INCONCLUSIVE');
});
test('missing and counter evidence persist through freeze', () => {
  const h = createHypothesis({ signal, label: 'x', mechanism: 'm', supportingStatements: [], counterEvidence: [{ text: 'counter' }], missingEvidence: [{ text: 'missing' }], falsificationCriteria: [{ type: 'correlation_at_least', threshold: .5 }], expectedObservations: [] });
  const f = freezeHypothesis(h, {}); assert.deepEqual(f.counterEvidenceAtT0, [{ text: 'counter' }]); assert.deepEqual(f.missingEvidenceAtT0, [{ text: 'missing' }]);
});
test('failure and reflection are separate from freeze', () => {
  const h = baseHypothesis({ type: 'correlation_at_most', threshold: -.5 }); const f = freezeHypothesis(h, {}); const v = validateHypothesis(h, f, rows, { feature: 'x', target: 'y', temporalBoundary: {} }); const failure = createFailureRecord(h, v, v.observations, 'criterion failed', 'review stability'); const reflection = createReflection(h, v, { whatWasExpected: [], whatOccurred: v.observations, whatWasWrong: 'threshold', whatWasMissing: [], whatWasLearned: 'out of sample failed', proposedNextExperiments: [] });
  assert.equal(failure.hypothesisId, h.hypothesisId); assert.equal(reflection.outcomeId, v.validationId); assert.equal(verifyFreeze(f), true);
});
test('prior-failure warning uses deterministic tags and criterion', () => {
  const old = baseHypothesis({ type: 'correlation_at_most', threshold: -.5 }); const oldF = freezeHypothesis(old, {}); const oldV = validateHypothesis(old, oldF, rows, { feature: 'x', target: 'y', temporalBoundary: {} }); const failure = createFailureRecord(old, oldV, {}, 'failed', 'lesson');
  const next = createHypothesis({ signal, label: 'next', mechanism: 'm', supportingStatements: [], tags: old.tags, falsificationCriteria: [{ type: 'correlation_at_most', threshold: -.2 }], expectedObservations: [] });
  assert.equal(priorFailureWarning(next, [failure]).type, 'PRIOR_FAILURE_WARNING');
});
