import crypto from 'node:crypto';

export const EPISTEMIC = Object.freeze(['FACT', 'INFERENCE', 'HYPOTHESIS', 'UNKNOWN']);
export const OUTCOMES = Object.freeze(['SURVIVED', 'FAILED', 'INCONCLUSIVE']);
export const SPECIALISTS = Object.freeze(['DOMAIN_SPECIALIST', 'STATISTICIAN', 'FALSIFIER', 'ALTERNATIVE_MODEL']);

const id = prefix => `${prefix}_${crypto.randomUUID()}`;
const clone = value => JSON.parse(JSON.stringify(value));
const sha256 = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function assert(condition, message) { if (!condition) throw new Error(message); }

export function createSignal(input) {
  assert(input?.signalId && input.datasetId && input.feature && input.target, 'invalid_signal');
  return {
    signalId: String(input.signalId), createdAt: input.createdAt || new Date().toISOString(),
    datasetId: String(input.datasetId), feature: String(input.feature), target: String(input.target),
    association: input.association ?? null, timeWindow: input.timeWindow ?? null,
    metadata: clone(input.metadata || {}), supportingEvidence: clone(input.supportingEvidence || [])
  };
}

export function statement({ text, status, provenance = null, source = null, category = null, confidence = null } = {}) {
  assert(typeof text === 'string' && text.length > 0, 'statement_text_required');
  assert(EPISTEMIC.includes(status), `invalid_epistemic_status:${status}`);
  if (status === 'FACT') assert(provenance && provenance.length > 0, 'unsupported_FACT_promotion');
  return { text, status, provenance, source, category, confidence };
}

export function createSpecialistPass({ signal, role, observation, reasoning, statements = [], falsificationCriteria = [], missingEvidence = [] }) {
  assert(SPECIALISTS.includes(role), `invalid_specialist:${role}`);
  const safeStatements = statements.map(s => {
    const item = { ...s, status: s.status === 'FACT' ? 'HYPOTHESIS' : (s.status || 'HYPOTHESIS') };
    return statement(item);
  });
  return { passId: id('pass'), signalId: signal.signalId, role, observation, reasoning,
    statements: safeStatements, falsificationCriteria: clone(falsificationCriteria), missingEvidence: clone(missingEvidence), createdAt: new Date().toISOString() };
}

export function createHypothesis({ signal, hypothesisId, label, mechanism, supportingStatements, counterEvidence = [], missingEvidence = [], falsificationCriteria, expectedObservations, tags = {}, confidenceAtT0 = null }) {
  assert(label && mechanism && Array.isArray(falsificationCriteria) && falsificationCriteria.length, 'invalid_hypothesis');
  const stableHypothesisId = hypothesisId || `hyp_${sha256({ signalId: signal.signalId, label, mechanism, falsificationCriteria }).slice(0, 16)}`;
  return { hypothesisId: stableHypothesisId, signalId: signal.signalId, feature: signal.feature, label, mechanism,
    supportingStatements: clone(supportingStatements || []), counterEvidence: clone(counterEvidence), missingEvidence: clone(missingEvidence),
    falsificationCriteria: clone(falsificationCriteria), expectedObservations: clone(expectedObservations || []), tags: clone(tags),
    confidenceAtT0, createdAt: new Date().toISOString() };
}

export function freezeHypothesis(hypothesis, { evidenceAvailableAtT0, factsAtT0, inferencesAtT0, hypothesisAtT0, counterEvidenceAtT0, missingEvidenceAtT0, confidenceAtT0 }) {
  assert(hypothesis?.hypothesisId, 'hypothesis_required');
  const body = { freezeId: id('freeze'), hypothesisId: hypothesis.hypothesisId, frozenAt: new Date().toISOString(), signalId: hypothesis.signalId,
    evidenceAvailableAtT0: clone(evidenceAvailableAtT0 || []), factsAtT0: clone(factsAtT0 || []), inferencesAtT0: clone(inferencesAtT0 || []),
    hypothesisAtT0: clone(hypothesisAtT0 || { label: hypothesis.label, mechanism: hypothesis.mechanism }),
    counterEvidenceAtT0: clone(counterEvidenceAtT0 || hypothesis.counterEvidence), missingEvidenceAtT0: clone(missingEvidenceAtT0 || hypothesis.missingEvidence),
    confidenceAtT0: confidenceAtT0 ?? hypothesis.confidenceAtT0 ?? null, falsificationCriteria: clone(hypothesis.falsificationCriteria),
    expectedObservations: clone(hypothesis.expectedObservations) };
  return Object.freeze({ ...body, contentHash: sha256(freezeHashBody(body)) });
}

function freezeHashBody(freeze) {
  const { freezeId, frozenAt, contentHash, ...stable } = freeze;
  return stable;
}

