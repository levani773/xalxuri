import React, { useState } from 'react';
import { Article } from '../types';
import { Heart, MessageSquare, Eye, ExternalLink, ArrowRight, Edit3, Trash2, User } from 'lucide-react';
import { SharePopover } from './SharePopover';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface ArticleCardProps {
  article: Article;
  onSelect: (article: Article) => void;
  onLikeChanged?: (articleId: string, isLiked: boolean, newCount: number) => void;
  onEdit?: (article: Article) => void;
  onDelete?: (articleId: string) => void;
  onViewAuthor?: (authorId: string, authorName: string) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onSelect,
  onLikeChanged,
  onEdit,
  onDelete,
  onViewAuthor,
}) => {
  const { user, openAuthModal, showToast } = useAuth();
  const [isLiked, setIsLiked] = useState(article.isLiked);
  const [likesCount, setLikesCount] = useState(article.likesCount);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isUserAdmin = Boolean(
    user && (
      user.role === 'admin' ||
      user.email?.toLowerCase() === 'levani773@gmail.com' ||
      user.username?.toLowerCase() === 'levani773' ||
      user.username?.toLowerCase() === 'admin'
    )
  );
  const isAuthor = Boolean(user && user.id === article.author.id);
  const canModify = isUserAdmin || isAuthor;

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (isLiking) return;
    setIsLiking(true);

    // Optimistic toggle
    const nextLiked = !isLiked;
    const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    setIsLiked(nextLiked);
    setLikesCount(nextCount);

    try {
      const res = await api.toggleLikeArticle(article.id);
      setIsLiked(res.isLiked);
      setLikesCount(res.likesCount);
      if (onLikeChanged) {
        onLikeChanged(article.id, res.isLiked, res.likesCount);
      }
      showToast(res.message);
    } catch {
      // Revert on error
      setIsLiked(isLiked);
      setLikesCount(likesCount);
      showToast('მოწონების შეცდომა');
    } finally {
      setIsLiking(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(article);
    }
  };

  const handleExecuteDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canModify) return;

    setIsDeleting(true);
    try {
      await api.deleteArticle(article.id);
      showToast('პოსტი წარმატებით წაიშალა.');
      if (onDelete) {
        onDelete(article.id);
      }
    } catch (err: any) {
      showToast(err.message || 'პოსტის წაშლა ვერ მოხერხდა.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formattedDate = new Date(article.createdAt).toLocaleDateString('ka-GE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={() => onSelect(article)}
      className="group relative bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-lg"
    >
      <div>
        {/* Clean unboxed metadata with typographic separators (Zero-Pill Rule) */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
            <span className="text-emerald-400 font-medium">{article.category}</span>
            <span aria-hidden="true">·</span>
            {/* Author Name with link to profile */}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                if (onViewAuthor) {
                  onViewAuthor(article.author.id, article.author.fullName || article.author.username);
                }
              }}
              title={`ავტორი: ${article.author.fullName || article.author.username}`}
              className="inline-flex items-center gap-1 text-slate-300 hover:text-emerald-400 font-medium transition-colors group/author"
            >
              <User className="w-3 h-3 text-slate-500 group-hover/author:text-emerald-400" />
              <span className="group-hover/author:underline underline-offset-2">
                {article.author.fullName || article.author.username}
              </span>
            </button>
            <span aria-hidden="true">·</span>
            <span>{formattedDate}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span className="tabular-nums">{article.viewsCount}</span>
            </span>
          </div>

          {canModify && (
            <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity ml-auto">
              {onEdit && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  title="პოსტის რედაქტირება"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                showDeleteConfirm ? (
                  <div
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 bg-rose-950/95 border border-rose-500/60 rounded-lg px-2 py-0.5 text-xs shadow-lg animate-fade-in z-20"
                  >
                    <span className="text-rose-200 text-[11px] font-medium">წავშალო?</span>
                    <button
                      type="button"
                      onClick={handleExecuteDelete}
                      disabled={isDeleting}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? '...' : 'დიახ'}
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setShowDeleteConfirm(false);
                      }}
                      className="px-1 py-0.5 text-slate-300 hover:text-white rounded text-[11px] transition-colors"
                    >
                      არა
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                    title="პოსტის წაშლა"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Article Image if present (250px) */}
        {(article.image || (article.images && article.images[0])) && (
          <div className="mb-3 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 aspect-[16/9] max-h-40 flex items-center justify-center">
            <img
              src={article.image || article.images![0]}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        {/* Article Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-2 mb-2 leading-snug">
          {article.title}
        </h3>

        {/* Summary */}
        <p className="text-xs sm:text-sm text-slate-400 line-clamp-3 leading-relaxed mb-4">
          {article.summary}
        </p>

        {/* Source link preview if available */}
        {article.sources && article.sources.length > 0 && (
          <div className="mb-4 text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
            <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">წყარო: {article.source_title || article.sources[0]}</span>
          </div>
        )}
      </div>

      {/* Footer: Interactive controls */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          {/* Like button */}
          <button
            type="button"
            onClick={handleLikeClick}
            title={isLiked ? 'მოწონების გაუქმება' : 'მოწონება'}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors border ${
              isLiked
                ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800/70 border-transparent'
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-transform ${isLiked ? 'fill-rose-500 text-rose-500 scale-110' : ''}`}
            />
            <span className="tabular-nums font-medium">{likesCount}</span>
          </button>

          {/* Comments count */}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onSelect(article);
            }}
            title="კომენტარების ნახვა"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 rounded-lg transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span className="tabular-nums font-medium">{article.commentsCount}</span>
          </button>

          {/* Share */}
          <SharePopover
            title={article.title}
            summary={article.summary}
            image={article.image || (article.images && article.images[0])}
            articleId={article.id}
          />
        </div>

        {/* Read More button */}
        <span className="text-emerald-400 group-hover:text-emerald-300 font-medium inline-flex items-center gap-1 text-xs">
          <span>სრულად</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  );
};
