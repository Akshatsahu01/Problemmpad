import test from 'node:test';
import assert from 'node:assert/strict';
import { geminiModelCandidates, generateGeminiContentWithFallback, geminiErrorResponse } from '../src/gemini.js';

test('uses current models by default and keeps a configured preferred model first', () => {
  assert.deepEqual(geminiModelCandidates(), ['gemini-3.5-flash-lite', 'gemini-3.8-flash']);
  assert.deepEqual(geminiModelCandidates(undefined, 'gemini-2.5-flash'), ['gemini-2.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash']);
  assert.deepEqual(geminiModelCandidates('gemini-3.8-flash, gemini-3.5-flash-lite'), ['gemini-3.8-flash', 'gemini-3.5-flash-lite']);
});

test('falls back when the first model is unavailable to a new project', async () => {
  const tried = [];
  const client = { models: { generateContent: async ({ model }) => {
    tried.push(model);
    if (model === 'gemini-2.5-flash') throw Object.assign(new Error('model not available'), { status: 404 });
    return { text: '{}' };
  } } };
  const result = await generateGeminiContentWithFallback(client, { contents: 'test' }, ['gemini-2.5-flash', 'gemini-3.5-flash-lite'], { retryDelayMs: 0 });
  assert.equal(result.text, '{}');
  assert.deepEqual(tried, ['gemini-2.5-flash', 'gemini-3.5-flash-lite']);
});

test('retries overload once, then tries the next model', async () => {
  const tried = [];
  const client = { models: { generateContent: async ({ model }) => {
    tried.push(model);
    if (model === 'busy') throw Object.assign(new Error('overloaded'), { status: 503 });
    return { text: '{}' };
  } } };
  await generateGeminiContentWithFallback(client, {}, ['busy', 'available'], { retryDelayMs: 0 });
  assert.deepEqual(tried, ['busy', 'busy', 'available']);
});

test('does not switch models to bypass a usage limit and returns a safe message', async () => {
  const tried = [];
  const client = { models: { generateContent: async ({ model }) => {
    tried.push(model);
    throw Object.assign(new Error('{"secret":"provider details"}'), { status: 429 });
  } } };
  await assert.rejects(generateGeminiContentWithFallback(client, {}, ['first', 'second']), (error) => error.status === 429);
  assert.deepEqual(tried, ['first']);
  assert.equal(geminiErrorResponse({ status: 429 }).error.includes('provider details'), false);
});
