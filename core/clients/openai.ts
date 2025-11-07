import OpenAI from 'openai';

// Singleton OpenAI client instance
let _client: OpenAI | null = null;

// Get or create OpenAI client instance
export function openai(): OpenAI {
  if (_client) return _client;

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  _client = new OpenAI({ apiKey });
  return _client;
}

// Alias for backward compatibility
export function getOpenAI(): OpenAI {
  return openai();
}
