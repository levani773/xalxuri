import { Article, Comment, User, UserStats, CategoryInfo } from '../types';
import { localDb } from './localDb';

const TOKEN_KEY = 'codna_hub_token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Auto-detect static hosting environments (Netlify, Vercel, GitHub Pages)
const isStaticHost =
  typeof window !== 'undefined' &&
  (window.location.hostname.endsWith('netlify.app') ||
    window.location.hostname.endsWith('vercel.app') ||
    window.location.hostname.endsWith('github.io') ||
    window.location.hostname.endsWith('pages.dev'));

let forceLocalFallback = isStaticHost;

function isFallbackError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || err);
  return (
    msg.includes('404') ||
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('Load failed') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('ECONNREFUSED')
  );
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `მოთხოვნის შეცდომა (${response.status})`);
  }

  return data as T;
}

export const api = {
  // Auth
  async register(payload: {
    username: string;
    email: string;
    fullName: string;
    password: string;
    avatar?: string;
    bio?: string;
  }): Promise<{ user: User; token: string }> {
    if (forceLocalFallback) {
      const res = await localDb.register(payload);
      tokenStorage.set(res.token);
      return res;
    }
    try {
      const res = await request<{ user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      tokenStorage.set(res.token);
      return res;
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        const res = await localDb.register(payload);
        tokenStorage.set(res.token);
        return res;
      }
      throw err;
    }
  },

  async login(payload: {
    identifier: string;
    password: string;
  }): Promise<{ user: User; token: string }> {
    if (forceLocalFallback) {
      const res = await localDb.login(payload);
      tokenStorage.set(res.token);
      return res;
    }
    try {
      const res = await request<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      tokenStorage.set(res.token);
      return res;
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        const res = await localDb.login(payload);
        tokenStorage.set(res.token);
        return res;
      }
      throw err;
    }
  },

  async getMe(): Promise<{ user: User; stats: UserStats }> {
    if (forceLocalFallback) {
      return localDb.getMe();
    }
    try {
      return await request<{ user: User; stats: UserStats }>('/api/auth/me');
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        return localDb.getMe();
      }
      throw err;
    }
  },

  async logout(): Promise<void> {
    if (forceLocalFallback) {
      await localDb.logout();
      tokenStorage.clear();
      return;
    }
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      await localDb.logout();
    } finally {
      tokenStorage.clear();
    }
  },

  async updateProfile(payload: {
    fullName?: string;
    bio?: string;
    avatar?: string;
    coverImage?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<{ user: User; message: string }> {
    if (forceLocalFallback) {
      return localDb.updateProfile(payload);
    }
    try {
      return await request<{ user: User; message: string }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        return localDb.updateProfile(payload);
      }
      throw err;
    }
  },

  // Articles
  async getArticles(params?: {
    search?: string;
    category?: string;
    sort?: string;
  }): Promise<Article[]> {
    if (forceLocalFallback) {
      return localDb.getArticles(params);
    }
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.category) query.append('category', params.category);
      if (params?.sort) query.append('sort', params.sort);

      const qs = query.toString();
      return await request<Article[]>(`/api/articles${qs ? `?${qs}` : ''}`);
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        return localDb.getArticles(params);
      }
      throw err;
    }
  },

  async getArticleById(id: string): Promise<Article> {
    if (forceLocalFallback) {
      return localDb.getArticleById(id);
    }
    try {
      return await request<Article>(`/api/articles/${id}`);
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        return localDb.getArticleById(id);
      }
      throw err;
    }
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
    if (forceLocalFallback) {
      return localDb.createArticle(payload);
    }
    try {
      return await request<Article>('/api/articles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        return localDb.createArticle(payload);
      }
      throw err;
    }
  },

  async toggleLikeArticle(id: string): Promise<{ isLiked: boolean; likesCount: number; message: string }> {
    if (forceLocalFallback) {
      return localDb.toggleLikeArticle(id);
    }
    try {
      return await request<{ isLiked: boolean; likesCount: number; message: string }>(`/api/articles/${id}/like`, {
        method: 'POST',
      });
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        return localDb.toggleLikeArticle(id);
      }
      throw err;
    }
  },

  async updateArticle(
    id: string,
    payload: {
      title?: string;
      category?: string;
      summary?: string;
      answer?: string;
      keywords?: string[];
      questions?: string[];
      sources?: string[];
      source_title?: string;
      image?: string;
    }
  ): Promise<Article> {
    if (forceLocalFallback) {
      return localDb.updateArticle(id, payload);
    }
    try {
      return await request<Article>(`/api/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        return localDb.updateArticle(id, payload);
      }
      throw err;
    }
  },

  async deleteArticle(id: string): Promise<{ message: string }> {
    if (forceLocalFallback) {
      return localDb.deleteArticle(id);
    }
    try {
      return await request<{ message: string }>(`/api/articles/${id}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        return localDb.deleteArticle(id);
      }
      throw err;
    }
  },

  // Categories
  async getCategories(): Promise<CategoryInfo[]> {
    if (forceLocalFallback) {
      return localDb.getCategories();
    }
    try {
      return await request<CategoryInfo[]>('/api/categories');
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        return localDb.getCategories();
      }
      throw err;
    }
  },

  // Comments
  async getComments(articleId: string): Promise<Comment[]> {
    if (forceLocalFallback) {
      return localDb.getComments(articleId);
    }
    try {
      return await request<Comment[]>(`/api/articles/${articleId}/comments`);
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        return localDb.getComments(articleId);
      }
      throw err;
    }
  },

  async addComment(articleId: string, content: string): Promise<Comment> {
    if (forceLocalFallback) {
      return localDb.addComment(articleId, content);
    }
    try {
      return await request<Comment>(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        return localDb.addComment(articleId, content);
      }
      throw err;
    }
  },

  async deleteComment(commentId: string): Promise<{ message: string }> {
    if (forceLocalFallback) {
      return localDb.deleteComment(commentId);
    }
    try {
      return await request<{ message: string }>(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        return localDb.deleteComment(commentId);
      }
      throw err;
    }
  },

  async toggleLikeComment(commentId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    if (forceLocalFallback) {
      return localDb.toggleLikeComment(commentId);
    }
    try {
      return await request<{ isLiked: boolean; likesCount: number }>(`/api/comments/${commentId}/like`, {
        method: 'POST',
      });
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        return localDb.toggleLikeComment(commentId);
      }
      throw err;
    }
  },

  // User Activity
  async getUserActivity(userId: string): Promise<{
    user: User;
    likedArticles: Article[];
    comments: Comment[];
    createdArticles: Article[];
  }> {
    const defaultFallbackUser: User = {
      id: userId,
      username: 'user',
      email: 'user@example.com',
      fullName: 'მომხმარებელი',
      role: 'user',
      avatar: 'nature',
      bio: '',
      createdAt: new Date().toISOString(),
    };

    if (forceLocalFallback) {
      const act = await localDb.getUserActivity(userId);
      const userObj = act.user || (await localDb.getMe().catch(() => ({ user: defaultFallbackUser }))).user;
      return { user: userObj, ...act };
    }
    try {
      return await request<{
        user: User;
        likedArticles: Article[];
        comments: Comment[];
        createdArticles: Article[];
      }>(`/api/users/${userId}/activity`);
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        const act = await localDb.getUserActivity(userId);
        const userObj = act.user || (await localDb.getMe().catch(() => ({ user: defaultFallbackUser }))).user;
        return { user: userObj, ...act };
      }
      throw err;
    }
  },

  // Search
  async searchArticles(q: string): Promise<Article[]> {
    if (forceLocalFallback) {
      return localDb.getArticles({ search: q });
    }
    try {
      return await request<Article[]>(`/api/search?q=${encodeURIComponent(q)}`);
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        return localDb.getArticles({ search: q });
      }
      throw err;
    }
  },

  // Smart Chatbot
  async askBot(query: string): Promise<{
    found: boolean;
    score?: number;
    article?: Article;
    message?: string;
    isWebResult?: boolean;
  }> {
    if (forceLocalFallback) {
      return localDb.smartBotSearch(query);
    }
    try {
      return await request<{
        found: boolean;
        score?: number;
        article?: Article;
        message?: string;
        isWebResult?: boolean;
      }>('/api/bot/ask', {
        method: 'POST',
        body: JSON.stringify({ query }),
      });
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        return localDb.smartBotSearch(query);
      }
      throw err;
    }
  },

  async getUnanswered(): Promise<Array<{ id: string; question: string; count: number; firstAsked: string; lastAsked: string }>> {
    if (forceLocalFallback) {
      return [];
    }
    try {
      return await request('/api/unanswered');
    } catch (err: any) {
      if (isFallbackError(err)) {
        forceLocalFallback = true;
        return [];
      }
      throw err;
    }
  },
};
