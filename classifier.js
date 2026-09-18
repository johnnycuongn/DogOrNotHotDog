import { query } from '@anthropic-ai/claude-agent-sdk';

export const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
export const MAX_BYTES = 8 * 1024 * 1024;

const SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['hotdog', 'not_hotdog'] },
    confidence: { type: 'number', description: '0 to 1' },
    saw: { type: 'string', description: 'What is in the image, one short phrase.' },
  },
  required: ['verdict', 'confidence', 'saw'],
  additionalProperties: false,
};

const SYSTEM = [
  'You are a hotdog detector. Look at the image and rule on one question: is it a hotdog?',
  'A hotdog is a cooked sausage served in a sliced bun. A sausage with no bun is not a hotdog.',
  'A corn dog, a sausage roll and a bratwurst on a plate are not hotdogs.',
  'Keep "saw" to a short plain phrase naming what is actually in the picture.',
  'Answer only through the structured output.',
].join(' ');

// The child process inherits our env; these two vars make Claude Code think it
// is running inside itself and change its behaviour, so drop them.
function childEnv() {
  const env = { ...process.env };
  delete env.CLAUDECODE;
  delete env.CLAUDE_CODE_ENTRYPOINT;
  return env;
}

export async function classify(buffer, mediaType) {
  async function* input() {
    yield {
      type: 'user',
      session_id: '',
      parent_tool_use_id: null,
      message: {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: buffer.toString('base64') } },
          { type: 'text', text: 'Classify this image.' },
        ],
      },
    };
  }

  for await (const message of query({
    prompt: input(),
    options: {
      systemPrompt: SYSTEM,
      model: 'claude-haiku-4-5-20251001',
      // One turn of prose, one to call StructuredOutput; one turn is not enough.
      maxTurns: 4,
      tools: [],
      allowedTools: [],
      settingSources: [],
      outputFormat: { type: 'json_schema', schema: SCHEMA },
      env: childEnv(),
    },
  })) {
    if (message.type !== 'result') continue;
    if (message.subtype === 'success' && message.structured_output) {
      return { ...message.structured_output, costUsd: message.total_cost_usd };
    }
    throw new Error(message.errors?.join('; ') || `Classification failed (${message.subtype}).`);
  }
  throw new Error('Classification ended without a result.');
}
