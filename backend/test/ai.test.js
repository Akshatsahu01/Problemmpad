import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGeminiContent, generateGeminiContentWithFallback, geminiModelCandidates, geminiErrorResponse } from '../src/ai.js';

test('uses an ordered, unique list of Gemini models', () => {
  assert.deepEqual(geminiModelCandidates(undefined, 'gemini-3.8-flash'), [
    'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash-lite',
  ]);
  assert.deepEqual(geminiModelCandidates(' first, second, first, third '), ['first', 'second', 'third']);
});

test('tries the next model when previous models are overloaded', async () => {
  const calledModels = [];
  const ai = { models: { generateContent: async ({ model }) => {
    calledModels.push(model);
    if (model !== 'third') throw Object.assign(new Error('Busy'), { status: 503 });
    return { text: 'generated tests' };
  } } };
  const response = await generateGeminiContentWithFallback(
    ai, { contents: 'problem' }, ['first', 'second', 'third'], async () => {},
  );
  assert.equal(response.text, 'generated tests');
  assert.deepEqual(calledModels, ['first', 'first', 'first', 'second', 'third']);
});

test('stops after the last overloaded model', async () => {
  const calledModels = [];
  const ai = { models: { generateContent: async ({ model }) => {
    calledModels.push(model);
    throw Object.assign(new Error('Busy'), { status: 503 });
  } } };
  await assert.rejects(
    generateGeminiContentWithFallback(ai, {}, ['first', 'second'], async () => {}),
    { status: 503 },
  );
  assert.deepEqual(calledModels, ['first', 'first', 'first', 'second']);
});

test('skips an unavailable fallback model and continues the chain', async () => {
  const calledModels = [];
  const ai = { models: { generateContent: async ({ model }) => {
    calledModels.push(model);
    if (model === 'first') throw Object.assign(new Error('Busy'), { status: 503 });
    if (model === 'second') throw Object.assign(new Error('Model unavailable'), { status: 404 });
    return { text: 'generated tests' };
  } } };
  const response = await generateGeminiContentWithFallback(
    ai, {}, ['first', 'second', 'third'], async () => {},
  );
  assert.equal(response.text, 'generated tests');
  assert.deepEqual(calledModels, ['first', 'first', 'first', 'second', 'third']);
});

test('does not switch models for a usage limit error', async () => {
  const calledModels = [];
  const ai = { models: { generateContent: async ({ model }) => {
    calledModels.push(model);
    throw Object.assign(new Error('Limit reached'), { status: 429 });
  } } };
  await assert.rejects(
    generateGeminiContentWithFallback(ai, {}, ['first', 'second'], async () => {}),
    { status: 429 },
  );
  assert.deepEqual(calledModels, ['first']);
});

test('retries temporary Gemini failures with increasing delays', async () => {
  let calls = 0;
  const delays = [];
  const ai = { models: { generateContent: async () => {
    calls++;
    if (calls < 3) throw Object.assign(new Error('Busy'), { status: 503 });
    return { text: 'ready' };
  } } };
  const result = await generateGeminiContent(ai, { contents: 'test' }, async (delay) => { delays.push(delay); });
  assert.equal(result.text, 'ready');
  assert.equal(calls, 3);
  assert.equal(delays.length, 2);
  assert.ok(delays[0] >= 500 && delays[0] < 750);
  assert.ok(delays[1] >= 1000 && delays[1] < 1250);
});

test('does not retry a Gemini usage limit error', async () => {
  let calls = 0;
  const error = Object.assign(new Error('Limit reached'), { status: 429 });
  const ai = { models: { generateContent: async () => { calls++; throw error; } } };
  await assert.rejects(generateGeminiContent(ai, {}, async () => {}), error);
  assert.equal(calls, 1);
});

test('turns Gemini errors into actionable API responses', () => {
  assert.deepEqual(geminiErrorResponse({ status: 503 }, 'add tests manually'), {
    status: 503,
    message: 'AI is temporarily unavailable. Try again in a few minutes, or add tests manually.',
  });
  assert.deepEqual(geminiErrorResponse({ status: 429 }, 'add tests manually'), {
    status: 429,
    message: 'AI usage limit reached. Try again later, or add tests manually.',
  });
  assert.equal(geminiErrorResponse(new Error('Database failed'), 'add tests manually'), null);
});
