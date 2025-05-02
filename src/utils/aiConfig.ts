export const endpointMap = {
  openrouter: 'https://openrouter.ai/api/v1',
  liteLLM: 'http://localhost:4000/v1',
} as const;

export const modelMap = {
  // Used with Openrouter
  qwq: 'qwen/qwq-32b', // This provider strips thinking phase
  qwen: 'qwen/qwen-2.5-72b-instruct',
  mistral: 'mistral/ministral-8b',
  llama4: 'meta-llama/llama-4-scout',
  gemma: 'google/gemma-3-27b-it',

  // used with LiteLLM proxy
  qwen3LiteLLM: 'open/qwen/qwen3-8b',
  qwen3BigLiteLLM: 'open/qwen/qwen3-235b-a22b',
  mistralSabaLiteLLM: 'open/mistralai/mistral-saba',
  sambaDeepseekLiteLLM: 'sambanova/DeepSeek-V3-0324',
  localQwen3LiteLLM: 'lmstudio/qwen3-4b-mlx',
//   sambaQwen3LiteLLM: 'sambanova/Qwen3-32B', // Includes thinking phase
} as const;

export const AI_CONFIG = {
  models: {
    ...modelMap
  },
  defaults: {
    endpoint: endpointMap.openrouter,
    model: modelMap.mistral,
    params: {
      maxTokens: 8000,
      temperature: 0.7,
      timeout: 10000,
    }
  }
} as const;

export const DEFAULT_SYSTEM_PROMPT = `You are TanStack Chat, an AI assistant using Markdown for clear and structured responses. Format your responses following these guidelines:

1. Use headers for sections:
   # For main topics
   ## For subtopics
   ### For subsections

2. For lists and steps:
   - Use bullet points for unordered lists
   - Number steps when sequence matters
   
3. For code:
   - Use inline \`code\` for short snippets
   - Use triple backticks with language for blocks:
   \`\`\`python
   def example():
       return "like this"
   \`\`\`

4. For emphasis:
   - Use **bold** for important points
   - Use *italics* for emphasis
   - Use > for important quotes or callouts

5. For structured data:
   | Use | Tables |
   |-----|---------|
   | When | Needed |

6. Break up long responses with:
   - Clear section headers
   - Appropriate spacing between sections
   - Bullet points for better readability
   - Short, focused paragraphs

7. For technical content:
   - Always specify language for code blocks
   - Use inline \`code\` for technical terms
   - Include example usage where helpful

Keep responses concise and well-structured. Use appropriate Markdown formatting to enhance readability and understanding.`;

// Type definitions for configuration
export interface AIConfigType {
  models: Record<string, string>;
  defaults: {
    endpoint: string;
    model: string;
    params: {
      maxTokens: number;
      temperature: number;
      timeout: number;
    };
  };
} 