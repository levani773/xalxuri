import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Article, Comment } from '../types';
import { api } from '../services/api';
import { compressImageFile } from '../utils/imageUtils';
import {
  User,
  Heart,
  MessageSquare,
  BookOpen,
  Calendar,
  Mail,
  Settings,
  Lock,
  Edit3,
  Check,
  Shield,
  Clock,
  ArrowRight,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { ArticleCard } from './ArticleCard';

interface ProfileViewProps {
  onSelectArticle: (article: Article) => void;
  onLikeChanged?: (articleId: string, isLiked: boolean, newCount: number) => void;
  onEditArticle?: (article: Article) => void;
  onDeleteArticle?: (articleId: string) => void;
}

const AVATAR_OPTIONS = [
  { id: 'nature', label: '🌿 მცენარე', color: 'from-emerald-500 to-teal-700', icon: '🌿' },
  { id: 'healer', label: '🍵 მკურნალი', color: 'from-indigo-500 to-purple-700', icon: '🍵' },
  { id: 'botanist', label: '🌱 ბოტანიკოსი', color: 'from-amber-500 to-orange-700', icon: '🌱' },
  { id: 'sun', label: '☀️ ენერგია', color: 'from-yellow-400 to-amber-600', icon: '☀️' },
  { id: 'heart', label: '❤️ ჯანმრთელობა', color: 'from-rose-500 to-red-700', icon: '❤️' },
  { id: 'honey', label: '🍯 თაფლი', color: 'from-amber-600 to-yellow-600', icon: '🍯' },
  { id: 'flower', label: '🌸 გვირილა', color: 'from-pink-500 to-rose-600', icon: '🌸' },
];

const COVER_PRESETS = [
  {
    id: 'herbal_garden',
    label: '🌿 სამკურნალო ბაღი',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'forest',
    label: '🌲 მწვანე ტყე',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'mountains',
    label: '🏔️ მთის ბუნება',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'tea_cup',
    label: '🍵 ბალახეული ჩაი',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sunset_field',
    label: '🌅 მზის ჩასვლა',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
  },
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  onSelectArticle,
  onLikeChanged,
  onEditArticle,
  onDeleteArticle,
}) => {
  const { user, stats, openAuthModal, updateProfile, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState<'liked' | 'comments' | 'created' | 'edit'>('liked');

  const [likedArticles, setLikedArticles] = useState<Article[]>([]);
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [createdArticles, setCreatedArticles] = useState<Article[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Edit form state
  const [editFullName, setEditFullName] = useState(user?.fullName || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || 'nature');
  const [editCoverImage, setEditCoverImage] = useState(user?.coverImage || '');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // File input refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const editTabAvatarInputRef = useRef<HTMLInputElement>(null);
  const editTabCoverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setEditFullName(user.fullName || '');
      setEditBio(user.bio || '');
      setEditAvatar(user.avatar || 'nature');
      setEditCoverImage(user.coverImage || '');
      loadActivity(user.id);
    }
  }, [user]);

  const loadActivity = async (userId: string) => {
    setLoadingActivity(true);
    try {
      const data = await api.getUserActivity(userId);
      setLikedArticles(data.likedArticles || []);
      setUserComments(data.comments || []);
      setCreatedArticles(data.createdArticles || []);
    } catch {
      // ignore
    } finally {
      setLoadingActivity(false);
    }
  };

  if (!user) {
    return (
      <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 max-w-lg mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mx-auto">
          <User className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">
          მომხმარებლის პროფილი
        </h3>
        <p className="text-xs text-slate-400">
          პროფილის, მოწონებული მასალებისა და კომენტარების სანახავად გთხოვთ გაიაროთ ავტორიზაცია.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-md"
        >
          სისტემაში შესვლა / რეგისტრაცია
        </button>
      </div>
    );
  }

  const handleQuickAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const dataUrl = await compressImageFile(file, 400, 400, 0.85);
      setEditAvatar(dataUrl);
      await updateProfile({ avatar: dataUrl });
      showToast('ავატარი წარმატებით განახლდა!');
    } catch (err: any) {
      showToast(err.message || 'ავატარის ატვირთვა ვერ მოხერხდა.');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleQuickCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const dataUrl = await compressImageFile(file, 1400, 600, 0.85);
      setEditCoverImage(dataUrl);
      await updateProfile({ coverImage: dataUrl });
      showToast('უკანა ფონი წარმატებით განახლდა!');
    } catch (err: any) {
      showToast(err.message || 'ფონის ატვირთვა ვერ მოხერხდა.');
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleResetCover = async () => {
    if (!confirm('გსურთ ფონის გასუფთავება და ნაგულისხმევ გრადიენტზე დაბრუნება?')) return;
    try {
      setEditCoverImage('');
      await updateProfile({ coverImage: '' });
      showToast('უკანა ფონი გასუფთავდა.');
    } catch (err: any) {
      showToast(err.message || 'ფონის გასუფთავება ვერ მოხერხდა.');
    }
  };

  const handleTabAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 400, 400, 0.85);
      setEditAvatar(dataUrl);
      showToast('ფოტო ატვირთულია. დასამახსოვრებლად დააჭირეთ „ცვლილებების შენახვას“.');
    } catch (err: any) {
      showToast(err.message || 'ფოტოს დამუშავება ვერ მოხერხდა.');
    } finally {
      if (editTabAvatarInputRef.current) editTabAvatarInputRef.current.value = '';
    }
  };

  const handleTabCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 1400, 600, 0.85);
      setEditCoverImage(dataUrl);
      showToast('ფონი ატვირთულია. დასამახსოვრებლად დააჭირეთ „ცვლილებების შენახვას“.');
    } catch (err: any) {
      showToast(err.message || 'ფონის დამუშავება ვერ მოხერხდა.');
    } finally {
      if (editTabCoverInputRef.current) editTabCoverInputRef.current.value = '';
    }
  };

  const renderAvatarContent = (avatarValue?: string, fullName?: string, size: 'sm' | 'md' | 'lg' = 'lg') => {
    if (avatarValue && (avatarValue.startsWith('data:') || avatarValue.startsWith('http'))) {
      return (
        <img
          src={avatarValue}
          alt={fullName || 'Avatar'}
          className="w-full h-full object-cover"
        />
      );
    }
    const preset = AVATAR_OPTIONS.find(o => o.id === avatarValue);
    if (preset) {
      return (
        <span className={size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-sm'}>
          {preset.icon}
        </span>
      );
    }
    return <span>{fullName ? fullName[0] : 'U'}</span>;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      await updateProfile({
        fullName: editFullName,
        bio: editBio,
        avatar: editAvatar,
        coverImage: editCoverImage,
        ...(newPassword ? { currentPassword, newPassword } : {}),
      });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      showToast(err.message || 'პროფილის განახლება ვერ მოხერხდა.');
    } finally {
      setSavingProfile(false);
    }
  };

  const formattedJoinDate = new Date(user.createdAt).toLocaleDateString('ka-GE', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Profile Header Banner */}
      <div className="relative rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        {/* Decorative background stripe / Custom cover banner (CSS Selector 2) */}
        <div
          className="h-32 sm:h-44 relative border-b border-slate-800/80 overflow-hidden group/banner bg-slate-950 transition-all duration-300"
          style={
            user.coverImage
              ? {
                  backgroundImage: `url(${user.coverImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          {/* Subtle gradient overlay */}
          <div
            className={`absolute inset-0 ${
              user.coverImage
                ? 'bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/25'
                : 'bg-gradient-to-r from-emerald-950/70 via-indigo-950/60 to-slate-900'
            }`}
          />

          {/* Quick Cover Banner Upload and Reset Controls */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex items-center gap-2">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleQuickCoverUpload}
              className="hidden"
            />

            {user.coverImage && (
              <button
                type="button"
                onClick={handleResetCover}
                disabled={isUploadingCover}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-rose-300 hover:text-rose-200 border border-slate-700/80 backdrop-blur-md text-xs font-medium transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                title="ფონის წაშლა / ნაგულისხმევ გრადიენტზე დაბრუნება"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">ფონის წაშლა</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploadingCover}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-slate-100 hover:text-white border border-slate-700/80 hover:border-emerald-500/50 backdrop-blur-md text-xs font-semibold transition-all shadow-lg flex items-center gap-1.5 group/btn cursor-pointer"
              title="უკანა ფონის ატვირთვა / შეცვლა"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400 group-hover/btn:scale-110 transition-transform" />
              <span>{isUploadingCover ? 'იტვირთება...' : 'ფონის შეცვლა'}</span>
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14">
          {/* Avatar and Info */}
          <div className="flex items-end gap-4">
            {/* User Avatar with Quick Upload (CSS Selector 1) */}
            <div className="relative group/avatar">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleQuickAvatarUpload}
                className="hidden"
              />

              <div
                onClick={() => avatarInputRef.current?.click()}
                title="დააწკაპუნეთ ავატარის ასატვირთად / შესაცვლელად"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white border-4 border-slate-900 flex items-center justify-center text-2xl font-bold shadow-2xl shrink-0 overflow-hidden cursor-pointer relative transition-transform group-hover/avatar:scale-[1.02]"
              >
                {renderAvatarContent(user.avatar, user.fullName, 'lg')}

                {/* Hover overlay with Camera */}
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-medium pointer-events-none">
                  <Camera className="w-5 h-5 text-emerald-400 mb-0.5" />
                  <span>შეცვლა</span>
                </div>
              </div>

              {/* Floating badge button */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                title="ავატარის ატვირთვა / შეცვლა"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-slate-900 shadow-md flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 mb-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white leading-tight">
                  {user.fullName}
                </h2>
                {user.role === 'admin' && (
                  <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>ადმინისტრატორი</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">@{user.username}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  <span>{user.email}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>გაწევრიანდა {formattedJoinDate}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Edit button */}
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className="self-start sm:self-end px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>პარამეტრები</span>
          </button>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="px-6 pb-5 pt-1 text-xs text-slate-300 border-t border-slate-800/60 max-w-2xl">
            {user.bio}
          </div>
        )}

        {/* Stats Row (Tabular numbers) */}
        <div className="grid grid-cols-3 border-t border-slate-800 bg-slate-950/40 text-center py-3 text-xs">
          <div>
            <span className="block text-lg font-bold text-white tabular-nums">
              {stats?.likedArticlesCount ?? likedArticles.length}
            </span>
            <span className="text-[11px] text-slate-400">მოწონებული</span>
          </div>
          <div className="border-x border-slate-800">
            <span className="block text-lg font-bold text-white tabular-nums">
              {stats?.commentsCount ?? userComments.length}
            </span>
            <span className="text-[11px] text-slate-400">კომენტარი</span>
          </div>
          <div>
            <span className="block text-lg font-bold text-white tabular-nums">
              {stats?.createdArticlesCount ?? createdArticles.length}
            </span>
            <span className="text-[11px] text-slate-400">დამატებული</span>
          </div>
        </div>
      </div>

      {/* Profile Section Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-semibold gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('liked')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'liked'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>მოწონებული მასალები ({likedArticles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('comments')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'comments'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>ჩემი კომენტარები ({userComments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('created')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'created'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>ჩემი დამატებული ({createdArticles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'edit'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>პროფილის რედაქტირება</span>
        </button>
      </div>

      {/* Tab Content 1: Liked Articles */}
      {activeTab === 'liked' && (
        <div className="space-y-4">
          {loadingActivity ? (
            <div className="py-12 text-center text-xs text-slate-500">იტვირთება...</div>
          ) : likedArticles.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500">
              თქვენ ჯერ არ გაქვთ მოწონებული მასალები. დაათვალიერეთ მთავარ გვერდზე! ❤️
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {likedArticles.map(art => (
                <ArticleCard
                  key={art.id}
                  article={art}
                  onSelect={onSelectArticle}
                  onLikeChanged={(id, isLiked, newCount) => {
                    if (!isLiked) {
                      setLikedArticles(prev => prev.filter(a => a.id !== id));
                    }
                    if (onLikeChanged) onLikeChanged(id, isLiked, newCount);
                  }}
                  onEdit={onEditArticle}
                  onDelete={id => {
                    setLikedArticles(prev => prev.filter(a => a.id !== id));
                    setCreatedArticles(prev => prev.filter(a => a.id !== id));
                    if (onDeleteArticle) onDeleteArticle(id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: User Comments */}
      {activeTab === 'comments' && (
        <div className="space-y-3">
          {loadingActivity ? (
            <div className="py-12 text-center text-xs text-slate-500">იტვირთება...</div>
          ) : userComments.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500">
              თქვენ ჯერ არ დაგიწერიათ კომენტარები. გაუზიარეთ აზრი სხვებს! 💬
            </div>
          ) : (
            userComments.map(c => {
              const cDate = new Date(c.createdAt).toLocaleDateString('ka-GE', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-emerald-400">
                      მასალაზე: {c.articleTitle || 'ხალხური რეცეპტი'}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{cDate}</span>
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                    «{c.content}»
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab Content 3: Created Articles */}
      {activeTab === 'created' && (
        <div className="space-y-4">
          {loadingActivity ? (
            <div className="py-12 text-center text-xs text-slate-500">იტვირთება...</div>
          ) : createdArticles.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500">
              თქვენ ჯერ არ დაგიმატებიათ მასალა. გაუზიარეთ ხალხური რეცეპტი საზოგადოებას! 🌿
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {createdArticles.map(art => (
                <ArticleCard
                  key={art.id}
                  article={art}
                  onSelect={onSelectArticle}
                  onLikeChanged={onLikeChanged}
                  onEdit={onEditArticle}
                  onDelete={id => {
                    setCreatedArticles(prev => prev.filter(a => a.id !== id));
                    setLikedArticles(prev => prev.filter(a => a.id !== id));
                    if (onDeleteArticle) onDeleteArticle(id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 4: Edit Profile */}
      {activeTab === 'edit' && (
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 max-w-2xl space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">პროფილის მორგება &amp; რედაქტირება</h3>
              <p className="text-xs text-slate-400">შეცვალეთ ავატარი, უკანა ფონი, პირადი მონაცემები და პაროლი</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* SECTION 1: AVATAR MANAGEMENT */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>პროფილის ავატარი</span>
                </label>
                <span className="text-[11px] text-slate-500">ატვირთეთ ფოტო ან აირჩიეთ სიმბოლო</span>
              </div>

              {/* Preview and Upload Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white border-2 border-slate-700 flex items-center justify-center text-xl font-bold shadow-md shrink-0 overflow-hidden">
                  {renderAvatarContent(editAvatar, editFullName, 'md')}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      ref={editTabAvatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleTabAvatarUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editTabAvatarInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>ფოტოს ატვირთვა</span>
                    </button>

                    {editAvatar && (editAvatar.startsWith('data:') || editAvatar.startsWith('http')) && (
                      <button
                        type="button"
                        onClick={() => setEditAvatar('nature')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ნაგულისხმევზე დაბრუნება</span>
                      </button>
                    )}
                  </div>

                  {/* URL Input */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                        <LinkIcon className="w-3 h-3" />
                      </div>
                      <input
                        type="url"
                        value={customAvatarUrl}
                        onChange={e => setCustomAvatarUrl(e.target.value)}
                        placeholder="ან ჩასვით სურათის ბმული (URL)..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-1.5 pl-8 pr-2 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    {customAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditAvatar(customAvatarUrl.trim());
                          setCustomAvatarUrl('');
                          showToast('ავატარის ბმული დაყენებულია!');
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-medium border border-slate-700"
                      >
                        დაყენება
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Avatar Presets */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="block text-[11px] text-slate-400 mb-1.5">ან აირჩიეთ მზა სიმბოლო:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {AVATAR_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setEditAvatar(opt.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs border flex items-center gap-1.5 transition-all ${
                        editAvatar === opt.id
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-semibold shadow-sm'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {editAvatar === opt.id && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 2: COVER BANNER MANAGEMENT */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  <span>პროფილის უკანა ფონი (Cover Banner)</span>
                </label>
                <span className="text-[11px] text-slate-500">ატვირთეთ ფონი ან აირჩიეთ ბუნების თემატიკა</span>
              </div>

              {/* Cover Live Preview */}
              <div
                className="h-24 rounded-2xl border border-slate-800 overflow-hidden relative group/cover bg-slate-900"
                style={
                  editCoverImage
                    ? {
                        backgroundImage: `url(${editCoverImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
              >
                <div
                  className={`absolute inset-0 ${
                    editCoverImage
                      ? 'bg-gradient-to-t from-slate-950/80 via-transparent to-transparent'
                      : 'bg-gradient-to-r from-emerald-950/70 via-indigo-950/60 to-slate-950 flex items-center justify-center text-xs text-slate-500'
                  }`}
                >
                  {!editCoverImage && (
                    <span className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ნაგულისხმევი ბუნებრივი გრადიენტი</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Upload & Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  ref={editTabCoverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleTabCoverUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => editTabCoverInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>ფონის სურათის ატვირთვა</span>
                </button>

                {editCoverImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditCoverImage('');
                      showToast('ფონი გასუფთავდა (ნაგულისხმევი გრადიენტი).');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-rose-300 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>ფონის წაშლა</span>
                  </button>
                )}
              </div>

              {/* Cover Presets */}
              <div className="space-y-1.5">
                <span className="block text-[11px] text-slate-400">მზა ბუნების ფონები:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COVER_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setEditCoverImage(preset.url)}
                      className={`p-2 rounded-xl border text-left transition-all relative overflow-hidden group/opt ${
                        editCoverImage === preset.url
                          ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-500'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[11px] font-medium truncate flex items-center justify-between">
                        <span>{preset.label}</span>
                        {editCoverImage === preset.url && (
                          <Check className="w-3 h-3 text-indigo-400 shrink-0 ml-1" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Cover URL */}
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                    <LinkIcon className="w-3 h-3" />
                  </div>
                  <input
                    type="url"
                    value={customCoverUrl}
                    onChange={e => setCustomCoverUrl(e.target.value)}
                    placeholder="ან ჩასვით ფონის სურათის ბმული (URL)..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-1.5 pl-8 pr-2 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                {customCoverUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditCoverImage(customCoverUrl.trim());
                      setCustomCoverUrl('');
                      showToast('ფონის ბმული დაყენებულია!');
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-medium border border-slate-700"
                  >
                    დაყენება
                  </button>
                )}
              </div>
            </div>

            {/* SECTION 3: PERSONAL INFORMATION */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span>პირადი მონაცემები</span>
              </h4>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  სრული სახელი და გვარი *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  მოკლე ინფორმაცია (ბიო)
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="მოგვიყევით თქვენს შესახებ..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* SECTION 4: CHANGE PASSWORD */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>პაროლის შეცვლა (არასავალდებულო)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    მიმდინარე პაროლი
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    ახალი პაროლი (მინიმუმ 6 სიმბოლო)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-emerald-950/50 cursor-pointer"
              >
                {savingProfile ? 'ინახება...' : 'ცვლილებების შენახვა'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
