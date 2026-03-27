import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get('OPENAI_API_KEY');
    if (apiKey && apiKey !== 'your_openai_api_key') {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async analyzeStudent(data: any) {
    if (!this.openai) return { analysis: "AI sozlamalari yopilgan yoki kalit yo'q." };
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Analyze student performance based on attendance and payments. Keep it humorous. If attendance < 60%, warn them of risk." },
          { role: "user", content: JSON.stringify(data) }
        ]
      });
      return { analysis: response.choices[0].message.content };
    } catch (error: any) {
      if (error?.status === 429 || error?.message?.includes('429')) {
        return { analysis: "AI tavsiyalar xizmati ayni vaqtda faol emas (Kvota tugagan)." };
      }
      return { analysis: "AI moduli ulanishida vaqtinchalik xato chiqdi." };
    }
  }
  
  async groupSummary(data: any) {
    if (!this.openai) return { summary: "AI sozlamalari yopilgan yoki kalit yo'q." };
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Summarize group dynamics based on given data. Identify the best student (max attendance) and keep response humorous." },
          { role: "user", content: JSON.stringify(data) }
        ]
      });
      return { summary: response.choices[0].message.content };
    } catch (error: any) {
      if (error?.status === 429 || error?.message?.includes('429')) {
        return { summary: "AI tavsiyalar xizmati ayni vaqtda faol emas (Kvota tugagan)." };
      }
      return { summary: "AI moduli ulanishida vaqtinchalik xato chiqdi." };
    }
  }
}
