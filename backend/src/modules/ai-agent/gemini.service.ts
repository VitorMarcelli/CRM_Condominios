import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel, Content } from '@google/generative-ai';
import { buildSystemPrompt } from './prompts/system-prompt';

export interface GeminiResponse {
  type: 'CHAT' | 'TICKET' | 'UNREGISTERED';
  message: string;
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY', '');

    if (!apiKey || apiKey === 'SUA_CHAVE_GEMINI_AQUI') {
      this.logger.warn('GEMINI_API_KEY not configured. AI Agent will use fallback responses.');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    });
  }

  async chat(
    condominiumName: string,
    conversationHistory: Content[],
    newMessage: string,
    residentContext?: string,
  ): Promise<GeminiResponse> {
    try {
      const systemPrompt = buildSystemPrompt(condominiumName, residentContext);

      const chat = this.model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: 'Instruções do sistema: ' + systemPrompt }],
          },
          {
            role: 'model',
            parts: [{ text: '{"type":"CHAT","message":"Entendido. Estou pronto para atender os moradores do condomínio seguindo todas as instruções."}' }],
          },
          ...conversationHistory,
        ],
      });

      const result = await chat.sendMessage(newMessage);
      const responseText = result.response.text();

      return this.parseResponse(responseText);
    } catch (error: any) {
      this.logger.error(`Gemini API error: ${error.message}`);
      return this.getFallbackResponse();
    }
  }

  private parseResponse(text: string): GeminiResponse {
    try {
      // Try to extract JSON from the response
      let jsonStr = text.trim();

      // If wrapped in markdown code blocks, extract
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr);

      if (!parsed.type || !parsed.message) {
        throw new Error('Missing required fields');
      }

      return {
        type: parsed.type,
        message: parsed.message,
        title: parsed.title,
        description: parsed.description,
        priority: parsed.priority,
      };
    } catch {
      this.logger.warn(`Failed to parse Gemini response: ${text.substring(0, 200)}`);
      return {
        type: 'CHAT',
        message: text.length > 0 ? text : 'Desculpe, não consegui processar sua mensagem. Pode tentar novamente?',
      };
    }
  }

  private getFallbackResponse(): GeminiResponse {
    return {
      type: 'CHAT',
      message: 'Estamos com dificuldades técnicas no momento. Por favor, tente novamente em alguns instantes. Se for uma emergência, ligue diretamente para a portaria.',
    };
  }
}
