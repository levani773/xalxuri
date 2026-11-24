export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  createdAt: string;
  role: 'user' | 'admin';
}

export interface UserStats {
  likedArticlesCount: number;
  commentsCount: number;
  createdArticlesCount: number;
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
  images?: string[];
  author: {
    id: string;
    username: string;
    fullName: string;
  };
  likes: string[];
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  isLiked: boolean;
  createdAt: string;
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
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  articleTitle?: string;
}

export interface CategoryInfo {
  name: string;
  count: number;
}

export type ViewTab = 'feed' | 'search' | 'profile' | 'category' | 'chatbot';
