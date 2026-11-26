import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ViewTab } from '../types';
import { BookOpen, Search, PlusCircle, User, LogOut, Layers, ChevronDown, Bot } from 'lucide-react';

interface HeaderProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onOpenAddModal: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal,
}) => {
  const { user, openAuthModal, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('feed')}
          className="flex items-center gap-2.5 text-left text-slate-100 hover:text-white transition-colors shrink-0 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/40 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight whitespace-nowrap">
            ცოდნის პორტალი
          </span>
        </button>

        {/* Zone 2: Navigation Links (Single-line, unboxed, subtle hover) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            type="button"
            onClick={() => onSelectTab('feed')}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              currentTab === 'feed'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            მთავარი
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('chatbot')}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-white ${
              currentTab === 'chatbot'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            <Bot className="w-4 h-4 text-indigo-400" />
            <span>ჭკვიანი ჩათ-ბოტი</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('search')}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-white ${
              currentTab === 'search'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>საძიებო სისტემა</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('category')}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-white ${
              currentTab === 'category'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>კატეგორიები</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!user) {
                openAuthModal('login');
              } else {
                onOpenAddModal();
              }
            }}
            className="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-400 hover:text-white transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>მასალის დამატება</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* User Auth / Profile */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-xs font-semibold overflow-hidden">
                  {user.avatar && (user.avatar.startsWith('data:') || user.avatar.startsWith('http')) ? (
                    <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                  ) : (
                    user.fullName ? user.fullName[0] : 'U'
                  )}
                </div>
                <span className="text-xs font-medium max-w-[110px] truncate hidden sm:inline">
                  {user.fullName || user.username}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 z-40 text-xs animate-fade-in">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="font-semibold text-slate-200 truncate">{user.fullName}</p>
                      <p className="text-slate-400 text-[11px] truncate">@{user.username}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab('profile');
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      <span>მომხმარებლის პროფილი</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenAddModal();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                      <span>ახალი რეცეპტის დამატება</span>
                    </button>

                    <div className="border-t border-slate-800 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>გასვლა</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              შესვლა / რეგისტრაცია
            </button>
          )}
        </div>
      </div>

      {/* Mobile navigation row */}
      <div className="flex md:hidden border-t border-slate-800/80 bg-slate-900/95 px-4 py-2 justify-around text-xs">
        <button
          type="button"
          onClick={() => onSelectTab('feed')}
          className={`px-2 py-1 ${currentTab === 'feed' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          მთავარი
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('chatbot')}
          className={`px-2 py-1 flex items-center gap-1 ${currentTab === 'chatbot' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
        >
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          <span>ჩათ-ბოტი</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('search')}
          className={`px-2 py-1 ${currentTab === 'search' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          ძიება
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('category')}
          className={`px-2 py-1 ${currentTab === 'category' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          კატეგორიები
        </button>
        {user ? (
          <button
            type="button"
            onClick={() => onSelectTab('profile')}
            className={`px-2 py-1 ${currentTab === 'profile' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
          >
            პროფილი
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="px-2 py-1 text-emerald-400 font-medium"
          >
            შესვლა
          </button>
        )}
      </div>
    </header>
  );
};
