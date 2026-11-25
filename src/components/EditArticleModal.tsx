import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Article } from '../types';
import {
  X,
  Edit3,
  Link,
  Tag,
  HelpCircle,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { compressImageFile } from '../utils/imageUtils';

interface EditArticleModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  onArticleUpdated: (updatedArticle: Article) => void;
}

const CATEGORY_PRESETS = [
  'ხალხური მედიცინა',
  'იმუნიტეტი',
  'სახსრები და ძვლები',
  'საჭმლის მომნელებელი სისტემა',
  'გულ-სისხლძარღვთა სისტემა',
  'ნერვული სისტემა და ძილი',
  'ბალახეული ნაყენები',
  'ზოგადი',
];

export const EditArticleModal: React.FC<EditArticleModalProps> = ({
  article,
  isOpen,
  onClose,
  onArticleUpdated,
}) => {
  const { showToast } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ხალხური მედიცინა');
  const [summary, setSummary] = useState('');
  const [answer, setAnswer] = useState('');
  const [keywords, setKeywords] = useState('');
  const [questions, setQuestions] = useState('');
  const [source, setSource] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (article) {
      setTitle(article.title || '');
      setCategory(article.category || 'ხალხური მედიცინა');
      setSummary(article.summary || '');
      setAnswer(article.answer || '');
      setKeywords((article.keywords || []).join(', '));
      setQuestions((article.questions || []).join('\n'));
      setSource((article.sources && article.sources[0]) || '');
      setSourceTitle(article.source_title || '');
      setImage(article.image || (article.images && article.images[0]) || null);
      setError(null);
    }
  }, [article, isOpen]);

  if (!isOpen || !article) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('გთხოვთ აირჩიოთ სურათის ფორმატის ფაილი (JPG, PNG, WebP).');
      return;
    }

    setIsProcessingImage(true);
    setError(null);

    try {
      // Resize to 250px max as requested
      const compressed = await compressImageFile(file, 250, 250, 0.85);
      setImage(compressed);
    } catch (err: any) {
      setError(err.message || 'სურათის დამუშავება ვერ მოხერხდა.');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !answer.trim()) {
      setError('გთხოვთ შეავსოთ სათაური და რეცეპტის/მასალის ტექსტი.');
      return;
    }

    setLoading(true);

    try {
      const updated = await api.updateArticle(article.id, {
        title: title.trim(),
        category: category.trim(),
        summary: summary.trim(),
        answer: answer.trim(),
        keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        questions: questions.split('\n').map(q => q.trim()).filter(Boolean),
        sources: source.trim() ? [source.trim()] : [],
        source_title: sourceTitle.trim() || undefined,
        image: image || '',
      });

      showToast('პოსტი წარმატებით განახლდა!');
      onArticleUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'პოსტის განახლება ვერ მოხერხდა.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-fade-in"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">პოსტის რედაქტირება</h3>
              <p className="text-[11px] text-slate-400">
                შეცვალეთ სათაური, კატეგორია, სურათი ან რეცეპტის შინაარსი
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              მასალის სათაური *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="მაგ: სისხლძარღვების გაწმენდა ლიმონითა და ნივრით"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              კატეგორია / თემატიკა *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {CATEGORY_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors border ${
                    category === c
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="ან ჩაწერეთ საკუთარი კატეგორია..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Image Upload/Change Section */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>მასალის სურათი (შემცირდება 250px-მდე)</span>
              </label>
              <span className="text-[10px] text-slate-400">მაქს. 250px · ინახება JSON ბაზაში</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
              id="edit-article-image-upload"
            />

            {image ? (
              <div className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="relative group shrink-0 w-24 h-24 bg-slate-950 rounded-lg overflow-hidden border border-slate-700/80 flex items-center justify-center">
                  <img
                    src={image}
                    alt="მასალის სურათი"
                    className="max-w-[250px] max-h-[250px] w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      title="სურათის წაშლა"
                      className="p-1.5 bg-rose-500/80 hover:bg-rose-500 text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>სურათი ატვირთულია (250px)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    სურათი ოპტიმიზებულია 250 პიქსელამდე და შეინახება JSON ფაილში.
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2"
                    >
                      სურათის შეცვლა
                    </button>
                    <span className="text-slate-600">·</span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-medium underline underline-offset-2"
                    >
                      წაშლა
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label
                htmlFor="edit-article-image-upload"
                className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  isProcessingImage
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-slate-800 hover:border-emerald-500/60 bg-slate-900/40 hover:bg-slate-900/80'
                }`}
              >
                {isProcessingImage ? (
                  <div className="flex flex-col items-center gap-2 py-2 text-emerald-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-medium">სურათი მუშავდება და მცირდება 250px-მდე...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                      <UploadCloud className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-200">
                        დააჭირეთ სურათის ასატვირთად
                      </span>
                      <span className="text-slate-500 text-xs"> ან გადმოათრიეთ ფაილი</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      JPG, PNG, WebP — ავტომატურად შემცირდება 250 პიქსელამდე და ჩაიწერება JSON-ში
                    </p>
                  </div>
                )}
              </label>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              მოკლე აღწერა / შეჯამება (Preview)
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="მოკლე 1-2 წინადადება, რაც ბარათზე გამოჩნდება..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              სრული რეცეპტი / დეტალური ინფორმაცია *
            </label>
            <textarea
              rows={6}
              required
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="დეტალურად აღწერეთ ინგრედიენტები, მომზადების წესი, მიღების დოზირება და სიფრთხილის ზომები..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-normal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>საკვანძო სიტყვები (მძიმით გამოყოფილი)</span>
              </label>
              <input
                type="text"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="ლიმონი, ნიორი, წნევა, ქოლესტერინი"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>სავარაუდო კითხვები (ახალ ხაზზე)</span>
              </label>
              <input
                type="text"
                value={questions}
                onChange={e => setQuestions(e.target.value)}
                placeholder="როგორ გავწმინდოთ სისხლძარღვები?"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Link className="w-3.5 h-3.5 text-slate-400" />
                <span>წყაროს ბმული (URL)</span>
              </label>
              <input
                type="url"
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="https://shenimedicina.ge/..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                წყაროს დასახელება
              </label>
              <input
                type="text"
                value={sourceTitle}
                onChange={e => setSourceTitle(e.target.value)}
                placeholder="წიგნი „ხალხური მედიცინა“"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={loading || isProcessingImage}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shadow-md shadow-emerald-950/50 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>ინახება...</span>
                </>
              ) : (
                <span>ცვლილებების შენახვა</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
