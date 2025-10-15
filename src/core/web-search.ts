import axios from 'axios';
import { AIProvider } from './ai-provider';

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

export interface GroundedAnswer {
  answer: string;
  sources: WebSearchResult[];
  confidence: number;
}

export class WebSearchService {
  private aiProvider: AIProvider;
  private searchEngines: Map<string, SearchEngine>;

  constructor(aiProvider: AIProvider, config: any) {
    this.aiProvider = aiProvider;
    this.searchEngines = new Map([
      ['google', new GoogleSearchEngine(config)],
      ['brave', new BraveSearchEngine(config)],
      ['duckduckgo', new DuckDuckGoSearchEngine()],
    ]);
  }

  async search(query: string, engine: string = 'brave'): Promise<WebSearchResult[]> {
    const searchEngine = this.searchEngines.get(engine);
    if (!searchEngine) {
      throw new Error(`Unknown search engine: ${engine}`);
    }

    return searchEngine.search(query);
  }

  async searchDocumentation(
    technology: string,
    query: string
  ): Promise<WebSearchResult[]> {
    const docQuery = `${technology} documentation ${query} site:docs OR site:developer`;
    return this.search(docQuery);
  }

  async groundedAnswer(question: string): Promise<GroundedAnswer> {
    // Search the web for relevant information
    const searchResults = await this.search(question);

    // Fetch content from top results
    const contents = await Promise.all(
      searchResults.slice(0, 3).map((r) => this.fetchContent(r.url))
    );

    // Generate answer grounded in search results
    const response = await this.aiProvider.chat([
      {
        role: 'system',
        content: `You are a helpful assistant. Answer questions using ONLY the provided search results. Cite sources.`,
      },
      {
        role: 'user',
        content: `Question: ${question}\n\nSearch Results:\n${contents.join('\n\n')}\n\nProvide a well-sourced answer.`,
      },
    ]);

    return {
      answer: response.content,
      sources: searchResults.slice(0, 3),
      confidence: this.calculateConfidence(searchResults),
    };
  }

  async findCodeExamples(technology: string, task: string): Promise<string[]> {
    const query = `${technology} ${task} code example github`;
    const results = await this.search(query);

    const examples: string[] = [];
    for (const result of results.slice(0, 5)) {
      if (result.url.includes('github.com') || result.url.includes('stackoverflow.com')) {
        try {
          const content = await this.fetchContent(result.url);
          const code = this.extractCode(content);
          if (code) examples.push(code);
        } catch {
          continue;
        }
      }
    }

    return examples;
  }

  private async fetchContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 CLI-Agent/1.0',
        },
      });
      return this.cleanHtml(response.data);
    } catch {
      return '';
    }
  }

  private cleanHtml(html: string): string {
    return html
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2000);
  }

  private extractCode(content: string): string | null {
    const codePattern = /```[\w]*\n([\s\S]*?)```/;
    const match = content.match(codePattern);
    return match ? match[1] : null;
  }

  private calculateConfidence(results: WebSearchResult[]): number {
    if (results.length === 0) return 0;
    const avgRelevance = results.reduce((sum, r) => sum + r.relevance, 0) / results.length;
    return Math.min(avgRelevance, 1.0);
  }
}

abstract class SearchEngine {
  abstract search(query: string): Promise<WebSearchResult[]>;
}

class BraveSearchEngine extends SearchEngine {
  private apiKey: string;

  constructor(config: any) {
    super();
    this.apiKey = config.braveApiKey || process.env.BRAVE_API_KEY || '';
  }

  async search(query: string): Promise<WebSearchResult[]> {
    if (!this.apiKey) {
      throw new Error('Brave API key not configured');
    }

    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      params: { q: query, count: 10 },
      headers: {
        'X-Subscription-Token': this.apiKey,
        Accept: 'application/json',
      },
    });

    return response.data.web?.results?.map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.description,
      relevance: 0.8,
    })) || [];
  }
}

class GoogleSearchEngine extends SearchEngine {
  private apiKey: string;
  private cx: string;

  constructor(config: any) {
    super();
    this.apiKey = config.googleApiKey || process.env.GOOGLE_API_KEY || '';
    this.cx = config.googleCx || process.env.GOOGLE_CX || '';
  }

  async search(query: string): Promise<WebSearchResult[]> {
    if (!this.apiKey || !this.cx) {
      throw new Error('Google Search API not configured');
    }

    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: this.apiKey,
        cx: this.cx,
        q: query,
        num: 10,
      },
    });

    return response.data.items?.map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      relevance: 0.9,
    })) || [];
  }
}

class DuckDuckGoSearchEngine extends SearchEngine {
  async search(query: string): Promise<WebSearchResult[]> {
    const response = await axios.get('https://api.duckduckgo.com/', {
      params: {
        q: query,
        format: 'json',
        no_html: 1,
      },
    });

    return response.data.RelatedTopics?.slice(0, 10).map((topic: any) => ({
      title: topic.Text?.split(' - ')[0] || '',
      url: topic.FirstURL || '',
      snippet: topic.Text || '',
      relevance: 0.7,
    })) || [];
  }
}

