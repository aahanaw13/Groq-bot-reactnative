// src/services/groqService.js

const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';

export const MODELS = [
  { id: 'llama3-8b-8192',          label: 'Llama 3 8B',      desc: 'Fast & efficient' },
  { id: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B',   desc: 'Powerful reasoning' },
  { id: 'mixtral-8x7b-32768',      label: 'Mixtral 8×7B',    desc: 'Great for coding' },
  { id: 'gemma2-9b-it',            label: 'Gemma 2 9B',       desc: 'Google open-source' },
];

export const DEFAULT_MODEL = MODELS[0].id;

const SYSTEM = `You are Groq-bot, a helpful and friendly AI assistant powered by Groq's ultra-fast inference. Give clear, concise answers. Format code in fenced blocks with the language specified.`;

/**
 * Stream a chat completion from Groq.
 * @param {Array<{role,content}>} history  - Full conversation so far
 * @param {string}                model    - Groq model ID
 * @param {string}                apiKey
 * @param {(delta:string)=>void}  onChunk  - Called on each streamed token
 * @param {()=>boolean}           isCancelled
 * @returns {Promise<string>}              - Full assembled reply
 */
export async function streamChat(history, model, apiKey, onChunk, isCancelled) {
  if (!apiKey) throw new Error('No API key. Set GROQ_API_KEY in constants.js');

  const res = await fetch(GROQ_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: SYSTEM }, ...history],
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    if (isCancelled?.()) break;
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value, { stream: true }).split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') break;
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content ?? '';
        if (delta) { full += delta; onChunk(delta); }
      } catch { /* skip malformed lines */ }
    }
  }

  return full;
}