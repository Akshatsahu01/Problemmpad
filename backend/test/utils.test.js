import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOutput, judgeStatus, normalizeGeneratedTests } from '../src/utils.js';

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
