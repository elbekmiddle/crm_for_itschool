"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("openai");
let AiService = class AiService {
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('OPENAI_API_KEY');
        if (apiKey && apiKey !== 'your_openai_api_key') {
            this.openai = new openai_1.default({ apiKey });
        }
    }
    async analyzeStudent(data) {
        if (!this.openai)
            return { analysis: "AI sozlamalari yopilgan yoki kalit yo'q." };
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "Analyze student performance based on attendance and payments. Keep it humorous. If attendance < 60%, warn them of risk." },
                    { role: "user", content: JSON.stringify(data) }
                ]
            });
            return { analysis: response.choices[0].message.content };
        }
        catch (error) {
            if (error?.status === 429 || error?.message?.includes('429')) {
                return { analysis: "AI tavsiyalar xizmati ayni vaqtda faol emas (Kvota tugagan)." };
            }
            return { analysis: "AI moduli ulanishida vaqtinchalik xato chiqdi." };
        }
    }
    async groupSummary(data) {
        if (!this.openai)
            return { summary: "AI sozlamalari yopilgan yoki kalit yo'q." };
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "Summarize group dynamics based on given data. Identify the best student (max attendance) and keep response humorous." },
                    { role: "user", content: JSON.stringify(data) }
                ]
            });
            return { summary: response.choices[0].message.content };
        }
        catch (error) {
            if (error?.status === 429 || error?.message?.includes('429')) {
                return { summary: "AI tavsiyalar xizmati ayni vaqtda faol emas (Kvota tugagan)." };
            }
            return { summary: "AI moduli ulanishida vaqtinchalik xato chiqdi." };
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map