export function verifyFreeze(freeze) {
  return freeze.contentHash === sha256(freezeHashBody(freeze));
}

export function attemptFreezeMutation(freeze, patch) {
  const copy = { ...freeze, ...clone(patch) };
  if (copy.contentHash !== freeze.contentHash || !verifyFreeze(copy)) throw new Error('immutable_freeze_mutation_rejected');
  return freeze;
}

export function pearson(rows, x, y) {
  const pairs = rows.map(r => [Number(r[x]), Number(r[y])]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  if (pairs.length < 3) return null;
  const mx = pairs.reduce((s, p) => s + p[0], 0) / pairs.length;
  const my = pairs.reduce((s, p) => s + p[1], 0) / pairs.length;
  const num = pairs.reduce((s, [a, b]) => s + (a - mx) * (b - my), 0);
  const dx = Math.sqrt(pairs.reduce((s, [a]) => s + (a - mx) ** 2, 0));
  const dy = Math.sqrt(pairs.reduce((s, [, b]) => s + (b - my) ** 2, 0));
  return dx && dy ? num / (dx * dy) : null;
}

export function validateHypothesis(hypothesis, freeze, rows, { feature, target, temporalBoundary, method = 'Pearson correlation on held-out rows' }) {
  assert(verifyFreeze(freeze), 'freeze_hash_invalid');
  const observations = { correlation: pearson(rows, feature, target), rowCount: rows.length, feature, target };
  const criterion = hypothesis.falsificationCriteria[0];
  let status = 'INCONCLUSIVE';
  if (criterion.type === 'correlation_at_least') status = observations.correlation !== null && observations.correlation >= criterion.threshold ? 'SURVIVED' : (observations.correlation === null ? 'INCONCLUSIVE' : 'FAILED');
  if (criterion.type === 'correlation_at_most') status = observations.correlation !== null && observations.correlation <= criterion.threshold ? 'SURVIVED' : (observations.correlation === null ? 'INCONCLUSIVE' : 'FAILED');
  if (criterion.type === 'absolute_correlation_below') status = observations.correlation === null ? 'INCONCLUSIVE' : (Math.abs(observations.correlation) < criterion.threshold ? 'SURVIVED' : 'FAILED');
  return { validationId: id('validation'), hypothesisId: hypothesis.hypothesisId, freezeId: freeze.freezeId, startedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
    method, dataset: { rowCount: rows.length, datasetId: hypothesis.signalId }, temporalBoundary, observations, metrics: { correlation: observations.correlation }, status,
    predefinedCriterion: clone(criterion) };
}

export function createFailureRecord(hypothesis, validation, evidence, explanation, reusableLesson) {
  assert(validation.status === 'FAILED', 'failure_requires_FAILED_validation');
  return { failureId: id('failure'), hypothesisId: hypothesis.hypothesisId, validationId: validation.validationId,
    failureType: validation.predefinedCriterion.type, failedCriterion: clone(validation.predefinedCriterion), tags: clone(hypothesis.tags || {}), evidence: clone(evidence), explanation, reusableLesson, createdAt: new Date().toISOString() };
}

export function createReflection(hypothesis, validation, fields) {
  assert(OUTCOMES.includes(validation.status), 'reflection_requires_outcome');
  return { reflectionId: id('reflection'), hypothesisId: hypothesis.hypothesisId, outcomeId: validation.validationId, createdAt: new Date().toISOString(), ...clone(fields) };
}

export function priorFailureWarning(hypothesis, failures) {
  const matches = failures.filter(f => f.hypothesisId !== hypothesis.hypothesisId && f.failureType === hypothesis.falsificationCriteria[0]?.type &&
    [hypothesis.tags?.featureFamily, hypothesis.tags?.mechanismFamily, hypothesis.tags?.datasetDomain].some(v => v && Object.values(f.tags || {}).includes(v)));
  return matches.length ? { type: 'PRIOR_FAILURE_WARNING', references: matches.map(x => x.failureId), message: 'A deterministic tag/criterion match was found; this is not a semantic-equivalence claim.' } : null;
}

export function discoverSignals(rows, { datasetId, target, features, t0Rows }) {
  return features.map(feature => ({ signal: createSignal({ signalId: `signal_${sha256({ datasetId, feature, target }).slice(0, 16)}`, datasetId, feature, target, association: pearson(t0Rows, feature, target), timeWindow: { start: rows[0]?.timestamp, end: t0Rows.at(-1)?.timestamp }, metadata: { discovery: 'local_pearson_scan', t0Rows: t0Rows.length }, supportingEvidence: [{ type: 'DATASET_ROWS', rowCount: t0Rows.length, provenance: `local:${datasetId}:T0` }] }), correlation: pearson(t0Rows, feature, target) }));
}
