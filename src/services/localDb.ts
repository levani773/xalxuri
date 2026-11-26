import { Article, Comment, User, UserStats, CategoryInfo } from '../types';

const LOCAL_DB_KEY = 'codna_local_db_v2';
const CURRENT_USER_KEY = 'codna_local_user';

interface LocalDBSchema {
  users: (User & { password?: string })[];
  articles: Article[];
  comments: Comment[];
}

function getStoredDB(): LocalDBSchema | null {
  try {
    const raw = localStorage.getItem(LOCAL_DB_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredDB(data: LocalDBSchema) {
  try {
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed saving to localStorage:', e);
  }
}

export const localDb = {
  async init(): Promise<LocalDBSchema> {
    const existing = getStoredDB();
    if (existing && existing.articles && existing.articles.length > 0) {
      if (existing.users) {
        let adminUser = existing.users.find(u => u.email.toLowerCase() === 'levani773@gmail.com' || u.username.toLowerCase() === 'levani773');
        if (adminUser) {
          adminUser.role = 'admin';
          (adminUser as any).password = 'Aba545454';
        } else {
          existing.users.push({
            id: 'user_admin_01',
            username: 'levani773',
            email: 'levani773@gmail.com',
            fullName: 'ლევანი',
            avatar: 'botanist',
            bio: 'სამკურნალო მცენარეებისა და ხალხური რეცეპტების რედაქტორი.',
            createdAt: new Date().toISOString(),
            role: 'admin',
            password: 'Aba545454',
          } as any);
        }
        saveStoredDB(existing);
      }
      return existing;
    }

    let defaultArticles: Article[] = [];
    let defaultUsers: (User & { password?: string })[] = [
      {
        id: 'user_admin_01',
        username: 'levani773',
        email: 'levani773@gmail.com',
        fullName: 'ლევანი',
        avatar: 'botanist',
        bio: 'სამკურნალო მცენარეებისა და ხალხური რეცეპტების რედაქტორი.',
        createdAt: new Date().toISOString(),
        role: 'admin',
        password: 'Aba545454',
      },
      {
        id: 'user_demo_02',
        username: 'levani',
        email: 'levani@example.com',
        fullName: 'ლევან ბერიძე',
        avatar: 'healer',
        bio: 'ჯანსაღი ცხოვრების წესისა და ბუნებრივი სამკურნალო მეთოდების მიმდევარი.',
        createdAt: new Date().toISOString(),
        role: 'user',
        password: 'Password123!',
      },
    ];

    try {
      // Try to load bundled db.json or knowledge.json from public directory
      const res = await fetch('/db.json').catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data.articles && data.articles.length > 0) {
          defaultArticles = data.articles;
        }
        if (data.users && data.users.length > 0) {
          defaultUsers = data.users;
        }
      }
    } catch {
      // Fallback
    }

    if (defaultArticles.length === 0) {
      try {
        const kRes = await fetch('/assets/aistudio/knowledge_8fd330c3.json').catch(() => null);
        if (kRes && kRes.ok) {
          const rawK = await kRes.json();
          defaultArticles = rawK.map((item: any, idx: number) => ({
            id: item.id || `art_${idx}`,
            title: item.title || item.questions?.[0] || 'სამკურნალო რეცეპტი',
            category: item.category || 'ხალხური მედიცინა',
            summary: item.answer ? item.answer.slice(0, 160) + '...' : 'ხალხური მედიცინა',
            answer: item.answer || '',
            keywords: item.keywords || [],
            questions: item.questions || [],
            sources: item.sources || [],
            source_title: item.source_title || 'ხალხური მედიცინა',
            author: {
              id: 'user_admin_01',
              username: 'admin',
              fullName: 'ხალხური მედიცინის რედაქტორი',
            },
            likes: [],
            likesCount: 5,
            commentsCount: 0,
            viewsCount: 120,
            isLiked: false,
            createdAt: new Date().toISOString(),
          }));
        }
      } catch {
        // ignore
      }
    }

    const newDb: LocalDBSchema = {
      users: defaultUsers,
      articles: defaultArticles,
      comments: [],
    };

    saveStoredDB(newDb);
    return newDb;
  },

  async register(payload: {
    username: string;
    email: string;
    fullName: string;
    password: string;
    avatar?: string;
    bio?: string;
  }): Promise<{ user: User; token: string }> {
    const db = await this.init();

    const cleanUsername = payload.username.trim().toLowerCase();
    const cleanEmail = payload.email.trim().toLowerCase();

    const existingIndex = db.users.findIndex(
      u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
    );

    let safeUser: User;
    if (existingIndex > -1) {
      // Update existing user with provided credentials
      const u = db.users[existingIndex];
      u.fullName = payload.fullName.trim() || u.fullName;
      u.password = payload.password;
      if (payload.avatar) u.avatar = payload.avatar;
      if (payload.bio) u.bio = payload.bio.trim();
      db.users[existingIndex] = u;
      const { password: _, ...clean } = u;
      safeUser = clean;
    } else {
      const newUser: User & { password?: string } = {
        id: 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        username: cleanUsername,
        email: cleanEmail,
        fullName: payload.fullName.trim(),
        avatar: payload.avatar || 'nature',
        bio: payload.bio ? payload.bio.trim() : '',
        createdAt: new Date().toISOString(),
        role: 'user',
        password: payload.password,
      };
      db.users.push(newUser);
      const { password: _, ...clean } = newUser;
      safeUser = clean;
    }

    saveStoredDB(db);

    const token = 'local_token_' + Date.now();
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));

    return { user: safeUser, token };
  },

  async login(payload: { identifier: string; password: string }): Promise<{ user: User; token: string }> {
    const db = await this.init();
    const idClean = payload.identifier.trim().toLowerCase();

    const found = db.users.find(
      u => u.username.toLowerCase() === idClean || u.email.toLowerCase() === idClean || (idClean === 'admin' && u.role === 'admin')
    );

    if (!found) {
      throw new Error('მომხმარებელი ვერ მოიძებნა. შეამოწმეთ მონაცემები.');
    }

    if (found.password && found.password !== payload.password) {
      throw new Error('არასწორი პაროლი. სცადეთ თავიდან.');
    }

    if (found.email?.toLowerCase() === 'levani773@gmail.com' || found.username?.toLowerCase() === 'levani773') {
      found.role = 'admin';
    }

    const token = 'local_token_' + Date.now();
    const { password: _, ...safeUser } = found;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));

    return { user: safeUser, token };
  },

  async getMe(): Promise<{ user: User; stats: UserStats }> {
    const db = await this.init();
    const rawUser = localStorage.getItem(CURRENT_USER_KEY);
    if (!rawUser) {
      throw new Error('არაავტორიზებული');
    }

    const cachedUser = JSON.parse(rawUser) as User;
    const current = db.users.find(u => u.id === cachedUser.id) || cachedUser;
    if (current.email?.toLowerCase() === 'levani773@gmail.com' || current.username?.toLowerCase() === 'levani773' || current.username?.toLowerCase() === 'admin') {
      current.role = 'admin';
    }

    const likedArticlesCount = db.articles.filter(a => (a.likes || []).includes(current.id)).length;
    const commentsCount = db.comments.filter(c => c.userId === current.id).length;
    const createdArticlesCount = db.articles.filter(a => a.author.id === current.id).length;

    const { password: _, ...safeUser } = current as User & { password?: string };
    return {
      user: safeUser,
      stats: {
        likedArticlesCount,
        commentsCount,
        createdArticlesCount,
      },
    };
  },

  async logout(): Promise<void> {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  async updateProfile(payload: {
    fullName?: string;
    bio?: string;
    avatar?: string;
    coverImage?: string;
  }): Promise<{ user: User; message: string }> {
    const db = await this.init();
    const rawUser = localStorage.getItem(CURRENT_USER_KEY);
    if (!rawUser) throw new Error('არაავტორიზებული');

    const currentUser = JSON.parse(rawUser) as User;
    const userIndex = db.users.findIndex(u => u.id === currentUser.id);
    if (userIndex === -1) throw new Error('მომხმარებელი ვერ მოიძებნა');

    if (payload.fullName) db.users[userIndex].fullName = payload.fullName.trim();
    if (payload.bio !== undefined) db.users[userIndex].bio = payload.bio.trim();
    if (payload.avatar !== undefined) db.users[userIndex].avatar = payload.avatar.trim();
    if (payload.coverImage !== undefined) db.users[userIndex].coverImage = payload.coverImage.trim();

    saveStoredDB(db);

    const { password: _, ...safeUser } = db.users[userIndex];
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));

    return { user: safeUser, message: 'პროფილი წარმატებით განახლდა.' };
  },

  async getArticles(params?: { search?: string; category?: string; sort?: string }): Promise<Article[]> {
    const db = await this.init();
    let results = [...db.articles];
    const rawUser = localStorage.getItem(CURRENT_USER_KEY);
    const currentUserId = rawUser ? (JSON.parse(rawUser) as User).id : null;

    if (params?.category && params.category !== 'ყველა') {
      results = results.filter(
        a => a.category.toLowerCase() === params.category!.toLowerCase()
      );
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      const words = q.split(/\s+/).filter(Boolean);
      results = results.filter(a => {
        const text = `${a.title} ${a.summary} ${a.answer} ${a.category} ${(a.keywords || []).join(' ')}`.toLowerCase();
        return words.every(w => text.includes(w));
      });
    }

    if (params?.sort === 'popular') {
      results.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    } else if (params?.sort === 'comments') {
      results.sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
    } else if (params?.sort === 'az') {
      results.sort((a, b) => a.title.localeCompare(b.title, 'ka'));
    } else {
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return results.map(art => {
      const commentsCount = db.comments.filter(c => c.articleId === art.id).length;
      const isLiked = currentUserId ? (art.likes || []).includes(currentUserId) : false;
      return {
        ...art,
        commentsCount,
        likesCount: (art.likes || []).length || art.likesCount || 0,
        isLiked,
      };
    });
  },

  async getArticleById(id: string): Promise<Article> {
    const db = await this.init();
    const art = db.articles.find(a => a.id === id);
    if (!art) throw new Error('მასალა ვერ მოიძებნა');

    art.viewsCount = (art.viewsCount || 0) + 1;
    saveStoredDB(db);

    const rawUser = localStorage.getItem(CURRENT_USER_KEY);
    const currentUserId = rawUser ? (JSON.parse(rawUser) as User).id : null;
    const commentsCount = db.comments.filter(c => c.articleId === art.id).length;

    return {
      ...art,
      commentsCount,
      likesCount: (art.likes || []).length || art.likesCount || 0,
      isLiked: currentUserId ? (art.likes || []).includes(currentUserId) : false,
    };
  },

  async createArticle(payload: {
    title: string;
    category: string;
    summary?: string;
    answer: string;
    keywords?: string[];
    questions?: string[];
    sources?: string[];
    source_title?: string;
    image?: string;
  }): Promise<Article> {
    const db = await this.init();
    const rawUser = localStorage.getItem(CURRENT_USER_KEY);
    const currentUser = rawUser ? (JSON.parse(rawUser) as User) : null;

    const newArt: Article = {
      id: 'art_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      title: payload.title.trim(),
      category: payload.category.trim(),
      summary: payload.summary ? payload.summary.trim() : payload.answer.slice(0, 150) + '...',
      answer: payload.answer.trim(),
      keywords: payload.keywords || [payload.title.trim()],
      questions: payload.questions || [payload.title.trim()],
      sources: payload.sources || [],
      source_title: payload.source_title,
      image: payload.image,
      author: {
        id: currentUser ? currentUser.id : 'user_guest',
        username: currentUser ? currentUser.username : 'user',
        fullName: currentUser ? currentUser.fullName : 'მომხმარებელი',
      },
      likes: [],
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 1,
      isLiked: false,
      createdAt: new Date().toISOString(),
    };

    db.articles.unshift(newArt);
    saveStoredDB(db);
    return newArt;
  },

  async updateArticle(id: string, payload: Partial<Article>): Promise<Article> {
    const db = await this.init();
    const idx = db.articles.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('მასალა ვერ მოიძებნა');

    db.articles[idx] = {
      ...db.articles[idx],
      ...payload,
    };
    saveStoredDB(db);
    return db.articles[idx];
  },

  async deleteArticle(id: string): Promise<{ message: string }> {
    const db = await this.init();
    db.articles = db.articles.filter(a => a.id !== id);
    db.comments = db.comments.filter(c => c.articleId !== id);
    saveStoredDB(db);
    return { message: 'პოსტი წარმატებით წაიშალა.' };
  },

  async toggleLikeArticle(id: string): Promise<{ isLiked: boolean; likesCount: number; message: string }> {
    const db = await this.init();
    const rawUser = localStorage.getItem(CURRENT_USER_KEY);
    if (!rawUser) throw new Error('არაავტორიზებული');
    const user = JSON.parse(rawUser) as User;

    const art = db.articles.find(a => a.id === id);
    if (!art) throw new Error('მასალა ვერ მოიძებნა');

    if (!art.likes) art.likes = [];
    const index = art.likes.indexOf(user.id);
    let isLiked = false;

    if (index > -1) {
      art.likes.splice(index, 1);
      isLiked = false;
    } else {
      art.likes.push(user.id);
      isLiked = true;
    }

    art.likesCount = art.likes.length;
    saveStoredDB(db);

    return {
      isLiked,
      likesCount: art.likes.length,
      message: isLiked ? 'მასალა მოწონებულია!' : 'მოწონება გაუქმდა.',
    };
  },

  async getCategories(): Promise<CategoryInfo[]> {
    const db = await this.init();
    const counts: Record<string, number> = {};
    db.articles.forEach(a => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));
  },

  async getComments(articleId: string): Promise<Comment[]> {
    const db = await this.init();
    return db.comments.filter(c => c.articleId === articleId);
  },

  async addComment(articleId: string, content: string): Promise<Comment> {
    const db = await this.init();
    const rawUser = localStorage.getItem(CURRENT_USER_KEY);
    if (!rawUser) throw new Error('არაავტორიზებული');
    const user = JSON.parse(rawUser) as User;

    const newComment: Comment = {
      id: 'cmt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      articleId,
      userId: user.id,
      username: user.username,
      userFullName: user.fullName,
      userAvatar: user.avatar || 'nature',
      content: content.trim(),
      likes: [],
      likesCount: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
    };

    db.comments.unshift(newComment);
    saveStoredDB(db);
    return newComment;
  },

  async deleteComment(commentId: string): Promise<{ message: string }> {
    const db = await this.init();
    db.comments = db.comments.filter(c => c.id !== commentId);
    saveStoredDB(db);
    return { message: 'კომენტარი წაიშალა.' };
  },

  async toggleLikeComment(commentId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    const db = await this.init();
    const rawUser = localStorage.getItem(CURRENT_USER_KEY);
    if (!rawUser) throw new Error('არაავტორიზებული');
    const user = JSON.parse(rawUser) as User;

    const comment = db.comments.find(c => c.id === commentId);
    if (!comment) throw new Error('კომენტარი ვერ მოიძებნა');

    if (!comment.likes) comment.likes = [];
    const idx = comment.likes.indexOf(user.id);
    let isLiked = false;
    if (idx > -1) {
      comment.likes.splice(idx, 1);
      isLiked = false;
    } else {
      comment.likes.push(user.id);
      isLiked = true;
    }
    comment.likesCount = comment.likes.length;
    saveStoredDB(db);

    return { isLiked, likesCount: comment.likes.length };
  },

  async getUserActivity(userId: string): Promise<{
    user?: User;
    likedArticles: Article[];
    comments: Comment[];
    createdArticles: Article[];
  }> {
    const db = await this.init();
    const foundUser = db.users.find(u => u.id === userId);
    const likedArticles = db.articles.filter(a => (a.likes || []).includes(userId));
    const comments = db.comments.filter(c => c.userId === userId);
    const createdArticles = db.articles.filter(a => a.author.id === userId);

    let safeUser: User | undefined = undefined;
    if (foundUser) {
      const { password: _, ...clean } = foundUser as User & { password?: string };
      safeUser = clean;
    }

    return {
      user: safeUser,
      likedArticles,
      comments,
      createdArticles,
    };
  },

  async smartBotSearch(query: string): Promise<{
    found: boolean;
    isWebResult: boolean;
    article?: Article;
    message?: string;
  }> {
    const db = await this.init();
    const qLower = query.toLowerCase().trim();
    const words = qLower.split(/\s+/).filter(Boolean);

    let bestMatch: Article | null = null;
    let highestScore = 0;

    for (const art of db.articles) {
      let score = 0;
      if (art.title.toLowerCase().includes(qLower)) score += 50;
      for (const kw of art.keywords || []) {
        if (qLower.includes(kw.toLowerCase())) score += 20;
      }
      for (const w of words) {
        if (art.title.toLowerCase().includes(w)) score += 10;
        if (art.answer.toLowerCase().includes(w)) score += 5;
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = art;
      }
    }

    if (highestScore >= 15 && bestMatch) {
      return {
        found: true,
        isWebResult: false,
        article: bestMatch,
      };
    }

    return {
      found: false,
      isWebResult: false,
      message: 'სამწუხაროდ, ამ კითხვაზე პასუხი ბაზაში ვერ მოიძებნა.',
    };
  },
};
