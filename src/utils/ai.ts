import { createServerFn } from '@tanstack/react-start'
import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions.mjs'
import { AI_CONFIG, DEFAULT_SYSTEM_PROMPT, endpointMap } from './aiConfig'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

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
    const endpoint = data.endpoint || AI_CONFIG.defaults.endpoint;
    const apiKey =
      endpoint === endpointMap.liteLLM
        ? process.env.LITELLM_API_KEY
        : process.env.OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'Missing API key: Please set the appropriate API key in your environment variables.' +
          (endpoint === endpointMap.liteLLM
            ? ' (LITELLM_API_KEY)'
            : ' (OPENAI_API_KEY or VITE_OPENAI_API_KEY)')
      );
    }

    // Create OpenAI client with proper configuration
    const openai = new OpenAI({
      baseURL: endpoint,
      apiKey,
      timeout: AI_CONFIG.defaults.params.timeout
    });

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
      // finalPrompt: systemPrompt,
      // trim the middle of the prompt
      finalPrompt: systemPrompt.slice(0, 100) + '...' + systemPrompt.slice(-100)
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