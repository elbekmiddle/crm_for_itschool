declare const _default: (() => {
    port: number;
    jwtSecret: string;
    jwtExpiresIn: string;
    jwtRefreshSecret: string;
    jwtRefreshExpiresIn: string;
    openaiApiKey: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    port: number;
    jwtSecret: string;
    jwtExpiresIn: string;
    jwtRefreshSecret: string;
    jwtRefreshExpiresIn: string;
    openaiApiKey: string;
}>;
export default _default;
