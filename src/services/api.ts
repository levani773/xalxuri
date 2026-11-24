import { Article, Comment, User, UserStats, CategoryInfo } from '../types';

const TOKEN_KEY = 'codna_hub_token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

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
    const res = await request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    tokenStorage.set(res.token);
    return res;
  },

  async login(payload: {
    identifier: string;
    password: string;
  }): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    tokenStorage.set(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User; stats: UserStats }> {
    return request<{ user: User; stats: UserStats }>('/api/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
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
    return request<{ user: User; message: string }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Articles
  async getArticles(params?: {
    search?: string;
    category?: string;
    sort?: string;
  }): Promise<Article[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.sort) query.append('sort', params.sort);

    const qs = query.toString();
    return request<Article[]>(`/api/articles${qs ? `?${qs}` : ''}`);
  },

  async getArticleById(id: string): Promise<Article> {
    return request<Article>(`/api/articles/${id}`);
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
  }): Promise<Article> {
    return request<Article>('/api/articles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async toggleLikeArticle(id: string): Promise<{ isLiked: boolean; likesCount: number; message: string }> {
    return request<{ isLiked: boolean; likesCount: number; message: string }>(`/api/articles/${id}/like`, {
      method: 'POST',
    });
  },

  async updateArticle(id: string, payload: {
    title?: string;
    category?: string;
    summary?: string;
    answer?: string;
    keywords?: string[];
    questions?: string[];
    sources?: string[];
    source_title?: string;
  }): Promise<Article> {
    return request<Article>(`/api/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteArticle(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/articles/${id}`, {
      method: 'DELETE',
    });
  },

  // Categories
  async getCategories(): Promise<CategoryInfo[]> {
    return request<CategoryInfo[]>('/api/categories');
  },

  // Comments
  async getComments(articleId: string): Promise<Comment[]> {
    return request<Comment[]>(`/api/articles/${articleId}/comments`);
  },

  async addComment(articleId: string, content: string): Promise<Comment> {
    return request<Comment>(`/api/articles/${articleId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async deleteComment(commentId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  async toggleLikeComment(commentId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    return request<{ isLiked: boolean; likesCount: number }>(`/api/comments/${commentId}/like`, {
      method: 'POST',
    });
  },

  // User Activity
  async getUserActivity(userId: string): Promise<{
    user: User;
    likedArticles: Article[];
    comments: Comment[];
    createdArticles: Article[];
  }> {
    return request<{
      user: User;
      likedArticles: Article[];
      comments: Comment[];
      createdArticles: Article[];
    }>(`/api/users/${userId}/activity`);
  },

  // Search
  async searchArticles(q: string): Promise<Article[]> {
    return request<Article[]>(`/api/search?q=${encodeURIComponent(q)}`);
  },

  // Smart Chatbot
  async askBot(query: string): Promise<{
    found: boolean;
    score?: number;
    article?: Article;
    message?: string;
  }> {
    return request('/api/bot/ask', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },

  async getUnanswered(): Promise<Array<{ id: string; question: string; count: number; firstAsked: string; lastAsked: string }>> {
    return request('/api/unanswered');
  },
};
