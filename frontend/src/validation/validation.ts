import { z } from 'zod';

// Exam Schemas
export const createExamSchema = z.object({
  title: z.string().min(3, 'Imtihon nomi 3 ta belgidan kam bo\'lmasa kerak').max(100),
  courseId: z.string().uuid('Kurs ID noto\'g\'ri format'),
  description: z.string().optional(),
  duration_minutes: z.number().min(5, 'Kamida 5 daqiqa').max(480, 'Maksimal 8 soat'),
  passing_score: z.number().min(0).max(100, '0-100 orasida bo\'lishi kerak'),
  total_points: z.number().min(1).max(1000),
});

export const updateExamSchema = createExamSchema.partial();

// Question Schemas
export const questionSchema = z.object({
  type: z.enum(['select', 'text', 'code'], {
    errorMap: () => ({ message: 'Noto\'g\'ri savol turi' }),
  }),
  text: z.string().min(10, 'Savol 10 ta belgidan kam bo\'lmasa kerak').max(500),
  points: z.number().min(1).max(100),
  options: z.array(z.string()).optional(),
  correct_answer: z.union([z.string(), z.array(z.string())]).optional(),
  code_template: z.string().optional(),
  test_cases: z
    .array(
      z.object({
        input: z.string(),
        output: z.string(),
      }),
    )
    .optional(),
}).refine(
  (data) => {
    if (data.type === 'select') {
      return (
        data.options &&
        data.options.length >= 2 &&
        data.correct_answer &&
        data.options.includes(String(data.correct_answer))
      );
    }
    if (data.type === 'text') {
      return data.correct_answer && typeof data.correct_answer === 'string';
    }
    if (data.type === 'code') {
      return data.code_template && data.test_cases && data.test_cases.length > 0;
    }
    return true;
  },
  {
    message: 'Savol turi uchun required maydonlar to\'liq emas',
  },
);

// Student Answer Schema
export const submitAnswerSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  answer: z.union([z.string(), z.array(z.string())]),
  clientTime: z.number().optional(),
});

// Exam Settings Schema
export const examSettingsSchema = z.object({
  title: z.string().min(3).max(100),
  courseId: z.string().uuid(),
  durationMinutes: z.number().min(5).max(480),
  passingScore: z.number().min(0).max(100),
  totalPoints: z.number().min(1).max(1000),
  shuffleQuestions: z.boolean(),
  showAnswersFeedback: z.boolean(),
  allowReview: z.boolean(),
  hideCorrectAnswers: z.boolean(),
  randomizeAnswerOrder: z.boolean(),
  enableAntiCheat: z.boolean(),
  maxAttempts: z.number().min(1).max(10),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  startTime: z.string(),
  endTime: z.string(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  timeWarningMinutes: z.number().min(1).max(60),
  allowCalculator: z.boolean(),
  allowNotes: z.boolean(),
  showProgressBar: z.boolean(),
  showTimer: z.boolean(),
  allowBackTracking: z.boolean(),
  lockQuestions: z.boolean(),
  ipRestriction: z.array(z.string()).optional(),
  proctorRequired: z.boolean(),
  recordSession: z.boolean(),
  verifyIdentity: z.boolean(),
  fullScreenRequired: z.boolean(),
  webcamRequired: z.boolean(),
  microphoneRequired: z.boolean(),
  notificationEmail: z.string().email().optional(),
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  {
    message: 'Boshlanish sanasi tugash sanasidan oldin bo\'lishi kerak',
    path: ['startDate'],
  },
);

// AI Generation Config Schema
export const aiGenerationConfigSchema = z.object({
  topic: z.string().min(5, 'Mavzu 5 ta belgidan kam bo\'lmasa kerak').max(200),
  level: z.enum(['easy', 'medium', 'hard']),
  count: z.number().min(1).max(50),
  selectCount: z.number().min(0).max(50),
  textCount: z.number().min(0).max(50),
  codeCount: z.number().min(0).max(50),
}).refine(
  (data) => data.selectCount + data.textCount + data.codeCount === data.count,
  {
    message: 'Savol turlarining yig\'indisi jami savollar soniga teng bo\'lishi kerak',
  },
);

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('Email noto\'g\'ri'),
  password: z.string().min(6, 'Parol 6 ta belgidan kam bo\'lmasa kerak'),
});

// Register Schema
export const registerSchema = z
  .object({
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    email: z.string().email('Email noto\'g\'ri'),
    password: z
      .string()
      .min(8, 'Parol 8 ta belgidan kam bo\'lmasa kerak')
      .regex(/[A-Z]/, 'Kamida 1 ta bosh harf kerak')
      .regex(/[0-9]/, 'Kamida 1 ta raqam kerak'),
    confirmPassword: z.string(),
    role: z.enum(['student', 'teacher', 'admin']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Parollar mos kelmadi',
    path: ['confirmPassword'],
  });

// Attempt Submission Schema
export const submitAttemptSchema = z.object({
  attemptId: z.string().uuid(),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  submittedAt: z.date().optional(),
});

// API Response Schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
  errors: z.record(z.string().array(z.string())).optional(),
});

// Pagination Schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sort: z.string().optional(),
});

// Validation helper functions
export const validateExam = (data: unknown) => {
  return createExamSchema.safeParse(data);
};

export const validateQuestion = (data: unknown) => {
  return questionSchema.safeParse(data);
};

export const validateAnswer = (data: unknown) => {
  return submitAnswerSchema.safeParse(data);
};

export const validateAIConfig = (data: unknown) => {
  return aiGenerationConfigSchema.safeParse(data);
};

export const validateLogin = (data: unknown) => {
  return loginSchema.safeParse(data);
};

export const validateRegister = (data: unknown) => {
  return registerSchema.safeParse(data);
};

export const formatValidationError = (error: z.ZodError) => {
  const formatted: Record<string, string[]> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });
  return formatted;
};

export default {
  createExamSchema,
  updateExamSchema,
  questionSchema,
  submitAnswerSchema,
  examSettingsSchema,
  aiGenerationConfigSchema,
  loginSchema,
  registerSchema,
  submitAttemptSchema,
  validateExam,
  validateQuestion,
  validateAnswer,
  validateAIConfig,
  validateLogin,
  validateRegister,
  formatValidationError,
};
