// Centralized Google Gemini API integration for Finsights
// Uses @google/genai (preferred) or @google/generative-ai (fallback) gemini-2.5-flash

let SDKFactory = null; // function(apiKey) => client
let MODEL_NAME = 'gemini-2.5-flash';

async function ensureSdk() {
  if (SDKFactory) return;
  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/@google/genai/+esm');
    const GoogleGenerativeAI = mod.GoogleGenerativeAI || mod.GoogleAI || mod.default;
    if (GoogleGenerativeAI) {
      SDKFactory = (apiKey) => new GoogleGenerativeAI(apiKey);
      return;
    }
  } catch (_) {}
  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/@google/generative-ai/+esm');
    const GoogleGenerativeAI = mod.GoogleGenerativeAI || mod.GoogleAI || mod.default;
    if (GoogleGenerativeAI) {
      SDKFactory = (apiKey) => new GoogleGenerativeAI(apiKey);
      return;
    }
  } catch (_) {}
  throw new Error('Gemini SDK not available');
}

async function getClient() {
  const apiKey = window.GEMINI_API_KEY || localStorage.getItem('finsights_gemini_api_key');
  if (!apiKey) throw new Error('Missing Gemini API key. Set window.GEMINI_API_KEY or localStorage.finsights_gemini_api_key');
  await ensureSdk();
  return SDKFactory(apiKey);
}

export function setGeminiApiKey(key) {
  localStorage.setItem('finsights_gemini_api_key', key);
}

export function extractJsonFromText(text) {
  if (!text) return null;
  // Remove code fences if present
  const fenceMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/i);
  const payload = fenceMatch ? fenceMatch[1] : text;
  try {
    return JSON.parse(payload);
  } catch (e) {
    // Try to find first json object in text
    const idxStart = payload.indexOf('{');
    const idxEnd = payload.lastIndexOf('}');
    if (idxStart !== -1 && idxEnd !== -1 && idxEnd > idxStart) {
      const maybe = payload.slice(idxStart, idxEnd + 1);
      try { return JSON.parse(maybe); } catch (_) {}
    }
    return null;
  }
}

async function callModelJson({ prompt, useSearch, schema }) {
  const client = await getClient();
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    ...(schema ? { generationConfig: { responseMimeType: 'application/json', responseSchema: schema } } : {}),
    ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
  });

  const response = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
  const text = response?.response?.text?.();
  if (!text) throw new Error('Empty response from model');
  const json = extractJsonFromText(text);
  if (!json) throw new Error('Failed to parse JSON from model response');
  return json;
}

// Public API wrappers

export async function generateReport({ symbols, mode }) {
  const prompt = `Return ONLY valid JSON. Analyze Indian NSE stocks. Symbols: ${symbols}. Mode: ${mode}. Structure with keys: overview, fundamentals, technicals, news, sentiment, strategy, ...(comparison if multiple).`;
  return await callModelJson({ prompt, useSearch: true });
}

export async function getMarketMovers() {
  const prompt = 'Return ONLY valid JSON with top 5 NIFTY 50 gainers and losers with symbol, name, changePct.';
  return await callModelJson({ prompt, useSearch: true });
}

export async function runStockScreener(filters) {
  const prompt = `Return ONLY valid JSON array of stocks filtered for NSE with fields: symbol, name, ltp, marketCap, pe, dy. Filters: ${JSON.stringify(filters)}`;
  return await callModelJson({ prompt, useSearch: true });
}

export async function learnTopic(topicId) {
  const schema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      html: { type: 'string' },
    },
    required: ['title', 'html'],
    additionalProperties: false,
  };
  const prompt = `Explain the topic ${topicId} for a beginner Indian investor. Respond as JSON with keys title and html (sanitized, simple HTML).`;
  return await callModelJson({ prompt, useSearch: false, schema });
}

export async function getQuotes(symbols) {
  const prompt = `Return ONLY valid JSON with current LTP for these NSE symbols: ${symbols.join(', ')}. Use array of {symbol, ltpNumber}.`;
  return await callModelJson({ prompt, useSearch: true });
}

export async function getWatchlistPerformance(symbols) {
  const prompt = `Return ONLY valid JSON object with last 30 trading days average percent change across these NSE symbols: ${symbols.join(', ')}. Keys: dates (array YYYY-MM-DD), avgSeries (array of numbers).`;
  return await callModelJson({ prompt, useSearch: true });
}
