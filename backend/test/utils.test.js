import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOutput, judgeStatus, selectExecutionCases, normalizeGeneratedTests } from '../src/utils.js';

test('submissions use handwritten cases and verified AI cases', () => {
  const cases = [
    { id: 'manual-1', source: 'manual', verified: false, visibility: 'sample' },
    { id: 'manual-2', source: 'manual', verified: false, visibility: 'hidden' },
    { id: 'ai-unverified', source: 'ai', verified: false, visibility: 'hidden' },
    { id: 'ai-verified', source: 'ai', verified: true, visibility: 'hidden' },
  ];
  assert.deepEqual(selectExecutionCases(cases, true).map((item) => item.id), [
    'manual-1', 'manual-2', 'ai-verified',
  ]);
  assert.deepEqual(selectExecutionCases(cases, false, ['manual-1']).map((item) => item.id), [
    'manual-1',
  ]);
});

test('normalizes line endings and trailing whitespace', () => {
  assert.equal(normalizeOutput('alpha  \r\nbeta\t\n\n'), 'alpha\nbeta');
});

test('keeps meaningful internal whitespace differences', () => {
  assert.notEqual(normalizeOutput('two words'), normalizeOutput('two  words'));
});

test('calculates submission status from provider result types', () => {
  assert.equal(judgeStatus([{ passed: true }, { passed: true }]), 'Accepted');
  assert.equal(judgeStatus([{ passed: false, compileError: true }]), 'Compile Error');
  assert.equal(judgeStatus([{ passed: false, runtimeError: true }]), 'Runtime Error');
  assert.equal(judgeStatus([{ passed: false }]), 'Wrong Answer');
});

test('converts structured Gemini input and output values to text cases', () => {
  assert.deepEqual(
    normalizeGeneratedTests([
      { input: { nums: [2, 7], target: 9 }, expectedOutput: [0, 1] },
    ]),
    [{ input: '{"nums":[2,7],"target":9}', expectedOutput: '[0,1]', description: '' }],
  );
});

test('rejects malformed or oversized Gemini test suites', () => {
  assert.equal(normalizeGeneratedTests([{ input: 'x' }]), null);
  assert.equal(normalizeGeneratedTests(Array.from({ length: 9 }, () => ({ input: '', expectedOutput: '' }))), null);
});
