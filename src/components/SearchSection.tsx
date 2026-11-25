import React, { useState, useEffect, useMemo } from 'react';
import { Article, CategoryInfo } from '../types';
import { Search, X, Sparkles, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { ArticleCard } from './ArticleCard';

interface SearchSectionProps {
  articles: Article[];
  categories: CategoryInfo[];
  onSelectArticle: (article: Article) => void;
  onLikeChanged?: (articleId: string, isLiked: boolean, newCount: number) => void;
  onEditArticle?: (article: Article) => void;
  onDeleteArticle?: (articleId: string) => void;
  onViewAuthor?: (authorId: string, authorName: string) => void;
  initialQuery?: string;
  initialCategory?: string;
}

const POPULAR_QUERIES = [
  'სისხლძარღვების გაწმენდა',
  'მაღალი სიცხის დროს',
  'იმუნიტეტის გაძლიერება',
  'სახსრების ტკივილი',
  'კუჭ-ნაწლავის მოწესრიგება',
  'ლიმონი და ნიორი',
  'ძმრიანი წინდები',
  'დაფნის ფოთოლი',
];

export const SearchSection: React.FC<SearchSectionProps> = ({
  articles,
  categories,
  onSelectArticle,
  onLikeChanged,
  onEditArticle,
  onDeleteArticle,
  onViewAuthor,
  initialQuery = '',
  initialCategory = 'ყველა',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSort, setSelectedSort] = useState<'newest' | 'popular' | 'comments' | 'az'>('newest');

  useEffect(() => {
    if (initialQuery) setSearchQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  // Client-side filtering & fuzzy match
  const filteredArticles = useMemo(() => {
    let result = [...articles];

    // Category filter
    if (selectedCategory && selectedCategory !== 'ყველა') {
      result = result.filter(
        a => a.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const words = q.split(/\s+/).filter(Boolean);

      result = result.filter(a => {
        const textBlock = `${a.title} ${a.summary} ${a.answer} ${a.category} ${(a.keywords || []).join(' ')} ${(a.questions || []).join(' ')}`.toLowerCase();
        return words.every(w => textBlock.includes(w));
      });
    }

    // Sorting
    if (selectedSort === 'popular') {
      result.sort((a, b) => b.likesCount - a.likesCount);
    } else if (selectedSort === 'comments') {
      result.sort((a, b) => b.commentsCount - a.commentsCount);
    } else if (selectedSort === 'az') {
      result.sort((a, b) => a.title.localeCompare(b.title, 'ka'));
    } else {
      // newest
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [articles, searchQuery, selectedCategory, selectedSort]);

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl mx-auto text-center space-y-3 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            ხალხური მედიცინის საძიებო სისტემა
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            მოძებნეთ დაავადების, სიმპტომის, რეცეპტის ან სამკურნალო მცენარის მიხედვით
          </p>

          {/* Search Input Bar */}
          <div className="relative mt-4">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5 text-emerald-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ჩაწერეთ საძიებო სიტყვა (მაგ: სიცხე, სისხლძარღვები, იმუნიტეტი, კუჭი)..."
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl py-3.5 pl-12 pr-10 text-sm text-slate-100 placeholder-slate-500 shadow-inner focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Suggestions */}
          <div className="pt-2 flex items-center justify-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-500 flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3 h-3 text-amber-400" />
              ხშირი ძიებები:
            </span>
            {POPULAR_QUERIES.map(pq => (
              <button
                key={pq}
                type="button"
                onClick={() => setSearchQuery(pq)}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-800/80 hover:bg-emerald-600/20 hover:text-emerald-300 text-slate-300 border border-slate-700/50 transition-colors"
              >
                {pq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        {/* Category Segmented Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('ყველა')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
              selectedCategory === 'ყველა'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            ყველა კატეგორია
          </button>
          {categories.map(c => (
            <button
              key={c.name}
              type="button"
              onClick={() => setSelectedCategory(c.name)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
                selectedCategory === c.name
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {c.name} ({c.count})
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 text-xs shrink-0 self-end sm:self-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">დალაგება:</span>
          <select
            value={selectedSort}
            onChange={e => setSelectedSort(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="newest">უახლესი</option>
            <option value="popular">ყველაზე მოწონებული</option>
            <option value="comments">ყველაზე მეტი კომენტარი</option>
            <option value="az">ანბანით (ა-ჰ)</option>
          </select>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          ნაპოვნია <strong className="text-emerald-400 font-semibold">{filteredArticles.length}</strong> მასალა
          {searchQuery && <span> მოთხოვნაზე «{searchQuery}»</span>}
        </span>
        {(searchQuery || selectedCategory !== 'ყველა') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ყველა');
            }}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            ფილტრების გასუფთავება
          </button>
        )}
      </div>

      {/* Results Grid */}
      {filteredArticles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <Search className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">
            მონაცემები ვერ მოიძებნა
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            სცადეთ სხვა საძიებო სიტყვა, ან შეამოწმეთ სწორად არის თუ არა აკრეფილი. ასევე შეგიძლიათ აირჩიოთ «ყველა კატეგორია».
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ყველა');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-colors"
            >
              ყველა მასალის ნახვა
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              onSelect={onSelectArticle}
              onLikeChanged={onLikeChanged}
              onEdit={onEditArticle}
              onDelete={onDeleteArticle}
              onViewAuthor={onViewAuthor}
            />
          ))}
        </div>
      )}
    </div>
  );
};
