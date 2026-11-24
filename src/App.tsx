import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Article, CategoryInfo, ViewTab } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { ArticleCard } from './components/ArticleCard';
import { ArticleDetailModal } from './components/ArticleDetailModal';
import { SearchSection } from './components/SearchSection';
import { ProfileView } from './components/ProfileView';
import { AddArticleModal } from './components/AddArticleModal';
import { EditArticleModal } from './components/EditArticleModal';
import { CategoryView } from './components/CategoryView';
import { AuthModal } from './components/AuthModal';
import { Toast } from './components/Toast';
import { SmartBotView } from './components/SmartBotView';
import {
  Sparkles,
  Search,
  BookOpen,
  Heart,
  MessageSquare,
  Users,
  Shield,
  Layers,
  ArrowRight,
  TrendingUp,
  Bot,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, openAuthModal } = useAuth();

  const [currentTab, setCurrentTab] = useState<ViewTab>('feed');
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Search & Category deep linking state
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ყველა');

  // Theme management (dark / light)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('codna_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('codna_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const loadData = useCallback(async () => {
    setLoadingArticles(true);
    try {
      const [artData, catData] = await Promise.all([
        api.getArticles(),
        api.getCategories(),
      ]);
      setArticles(artData);
      setCategories(catData);
    } catch (err) {
      console.error('Failed to load portal data:', err);
    } finally {
      setLoadingArticles(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When like status changes in card or modal, update locally
  const handleLikeChanged = (articleId: string, isLiked: boolean, newCount: number) => {
    setArticles(prev =>
      prev.map(a =>
        a.id === articleId
          ? { ...a, isLiked, likesCount: newCount }
          : a
      )
    );
    if (selectedArticle && selectedArticle.id === articleId) {
      setSelectedArticle(prev =>
        prev ? { ...prev, isLiked, likesCount: newCount } : null
      );
    }
  };

  const handleCommentAdded = (articleId: string) => {
    setArticles(prev =>
      prev.map(a =>
        a.id === articleId
          ? { ...a, commentsCount: a.commentsCount + 1 }
          : a
      )
    );
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setIsEditModalOpen(true);
  };

  const handleArticleUpdated = (updated: Article) => {
    setArticles(prev => prev.map(a => (a.id === updated.id ? updated : a)));
    if (selectedArticle && selectedArticle.id === updated.id) {
      setSelectedArticle(updated);
    }
    loadData();
  };

  const handleArticleDeleted = (articleId: string) => {
    setArticles(prev => prev.filter(a => a.id !== articleId));
    if (selectedArticle && selectedArticle.id === articleId) {
      setSelectedArticle(null);
    }
    loadData();
  };

  const handleCategoryCardClick = (catName: string) => {
    setActiveCategoryFilter(catName);
    setCurrentTab('search');
  };

  const featuredArticle = articles[0] || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Bar Contract (3 zones) */}
      <Header
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* VIEW 1: FEED / HOME */}
        {currentTab === 'feed' && (
          <div className="space-y-8 animate-fade-in">
            {/* Hero Section */}
            <section className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 sm:p-10 shadow-2xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="text-xs text-emerald-400 font-semibold tracking-wide flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>ხალხური მედიცინისა და ცოდნის ბაზა</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight text-balance">
                    ბუნებრივი რეცეპტები და გამოცდილი მეთოდები
                  </h1>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                    სისხლძარღვების გაწმენდა, მაღალი სიცხის დაწევა, იმუნიტეტის გაძლიერება, სახსრებისა და კუჭის მოწესრიგება. გაეცანით, მოიწონეთ, დააკომენტარეთ და გაუზიარეთ სხვებს.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentTab('chatbot')}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-indigo-950/50 flex items-center gap-2"
                    >
                      <Bot className="w-4 h-4" />
                      <span>ჭკვიანი ჩათ-ბოტი (Smart Bot)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentTab('search')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-lg shadow-emerald-950/50 flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      <span>ძიების დაწყება</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!user) openAuthModal('login');
                        else setIsAddModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2"
                    >
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <span>რეცეპტის დამატება</span>
                    </button>
                  </div>

                  {/* Trust markers & Metrics */}
                  <div className="pt-4 border-t border-slate-800 flex items-center gap-6 text-xs text-slate-400">
                    <div>
                      <span className="block font-bold text-white text-base tabular-nums">
                        {articles.length}
                      </span>
                      <span>სამკურნალო რეცეპტი</span>
                    </div>
                    <div className="border-l border-slate-800 pl-6">
                      <span className="block font-bold text-white text-base tabular-nums">
                        100%
                      </span>
                      <span>ხალხური &amp; ბუნებრივი</span>
                    </div>
                    <div className="border-l border-slate-800 pl-6">
                      <span className="block font-bold text-white text-base tabular-nums">
                        დაცული
                      </span>
                      <span>Django-ს სტანდარტი</span>
                    </div>
                  </div>
                </div>

                {/* Featured Highlight Card */}
                {featuredArticle && (
                  <div
                    onClick={() => setSelectedArticle(featuredArticle)}
                    className="lg:col-span-5 p-6 rounded-2xl bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-500/60 shadow-xl cursor-pointer group transition-all duration-200"
                  >
                    <div className="text-[11px] font-semibold text-emerald-400 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>რჩეული მასალა (Featured)</span>
                      </span>
                      <span className="text-slate-500">{featuredArticle.category}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors mb-2 leading-snug">
                      {featuredArticle.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                      {featuredArticle.summary}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-rose-400">
                          <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
                          <span className="tabular-nums font-medium">{featuredArticle.likesCount}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                          <span className="tabular-nums font-medium">{featuredArticle.commentsCount}</span>
                        </span>
                      </div>

                      <span className="text-emerald-400 group-hover:text-emerald-300 font-semibold inline-flex items-center gap-1 text-xs">
                        <span>წაკითხვა</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Quick Category Bar */}
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>ცოდნის ბაზის მასალები</span>
                <span className="text-xs font-normal text-slate-400 tabular-nums">
                  ({articles.length})
                </span>
              </h2>

              <button
                type="button"
                onClick={() => setCurrentTab('search')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
              >
                <span>საძიებო სისტემა</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Articles Grid */}
            {loadingArticles ? (
              <div className="py-20 text-center text-xs text-slate-500">
                მასალები იტვირთება...
              </div>
            ) : articles.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
                მასალები ვერ მოიძებნა.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {articles.map(article => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onSelect={setSelectedArticle}
                    onLikeChanged={handleLikeChanged}
                    onEdit={handleEditArticle}
                    onDelete={handleArticleDeleted}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: SEARCH ENGINE */}
        {currentTab === 'search' && (
          <div className="animate-fade-in">
            <SearchSection
              articles={articles}
              categories={categories}
              onSelectArticle={setSelectedArticle}
              onLikeChanged={handleLikeChanged}
              onEditArticle={handleEditArticle}
              onDeleteArticle={handleArticleDeleted}
              initialQuery={activeSearchQuery}
              initialCategory={activeCategoryFilter}
            />
          </div>
        )}

        {/* VIEW 3: CATEGORIES */}
        {currentTab === 'category' && (
          <div className="animate-fade-in">
            <CategoryView
              categories={categories}
              onSelectCategory={handleCategoryCardClick}
            />
          </div>
        )}

        {/* VIEW 4: USER PROFILE */}
        {currentTab === 'profile' && (
          <div className="animate-fade-in">
            <ProfileView
              onSelectArticle={setSelectedArticle}
              onLikeChanged={handleLikeChanged}
              onEditArticle={handleEditArticle}
              onDeleteArticle={handleArticleDeleted}
            />
          </div>
        )}

        {/* VIEW 5: SMART CHATBOT (Matching screenshot) */}
        {currentTab === 'chatbot' && (
          <div className="animate-fade-in">
            <SmartBotView
              onSelectArticle={setSelectedArticle}
              knowledgeArticles={articles}
              onArticleAdded={newArt => {
                setArticles(prev => [newArt, ...prev]);
                loadData();
              }}
            />
          </div>
        )}
      </main>

      {/* Floating Smart Bot Launcher (visible on other tabs) */}
      {currentTab !== 'chatbot' && (
        <button
          type="button"
          onClick={() => {
            setCurrentTab('chatbot');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-semibold text-xs sm:text-sm border border-indigo-400/40 transition-all hover:scale-105 group"
          title="ჭკვიანი ჩათ-ბოტის გახსნა"
        >
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <span>Smart Bot AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 mt-16 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">ცოდნის პორტალი</span>
            <span aria-hidden="true">·</span>
            <span>ხალხური მედიცინა &amp; რეცეპტები</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>სწრაფი და დაცული არქიტექტურა</span>
            <span aria-hidden="true">·</span>
            <span>© 2026 ყველა უფლება დაცულია</span>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <ArticleDetailModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        onLikeChanged={handleLikeChanged}
        onCommentAdded={handleCommentAdded}
        onEdit={handleEditArticle}
        onDelete={handleArticleDeleted}
      />

      <AddArticleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onArticleCreated={newArt => {
          setArticles(prev => [newArt, ...prev]);
          loadData();
        }}
      />

      <EditArticleModal
        article={editingArticle}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingArticle(null);
        }}
        onArticleUpdated={handleArticleUpdated}
      />

      <AuthModal />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
