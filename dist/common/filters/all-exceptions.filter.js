"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    constructor() {
        this.logger = new common_1.Logger(AllExceptionsFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const msg = exception instanceof common_1.HttpException ? exception.getResponse() : 'Internal Server Error';
        let userMessage = typeof msg === 'string' ? msg : msg.message || msg;
        if (status === common_1.HttpStatus.FORBIDDEN) {
            userMessage = "Kechirasiz, ushbu amalni bajarish uchun sizda ruxsat mavjud emas. (Forbidden Error)";
        }
        else if (status === common_1.HttpStatus.UNAUTHORIZED) {
            userMessage = 'Kirish taqiqlangan yoki ruda ruxsati yo\'q (Unauthorized)';
        }
        else if (status === common_1.HttpStatus.BAD_REQUEST) {
            if (Array.isArray(userMessage)) {
                userMessage = userMessage.map(m => m.includes('UUID') ? `${m} - UUID formatida bo'lishi shart` : m);
            }
        }
        this.logger.error(`HTTP Status: ${status} Error Message: ${JSON.stringify(msg)}`, exception?.stack);
        response.status(status).json({
            success: false,
            message: userMessage,
            code: status,
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map