import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

const PLACEHOLDER_OPENAI = new Set(['', 'your_openai_api_key', 'sk-your-openai-key-here', 'sk-proj-placeholder']);
const PLACEHOLDER_GEMINI = new Set(['', 'your_gemini_api_key', 'AIza-placeholder']);

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;
  private readonly model: string;
  private readonly geminiKey: string | null;
  private readonly geminiModel: string;
  /** Bir marta muvaffaqiyatli ishlagan model — keyingi so‘rovlarda zanjir boshidan sinashni cheklaydi */
  private geminiResolvedModelId: string | null = null;

  constructor(private configService: ConfigService) {
    const raw = (this.configService.get<string>('OPENAI_API_KEY') || '').trim();
    this.model = (this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini').trim();
    if (raw && !PLACEHOLDER_OPENAI.has(raw) && raw.length > 12) {
      try {
        this.openai = new OpenAI({ apiKey: raw });
      } catch {
        this.openai = null;
      }
    }

    const g = (this.configService.get<string>('GEMINI_API_KEY') || '').trim();
    this.geminiKey =
      g && !PLACEHOLDER_GEMINI.has(g) && g.length > 20 ? g : null;
    this.geminiModel = (
      this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash'
    ).trim();
  }

  async onModuleInit() {
    const warmup =
      String(this.configService.get<string>('AI_WARMUP') || '').toLowerCase() === 'true' ||
      String(this.configService.get<string>('AI_WARMUP') || '') === '1';
    if (!warmup || !this.geminiKey || this.resolveAiProvider() !== 'gemini') {
      return;
    }
    try {
      await this.callGemini({
        system: 'Reply with the single word OK.',
        user: 'ping',
        maxOutputTokens: 8,
        temperature: 0,
      });
      this.logger.log('AI warmup: Gemini javob berdi.');
    } catch (e: any) {
      this.logger.debug(`AI warmup: ${e?.message || e}`);
    }
  }

  /** openai | gemini | none */
  private resolveAiProvider(): 'openai' | 'gemini' | 'none' {
    const p = (this.configService.get<string>('AI_PROVIDER') || '').trim().toLowerCase();
    if (p === 'gemini') {
      if (this.geminiKey) return 'gemini';
      if (this.openai) return 'openai';
      return 'none';
    }
    if (p === 'openai') {
      if (this.openai) return 'openai';
      if (this.geminiKey) return 'gemini';
      return 'none';
    }
    if (this.openai) return 'openai';
    if (this.geminiKey) return 'gemini';
    return 'none';
  }

  /** Kalitlar: OpenAI yoki Gemini (imtihon / tahlil uchun) */
  isConfigured(): boolean {
    return this.resolveAiProvider() !== 'none';
  }

  hasOpenAi(): boolean {
    return this.openai !== null;
  }

  hasGemini(): boolean {
    return this.geminiKey !== null;
  }

  getActiveProvider(): 'openai' | 'gemini' | 'none' {
    return this.resolveAiProvider();
  }

  /** Yangi akkauntlarda eski model nomlari 404 beradi — zanjir bilan sinaymiz */
  private geminiModelChain(): string[] {
    const extra = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
    const seen = new Set<string>();
    const out: string[] = [];
    const resolved = (this.geminiResolvedModelId || '').trim();
    if (resolved) {
      seen.add(resolved);
      out.push(resolved);
    }
    for (const m of [this.geminiModel, ...extra]) {
      const id = (m || '').trim();
      if (id && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
    return out;
  }

  private async callGeminiOnce(
    modelId: string,
    options: {
      system: string;
      user: string;
      jsonMode?: boolean;
      temperature?: number;
      maxOutputTokens?: number;
    },
  ): Promise<string> {
    const { system, user, jsonMode, temperature = 0.65, maxOutputTokens } = options;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(this.geminiKey!)}`;
    const generationConfig: Record<string, unknown> = { temperature };
    if (jsonMode) generationConfig.responseMimeType = 'application/json';
    if (maxOutputTokens != null) generationConfig.maxOutputTokens = maxOutputTokens;

    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as any;
    if (!res.ok) {
      const msg = data?.error?.message || res.statusText || 'Gemini so‘rovi muvaffaqiyatsiz';
      const err = new Error(`Gemini ${res.status}: ${msg}`) as Error & { httpStatus?: number };
      err.httpStatus = res.status;
      throw err;
    }
    if (data?.error?.message) {
      throw new Error(String(data.error.message));
    }

    const cand = data?.candidates?.[0];
    const reason = cand?.finishReason;
    if (reason && ['SAFETY', 'BLOCKLIST', 'PROHIBITED_CONTENT'].includes(String(reason))) {
      throw new Error('Gemini xavfsizlik filtri javobni blokladi.');
    }

    const text =
      cand?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';
    const out = text.trim();
    if (!out) {
      throw new Error(
        'Gemini javob matni bo‘sh (model yoki filtr). GEMINI_MODEL ni o‘zgartiring.',
      );
    }
    return out;
  }

  private async callGemini(options: {
    system: string;
    user: string;
    jsonMode?: boolean;
    temperature?: number;
    maxOutputTokens?: number;
  }): Promise<string> {
    if (!this.geminiKey) throw new Error('GEMINI_API_KEY yo‘q');
    let lastErr: any;
    for (const modelId of this.geminiModelChain()) {
      try {
        const text = await this.callGeminiOnce(modelId, options);
        this.geminiResolvedModelId = modelId;
        return text;
      } catch (e: any) {
        lastErr = e;
        const http = e?.httpStatus;
        const msg = String(e?.message || '');
        const modelGone =
          http === 404 ||
          /404|not longer available|is not found|not supported for generateContent/i.test(msg);
        if (modelGone) {
          if (this.geminiResolvedModelId === modelId) {
            this.geminiResolvedModelId = null;
          }
          this.logger.debug(`Gemini model "${modelId}" ishlamadi, keyingisini sinaymiz…`);
          continue;
        }
        throw e;
      }
    }
    throw lastErr || new Error('Gemini: hech qanday model ishlamadi');
  }

  private async completeWithProvider(
    system: string,
    user: string,
    opts?: { temperature?: number; maxOut?: number },
  ): Promise<string> {
    const p = this.resolveAiProvider();
    if (p === 'none') throw new Error('NO_AI');
    if (p === 'gemini') {
      return this.callGemini({
        system,
        user,
        jsonMode: false,
        temperature: opts?.temperature ?? 0.65,
        maxOutputTokens: opts?.maxOut,
      });
    }
    const response = await this.openai!.chat.completions.create({
      model: this.model,
      temperature: opts?.temperature ?? 0.65,
      max_tokens: opts?.maxOut,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    return String(response.choices[0]?.message?.content || '').trim();
  }

  private normalizeExamQuestionItems(jsonArr: any[], n: number) {
    return jsonArr.slice(0, n).map((q: any, i: number) => {
      let t = String(q?.type || 'multiple_choice').toLowerCase().replace(/-/g, '_');
      if (!['multiple_choice', 'true_false', 'multiple_select', 'text'].includes(t)) {
        t = 'multiple_choice';
      }
      const baseText = String(q?.text || `Savol ${i + 1}`);
      if (t === 'text') {
        return {
          type: 'text',
          text: baseText,
          options: [],
          correct_answer: String(q?.correct_answer || 'Qisqa javob').slice(0, 2000),
        };
      }
      if (t === 'true_false') {
        const opts =
          Array.isArray(q?.options) && q.options.length >= 2
            ? q.options.slice(0, 2).map((o: any) => String(o))
            : ["To'g'ri", "Noto'g'ri"];
        return {
          type: 'true_false',
          text: baseText,
          options: opts,
          correct_answer: Math.min(1, Math.max(0, Number(q?.correct_answer) || 0)),
        };
      }
      if (t === 'multiple_select') {
        const opts = Array.isArray(q?.options)
          ? q.options.map((o: any) => String(o)).filter(Boolean)
          : [];
        while (opts.length < 3) opts.push(`Variant ${opts.length + 1}`);
        const cap = opts.slice(0, 6);
        let ca = Array.isArray(q?.correct_answer)
          ? q.correct_answer.map((x: any) => Math.min(cap.length - 1, Math.max(0, Number(x))))
          : [0, 1];
        ca = [...new Set(ca)].filter((x) => x < cap.length);
        if (ca.length < 2) ca = [0, 1].filter((x) => x < cap.length);
        return {
          type: 'multiple_select',
          text: baseText,
          options: cap,
          correct_answer: ca,
        };
      }
      return {
        type: 'multiple_choice',
        text: baseText,
        options:
          Array.isArray(q?.options) && q.options.length >= 4
            ? q.options.slice(0, 4).map((o: any) => String(o))
            : ['A', 'B', 'C', 'D'],
        correct_answer: Math.min(3, Math.max(0, Number(q?.correct_answer) || 0)),
      };
    });
  }

  private parseExamJsonRaw(raw: string, _n: number): any[] {
    const trimmed = String(raw || '').trim();
    if (!trimmed) {
      throw new Error('AI JSON javobi bo‘sh');
    }
    let parsed: any;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      const stripped = trimmed.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(stripped);
    }
    let jsonArr = parsed?.questions;
    if (!Array.isArray(jsonArr)) jsonArr = parsed?.items;
    if (!Array.isArray(jsonArr) && Array.isArray(parsed)) {
      jsonArr = parsed;
    }
    if (!Array.isArray(jsonArr)) {
      throw new Error('JSONda "questions" massivi topilmadi');
    }
    if (jsonArr.length === 0) {
      throw new Error('Empty questions array');
    }
    return jsonArr;
  }

  async analyzeStudent(data: any) {
    const sys =
      data.special_mode === 'DEMO'
        ? "You are a legendary Web Development Teacher. Provide an inspiring, humorous, and tech-savvy 'Web Dasturlash' (Web Development) themed analysis of this student. Use terms like 'Full-stack', 'Commit', 'Bug-free' etc."
        : "Analyze student performance based on attendance and payments. Keep it humorous. If attendance < 60%, warn them of risk. Use Uzbek language for the analysis.";
    try {
      const content = await this.completeWithProvider(sys, JSON.stringify(data));
      return { analysis: content };
    } catch (error: any) {
      if (error?.message === 'NO_AI') {
        return { analysis: "AI sozlamalari yopilgan yoki kalit yo'q." };
      }
      if (error?.status === 429 || String(error?.message || '').includes('429')) {
        return { analysis: "AI tavsiyalar xizmati ayni vaqtda faol emas (limit)." };
      }
      return { analysis: "AI moduli ulanishida vaqtinchalik xato chiqdi." };
    }
  }

  async groupSummary(data: any) {
    try {
      const content = await this.completeWithProvider(
        'Summarize group dynamics based on given data. Identify the best student (max attendance) and keep response humorous.',
        JSON.stringify(data),
      );
      return { summary: content };
    } catch (error: any) {
      if (error?.message === 'NO_AI') {
        return { summary: "AI sozlamalari yopilgan yoki kalit yo'q." };
      }
      if (error?.status === 429 || String(error?.message || '').includes('429')) {
        return { summary: "AI tavsiyalar xizmati ayni vaqtda faol emas (limit)." };
      }
      return { summary: "AI moduli ulanishida vaqtinchalik xato chiqdi." };
    }
  }

  async analyzeFinancials(data: any) {
    try {
      const content = await this.completeWithProvider(
        'You are a senior business analyst for an IT school. Analyze the provided monthly financial and growth data. Identify trends, calculate basic ROI if possible, and provide 3 actionable strategic recommendations. Keep it professional but concise.',
        JSON.stringify(data),
      );
      return { analysis: content };
    } catch {
      return { analysis: "AI moliyaviy tahlil moduli ulanishida xato chiqdi." };
    }
  }

  async generateExamQuestions(topic: string, level: string, count: number) {
    const n = Math.min(Math.max(1, count), 30);
    const system = `You create IELTS-style mixed exam items. Respond with JSON only: { "questions": [ ... ] }.
Exactly ${n} questions total. Mix types like a mock test:
- "multiple_choice": "text", "options" (exactly 4 distinct strings), "correct_answer" (integer 0-3).
- "true_false": "text" (statement), "options" may be [] or ["To'g'ri","Noto'g'ri"], "correct_answer" 0 or 1 (0=true/yes).
- "multiple_select": "text", "options" (3-6 strings), "correct_answer" (array of distinct indices, at least 2 correct).
- "text": "text" (open question), "options" [], "correct_answer" (short model answer string for grading, 1-3 sentences).

Each object MUST include "type" as one of: multiple_choice, true_false, multiple_select, text.
Prefer Uzbek or bilingual wording when natural for an IT school.`;

    const userMsg = JSON.stringify({ topic, level, count: n });

    const provider = this.resolveAiProvider();
    if (provider === 'none') {
      return Array.from({ length: count }).map((_, i) => ({
        type: 'multiple_choice',
        text: `Default Question ${i + 1} for ${topic} (AI Offline)`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_answer: 0,
      }));
    }

    try {
      if (provider === 'gemini') {
        const raw = await this.callGemini({
          system,
          user: userMsg,
          jsonMode: true,
          temperature: 0.65,
        });
        const jsonArr = this.parseExamJsonRaw(raw, n);
        return this.normalizeExamQuestionItems(jsonArr, n);
      }

      const response = await this.openai!.chat.completions.create({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userMsg },
        ],
        temperature: 0.65,
      });
      const raw = response.choices[0]?.message?.content?.trim() || '{}';
      const jsonArr = this.parseExamJsonRaw(raw, n);
      return this.normalizeExamQuestionItems(jsonArr, n);
    } catch (e: any) {
      this.logExamGenerationError(e);
      const msg = this.examErrorUserMessage(e);
      throw new Error(msg);
    }
  }

  private logExamGenerationError(e: any) {
    const apiCode = e?.error?.code || e?.code;
    const apiType = e?.error?.type || e?.type;
    const msg = String(e?.message || '');
    const quota =
      apiCode === 'insufficient_quota' ||
      apiType === 'insufficient_quota' ||
      e?.status === 429 ||
      /429|quota|rate_limit|RESOURCE_EXHAUSTED|exhausted/i.test(msg);

    if (quota) {
      this.logger.warn(
        'AI imtihon: provayder limiti (429 / quota). OpenAI billing yoki Gemini usage tekshiring.',
      );
    } else {
      const line = msg.split('\n')[0] || 'noma\'lum xato';
      this.logger.warn(`AI imtihon generatsiyasi: ${line}`);
    }
  }

  private examErrorUserMessage(e: any): string {
    const msg = String(e?.message || '');
    const quota =
      e?.status === 429 ||
      /429|quota|RESOURCE_EXHAUSTED|exhausted|rate limit/i.test(msg);
    if (quota) {
      return this.resolveAiProvider() === 'gemini'
        ? 'Gemini API limiti yoki kvota. Google AI Studio → usage tekshiring yoki GEMINI_MODEL ni almashtiring (masalan gemini-1.5-flash).'
        : 'OpenAI hisobingizda kvota yoki limit (429). platform.openai.com → Billing tekshiring.';
    }
    return msg || 'AI savollarni generatsiya qila olmadi.';
  }

  async gradeExamAnswer(input: {
    questionText: string;
    expectedAnswer: string;
    studentAnswer: string;
    questionType: 'text' | 'code';
  }): Promise<{ isCorrect: boolean; points: number } | null> {
    const student = String(input.studentAnswer || '').slice(0, 12000);
    if (!student.trim()) {
      return { isCorrect: false, points: 0 };
    }

    const system =
      input.questionType === 'code'
        ? 'You grade programming exam answers. Return JSON only: {"score_0_to_10": number, "passed": boolean}. passed=true if score >= 6. Check correctness vs reference; allow minor syntax differences.'
        : 'You grade short text answers for an IT school. Return JSON only: {"score_0_to_10": number, "passed": boolean}. passed=true if score >= 6. Use reference as key facts; reward partial understanding.';

    const userPayload = JSON.stringify({
      question: input.questionText,
      reference_answer: input.expectedAnswer,
      student_answer: student,
    });

    const p = this.resolveAiProvider();
    if (p === 'none') return null;

    try {
      let raw: string;
      if (p === 'gemini') {
        raw = await this.callGemini({
          system,
          user: userPayload,
          jsonMode: true,
          temperature: 0.2,
        });
      } else {
        const response = await this.openai!.chat.completions.create({
          model: this.model,
          response_format: { type: 'json_object' },
          temperature: 0.2,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userPayload },
          ],
        });
        raw = response.choices[0]?.message?.content || '{}';
      }
      const obj = JSON.parse(raw);
      const score = Math.min(10, Math.max(0, Number(obj.score_0_to_10) || 0));
      const passed = obj.passed === true || score >= 6;
      return { isCorrect: passed, points: score };
    } catch {
      return null;
    }
  }

  async summarizeDashboardSnapshot(data: Record<string, unknown>): Promise<string | null> {
    if (this.resolveAiProvider() === 'none') return null;
    try {
      const payload = JSON.stringify(data).slice(0, 14000);
      return await this.completeWithProvider(
        "Sen IT o'quv markazi boshlig‘iga yordamchi analitkasan. Faqat o‘zbek tilida 2–4 qisqa jumlada: asosiy tendensiya, ogohlantirish (agar kerak), bitta amaliy tavsiya. San idealarni taxmin qilma — faqat berilgan raqamlarga tayan.",
        payload,
        { temperature: 0.35, maxOut: 400 },
      );
    } catch {
      return null;
    }
  }

  async getStudentHumorStatus(studentData: any) {
    if (this.resolveAiProvider() === 'none') {
      return "Kelajakda zo'r dasturchi bo'ladi (lekin AI o'chiq)!";
    }
    try {
      return await this.completeWithProvider(
        "Sen IT o'quv markazining hazilkash yordamchisisan. Studentning davomati va holatiga qarab, unga bitta qisqa (1-2 gap), juda kulgili va o'zbek tilida holat (status) yozib ber. Masalan, agar dars qoldirsa: 'Bu bolani qidiruvga berish kerak, yo'qolib qoldi.', yoki zo'r bo'lsa: 'Sohasining sherlaridan biri 😎'. Faqat xabar qismini qaytar.",
        JSON.stringify(studentData),
      );
    } catch {
      return "Zahira kodi: Darslarga vaqtida keling, yo'qsa AI xafa bo'ladi!";
    }
  }
}
