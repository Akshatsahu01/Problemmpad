const DEFAULT_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];

export function geminiModelCandidates(configuredModels, preferredModel) {
  const configured = configuredModels?.split(',').map((model) => model.trim()).filter(Boolean);
  const order = configured?.length ? configured : [preferredModel, ...DEFAULT_MODELS];
  return [...new Set(order.filter(Boolean))];
}

export function geminiErrorStatus(error) {
  const status = Number(error?.status ?? error?.code ?? error?.response?.status);
  if (Number.isInteger(status) && status >= 400 && status <= 599) return status;
  const message = String(error?.message || '');
  const match = message.match(/\b(400|401|403|404|429|500|503)\b/);
  return match ? Number(match[1]) : null;
}

export async function generateGeminiContentWithFallback(client, request, models, { retryDelayMs = 400 } = {}) {
  let lastUnavailable;
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await client.models.generateContent({ ...request, model });
      } catch (error) {
        const status = geminiErrorStatus(error);
        if (status === 404) { lastUnavailable = error; break; }
        if (status === 503) {
          lastUnavailable = error;
          if (attempt === 0) {
            if (retryDelayMs) await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
            continue;
          }
          break;
        }
        throw error;
      }
    }
  }
  const error = new Error('No configured Gemini model is available right now. Try again later or continue manually.');
  error.status = 503;
  error.cause = lastUnavailable;
  throw error;
}

export function geminiErrorResponse(error) {
  const status = geminiErrorStatus(error);
  if (status === 429) return { status: 429, error: 'Gemini usage limit reached. Try again later or continue manually.' };
  if (status === 403) return { status: 503, error: 'Gemini is unavailable for this API key. Check its project access or continue manually.' };
  if (status === 404 || status === 503) return { status: 503, error: 'No Gemini model is available right now. Try again later or continue manually.' };
  return { status: 502, error: 'AI request failed. Try again later or continue manually.' };
}
