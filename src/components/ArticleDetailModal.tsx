import React, { useState, useEffect } from 'react';
import { Article, Comment } from '../types';
import {
  X,
  Heart,
  MessageSquare,
  Share2,
  Calendar,
  Eye,
  User as UserIcon,
  ExternalLink,
  Trash2,
  Send,
  ThumbsUp,
  AlertCircle,
  HelpCircle,
  Tag,
  Edit3,
} from 'lucide-react';
import { SharePopover } from './SharePopover';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface ArticleDetailModalProps {
  article: Article | null;
  onClose: () => void;
  onLikeChanged?: (articleId: string, isLiked: boolean, newCount: number) => void;
  onCommentAdded?: (articleId: string) => void;
  onEdit?: (article: Article) => void;
  onDelete?: (articleId: string) => void;
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  article,
  onClose,
  onLikeChanged,
  onCommentAdded,
  onEdit,
  onDelete,
}) => {
  const { user, openAuthModal, showToast } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(article?.isLiked || false);
  const [likesCount, setLikesCount] = useState(article?.likesCount || 0);
  const [isDeletingArticle, setIsDeletingArticle] = useState(false);

  const canModify = Boolean(user && article && (user.id === article.author.id || user.role === 'admin'));

  useEffect(() => {
    if (article) {
      setIsLiked(article.isLiked);
      setLikesCount(article.likesCount);
      loadComments(article.id);
    }
  }, [article]);

  const loadComments = async (artId: string) => {
    setLoadingComments(true);
    try {
      const data = await api.getComments(artId);
      setComments(data);
    } catch {
      // ignore
    } finally {
      setLoadingComments(false);
    }
  };

  if (!article) return null;

  const handleLikeClick = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

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
      setIsLiked(isLiked);
      setLikesCount(likesCount);
      showToast('მოწონების შეცდომა');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    const trimmed = commentText.trim();
    if (trimmed.length < 2) {
      showToast('კომენტარი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს.');
      return;
    }

    setSubmittingComment(true);
    try {
      const newComment = await api.addComment(article.id, trimmed);
      setComments([newComment, ...comments]);
      setCommentText('');
      showToast('კომენტარი წარმატებით დაემატა!');
      if (onCommentAdded) {
        onCommentAdded(article.id);
      }
    } catch (err: any) {
      showToast(err.message || 'კომენტარის დამატება ვერ მოხერხდა.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('ნამდვილად გსურთ კომენტარის წაშლა?')) return;

    try {
      await api.deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
      showToast('კომენტარი წაიშალა.');
    } catch {
      showToast('კომენტარის წაშლა ვერ მოხერხდა.');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    try {
      const res = await api.toggleLikeComment(commentId);
      setComments(
        comments.map(c =>
          c.id === commentId
            ? { ...c, isLiked: res.isLiked, likesCount: res.likesCount }
            : c
        )
      );
    } catch {
      // ignore
    }
  };

  const handleDeleteArticle = async () => {
    if (!article) return;
    if (!confirm(`ნამდვილად გსურთ პოსტის «${article.title}» წაშლა? ეს ქმედება შეუქცევადია.`)) return;

    setIsDeletingArticle(true);
    try {
      await api.deleteArticle(article.id);
      showToast('პოსტი წარმატებით წაიშალა.');
      onClose();
      if (onDelete) {
        onDelete(article.id);
      }
    } catch (err: any) {
      showToast(err.message || 'პოსტის წაშლა ვერ მოხერხდა.');
    } finally {
      setIsDeletingArticle(false);
    }
  };

  const formattedDate = new Date(article.createdAt).toLocaleDateString('ka-GE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between gap-4 sticky top-0 z-10">
          <div>
            {/* Zero-Pill Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-2">
              <span className="text-emerald-400 font-semibold">{article.category}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{formattedDate}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span className="tabular-nums">{article.viewsCount} ნახვა</span>
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl font-bold text-slate-100 leading-snug">
              {article.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {canModify && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(article);
                }}
                title="პოსტის რედაქტირება"
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}

            {canModify && onDelete && (
              <button
                type="button"
                onClick={handleDeleteArticle}
                disabled={isDeletingArticle}
                title="პოსტის წაშლა"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Summary / Lead */}
          {article.summary && (
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 text-sm text-slate-300 leading-relaxed font-normal">
              {article.summary}
            </div>
          )}

          {/* Article Image (Resized to 250px) */}
          {(article.image || (article.images && article.images[0])) && (
            <div className="flex justify-center my-2">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl max-w-[250px] max-h-[250px] flex items-center justify-center p-1">
                <img
                  src={article.image || article.images![0]}
                  alt={article.title}
                  className="max-w-[250px] max-h-[250px] w-auto h-auto object-contain rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Detailed Content / Answer */}
          <div className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed text-slate-200 whitespace-pre-line">
            {article.answer}
          </div>

          {/* Keywords / Tags (Unboxed zero-pill text) */}
          {article.keywords && article.keywords.length > 0 && (
            <div className="pt-4 border-t border-slate-800 flex items-center gap-2 flex-wrap text-xs text-slate-400">
              <Tag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-medium text-slate-400">საკვანძო სიტყვები:</span>
              <span>{article.keywords.join(' · ')}</span>
            </div>
          )}

          {/* Related / Asked Questions */}
          {article.questions && article.questions.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>ხშირად დასმული კითხვები ამ თემაზე:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                {article.questions.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Verified Sources */}
          {article.sources && article.sources.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>გამოყენებული წყაროები და ბმულები:</span>
              </div>
              <div className="space-y-1 pl-1">
                {article.sources.map((src, i) => (
                  <div key={i} className="truncate">
                    <a
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 break-all"
                    >
                      {src}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Action Bar (Like, Share, Author info) */}
          <div className="pt-4 pb-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {/* Like Button */}
              <button
                type="button"
                onClick={handleLikeClick}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                  isLiked
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : 'bg-slate-800 text-slate-300 hover:text-rose-400 hover:bg-slate-750 border-slate-700'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`}
                />
                <span>{isLiked ? 'მოწონებულია' : 'მოწონება'}</span>
                <span className="tabular-nums font-mono">({likesCount})</span>
              </button>

              {/* Social Share */}
              <SharePopover title={article.title} />

              {/* Edit & Delete for author or admin */}
              {canModify && (
                <div className="flex items-center gap-2">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEdit(article);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-slate-700 hover:border-indigo-500/40 transition-colors"
                      title="პოსტის რედაქტირება"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>რედაქტირება</span>
                    </button>
                  )}

                  {onDelete && (
                    <button
                      type="button"
                      onClick={handleDeleteArticle}
                      disabled={isDeletingArticle}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition-colors disabled:opacity-50"
                      title="პოსტის წაშლა"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>{isDeletingArticle ? 'იშლება...' : 'წაშლა'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Author Attribution */}
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>ავტორი: <strong className="text-slate-300 font-medium">{article.author.fullName}</strong></span>
            </div>
          </div>

          {/* Comments Section */}
          <section className="pt-6 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>კომენტარები და განხილვა</span>
                <span className="text-xs font-normal text-slate-400 tabular-nums">
                  ({comments.length})
                </span>
              </h4>
            </div>

            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleCommentSubmit} className="space-y-2">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="გაგვიზიარეთ თქვენი გამოცდილება ან დასვით კითხვა..."
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingComment ? 'იგზავნება...' : 'კომენტარის დამატება'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 flex items-center justify-between">
                <span>კომენტარის დასაწერად გაიარეთ ავტორიზაცია:</span>
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                >
                  შესვლა
                </button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3 pt-2">
              {loadingComments ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  კომენტარები იტვირთება...
                </div>
              ) : comments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  ამ მასალაზე ჯერ კომენტარი არ არის. იყავით პირველი! 💬
                </div>
              ) : (
                comments.map(c => {
                  const cDate = new Date(c.createdAt).toLocaleDateString('ka-GE', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const isOwnComment = user && (user.id === c.userId || user.role === 'admin');

                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-emerald-600/30 text-emerald-300 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                            {c.userAvatar && (c.userAvatar.startsWith('data:') || c.userAvatar.startsWith('http')) ? (
                              <img src={c.userAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              c.userFullName ? c.userFullName[0] : 'U'
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-200">
                              {c.userFullName || c.username}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-2">
                              {cDate}
                            </span>
                          </div>
                        </div>

                        {isOwnComment && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(c.id)}
                            title="კომენტარის წაშლა"
                            className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line pl-8">
                        {c.content}
                      </p>

                      <div className="flex justify-end items-center gap-1.5 pl-8">
                        <button
                          type="button"
                          onClick={() => handleLikeComment(c.id)}
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition-colors ${
                            c.isLiked
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span className="tabular-nums">{c.likesCount || 0}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
