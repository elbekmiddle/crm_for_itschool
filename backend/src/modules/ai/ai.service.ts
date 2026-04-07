import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

const PLACEHOLDER_KEYS = new Set(['', 'your_openai_api_key', 'sk-your-openai-key-here', 'sk-proj-placeholder']);

@Injectable()
export class AiService {
  private openai: OpenAI | null = null;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    const raw = (this.configService.get<string>('OPENAI_API_KEY') || '').trim();
    this.model = (this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini').trim();
    if (raw && !PLACEHOLDER_KEYS.has(raw) && raw.length > 12) {
      try {
        this.openai = new OpenAI({ apiKey: raw });
      } catch {
        this.openai = null;
      }
    }
  }

  /** Kalit `.env` da to‘g‘ri qo‘yilgan va OpenAI client yaratilgan */
  isConfigured(): boolean {
    return this.openai !== null;
  }

  async analyzeStudent(data: any) {
    if (!this.openai) return { analysis: "AI sozlamalari yopilgan yoki kalit yo'q." };
    
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
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
        model: this.model,
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
        model: this.model,
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
      return Array.from({ length: count }).map((_, i) => ({
        text: `Default Question ${i + 1} for ${topic} (AI Offline)`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct_answer: 0
      }));
    }
    const n = Math.min(Math.max(1, count), 30);
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You create exam questions. Respond with JSON only: { "questions": [ ... ] }.
Exactly ${n} multiple-choice questions. Each element MUST have:
"text" (string), "options" (array of exactly 4 distinct strings), "correct_answer" (integer 0-3).
Topic and difficulty are given in the user message. Prefer Uzbek or bilingual wording when natural for an IT school.`,
          },
          {
            role: 'user',
            content: JSON.stringify({ topic, level, count: n }),
          },
        ],
        temperature: 0.65,
      });
      const raw = response.choices[0]?.message?.content?.trim() || '{}';
      const parsed = JSON.parse(raw);
      let jsonArr = parsed.questions;
      if (!Array.isArray(jsonArr)) jsonArr = parsed.items;
      if (!Array.isArray(jsonArr)) {
        const stripped = raw.replace(/```json/gi, '').replace(/```/g, '');
        const tryArr = JSON.parse(stripped);
        jsonArr = Array.isArray(tryArr) ? tryArr : [];
      }
      if (!Array.isArray(jsonArr) || jsonArr.length === 0) {
        throw new Error('Empty questions array');
      }
      return jsonArr.slice(0, n).map((q: any, i: number) => ({
        text: String(q?.text || `Savol ${i + 1}`),
        options: Array.isArray(q?.options) && q.options.length >= 4
          ? q.options.slice(0, 4).map((o: any) => String(o))
          : ['A', 'B', 'C', 'D'],
        correct_answer: Math.min(3, Math.max(0, Number(q?.correct_answer) || 0)),
      }));
    } catch (e) {
      console.error('AI Generation Error:', e);
      return Array.from({ length: Math.min(n, 5) }).map((_, i) => ({
        text: `Zahira savoli #${i + 1} (AI xatosi sababli): ${topic} mavzusida.`,
        options: ['Javob A', 'Javob B', 'Javob C', 'Javob D'],
        correct_answer: 0,
      }));
    }
  }

  /**
   * Ochiq matn va kod savollarini GPT bilan baholash (6+ ball = to‘g‘ri).
   */
  async gradeExamAnswer(input: {
    questionText: string;
    expectedAnswer: string;
    studentAnswer: string;
    questionType: 'text' | 'code';
  }): Promise<{ isCorrect: boolean; points: number } | null> {
    if (!this.openai) return null;
    const student = String(input.studentAnswer || '').slice(0, 12000);
    if (!student.trim()) {
      return { isCorrect: false, points: 0 };
    }
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        response_format: { type: 'json_object' },
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              input.questionType === 'code'
                ? 'You grade programming exam answers. Return JSON only: {"score_0_to_10": number, "passed": boolean}. passed=true if score >= 6. Check correctness vs reference; allow minor syntax differences.'
                : 'You grade short text answers for an IT school. Return JSON only: {"score_0_to_10": number, "passed": boolean}. passed=true if score >= 6. Use reference as key facts; reward partial understanding.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              question: input.questionText,
              reference_answer: input.expectedAnswer,
              student_answer: student,
            }),
          },
        ],
      });
      const raw = response.choices[0]?.message?.content || '{}';
      const obj = JSON.parse(raw);
      const score = Math.min(10, Math.max(0, Number(obj.score_0_to_10) || 0));
      const passed = obj.passed === true || score >= 6;
      return { isCorrect: passed, points: score };
    } catch {
      return null;
    }
  }

  /** Dashboard statistikasi bo‘yicha qisqa AI xulosasi (o‘zbekcha). */
  async summarizeDashboardSnapshot(data: Record<string, unknown>): Promise<string | null> {
    if (!this.openai) return null;
    try {
      const payload = JSON.stringify(data).slice(0, 14000);
      const response = await this.openai.chat.completions.create({
        model: this.model,
        temperature: 0.35,
        max_tokens: 400,
        messages: [
          {
            role: 'system',
            content:
              "Sen IT o'quv markazi boshlig‘iga yordamchi analitkasan. Faqat o‘zbek tilida 2–4 qisqa jumlada: asosiy tendensiya, ogohlantirish (agar kerak), bitta amaliy tavsiya. San idealarni taxmin qilma — faqat berilgan raqamlarga tayan.",
          },
          { role: 'user', content: payload },
        ],
      });
      const t = response.choices[0]?.message?.content?.trim();
      return t || null;
    } catch {
      return null;
    }
  }

  async getStudentHumorStatus(studentData: any) {
    if (!this.openai) return "Kelajakda zo'r dasturchi bo'ladi (lekin AI o'chiq)!";
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
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
