export async function generateGeminiContent(ai, request, sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await ai.models.generateContent(request);
    } catch (error) {
      if (![500, 502, 503, 504].includes(Number(error.status)) || attempt === 2) throw error;
      await sleep(500 * 2 ** attempt + Math.floor(Math.random() * 250));
    }
  }
}

export function geminiModelCandidates(configuredModels, primaryModel) {
  const defaults = [
    primaryModel || 'gemini-2.5-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash-lite',
    'gemini-2.5-flash-lite',
  ];
  const configured = typeof configuredModels === 'string' && configuredModels.trim()
    ? configuredModels.split(',')
    : defaults;
  return [...new Set(configured.map((model) => model.trim()).filter(Boolean))].slice(0, 4);
}

export async function generateGeminiContentWithFallback(ai, request, models, sleep) {
  if (!models.length) throw new Error('No Gemini models configured');
  for (let index = 0; index < models.length; index++) {
    const modelRequest = { ...request, model: models[index] };
    try {
      return index === 0
        ? await generateGeminiContent(ai, modelRequest, sleep)
        : await ai.models.generateContent(modelRequest);
    } catch (error) {
      if (![404, 503].includes(Number(error.status)) || index === models.length - 1) throw error;
    }
  }
}

export function geminiErrorResponse(error, manualOption) {
  const status = Number(error.status);
  if (status === 429) return { status: 429, message: `AI usage limit reached. Try again later, or ${manualOption}.` };
  if (status >= 500 && status < 600) return { status: 503, message: `AI is temporarily unavailable. Try again in a few minutes, or ${manualOption}.` };
  if (status === 401 || status === 403) return { status: 502, message: `AI access is unavailable. Check the configured Gemini API key, or ${manualOption}.` };
  if (error.name === 'ApiError') return { status: 502, message: `AI request failed. Try again later, or ${manualOption}.` };
  return null;
}
