import { createServerFn } from '@tanstack/react-start'
import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions.mjs'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// AI Configuration
export const AI_CONFIG = {
  // API endpoints
  endpoints: {
    openRouter: 'https://openrouter.ai/api/v1',
    local: 'http://localhost:4000/v1',
  },
  // Available models
  models: {
    // OpenAI models
    qwq: 'open/qwen/qwq-32b',
    qwen: 'open/qwen/qwen-2.5-72b-instruct',
    // OpenRouter models
    mistral: 'mistral/ministral-8b',
  },
  // Default configurations
  defaults: {
    endpoint: 'http://localhost:4000/v1',
    model: 'open/mistral/ministral-8b',
    params: {
      maxTokens: 4096,
      temperature: 0.7,
      timeout: 30000, // 30 seconds timeout
    }
  }
}

const DEFAULT_SYSTEM_PROMPT = `You are TanStack Chat, an AI assistant using Markdown for clear and structured responses. Format your responses following these guidelines:

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

Keep responses concise and well-structured. Use appropriate Markdown formatting to enhance readability and understanding.`

// Non-streaming implementation
export const genAIResponse = createServerFn({ method: 'GET', response: 'raw' })
  .validator(
    (d: {
      messages: Array<Message>
      systemPrompt?: { value: string; enabled: boolean }
      model?: string
      maxTokens?: number
      endpoint?: string
    }) => d,
  )
  // .middleware([loggingMiddleware])
  .handler(async ({ data }) => {
    // Check for API key in environment variables
    const apiKey = process.env.OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY

    if (!apiKey) {
      throw new Error(
        'Missing API key: Please set VITE_OPENAI_API_KEY in your environment variables or VITE_OPENAI_API_KEY in your .env file.'
      )
    }
    
    // Create OpenAI client with proper configuration
    const openai = new OpenAI({
      baseURL: data.endpoint || AI_CONFIG.defaults.endpoint,
      apiKey,
      timeout: AI_CONFIG.defaults.params.timeout
    })

    // Filter out error messages and empty messages
    const formattedMessages = data.messages
      .filter(
        (msg) =>
          msg.content.trim() !== '' &&
          !msg.content.startsWith('Sorry, I encountered an error'),
      )
      .map((msg) => ({
        role: msg.role,
        content: msg.content.trim(),
      }))

    if (formattedMessages.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid messages to send' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const systemPrompt = data.systemPrompt?.enabled
      ? `${DEFAULT_SYSTEM_PROMPT}\n\n${data.systemPrompt.value}`
      : DEFAULT_SYSTEM_PROMPT

    // Debug log to verify prompt layering
    console.log('System Prompt Configuration:', {
      hasCustomPrompt: data.systemPrompt?.enabled,
      customPromptValue: data.systemPrompt?.value,
      finalPrompt: systemPrompt,
    })

    try {
      // OpenAI requires system message as a separate message with role 'system'
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...formattedMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      ];

      const stream = await openai.chat.completions.create({
        model: data.model || AI_CONFIG.defaults.model,
        messages: messages,
        max_tokens: data.maxTokens || AI_CONFIG.defaults.params.maxTokens,
        temperature: AI_CONFIG.defaults.params.temperature,
        stream: true,
      });

      // Create a simple transformed stream that just passes the raw text content
      const transformStream = new TransformStream({
        async transform(chunk, controller) {
          if (chunk.choices[0]?.delta?.content) {
            controller.enqueue(chunk.choices[0].delta.content);
          }
        }
      });

      // Pipe the OpenAI stream through our transform
      const reader = stream[Symbol.asyncIterator]();
      const writer = transformStream.writable.getWriter();
      
      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.next();
            if (done) break;
            await writer.write(value);
          }
        } catch (error) {
          console.error('Error in stream processing:', error);
        } finally {
          writer.close();
        }
      })();

      return new Response(transformStream.readable);
      
    } catch (error) {
      console.error('Error in genAIResponse:', error)
      
      // Error handling with specific messages
      let errorMessage = 'Failed to get AI response'
      let statusCode = 500
      
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment.'
        } else if (error.message.includes('Connection error') || error.name === 'APIConnectionError') {
          errorMessage = 'Connection to OpenAI API failed. Please check your internet connection and API key.'
          statusCode = 503 // Service Unavailable
        } else if (error.message.includes('authentication') || error.message.includes('API key')) {
          errorMessage = 'Authentication failed. Please check your OpenAI API key.'
          statusCode = 401 // Unauthorized
        } else {
          errorMessage = error.message
        }
      }
      
      return new Response(JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.name : undefined
      }), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  })