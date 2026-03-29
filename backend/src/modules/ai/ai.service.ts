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
          { role: "system", content: data.special_mode === 'DEMO' 
              ? "You are a legendary Web Development Teacher. Provide an inspiring, humorous, and tech-savvy 'Web Dasturlash' (Web Development) themed analysis of this student. Use terms like 'Full-stack', 'Commit', 'Bug-free' etc."
              : "Analyze student performance based on attendance and payments. Keep it humorous. If attendance < 60%, warn them of risk. Use Uzbek language for the analysis." 
          },
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
  
  async analyzeFinancials(data: any) {
    if (!this.openai) return { analysis: "AI sozlamalari yopilgan yoki kalit yo'q." };
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are a senior business analyst for an IT school. Analyze the provided monthly financial and growth data. Identify trends, calculate basic ROI if possible, and provide 3 actionable strategic recommendations. Keep it professional but concise." 
          },
          { role: "user", content: JSON.stringify(data) }
        ]
      });
      return { analysis: response.choices[0].message.content };
    } catch (error: any) {
      return { analysis: "AI moliyaviy tahlil moduli ulanishida xato chiqdi." };
    }
  }

  async generateExamQuestions(topic: string, level: string, count: number) {
    if (!this.openai) {
      return [`Default Q1 for ${topic} (AI Offline)`, `Default Q2 for ${topic}`];
    }
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `Generate exactly ${count} ${level} difficulty questions about ${topic}. Output ONLY a raw JSON array of strings. Do not include markdown formatting or tags like \`\`\`json.` },
        ]
      });
      const text = response.choices[0].message.content.trim();
      const jsonArr = JSON.parse(text.replace(/```json/g, '').replace(/```/g, ''));
      return Array.isArray(jsonArr) ? jsonArr : [text];
    } catch(e) {
      return [`Generated AI fallback 1 for ${topic}`, `Generated AI fallback 2 for ${topic}`];
    }
  }

  async getStudentHumorStatus(studentData: any) {
    if (!this.openai) return "Kelajakda zo'r dasturchi bo'ladi (lekin AI o'chiq)!";
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "Sen IT o'quv markazining hazilkash yordamchisisan. Studentning davomati va holatiga qarab, unga bitta qisqa (1-2 gap), juda kulgili va o'zbek tilida holat (status) yozib ber. Masalan, agar dars qoldirsa: 'Bu bolani qidiruvga berish kerak, yo'qolib qoldi.', yoki zo'r bo'lsa: 'Sohasining sherlaridan biri 😎'. Faqat xabar qismini qaytar." 
          },
          { role: "user", content: JSON.stringify(studentData) }
        ]
      });
      return response.choices[0].message.content.trim();
    } catch (e) {
      return "Zahira kodi: Darslarga vaqtida keling, yo'qsa AI xafa bo'ladi!";
    }
  }
}
