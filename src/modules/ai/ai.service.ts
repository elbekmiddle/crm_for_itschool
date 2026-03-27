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
    if (!this.openai) throw new HttpException('OpenAI missing or not configured in .env', HttpStatus.NOT_IMPLEMENTED);
    
    // Limits and queues would go here in fully connected environment
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Analyze student performance based on attendance and payments. Keep it humorous. If attendance < 60%, warn them of risk." },
        { role: "user", content: JSON.stringify(data) }
      ]
    });
    
    return { analysis: response.choices[0].message.content };
  }
  
  async groupSummary(data: any) {
    if (!this.openai) throw new HttpException('OpenAI missing or not configured in .env', HttpStatus.NOT_IMPLEMENTED);
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Summarize group dynamics based on given data. Identify the best student (max attendance) and keep response humorous." },
        { role: "user", content: JSON.stringify(data) }
      ]
    });
    
    return { summary: response.choices[0].message.content };
  }
}
