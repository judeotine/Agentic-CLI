import axios, { AxiosInstance } from 'axios';
import { AIModel } from '../types/config';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  tokensUsed?: number;
  model: string;
  finishReason?: string;
}

export interface AIStreamHandler {
  onToken: (token: string) => void;
  onComplete: (response: AIResponse) => void;
  onError: (error: Error) => void;
}

export abstract class AIProvider {
  protected config: AIModel;
  protected client: AxiosInstance;

  constructor(config: AIModel) {
    this.config = config;
    this.client = axios.create({
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  abstract chat(messages: AIMessage[]): Promise<AIResponse>;
  abstract streamChat(messages: AIMessage[], handler: AIStreamHandler): Promise<void>;
}

export class OpenAIProvider extends AIProvider {
  constructor(config: AIModel) {
    super(config);
    this.client.defaults.baseURL = config.endpoint || 'https://api.openai.com/v1';
    this.client.defaults.headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    const response = await this.client.post('/chat/completions', {
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
    });

    const choice = response.data.choices[0];
    return {
      content: choice.message.content,
      tokensUsed: response.data.usage?.total_tokens,
      model: this.config.model,
      finishReason: choice.finish_reason,
    };
  }

  async streamChat(messages: AIMessage[], handler: AIStreamHandler): Promise<void> {
    try {
      const response = await this.client.post(
        '/chat/completions',
        {
          model: this.config.model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: true,
        },
        { responseType: 'stream' }
      );

      let fullContent = '';
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices[0]?.delta?.content || '';
              if (token) {
                fullContent += token;
                handler.onToken(token);
              }
            } catch {}
          }
        }
      });

      response.data.on('end', () => {
        handler.onComplete({
          content: fullContent,
          model: this.config.model,
        });
      });

      response.data.on('error', (error: Error) => {
        handler.onError(error);
      });
    } catch (error) {
      handler.onError(error as Error);
    }
  }
}

export class AnthropicProvider extends AIProvider {
  constructor(config: AIModel) {
    super(config);
    this.client.defaults.baseURL = config.endpoint || 'https://api.anthropic.com/v1';
    this.client.defaults.headers['x-api-key'] = config.apiKey;
    this.client.defaults.headers['anthropic-version'] = '2023-06-01';
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    const response = await this.client.post('/messages', {
      model: this.config.model,
      messages: messages.filter((m) => m.role !== 'system'),
      system: messages.find((m) => m.role === 'system')?.content,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens || 4096,
    });

    return {
      content: response.data.content[0].text,
      tokensUsed: response.data.usage?.input_tokens + response.data.usage?.output_tokens,
      model: this.config.model,
      finishReason: response.data.stop_reason,
    };
  }

  async streamChat(messages: AIMessage[], handler: AIStreamHandler): Promise<void> {
    try {
      const response = await this.client.post(
        '/messages',
        {
          model: this.config.model,
          messages: messages.filter((m) => m.role !== 'system'),
          system: messages.find((m) => m.role === 'system')?.content,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens || 4096,
          stream: true,
        },
        { responseType: 'stream' }
      );

      let fullContent = '';
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta') {
                const token = parsed.delta?.text || '';
                if (token) {
                  fullContent += token;
                  handler.onToken(token);
                }
              }
            } catch {}
          }
        }
      });

      response.data.on('end', () => {
        handler.onComplete({
          content: fullContent,
          model: this.config.model,
        });
      });

      response.data.on('error', (error: Error) => {
        handler.onError(error);
      });
    } catch (error) {
      handler.onError(error as Error);
    }
  }
}

export class AIProviderFactory {
  static create(config: AIModel): AIProvider {
    switch (config.provider) {
      case 'openai':
      case 'azure':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'local':
        return new OpenAIProvider(config);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }
}

