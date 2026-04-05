const { Client } = require('pg');
require('dotenv').config({ path: '../backend/.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const questions = [
  // HTML
  {
    title: 'HTML: Semantic Tags',
    text: 'Quyidagilardan qaysi biri semantik HTML tegi hisoblanadi?',
    type: 'multiple_choice',
    options: [
      { text: '<div>', is_correct: false },
      { text: '<article>', is_correct: true },
      { text: '<span>', is_correct: false },
      { text: '<b>', is_correct: false }
    ]
  },
  {
    title: 'HTML: Form Input',
    text: 'Foydalanuvchidan bir nechta qatorli matn qabul qilish uchun qaysi tegdan foydalaniladi?',
    type: 'multiple_choice',
    options: [
      { text: '<input type="text">', is_correct: false },
      { text: '<input type="multiline">', is_correct: false },
      { text: '<textarea>', is_correct: true },
      { text: '<text>', is_correct: false }
    ]
  },
  {
    title: 'HTML: Attributes',
    text: 'Rasm yuklanmaganda chiqadigan matnni qaysi atribut orqali beramiz?',
    type: 'multiple_choice',
    options: [
      { text: 'title', is_correct: false },
      { text: 'src', is_correct: false },
      { text: 'alt', is_correct: true },
      { text: 'caption', is_correct: false }
    ]
  },
  
  // CSS
  {
    title: 'CSS: Flexbox',
    text: 'Flexboxda elementlarni asosiy o\'q (main axis) bo\'ylab o\'rtaga joylashtirish uchun qaysi xususiyat ishlatiladi?',
    type: 'multiple_choice',
    options: [
      { text: 'align-items: center', is_correct: false },
      { text: 'justify-content: center', is_correct: true },
      { text: 'text-align: center', is_correct: false },
      { text: 'float: center', is_correct: false }
    ]
  },
  {
    title: 'CSS: Specificity',
    text: 'Quyidagilardan qaysi birining prioriteti (specificity) eng yuqori?',
    type: 'multiple_choice',
    options: [
      { text: 'Class selector (.my-class)', is_correct: false },
      { text: 'ID selector (#my-id)', is_correct: true },
      { text: 'Tag selector (div)', is_correct: false },
      { text: 'Universal selector (*)', is_correct: false }
    ]
  },
  {
    title: 'CSS: Box Model',
    text: 'Box model elementlarini tartib bilan ko\'rsating (ichkaridan tashqariga):',
    type: 'multiple_choice',
    options: [
      { text: 'Content, Padding, Border, Margin', is_correct: true },
      { text: 'Content, Border, Padding, Margin', is_correct: false },
      { text: 'Margin, Border, Padding, Content', is_correct: false },
      { text: 'Padding, Content, Border, Margin', is_correct: false }
    ]
  },
  {
    title: 'CSS Grid',
    text: 'Grid konteynerida ustunlar sonini belgilash uchun qaysi buyruq ishlatiladi?',
    type: 'multiple_choice',
    options: [
      { text: 'grid-rows', is_correct: false },
      { text: 'grid-template-columns', is_correct: true },
      { text: 'columns', is_correct: false },
      { text: 'grid-cols', is_correct: false }
    ]
  },

  // JavaScript
  {
    title: 'JS: Variables',
    text: 'Qaysi kalit so\'z orqali o\'zgarmas (constant) e\'lon qilinadi?',
    type: 'multiple_choice',
    options: [
      { text: 'let', is_correct: false },
      { text: 'var', is_correct: false },
      { text: 'const', is_correct: true },
      { text: 'def', is_correct: false }
    ]
  },
  {
    title: 'JS: Data Types',
    text: 'JavaScriptda "primitive" bo\'lmagan tipni tanlang:',
    type: 'multiple_choice',
    options: [
      { text: 'String', is_correct: false },
      { text: 'Number', is_correct: false },
      { text: 'Object', is_correct: true },
      { text: 'Boolean', is_correct: false }
    ]
  },
  {
    title: 'JS: Arrow Functions',
    text: 'To\'g\'ri yozilgan arrow functionni toping:',
    type: 'multiple_choice',
    options: [
      { text: 'const fn = () => { }', is_correct: true },
      { text: 'const fn = function() => { }', is_correct: false },
      { text: 'fn => { }', is_correct: false },
      { text: '() -> { }', is_correct: false }
    ]
  },

  // Multi Select
  {
    title: 'HTML & CSS: Block Elements',
    text: 'Quyidagilardan qaysilari "block-level" elementlar hisoblanadi? (Bir nechta javob bo\'lishi mumkin)',
    type: 'multi_select',
    max_choices: 3,
    options: [
      { text: '<div>', is_correct: true },
      { text: '<span>', is_correct: false },
      { text: '<h1>', is_correct: true },
      { text: '<p>', is_correct: true },
      { text: '<a>', is_correct: false }
    ]
  },
  {
    title: 'JS: Modern ES6+',
    text: 'ES6 (2015) versiyasida qo\'shilgan xususiyatlarni tanlang:',
    type: 'multi_select',
    max_choices: 3,
    options: [
      { text: 'let/const', is_correct: true },
      { text: 'Arrow functions', is_correct: true },
      { text: 'Template literals', is_correct: true },
      { text: 'var', is_correct: false },
      { text: 'XMLHttpRequest', is_correct: false }
    ]
  },

  // Text Questions
  {
    title: 'Architecture',
    text: 'Single Page Application (SPA) nima va u qanday ishlaydi?',
    type: 'text'
  },
  {
    title: 'Git Version Control',
    text: '"git merge" va "git rebase" o\'rtasidagi farqni tushuntiring.',
    type: 'text'
  },

  // Code Questions (LeetCode like)
  {
    title: 'Code: Hello World',
    text: 'JavaScriptda konsolga "Salom IT School" matnini chiqaruvchi kod yozing.',
    type: 'code'
  },
  {
    title: 'Code: Sum Array',
    text: 'Berilgan massiv (arr) elementlari yig\'indisini hisoblovchi function yozing.',
    type: 'code'
  },
  {
    title: 'Code: Find Max',
    text: 'Ikki sonning kattasini qaytaruvchi "getMax(a, b)" funksiyasini yozing.',
    type: 'code'
  },
  {
    title: 'Code: CSS Center',
    text: 'Parent div ichidagi child elementni ham vertikal, ham gorizontal o\'rtaga keltiruvchi CSS kodini yozing (Flexbox orqali).',
    type: 'code'
  },
  {
    title: 'Code: React Component',
    text: '"Header" nomli oddiy functional komponent yarating.',
    type: 'code'
  },
  {
    title: 'Code: Async/Await',
    text: 'API dan ma\'lumot oluvchi (fetch) oddiy "async" funksiya yozing.',
    type: 'code'
  }
];

async function run() {
  await client.connect();
  console.log('Connected to DB');

  // 1. Create a dummy exam or use existing
  const examRes = await client.query(`
    INSERT INTO exams (title, description, duration, created_by)
    VALUES ($1, $2, $3, (SELECT id FROM users LIMIT 1))
    RETURNING id
  `, ['FullStack Kirish Testi', 'HTML, CSS va JS asoslari bo\'yicha yakuniy test', 30]);

  const examId = examRes.rows[0].id;
  console.log(`Created Exam ID: ${examId}`);

  for (const q of questions) {
    const qRes = await client.query(`
      INSERT INTO questions (exam_id, text, type, max_choices)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [examId, q.text, q.type, q.max_choices || null]);

    const questionId = qRes.rows[0].id;

    if (q.options) {
      for (const opt of q.options) {
        await client.query(`
          INSERT INTO question_options (question_id, text, is_correct)
          VALUES ($1, $2, $3)
        `, [questionId, opt.text, opt.is_correct]);
      }
    }
  }

  console.log('Successfully inserted 20 questions!');
  await client.end();
}

run().catch(console.error);
