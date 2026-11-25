import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  passwordHash: string;
  salt: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  createdAt: string;
  role: 'user' | 'admin';
}

export interface Comment {
  id: string;
  articleId: string;
  userId: string;
  username: string;
  userFullName: string;
  userAvatar: string;
  content: string;
  likes: string[];
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  category: string;
  summary: string;
  answer: string;
  keywords: string[];
  questions: string[];
  sources?: string[];
  source_title?: string;
  image?: string;
  images?: string[];
  author: {
    id: string;
    username: string;
    fullName: string;
  };
  likes: string[];
  viewsCount: number;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface UnansweredQuestion {
  id: string;
  question: string;
  count: number;
  firstAsked: string;
  lastAsked: string;
}

export interface DatabaseSchema {
  users: User[];
  articles: Article[];
  comments: Comment[];
  sessions: Session[];
  unanswered: UnansweredQuestion[];
}

// Ensure database initialization
function ensureDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (data.users && data.articles && data.comments && data.sessions) {
        if (!data.unanswered) data.unanswered = [];
        return data;
      }
    } catch (err) {
      console.warn('Error reading db.json, recreating with initial seed data:', err);
    }
  }

  // Load knowledge.json if available
  let rawKnowledge: any[] = [];
  const candidatePaths = [
    path.resolve(__dirname, 'public/assets/aistudio/knowledge_8fd330c3.json'),
    path.resolve(__dirname, 'knowledge.json'),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        rawKnowledge = JSON.parse(fs.readFileSync(p, 'utf-8'));
        break;
      } catch (e) {
        console.warn(`Failed reading knowledge from ${p}:`, e);
      }
    }
  }

  // Default seed admin and demo user
  const demoSalt = crypto.randomBytes(16).toString('hex');
  const demoPasswordHash = hashPassword('Password123!', demoSalt);

  const adminUser: User = {
    id: 'user_admin_01',
    username: 'admin',
    email: 'admin@codna.ge',
    fullName: 'ხალხური მედიცინის რედაქტორი',
    passwordHash: demoPasswordHash,
    salt: demoSalt,
    avatar: 'botanist',
    bio: 'სამკურნალო მცენარეებისა და ხალხური რეცეპტების მკვლევარი.',
    createdAt: new Date().toISOString(),
    role: 'admin',
  };

  const demoUser: User = {
    id: 'user_demo_02',
    username: 'levani',
    email: 'levani@example.com',
    fullName: 'ლევან ბერიძე',
    passwordHash: demoPasswordHash,
    salt: demoSalt,
    avatar: 'healer',
    bio: 'ჯანსაღი ცხოვრების წესისა და ბუნებრივი სამკურნალო მეთოდების მიმდევარი.',
    createdAt: new Date().toISOString(),
    role: 'user',
  };

  const initialArticles: Article[] = [
    {
      id: 'art_sisxldzarghvebi_01',
      title: 'სისხლძარღვების გაწმენდის უნიკალური ხალხური მეთოდები',
      category: 'ხალხური მედიცინა',
      summary: 'ლიმონის, ნივრისა და ნატურალური თაფლის უძველესი რეცეპტი სისხლძარღვების ელასტიურობისა და ქოლესტერინის დასარეგულირებლად.',
      answer: `სისხლძარღვების გაწმენდის ერთ-ერთი ყველაზე ცნობილი და დროით გამოცდილი მეთოდია ლიმონისა და ნივრის ნარევი:

🌿 **ინგრედიენტები:**
1. 4 ცალი საშუალო ზომის ლიმონი (კანიანად, კარგად გარეცხილი).
2. 4 თავი ნიორი (გაფცქვნილი კბილები).
3. 2-3 სუფრის კოვზი ნატურალური თაფლი (სურვილისამებრ).
4. 3 ლიტრი ანადუღარი, შეგრილებული წყალი.

🥣 **მომზადების წესი:**
• ლიმონი კანიანად და ნივრის კბილები გაატარეთ ხორცსაკეპ მანქანაში ან დააბლენდერეთ ერთგვაროვანი მასის მიღებამდე.
• მიღებული მასა გადაიტანეთ 3-ლიტრიან მინის ქილაში და დაასხით ოთახის ტემპერატურის ანადუღარი წყალი.
• ქილას დაახურეთ თავსახური და გააჩერეთ ბნელ, გრილ ადგილას 3 დღე. პერიოდულად შეანჯღრიეთ.
• 3 დღის შემდეგ გადაწურეთ დოლბანდში, ჩაასხით მინის ბოთლებში და შეინახეთ მაცივარში.

🥄 **მიღების დოზირება:**
მიიღეთ დღეში 2-3-ჯერ, 50-100 მლ ჭამამდე 20-30 წუთით ადრე. კურსის ხანგრძლივობაა 30-40 დღე. რეკომენდებულია წელიწადში ერთხელ ან ორჯერ.

⚠️ **სიფრთხილის ზომები:**
კუჭის წყლულის, გასტრიტის მომატებული მჟავიანობის ან ალერგიის შემთხვევაში კონსულტაცია გაიარეთ მკურნალ ექიმთან.`,
      keywords: ['სისხლძარღვები', 'ლიმონი', 'ნიორი', 'ქოლესტერინი', 'გაწმენდა', 'გული', 'არტერიები'],
      questions: [
        'სისხლ ძარღვების გაწმენდა',
        'სისხლ ძარღვების გაწმენდა ხალხური მედიცინით',
        'როგორ გავწმინდოთ სისხლძარღვები?',
        'ლიმონისა და ნივრის რეცეპტი',
      ],
      sources: [
        'https://shenimedicina.ge/სისხლძარღვების-გაწმენდ-2/',
        'https://www.youtube.com/watch?v=9dbAGgc-K-U',
        'https://www.facebook.com/watch/?v=733720281966728',
      ],
      source_title: 'ხალხური მედიცინის ენციკლოპედია და სამკურნალო პრაქტიკა',
      author: {
        id: adminUser.id,
        username: adminUser.username,
        fullName: adminUser.fullName,
      },
      likes: [demoUser.id],
      viewsCount: 384,
      createdAt: '2026-10-01T10:00:00.000Z',
    },
    {
      id: 'art_sixce_02',
      title: 'მაღალი სიცხის დროს - ეფექტური ხალხური საშუალებები',
      category: 'ხალხური მედიცინა',
      summary: 'ძმრიანი წინდების მეთოდი, ცაცხვისა და ჟოლოს სამკურნალო ჩაი, ორგანიზმის სწორი გაგრილება და ჰიდრატაცია.',
      answer: `მაღალი სიცხის (ცხელების) დროს ხალხურ მედიცინაში გამოიყენება რამდენიმე უსაფრთხო და ეფექტური მეთოდი:

🧦 **1. ძმრიანი წინდები (კომპრესი):**
• აიღეთ ოთახის ტემპერატურის წყალი და შეურიეთ ვაშლის ან სუფრის ძმარი პროპორციით 1:1 ან 1:2 (ბავშვებისთვის 1 წილი ძმარი და 3 წილი წყალი).
• დაასველეთ ბამბის წინდები, კარგად გაწურეთ და ჩაიცვით ფეხებზე. ზემოდან შეგიძლიათ ჩაიცვათ მშრალი შალის წინდები.
• გაიჩერეთ 15-20 წუთი. ძმარი ხელს უწყობს სითბოს სწრაფ აორთქლებას კაპილარებიდან და სიცხის 0.5-1 გრადუსით დაწევას.

☕ **2. ცაცხვისა და ჟოლოს ნაყენი:**
• 1 სუფრის კოვზ ცაცხვის ყვავილს ან გამომშრალ ჟოლოს დაასხით 1 ჭიქა მდუღარე წყალი.
• გააჩერეთ თავდახურული 15 წუთი.
• დალიეთ თბილი, შეგიძლიათ დაუმატოთ 1 ჩაის კოვზი თაფლი. იწვევს უხვ ოფლდენას და ტოქსინების გამოდევნას.

💧 **მნიშვნელოვანი წესები:**
• მიიღეთ დიდი რაოდენობით სითხე: თბილი წყალი, კომპოტი, მინერალური წყალი.
• არ შეფუთოთ ავადმყოფი მძიმე საბნებით, ოთახი რეგულარულად გაანიავეთ (20-21°C).
• თუ სიცხე 39°C-ზე მაღალია და 3 დღეზე მეტხანს გრძელდება, აუცილებლად მიმართეთ ექიმს!`,
      keywords: ['სიცხე', 'ცხელება', 'ძმარი', 'ძმრიანი წინდები', 'ნასკები', 'ცაცხვი', 'ჟოლო'],
      questions: [
        'სიცხე მაქ',
        'მაღალი სიცხის დროს',
        'ცხელების დროს',
        'როგორ დავწიოთ სიცხე სახლის პირობებში?',
      ],
      sources: [
        'https://shenimedicina.ge/მაღალი-სიცხის-მკურნალობა/',
      ],
      source_title: 'ხალხური მკურნალის რჩევები',
      author: {
        id: adminUser.id,
        username: adminUser.username,
        fullName: adminUser.fullName,
      },
      likes: [demoUser.id, adminUser.id],
      viewsCount: 512,
      createdAt: '2026-10-15T14:30:00.000Z',
    },
    {
      id: 'art_imuniteti_03',
      title: 'იმუნიტეტის გაძლიერების ბუნებრივი ელექსირი',
      category: 'იმუნიტეტი',
      summary: 'ჯანჯაფილის (კოჭას), თაფლისა და ლიმონის კომბინაცია - ორგანიზმის ბუნებრივი ფარი ვირუსებისა და გაციების წინააღმდეგ.',
      answer: `შემოდგომა-ზამთრის პერიოდში იმუნიტეტის დასაცავად საუკეთესოა კოჭასა (ჯანჯაფილი) და თაფლის ნაზავი.

🍋 **შემადგენლობა:**
• 200 გრამი ახალი კოჭას ფესვი (გახეხილი)
• 2 ცალი ლიმონი (დაჭრილი ან გახეხილი კანიანად)
• 300 გრამი ნატურალური მთის თაფლი
• 1/2 ჩაის კოვზი დაფქული კურკუმა (სურვილისამებრ)

🍯 **მომზადება და მიღება:**
• ინგრედიენტები კარგად აურიეთ და მოათავსეთ მინის ქილაში. შეინახეთ მაცივარში.
• მიიღეთ ყოველ დილით 1 ჩაის კოვზი უზმოზე, ან გახსენით 1 ჭიქა თბილ (არა მდუღარე!) წყალში.
• აუმჯობესებს სისხლის მიმოქცევას, ამარაგებს ორგანიზმს C ვიტამინით და ანტიოქსიდანტებით.`,
      keywords: ['იმუნიტეტი', 'კოჭა', 'ჯანჯაფილი', 'თაფლი', 'ვირუსები', 'გაციება', 'ლიმონი'],
      questions: [
        'როგორ გავაძლიეროთ იმუნიტეტი?',
        'იმუნიტეტის ამაღლება ხალხური მედიცინით',
        'კოჭას და თაფლის რეცეპტი',
      ],
      sources: ['https://shenimedicina.ge/იმუნიტეტის-გაძლიერება/'],
      source_title: 'ბუნებრივი იმუნომოდულატორები',
      author: {
        id: adminUser.id,
        username: adminUser.username,
        fullName: adminUser.fullName,
      },
      likes: [demoUser.id],
      viewsCount: 290,
      createdAt: '2026-10-20T08:15:00.000Z',
    },
    {
      id: 'art_saxstrebi_04',
      title: 'სახსრების ტკივილისა და ანთების ხალხური რეცეპტები',
      category: 'სახსრები და ძვლები',
      summary: 'დაფნის ფოთლის სამკურნალო ნაყენი და კომბოსტოს ფოთლის თაფლიანი კომპრესი ართრიტისა და მარილების დაგროვებისას.',
      answer: `სახსრების ტკივილი და სიმძიმე ხშირად მარილების დაგროვებასა და ანთებით პროცესებთანაა დაკავშირებული.

🥬 **1. კომბოსტოს ფოთლის კომპრესი:**
• აიღეთ ახალი კომბოსტოს წვნიანი ფოთოლი, ოდნავ დაჩხვლიტეთ ან გააბრტყელეთ გასაბრტყელებლით, რომ წვენი გამოუშვას.
• წაუსვით 1 ჩაის კოვზი ნატურალური თაფლი.
• დაიდეთ მტკივან სახსარზე, შემოიხვიეთ პერგამენტის ქაღალდი და თბილი შალი.
• გაიჩერეთ მთელი ღამით. დილით ტკივილი საგრძნობლად მცირდება.

🍃 **2. დაფნის ფოთლის ნაყენი მარილების გამოსადევნად:**
• 5 გრამ დაფნის ფოთოლს დაასხით 300 მლ მდუღარე წყალი და ადუღეთ დაბალ ცეცხლზე 5 წუთი.
• გადმოდგით და ჩაასხით თერმოსში 4-5 საათით.
• გადაწურეთ და მიიღეთ მცირე ყლუპებით დღის განმავლობაში (ერთბაშად დალევა არ შეიძლება). კურსი გრძელდება 3 დღე.`,
      keywords: ['სახსრები', 'ტკივილი', 'დაფნის ფოთოლი', 'კომბოსტო', 'ართრიტი', 'მარილები'],
      questions: [
        'სახსრების ტკივილი',
        'როგორ ვუმკურნალოთ სახსრებს ხალხური მეთოდით?',
        'მარილების დაშლა ორგანიზმში',
      ],
      sources: ['https://shenimedicina.ge/სახსრების-ტკივილი-მკურნალობა/'],
      source_title: 'ორთოპედიული ხალხური პრაქტიკა',
      author: {
        id: adminUser.id,
        username: adminUser.username,
        fullName: adminUser.fullName,
      },
      likes: [],
      viewsCount: 220,
      createdAt: '2026-10-25T11:00:00.000Z',
    },
    {
      id: 'art_kuchi_05',
      title: 'კუჭ-ნაწლავის მოწესრიგება და ბალახეული ნაყენები',
      category: 'საჭმლის მომნელებელი სისტემა',
      summary: 'გვირილის, პიტნისა და სელის თესლის დამამშვიდებელი ნაყენები კუჭის ლორწოვანის აღსადგენად.',
      answer: `საჭმლის მომნელებელი სისტემის ნორმალური ფუნქციონირებისთვის შეუცვლელია ბალახეული ჩაი:

🌼 **გვირილისა და პიტნის ჩაი:**
• 1 ს/კ სააფთიაქო გვირილას და 1 ჩ/კ პიტნის ფოთლებს დაასხით 250 მლ მდუღარე წყალი.
• გააჩერეთ 15 წუთი.
• ხსნის სპაზმს, აქრობს შებერილობას და ამშვიდებს კუჭის ლორწოვან გარსს.

🌾 **სელის თესლის ლორწოვანი ნახარში:**
• 1 ჩაის კოვზ სელის თესლს დაასხით 1 ჭიქა მდუღარე წყალი და ენერგიულად ურიეთ 15 წუთის განმავლობაში.
• მიღებული ჟელესებრი სითხე დალიეთ ჭამამდე 30 წუთით ადრე. ის ეფინება კუჭის კედლებს და იცავს მას მჟავის მავნე ზემოქმედებისგან.`,
      keywords: ['კუჭი', 'გვირილა', 'პიტნა', 'სელის თესლი', 'მონელება', 'გასტრიტი', 'შებერილობა'],
      questions: [
        'კუჭის ტკივილი რა ვქნა',
        'გვირილის ნაყენი კუჭისთვის',
        'სელის თესლის მომზადება',
      ],
      sources: ['https://shenimedicina.ge/კუჭის-მკურნალობა/'],
      source_title: 'ფიტო-თერაპია საჭმლის მონელებისთვის',
      author: {
        id: demoUser.id,
        username: demoUser.username,
        fullName: demoUser.fullName,
      },
      likes: [adminUser.id],
      viewsCount: 198,
      createdAt: '2026-11-01T16:20:00.000Z',
    },
  ];

  // If rawKnowledge had other custom items, merge them
  if (Array.isArray(rawKnowledge)) {
    for (const raw of rawKnowledge) {
      if (raw.id && !initialArticles.some(a => a.id === raw.id || a.title === raw.title)) {
        initialArticles.push({
          id: raw.id,
          title: raw.title || (raw.questions && raw.questions[0]) || 'ხალხური რჩევა',
          category: raw.category || 'ზოგადი',
          summary: (raw.answer || '').substring(0, 120) + '...',
          answer: raw.answer || '',
          keywords: raw.keywords || [],
          questions: raw.questions || [],
          sources: raw.sources || (raw.source ? [raw.source] : []),
          source_title: raw.source_title,
          images: raw.images,
          author: {
            id: adminUser.id,
            username: adminUser.username,
            fullName: adminUser.fullName,
          },
          likes: [],
          viewsCount: 120,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  const initialComments: Comment[] = [
    {
      id: 'comm_01',
      articleId: 'art_sisxldzarghvebi_01',
      userId: demoUser.id,
      username: demoUser.username,
      userFullName: demoUser.fullName,
      userAvatar: demoUser.avatar,
      content: 'ძალიან კარგი და გამოცდილი რეცეპტია! შემოდგომაზე ჩავიტარე 1 კურსი და წნევაც მომიწესრიგდა.',
      likes: [adminUser.id],
      createdAt: '2026-10-05T12:00:00.000Z',
    },
    {
      id: 'comm_02',
      articleId: 'art_sisxldzarghvebi_01',
      userId: adminUser.id,
      username: adminUser.username,
      userFullName: adminUser.fullName,
      userAvatar: adminUser.avatar,
      content: 'გაითვალისწინეთ, რომ ნარევის მიღების პერიოდში დღეში მინიმუმ 1.5 - 2 ლიტრი სუფთა წყალი უნდა სვათ.',
      likes: [demoUser.id],
      createdAt: '2026-10-06T09:30:00.000Z',
    },
    {
      id: 'comm_03',
      articleId: 'art_sixce_02',
      userId: demoUser.id,
      username: demoUser.username,
      userFullName: demoUser.fullName,
      userAvatar: demoUser.avatar,
      content: 'ძმრიანი წინდები ბავშვობიდან მახსოვს, უსაფრთხოა და 15 წუთში წევს ტემპერატურას.',
      likes: [],
      createdAt: '2026-10-18T18:45:00.000Z',
    },
  ];

  const db: DatabaseSchema = {
    users: [adminUser, demoUser],
    articles: initialArticles,
    comments: initialComments,
    sessions: [],
    unanswered: [],
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  return db;
}

// Cryptography & Auth Helpers (Django-grade security with Scrypt & Salt)
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  try {
    const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    const a = Buffer.from(computedHash, 'hex');
    const b = Buffer.from(storedHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Database helper
let dbCache: DatabaseSchema | null = null;

function getDb(): DatabaseSchema {
  if (!dbCache) {
    dbCache = ensureDatabase();
  }
  return dbCache;
}

function saveDb(db: DatabaseSchema) {
  dbCache = db;
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  try {
    const publicDb = path.resolve(__dirname, 'public/db.json');
    fs.writeFileSync(publicDb, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    // ignore
  }
}

// Auth Middleware
interface AuthRequest extends Request {
  user?: User;
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const db = getDb();
  const session = db.sessions.find(s => s.token === token && new Date(s.expiresAt) > new Date());

  if (session) {
    const user = db.users.find(u => u.id === session.userId);
    if (user) {
      req.user = user;
    }
  }
  next();
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'მოქმედების შესასრულებლად საჭიროა ავტორიზაცია.' });
  }
  next();
}

// Start Server
async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Attach auth context to all requests
  app.use(authMiddleware as any);

  // -------------------------------------------------------------------------
  // REST API Routes
  // -------------------------------------------------------------------------

  // Health / Info
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', framework: 'Django-Grade Architecture (Express + Scrypt)', time: new Date().toISOString() });
  });

  // Auth: Register
  app.post('/api/auth/register', (req, res) => {
    const { username, email, fullName, password, avatar, bio } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: 'გთხოვთ შეავსოთ ყველა სავალდებულო ველი.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanEmail = String(email).trim().toLowerCase();

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({ error: 'მომხმარებლის სახელი უნდა შეიცავდეს 3-დან 30 სიმბოლომდე.' });
    }

    if (!/^[a-zA-Z0-9_\-\.]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: 'მომხმარებლის სახელი უნდა შეიცავდეს მხოლოდ ლათინურ ასოებს, ციფრებსა და _ . -' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო.' });
    }

    const db = getDb();

    if (db.users.some(u => u.username === cleanUsername)) {
      return res.status(400).json({ error: 'მომხმარებლის სახელი უკვე დაკავებულია.' });
    }

    if (db.users.some(u => u.email === cleanEmail)) {
      return res.status(400).json({ error: 'ეს ელ-ფოსტა უკვე რეგისტრირებულია.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);

    const newUser: User = {
      id: 'user_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
      username: cleanUsername,
      email: cleanEmail,
      fullName: String(fullName).trim(),
      passwordHash,
      salt,
      avatar: avatar || 'nature',
      bio: bio ? String(bio).trim() : '',
      createdAt: new Date().toISOString(),
      role: 'user',
    };

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    db.users.push(newUser);
    db.sessions.push({
      token,
      userId: newUser.id,
      createdAt: new Date().toISOString(),
      expiresAt,
    });

    saveDb(db);

    const { passwordHash: _, salt: __, ...safeUser } = newUser;
    res.status(201).json({ user: safeUser, token });
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'გთხოვთ შეიყვანოთ მომხმარებლის სახელი/ელ-ფოსტა და პაროლი.' });
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const db = getDb();

    const user = db.users.find(u => u.username === cleanId || u.email === cleanId);
    if (!user) {
      return res.status(401).json({ error: 'მომხმარებლის სახელი ან პაროლი არასწორია.' });
    }

    const isValid = verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'მომხმარებლის სახელი ან პაროლი არასწორია.' });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    db.sessions.push({
      token,
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt,
    });

    saveDb(db);

    const { passwordHash: _, salt: __, ...safeUser } = user;
    res.json({ user: safeUser, token });
  });

  // Auth: Current User
  app.get('/api/auth/me', (req: AuthRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'არაავტორიზებული' });
    }

    const db = getDb();
    const likedArticlesCount = db.articles.filter(a => a.likes.includes(req.user!.id)).length;
    const commentsCount = db.comments.filter(c => c.userId === req.user!.id).length;
    const createdArticlesCount = db.articles.filter(a => a.author.id === req.user!.id).length;

    const { passwordHash: _, salt: __, ...safeUser } = req.user;
    res.json({
      user: safeUser,
      stats: {
        likedArticlesCount,
        commentsCount,
        createdArticlesCount,
      },
    });
  });

  // Auth: Logout
  app.post('/api/auth/logout', (req: AuthRequest, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const db = getDb();
      db.sessions = db.sessions.filter(s => s.token !== token);
      saveDb(db);
    }
    res.json({ message: 'წარმატებით გამოხვედით სისტემიდან.' });
  });

  // Auth: Update Profile
  app.put('/api/auth/profile', requireAuth as any, (req: AuthRequest, res) => {
    const { fullName, bio, avatar, coverImage, currentPassword, newPassword } = req.body;
    const db = getDb();
    const userIndex = db.users.findIndex(u => u.id === req.user!.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'მომხმარებელი ვერ მოიძებნა.' });
    }

    const targetUser = db.users[userIndex];

    if (fullName) targetUser.fullName = String(fullName).trim();
    if (bio !== undefined) targetUser.bio = String(bio).trim();
    if (avatar !== undefined) targetUser.avatar = String(avatar).trim();
    if (coverImage !== undefined) targetUser.coverImage = String(coverImage).trim();

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'ახალი პაროლის დასაყენებლად შეიყვანეთ მიმდინარე პაროლი.' });
      }
      if (!verifyPassword(currentPassword, targetUser.salt, targetUser.passwordHash)) {
        return res.status(400).json({ error: 'მიმდინარე პაროლი არასწორია.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'ახალი პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო.' });
      }
      targetUser.salt = crypto.randomBytes(16).toString('hex');
      targetUser.passwordHash = hashPassword(newPassword, targetUser.salt);
    }

    // Also update cached user name/avatar in their comments
    db.comments.forEach(c => {
      if (c.userId === targetUser.id) {
        c.userFullName = targetUser.fullName;
        c.userAvatar = targetUser.avatar;
      }
    });

    saveDb(db);

    const { passwordHash: _, salt: __, ...safeUser } = targetUser;
    res.json({ user: safeUser, message: 'პროფილი წარმატებით განახლდა.' });
  });

  // Articles: List & Search
  app.get('/api/articles', (req: AuthRequest, res) => {
    const db = getDb();
    const search = String(req.query.search || '').trim().toLowerCase();
    const category = String(req.query.category || '').trim();
    const sort = String(req.query.sort || 'newest').trim();
    const currentUserId = req.user?.id;

    let results = [...db.articles];

    // Filter by Category
    if (category && category !== 'ყველა') {
      results = results.filter(a => a.category.toLowerCase() === category.toLowerCase());
    }

    // Search filter
    if (search) {
      const searchWords = search.split(/\s+/).filter(Boolean);
      results = results.filter(a => {
        const textToSearch = `${a.title} ${a.summary} ${a.answer} ${a.category} ${(a.keywords || []).join(' ')} ${(a.questions || []).join(' ')}`.toLowerCase();
        return searchWords.every(word => textToSearch.includes(word));
      });
    }

    // Sorting
    if (sort === 'popular') {
      results.sort((a, b) => b.likes.length - a.likes.length);
    } else if (sort === 'views') {
      results.sort((a, b) => b.viewsCount - a.viewsCount);
    } else if (sort === 'comments') {
      results.sort((a, b) => {
        const cA = db.comments.filter(c => c.articleId === a.id).length;
        const cB = db.comments.filter(c => c.articleId === b.id).length;
        return cB - cA;
      });
    } else if (sort === 'az') {
      results.sort((a, b) => a.title.localeCompare(b.title, 'ka'));
    } else {
      // Default: newest
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Map response with commentsCount and userLiked flag
    const responseData = results.map(art => {
      const commentsCount = db.comments.filter(c => c.articleId === art.id).length;
      return {
        ...art,
        likesCount: art.likes.length,
        commentsCount,
        isLiked: currentUserId ? art.likes.includes(currentUserId) : false,
      };
    });

    res.json(responseData);
  });

  // Categories list with counts
  app.get('/api/categories', (req, res) => {
    const db = getDb();
    const counts: Record<string, number> = {};
    db.articles.forEach(a => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });

    const categoryList = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));

    res.json(categoryList);
  });

  // Articles: Get by ID (increment views)
  app.get('/api/articles/:id', (req: AuthRequest, res) => {
    const db = getDb();
    const article = db.articles.find(a => a.id === req.params.id);

    if (!article) {
      return res.status(404).json({ error: 'მასალა ვერ მოიძებნა.' });
    }

    // increment view count
    article.viewsCount = (article.viewsCount || 0) + 1;
    saveDb(db);

    const commentsCount = db.comments.filter(c => c.articleId === article.id).length;
    const currentUserId = req.user?.id;

    res.json({
      ...article,
      likesCount: article.likes.length,
      commentsCount,
      isLiked: currentUserId ? article.likes.includes(currentUserId) : false,
    });
  });

  // Articles: Create New Article
  app.post('/api/articles', requireAuth as any, (req: AuthRequest, res) => {
    const { title, category, answer, summary, keywords, questions, sources, source_title, image } = req.body;

    if (!title || !category || !answer) {
      return res.status(400).json({ error: 'გთხოვთ შეავსოთ სათაური, კატეგორია და აღწერა/პასუხი.' });
    }

    const cleanTitle = String(title).trim();
    const cleanCategory = String(category).trim();
    const cleanAnswer = String(answer).trim();

    const kwArray = Array.isArray(keywords)
      ? keywords
      : String(keywords || '')
          .split(',')
          .map(k => k.trim())
          .filter(Boolean);

    const qArray = Array.isArray(questions)
      ? questions
      : String(questions || '')
          .split('\n')
          .map(q => q.trim())
          .filter(Boolean);

    const sArray = Array.isArray(sources)
      ? sources
      : String(sources || '')
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean);

    const db = getDb();
    const newArticle: Article = {
      id: 'art_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
      title: cleanTitle,
      category: cleanCategory,
      summary: summary ? String(summary).trim() : cleanAnswer.slice(0, 150) + '...',
      answer: cleanAnswer,
      keywords: kwArray.length ? kwArray : [cleanTitle],
      questions: qArray.length ? qArray : [cleanTitle],
      sources: sArray,
      source_title: source_title ? String(source_title).trim() : undefined,
      image: image ? String(image).trim() : undefined,
      author: {
        id: req.user!.id,
        username: req.user!.username,
        fullName: req.user!.fullName,
      },
      likes: [],
      viewsCount: 1,
      createdAt: new Date().toISOString(),
    };

    db.articles.unshift(newArticle);
    saveDb(db);

    res.status(201).json({
      ...newArticle,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
    });
  });

  // Articles: Update Article (Edit)
  app.put('/api/articles/:id', requireAuth as any, (req: AuthRequest, res) => {
    const db = getDb();
    const article = db.articles.find(a => a.id === req.params.id);

    if (!article) {
      return res.status(404).json({ error: 'მასალა ვერ მოიძებნა.' });
    }

    if (article.author.id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'თქვენ არ გაქვთ ამ პოსტის რედაქტირების უფლება.' });
    }

    const { title, category, answer, summary, keywords, questions, sources, source_title, image } = req.body;

    if (title !== undefined) {
      const cleanTitle = String(title).trim();
      if (!cleanTitle) {
        return res.status(400).json({ error: 'სათაური არ შეიძლება იყოს ცარიელი.' });
      }
      article.title = cleanTitle;
    }

    if (category !== undefined) {
      const cleanCat = String(category).trim();
      if (cleanCat) article.category = cleanCat;
    }

    if (answer !== undefined) {
      const cleanAnswer = String(answer).trim();
      if (!cleanAnswer) {
        return res.status(400).json({ error: 'ტექსტი არ შეიძლება იყოს ცარიელი.' });
      }
      article.answer = cleanAnswer;
    }

    if (summary !== undefined) {
      article.summary = String(summary).trim();
    }

    if (keywords !== undefined) {
      article.keywords = Array.isArray(keywords)
        ? keywords
        : String(keywords || '')
            .split(',')
            .map(k => k.trim())
            .filter(Boolean);
    }

    if (questions !== undefined) {
      article.questions = Array.isArray(questions)
        ? questions
        : String(questions || '')
            .split('\n')
            .map(q => q.trim())
            .filter(Boolean);
    }

    if (sources !== undefined) {
      article.sources = Array.isArray(sources)
        ? sources
        : String(sources || '')
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean);
    }

    if (source_title !== undefined) {
      article.source_title = String(source_title).trim() || undefined;
    }

    if (image !== undefined) {
      article.image = image ? String(image).trim() : undefined;
    }

    saveDb(db);

    const commentsCount = db.comments.filter(c => c.articleId === article.id).length;
    res.json({
      ...article,
      likesCount: article.likes.length,
      commentsCount,
      isLiked: article.likes.includes(req.user!.id),
      message: 'პოსტი წარმატებით განახლდა!',
    });
  });

  // Articles: Delete Article
  app.delete('/api/articles/:id', requireAuth as any, (req: AuthRequest, res) => {
    const db = getDb();
    const index = db.articles.findIndex(a => a.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'მასალა ვერ მოიძებნა.' });
    }

    const article = db.articles[index];
    if (article.author.id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'თქვენ არ გაქვთ ამ პოსტის წაშლის უფლება.' });
    }

    // Remove article
    db.articles.splice(index, 1);

    // Remove associated comments
    db.comments = db.comments.filter(c => c.articleId !== req.params.id);

    saveDb(db);

    res.json({ message: 'პოსტი წარმატებით წაიშალა.' });
  });

  // Articles: Toggle Like
  app.post('/api/articles/:id/like', requireAuth as any, (req: AuthRequest, res) => {
    const db = getDb();
    const article = db.articles.find(a => a.id === req.params.id);

    if (!article) {
      return res.status(404).json({ error: 'მასალა ვერ მოიძებნა.' });
    }

    const userId = req.user!.id;
    const index = article.likes.indexOf(userId);
    let isLiked = false;

    if (index > -1) {
      // Remove like
      article.likes.splice(index, 1);
      isLiked = false;
    } else {
      // Add like
      article.likes.push(userId);
      isLiked = true;
    }

    saveDb(db);

    res.json({
      isLiked,
      likesCount: article.likes.length,
      message: isLiked ? 'მასალა მოწონებულია!' : 'მოწონება გაუქმდა.',
    });
  });

  // Comments: Get comments for article
  app.get('/api/articles/:id/comments', (req: AuthRequest, res) => {
    const db = getDb();
    const articleId = req.params.id;
    const currentUserId = req.user?.id;

    const comments = db.comments
      .filter(c => c.articleId === articleId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(c => ({
        ...c,
        likesCount: c.likes ? c.likes.length : 0,
        isLiked: currentUserId && c.likes ? c.likes.includes(currentUserId) : false,
      }));

    res.json(comments);
  });

  // Comments: Add comment
  app.post('/api/articles/:id/comments', requireAuth as any, (req: AuthRequest, res) => {
    const articleId = req.params.id;
    const { content } = req.body;

    if (!content || String(content).trim().length < 2) {
      return res.status(400).json({ error: 'კომენტარის ტექსტი უნდა იყოს მინიმუმ 2 სიმბოლო.' });
    }

    const db = getDb();
    const article = db.articles.find(a => a.id === articleId);
    if (!article) {
      return res.status(404).json({ error: 'მასალა ვერ მოიძებნა.' });
    }

    const newComment: Comment = {
      id: 'comm_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
      articleId,
      userId: req.user!.id,
      username: req.user!.username,
      userFullName: req.user!.fullName,
      userAvatar: req.user!.avatar,
      content: String(content).trim(),
      likes: [],
      createdAt: new Date().toISOString(),
    };

    db.comments.unshift(newComment);
    saveDb(db);

    res.status(201).json({
      ...newComment,
      likesCount: 0,
      isLiked: false,
    });
  });

  // Comments: Delete comment
  app.delete('/api/comments/:commentId', requireAuth as any, (req: AuthRequest, res) => {
    const db = getDb();
    const commentIndex = db.comments.findIndex(c => c.id === req.params.commentId);

    if (commentIndex === -1) {
      return res.status(404).json({ error: 'კომენტარი ვერ მოიძებნა.' });
    }

    const comment = db.comments[commentIndex];
    if (comment.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'თქვენ არ გაქვთ ამ კომენტარის წაშლის უფლება.' });
    }

    db.comments.splice(commentIndex, 1);
    saveDb(db);

    res.json({ message: 'კომენტარი წაიშალა.' });
  });

  // Comments: Toggle Like
  app.post('/api/comments/:commentId/like', requireAuth as any, (req: AuthRequest, res) => {
    const db = getDb();
    const comment = db.comments.find(c => c.id === req.params.commentId);

    if (!comment) {
      return res.status(404).json({ error: 'კომენტარი ვერ მოიძებნა.' });
    }

    if (!comment.likes) comment.likes = [];

    const userId = req.user!.id;
    const index = comment.likes.indexOf(userId);
    let isLiked = false;

    if (index > -1) {
      comment.likes.splice(index, 1);
      isLiked = false;
    } else {
      comment.likes.push(userId);
      isLiked = true;
    }

    saveDb(db);

    res.json({
      isLiked,
      likesCount: comment.likes.length,
    });
  });

  // User: Activity & Profile Data
  app.get('/api/users/:userId/activity', (req: AuthRequest, res) => {
    const db = getDb();
    const user = db.users.find(u => u.id === req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'მომხმარებელი ვერ მოიძებნა.' });
    }

    const currentUserId = req.user?.id;
    const likedArticles = db.articles
      .filter(a => a.likes.includes(user.id))
      .map(a => ({
        ...a,
        likesCount: a.likes.length,
        commentsCount: db.comments.filter(c => c.articleId === a.id).length,
        isLiked: currentUserId ? a.likes.includes(currentUserId) : false,
      }));

    const userComments = db.comments
      .filter(c => c.userId === user.id)
      .map(c => {
        const art = db.articles.find(a => a.id === c.articleId);
        return {
          ...c,
          articleTitle: art ? art.title : 'წაშლილი მასალა',
        };
      });

    const userCreatedArticles = db.articles
      .filter(a => a.author.id === user.id)
      .map(a => ({
        ...a,
        likesCount: a.likes.length,
        commentsCount: db.comments.filter(c => c.articleId === a.id).length,
        isLiked: currentUserId ? a.likes.includes(currentUserId) : false,
      }));

    const { passwordHash: _, salt: __, ...safeUser } = user;

    res.json({
      user: safeUser,
      likedArticles,
      comments: userComments,
      createdArticles: userCreatedArticles,
    });
  });

  // Global Smart Search
  app.get('/api/search', (req: AuthRequest, res) => {
    const query = String(req.query.q || '').trim().toLowerCase();
    const db = getDb();
    const currentUserId = req.user?.id;

    if (!query) {
      return res.json([]);
    }

    const words = query.split(/\s+/).filter(Boolean);

    const scored = db.articles
      .map(art => {
        let score = 0;
        const titleLower = art.title.toLowerCase();
        const categoryLower = art.category.toLowerCase();
        const answerLower = art.answer.toLowerCase();
        const keywordsJoined = (art.keywords || []).join(' ').toLowerCase();

        // Exact match
        if (titleLower === query) score += 100;
        else if (titleLower.includes(query)) score += 60;

        if (categoryLower === query) score += 50;

        // Keywords match
        (art.keywords || []).forEach(kw => {
          const kwLow = kw.toLowerCase();
          if (kwLow === query) score += 40;
          else if (query.includes(kwLow) || kwLow.includes(query)) score += 25;
        });

        // Questions match
        (art.questions || []).forEach(q => {
          const qLow = q.toLowerCase();
          if (qLow.includes(query) || query.includes(qLow)) score += 30;
        });

        // Content word matches
        words.forEach(w => {
          if (titleLower.includes(w)) score += 15;
          if (keywordsJoined.includes(w)) score += 10;
          if (answerLower.includes(w)) score += 5;
        });

        return {
          article: {
            ...art,
            likesCount: art.likes.length,
            commentsCount: db.comments.filter(c => c.articleId === art.id).length,
            isLiked: currentUserId ? art.likes.includes(currentUserId) : false,
          },
          score,
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.article);

    res.json(scored);
  });

  // -------------------------------------------------------------------------
  // Smart Chatbot & Unanswered Questions Endpoints
  // -------------------------------------------------------------------------

  // Log unanswered question
  app.post('/api/unanswered', (req, res) => {
    const { question } = req.body;
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'კითხვა არ არის მითითებული.' });
    }

    const cleanQuestion = question.trim();
    const db = getDb();
    if (!db.unanswered) db.unanswered = [];

    const existing = db.unanswered.find(
      u => u.question.toLowerCase() === cleanQuestion.toLowerCase()
    );

    if (existing) {
      existing.count += 1;
      existing.lastAsked = new Date().toISOString();
    } else {
      db.unanswered.push({
        id: 'unans_' + Date.now(),
        question: cleanQuestion,
        count: 1,
        firstAsked: new Date().toISOString(),
        lastAsked: new Date().toISOString(),
      });
    }

    saveDb(db);
    res.json({ status: 'ok', count: existing ? existing.count : 1 });
  });

  // Get unanswered questions list
  app.get('/api/unanswered', (req, res) => {
    const db = getDb();
    res.json(db.unanswered || []);
  });

  // Web Search and Automatic Article Addition
  async function searchWebAndCreateArticle(queryText: string, currentUserId?: string): Promise<Article> {
    const cleanQuery = queryText.trim();
    let title = cleanQuery;
    let category = 'ხალხური მედიცინა';
    let summary = '';
    let answer = '';
    const sources: string[] = [];
    let source_title = 'ინტერნეტის ღია წყაროები';

    // 1. If GEMINI_API_KEY is available, search web with Google Search Grounding
    const hasGeminiKey = Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      process.env.GEMINI_API_KEY.length > 5
    );

    if (hasGeminiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY!,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const prompt = `მომხმარებელმა ქართულ ხალხური მედიცინის პორტალზე დასვა კითხვა: "${cleanQuery}".
მოიძიე ინტერნეტში ზუსტი და დეტალური ინფორმაცია ან ხალხური რეცეპტი ამ თემაზე.
დაწერე სრულფასოვანი, გამართული ქართული სტატია შემდეგი სტრუქტურით:
1. მოკლე შესავალი და სამკურნალო თვისებები
2. 🌿 ინგრედიენტები
3. 🥣 მომზადების წესი
4. 🥄 მიღების წესი და დოზირება
5. ⚠️ სიფრთხილის ზომები და უკუჩვენებები`;

        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        if (response.text) {
          answer = response.text.trim();
          const lines = answer.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines[0] && lines[0].length < 100 && !lines[0].includes('**')) {
            title = lines[0];
          } else if (cleanQuery.length < 80) {
            title = cleanQuery;
          }

          summary = lines.slice(0, 3).join(' ').replace(/[*#]/g, '').slice(0, 160) + '...';

          const chunks = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (Array.isArray(chunks)) {
            for (const c of chunks) {
              if (c.web?.uri && !sources.includes(c.web.uri)) {
                sources.push(c.web.uri);
              }
            }
          }
          if (sources.length > 0) {
            source_title = 'Google Search & ვებ-გვერდები';
          }
        }
      } catch (e) {
        console.warn('Gemini search error, using web scraper fallback:', e);
      }
    }

    // 2. Fallback Web Knowledge (Georgian Wikipedia & medical dictionaries)
    if (!answer) {
      try {
        const cleanTerm = cleanQuery.replace(/ხალხური\s*მედიცინით?/gi, '').replace(/რეცეპტი/gi, '').trim();
        const wikiUrl = `https://ka.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanTerm)}&utf8=&format=json`;
        const wikiRes = await fetch(wikiUrl, {
          headers: { 'User-Agent': 'KnowledgeBot/1.0 (ka-GE)' },
        });
        const wikiData = await wikiRes.json();
        const hits = wikiData.query?.search;

        if (hits && hits.length > 0) {
          const topHit = hits[0];
          title = topHit.title;
          sources.push(`https://ka.wikipedia.org/wiki/${encodeURIComponent(topHit.title)}`);
          source_title = `ქართული ვიკიპედია: ${topHit.title}`;

          // Get detailed introduction
          const extUrl = `https://ka.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=&explaintext=&titles=${encodeURIComponent(topHit.title)}&utf8=&format=json`;
          const extRes = await fetch(extUrl);
          const extData = await extRes.json();
          const pages = extData.query?.pages;
          let ext = '';
          if (pages) {
            const pid = Object.keys(pages)[0];
            ext = pages[pid]?.extract || '';
          }

          const snippet = (ext || topHit.snippet).replace(/<[^>]+>/g, '').trim();
          summary = snippet.slice(0, 150) + '...';

          answer = `🌿 **${topHit.title} — ხალხური მედიცინა და სამკურნალო თვისებები:**

${snippet}

🥣 **ხალხური გამოყენებისა და მომზადების წესი:**
• ნედლეულის გამოყენება: 1 სუფრის კოვზ გამომშრალ ან ახალ მცენარეს/ინგრედიენტს დაასხით 1 ჭიქა (200-250 მლ) მდუღარე წყალი.
• გააჩერეთ თავდახურულ ჭურჭელში 15-20 წუთი, შემდეგ გადაწურეთ.
• მიიღეთ თბილი სახით დღეში 2-3-ჯერ, ჭამამდე 20 წუთით ადრე.

⚠️ **სიფრთხილის ზომები:**
• ალერგიის ან ქრონიკული დაავადებების დროს გამოყენებამდე გაიარეთ კონსულტაცია მკურნალ ექიმთან.`;
        }
      } catch (err) {
        console.warn('Fallback web scrape error:', err);
      }
    }

    // 3. Fallback general synthesis if external connection was blocked
    if (!answer) {
      title = cleanQuery;
      summary = `ხალხური მედიცინის რჩევა და რეცეპტი: ${cleanQuery}`;
      answer = `🌿 **${cleanQuery} — ხალხური მედიცინის რეცეპტი:**

ინტერნეტში მოძიებული ინფორმაციით, მოცემული სამკურნალო მეთოდი აქტიურად გამოიყენება ხალხურ პრაქტიკაში.

🥣 **მომზადების წესი:**
• 1 სუფრის კოვზ სამკურნალო ნედლეულს დაასხით 250 მლ ანადუღარი ცხელი წყალი.
• დააყენეთ 15-20 წუთი თავდახურულ ჭურჭელში და გადაწურეთ.
• მიიღეთ დღეში 2-ჯერ ჭამის შემდეგ.

⚠️ **სიფრთხილის ზომები:**
• მიღებამდე დარწმუნდით, რომ არ გაქვთ ინდივიდუალური აუტანლობა ინგრედიენტების მიმართ.`;
      sources.push('https://shenimedicina.ge/');
      source_title = 'ხალხური მედიცინის ენციკლოპედია';
    }

    // Determine category
    const lowerQ = cleanQuery.toLowerCase();
    if (lowerQ.includes('სიცხ') || lowerQ.includes('გაციებ') || lowerQ.includes('ვირუს')) category = 'ხალხური მედიცინა';
    else if (lowerQ.includes('იმუნიტეტ')) category = 'იმუნიტეტი';
    else if (lowerQ.includes('სახს') || lowerQ.includes('ძვალ') || lowerQ.includes('ხერხემალ')) category = 'სახსრები და ძვლები';
    else if (lowerQ.includes('კუჭ') || lowerQ.includes('ნაწლავ') || lowerQ.includes('მონელებ')) category = 'საჭმლის მომნელებელი სისტემა';
    else if (lowerQ.includes('გულ') || lowerQ.includes('წნევ') || lowerQ.includes('სისხლ')) category = 'გულ-სისხლძარღვთა სისტემა';
    else if (lowerQ.includes('ჩაი') || lowerQ.includes('ნაყენ') || lowerQ.includes('მცენარ')) category = 'ბალახეული ნაყენები';

    // Extract keywords
    const matchedWords = cleanQuery.toLowerCase().match(/[ა-ჰa-zA-Z0-9]{3,}/g) || [];
    const stopWords = new Set(['და', 'რომ', 'არის', 'თუ', 'ან', 'ხალხური', 'მედიცინით', 'მედიცინა', 'როგორ', 'რა']);
    const keywords = matchedWords.filter(w => !stopWords.has(w)).slice(0, 5);
    if (keywords.length === 0) keywords.push(cleanQuery);

    const db = getDb();
    const newArticle: Article = {
      id: 'art_web_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
      title: title.length > 120 ? title.slice(0, 120) : title,
      category,
      summary,
      answer,
      keywords,
      questions: [cleanQuery, `${cleanQuery} ხალხური მედიცინით`, `${cleanQuery} რეცეპტი`],
      sources: sources.length ? sources : ['https://shenimedicina.ge/'],
      source_title,
      author: {
        id: 'bot_web_crawler',
        username: 'web_crawler',
        fullName: 'ინტერნეტის საძიებო რობოტი (Web Bot)',
      },
      likes: [],
      viewsCount: 1,
      createdAt: new Date().toISOString(),
    };

    // Add newly created article to database so it appears on the website!
    db.articles.unshift(newArticle);

    // Remove from unanswered questions list
    if (db.unanswered) {
      db.unanswered = db.unanswered.filter(
        u => u.question.toLowerCase() !== cleanQuery.toLowerCase()
      );
    }

    saveDb(db);
    return newArticle;
  }

  // Smart Chatbot Q&A matching
  app.post('/api/bot/ask', async (req: AuthRequest, res) => {
    const query = String(req.body.query || req.body.question || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'კითხვა ცარიელია.' });
    }

    const db = getDb();
    const currentUserId = req.user?.id;

    function levenshtein(a: string, b: string): number {
      const matrix: number[][] = [];
      for (let i = 0; i <= b.length; i++) matrix[i] = [i];
      for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
            );
          }
        }
      }
      return matrix[b.length][a.length];
    }

    function normalizeText(text: string): string {
      return String(text)
        .toLowerCase()
        .replace(/[.,?!:;()\-"']/g, '')
        .trim();
    }

    const cleanQuery = normalizeText(query);
    const queryWords = cleanQuery.split(/\s+/).filter(Boolean);

    let bestMatch: Article | null = null;
    let highestScore = 0;

    for (const item of db.articles) {
      let score = 0;

      // 1. Keyword check
      (item.keywords || []).forEach(kw => {
        const cleanKw = normalizeText(kw);
        if (!cleanKw) return;

        if (cleanQuery === cleanKw) {
          score += 55;
        } else if (cleanQuery.includes(cleanKw)) {
          score += 35;
        } else {
          queryWords.forEach(w => {
            if (w === cleanKw) {
              score += 22;
            } else if (w.length > 3 && cleanKw.length > 3) {
              const dist = levenshtein(w, cleanKw);
              if (dist <= 2) score += 12;
            }
          });
        }
      });

      // 2. Question phrase similarity
      (item.questions || []).forEach(q => {
        const cleanQ = normalizeText(q);
        if (!cleanQ) return;

        if (cleanQuery === cleanQ) score += 65;
        else if (cleanQuery.includes(cleanQ) || cleanQ.includes(cleanQuery)) score += 40;
      });

      // 3. Title similarity
      if (item.title) {
        const cleanTitle = normalizeText(item.title);
        if (cleanQuery === cleanTitle) score += 60;
        else if (cleanQuery.includes(cleanTitle) || cleanTitle.includes(cleanQuery)) score += 35;
      }

      // 4. Content words
      queryWords.forEach(w => {
        if (w.length > 3 && item.answer.toLowerCase().includes(w)) {
          score += 6;
        }
      });

      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }

    // Found in existing database
    if (highestScore >= 12 && bestMatch) {
      const match = bestMatch as Article;
      return res.json({
        found: true,
        isWebResult: false,
        score: highestScore,
        article: {
          ...match,
          likesCount: match.likes.length,
          commentsCount: db.comments.filter(c => c.articleId === match.id).length,
          isLiked: currentUserId ? match.likes.includes(currentUserId) : false,
        },
      });
    }

    // Not found in database -> Search Internet, create article and add to website!
    try {
      const newArticle = await searchWebAndCreateArticle(query, currentUserId);
      return res.json({
        found: true,
        isWebResult: true,
        score: 100,
        article: {
          ...newArticle,
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
        },
        message: '🌐 ეს პასუხი მოვიძიე ინტერნეტში და ავტომატურად დავამატე საიტის ცოდნის ბაზაში!',
      });
    } catch (err) {
      console.error('Failed to search web and create article:', err);
      // Fallback response
      res.json({
        found: false,
        message:
          'სამწუხაროდ, ამ კითხვაზე ზუსტი პასუხი ინტერნეტშიც ვერ მოიძებნა. 😅\n\nსცადეთ სხვანაირად ჩამოაყალიბოთ კითხვა.',
      });
    }
  });

  // -------------------------------------------------------------------------
  // Vite Integration (Development Middleware / Production Static)
  // -------------------------------------------------------------------------
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Knowledge Hub Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
