import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOutput, judgeStatus, selectExecutionCases, normalizeGeneratedTests, normalizeGeneratedInput, buildTestGenerationPrompt } from '../src/utils.js';

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

test('AI inputs use the array and target layout when no sample exists', () => {
  const problem = { inputFormat: 'An array of numbers and a target number', tests: [] };
  assert.equal(normalizeGeneratedInput({ arr: [1, 2, 3], target: 3 }, problem), '[1,2,3] 3');
  assert.equal(normalizeGeneratedInput('{"nums":[1,2,3],"target":3}', problem), '[1,2,3] 3');
  assert.equal(normalizeGeneratedInput('{"unrelated":true}', problem), null);
  assert.equal(normalizeGeneratedInput('[1,2,3] 3', problem), '[1,2,3] 3');
});

test('AI inputs match handwritten sample stdin layout', () => {
  const structured = { arr: [1, 2, 3], target: 3 };
  const sample = (input) => ({ inputFormat: 'An array and a target number', tests: [{ source: 'manual', visibility: 'sample', input }] });
  assert.equal(normalizeGeneratedInput(structured, sample('[1,2,3,4,5] 3')), '[1,2,3] 3');
  assert.equal(normalizeGeneratedInput(structured, sample('5\n1 2 3 4 5\n3')), '3\n1 2 3\n3');
  assert.equal(normalizeGeneratedInput('[1,2,3] 3', sample('5\n1 2 3 4 5\n3')), null);
  assert.match(buildTestGenerationPrompt(sample('5\n1 2 3 4 5\n3')), /Match the exact stdin layout/);
});

test('generated test suites convert structured input before saving', () => {
  const problem = { inputFormat: 'An array and a target number' };
  assert.deepEqual(normalizeGeneratedTests([{ input: { arr: [1, 2, 3], target: 3 }, expectedOutput: '1' }], problem), [
    { input: '[1,2,3] 3', expectedOutput: '1', description: '' },
  ]);
});

test('rejects malformed or oversized Gemini test suites', () => {
  assert.equal(normalizeGeneratedTests([{ input: 'x' }]), null);
  assert.equal(normalizeGeneratedTests(Array.from({ length: 9 }, () => ({ input: '', expectedOutput: '' }))), null);
});
