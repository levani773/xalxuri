import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, ShieldCheck, Sparkles, Check } from 'lucide-react';

const AVATAR_OPTIONS = [
  { id: 'nature', label: '🌿 მცენარე', color: 'from-emerald-500 to-teal-700' },
  { id: 'healer', label: '🍵 მკურნალი', color: 'from-indigo-500 to-purple-700' },
  { id: 'botanist', label: '🌱 ბოტანიკოსი', color: 'from-amber-500 to-orange-700' },
  { id: 'sun', label: '☀️ ენერგია', color: 'from-yellow-400 to-amber-600' },
  { id: 'heart', label: '❤️ ჯანმრთელობა', color: 'from-rose-500 to-red-700' },
];

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalTab, login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(authModalTab);

  // Form states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regAvatar, setRegAvatar] = useState('nature');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync tab with context if opened with specific tab
  React.useEffect(() => {
    setTab(authModalTab);
    setError(null);
  }, [authModalTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(loginIdentifier, loginPassword);
      closeAuthModal();
    } catch (err: any) {
      setError(err.message || 'ავტორიზაციის შეცდომა');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({
        fullName: regFullName,
        username: regUsername,
        email: regEmail,
        password: regPassword,
        bio: regBio,
        avatar: regAvatar,
      });
      closeAuthModal();
    } catch (err: any) {
      setError(err.message || 'რეგისტრაციის შეცდომა');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (username: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(username, 'Password123!');
      closeAuthModal();
    } catch (err: any) {
      setError(err.message || 'დემო შესვლის შეცდომა');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto animate-fade-in"
      >
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {tab === 'login' ? 'სისტემაში შესვლა' : 'ახალი რეგისტრაცია'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Django-ს სტანდარტის დაცული ავტორიზაცია
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              tab === 'login'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            შესვლა
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              tab === 'register'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            რეგისტრაცია
          </button>
        </div>

        {/* Body Form */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  მომხმარებლის სახელი ან ელ-ფოსტა
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    placeholder="მაგ: levani ან admin@codna.ge"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  პაროლი
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors shadow-md shadow-emerald-950/50"
              >
                {loading ? 'მიმდინარეობს შესვლა...' : 'სისტემაში შესვლა'}
              </button>

              {/* Demo Login Shortcuts */}
              <div className="pt-2 border-t border-slate-800">
                <p className="text-[11px] text-slate-400 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>სწრაფი ტესტირებისთვის (Demo Accounts):</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('admin')}
                    className="py-1.5 px-2 bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-[11px] transition-colors truncate"
                  >
                    👑 ადმინი (admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('levani')}
                    className="py-1.5 px-2 bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-[11px] transition-colors truncate"
                  >
                    👤 მომხმარებელი (levani)
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  სახელი და გვარი *
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  placeholder="მაგ: გიორგი ბერიძე"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    მომხმარებლის სახელი *
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value.toLowerCase())}
                    placeholder="მაგ: giorgi_b"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    ელ-ფოსტა *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="mail@example.com"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  პაროლი (მინიმუმ 6 სიმბოლო) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  აირჩიეთ ავატარის სტილი
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {AVATAR_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRegAvatar(opt.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] border flex items-center gap-1.5 transition-all ${
                        regAvatar === opt.id
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {regAvatar === opt.id && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  მოკლე ბიოგრაფია / ინტერესები (არასავალდებულო)
                </label>
                <textarea
                  rows={2}
                  value={regBio}
                  onChange={e => setRegBio(e.target.value)}
                  placeholder="მაგ: მაინტერესებს ბალახეული ჩაი და იმუნიტეტის რეცეპტები..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors shadow-md shadow-emerald-950/50"
              >
                {loading ? 'მიმდინარეობს რეგისტრაცია...' : 'რეგისტრაციის დასრულება'}
              </button>
            </form>
          )}

          {/* Security note */}
          <div className="pt-2 text-[10px] text-slate-500 text-center leading-normal">
            🔒 უსაფრთხოება: პაროლები ჰეშირებულია კრიპტოგრაფიული მეთოდით (Scrypt + Salt) და სერვერზე ინახება დაცულ ფორმატში.
          </div>
        </div>
      </div>
    </div>
  );
};
