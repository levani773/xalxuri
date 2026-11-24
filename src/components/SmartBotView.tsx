import React, { useState, useEffect, useRef } from 'react';
import { Article } from '../types';
import { api } from '../services/api';
import {
  Bot,
  User,
  Trash2,
  Camera,
  Send,
  ExternalLink,
  BookOpen,
  Sparkles,
  Heart,
  MessageSquare,
  Image as ImageIcon,
  CheckCircle2,
  Globe,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  title?: string;
  article?: Article;
  sources?: string[];
  imageUrl?: string;
  isWebResult?: boolean;
  webNote?: string;
  time: string;
}

interface SmartBotViewProps {
  onSelectArticle: (article: Article) => void;
  onArticleAdded?: (article: Article) => void;
  knowledgeArticles?: Article[];
}

const DEFAULT_QUICK_CHIPS = [
  'სისხლძარღვების გაწმენდა',
  'მაღალი სიცხის დროს',
  'იმუნიტეტის გაძლიერება',
  'სახსრების ტკივილი',
  'კუჭ-ნაწლავის მოწესრიგება',
  'ლიმონისა და ნივრის რეცეპტი',
];

export const SmartBotView: React.FC<SmartBotViewProps> = ({
  onSelectArticle,
  onArticleAdded,
  knowledgeArticles = [],
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return [
      {
        id: 'msg_welcome',
        sender: 'bot',
        text: 'გამარჯობა! 👋 მე ვარ ჭკვიანი ასისტენტი. რით შემიძლია დაგეხმაროთ დღეს?\n\nშეგიძლიათ მკითხოთ ხალხურ მედიცინაზე, დაავადებებზე, რეცეპტებზე, ან ატვირთოთ სურათი. თუ პასუხი ბაზაში არ არის, მას ინტერნეტში მოვიძიებ და ავტომატურად დავამატებ საიტზე!',
        time: now,
      },
    ];
  });

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputVal).trim();
    if (!textToSend && !selectedImage) return;

    const time = getCurrentTime();

    // Add user message
    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: textToSend || '📷 სურათით ძებნა',
      imageUrl: selectedImage || undefined,
      time,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setSelectedImage(null);
    setIsTyping(true);

    try {
      // Ask bot via server endpoint
      const res = await api.askBot(textToSend || 'სურათი');

      setIsTyping(false);

      if (res.found && res.article) {
        const art = res.article;
        const isWeb = Boolean((res as any).isWebResult);
        if (isWeb && onArticleAdded) {
          onArticleAdded(art);
        }
        const botMsg: ChatMessage = {
          id: 'msg_' + Date.now(),
          sender: 'bot',
          title: art.title,
          text: art.answer,
          article: art,
          sources: art.sources,
          isWebResult: isWeb,
          webNote: (res as any).message,
          time: getCurrentTime(),
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        const botMsg: ChatMessage = {
          id: 'msg_' + Date.now(),
          sender: 'bot',
          text:
            res.message ||
            'სამწუხაროდ, ამ კითხვაზე ზუსტი პასუხი ჩემს ბაზაში ვერ მოიძებნა. 😅\n\nსცადეთ სხვანაირად ჩამოაყალიბოთ კითხვა ან გამოიყენეთ სხვა საკვანძო სიტყვები.',
          time: getCurrentTime(),
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: 'msg_' + Date.now(),
          sender: 'bot',
          text: 'დაფიქსირდა შეცდომა სერვერთან კავშირისას. გთხოვთ სცადოთ თავიდან.',
          time: getCurrentTime(),
        },
      ]);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'msg_' + Date.now(),
        sender: 'bot',
        text: 'ჩატის ისტორია გასუფთავებულია. რით შემიძლია დაგეხმაროთ?',
        time: getCurrentTime(),
      },
    ]);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Quick chips extracted from real knowledge articles if available
  const quickChips = knowledgeArticles.length
    ? knowledgeArticles.slice(0, 6).map(a => a.title)
    : DEFAULT_QUICK_CHIPS;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] min-h-[580px] bg-slate-900/90 rounded-3xl border border-slate-700/70 shadow-2xl overflow-hidden animate-fade-in">
      {/* Bot Chat Header (Matching the exact look from user's screenshot) */}
      <div className="px-5 py-3.5 bg-slate-800/90 border-b border-slate-700/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-white tracking-wide flex items-center gap-2">
              <span>Smart Bot AI</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                JSON ცოდნის ბაზა
              </span>
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ბოტი აქტიურია (ონლაინ)</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearChat}
          title="ჩატის ისტორიის წაშლა"
          className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-700/60"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">ისტორიის წაშლა</span>
        </button>
      </div>

      {/* Quick Questions Chips Bar */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
        <span className="text-slate-500 flex items-center gap-1 text-[11px] shrink-0">
          <Sparkles className="w-3 h-3 text-amber-400" />
          სწრაფი კითხვები:
        </span>
        {quickChips.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            className="px-2.5 py-1 rounded-full text-[11px] bg-slate-800/80 hover:bg-indigo-600 hover:text-white text-slate-300 border border-slate-700/60 transition-colors whitespace-nowrap shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Bot Avatar */}
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-md text-sm leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-tl-none'
                }`}
              >
                {/* Optional Image */}
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Uploaded query"
                    className="max-h-48 rounded-lg mb-2 object-cover border border-indigo-400/30"
                  />
                )}

                {/* Web Search result badge */}
                {msg.isWebResult && (
                  <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium">
                    <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>ინტერნეტში მოძიებული რეცეპტი · ავტომატურად დაემატა საიტზე!</span>
                  </div>
                )}

                {/* Optional Bot Title */}
                {msg.title && (
                  <p className="text-sm font-bold text-indigo-300 mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>{msg.title}</span>
                  </p>
                )}

                {/* Message Body */}
                <p className="whitespace-pre-line text-xs sm:text-sm">{msg.text}</p>

                {/* Source Links */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-700/60 text-xs space-y-1">
                    <span className="text-slate-400 font-semibold block text-[11px]">
                      წყაროები:
                    </span>
                    {msg.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-300 hover:text-indigo-200 underline text-[11px] block truncate"
                      >
                        {src}
                      </a>
                    ))}
                  </div>
                )}

                {/* Action: Open in Portal if connected to an article */}
                {msg.article && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-rose-400">
                        <Heart className="w-3 h-3 fill-rose-500/20" />
                        <span>{msg.article.likesCount}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-slate-400" />
                        <span>{msg.article.commentsCount}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectArticle(msg.article!)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>სრული სტატია &amp; კომენტარები</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <span
                  className={`text-[10px] block text-right mt-1.5 ${
                    isUser ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {msg.time}
                </span>
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-indigo-300 shrink-0 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm text-slate-300 flex items-center gap-2 text-xs">
              <span className="text-slate-400">ბოტი ეძებს პასუხს...</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selected Image Preview */}
      {selectedImage && (
        <div className="px-4 py-2 bg-slate-800/80 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span>არჩეულია სურათი ძებნისთვის</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="text-rose-400 hover:text-rose-300 text-xs font-semibold"
          >
            გაუქმება
          </button>
        </div>
      )}

      {/* Chat Input Bar (Matching screenshot) */}
      <div className="p-3 sm:p-4 bg-slate-800 border-t border-slate-700/70 shrink-0">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          {/* Hidden Image file input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleImageFileChange}
          />

          {/* Camera Button for Image Search */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="სურათით ძებნა"
            className="shrink-0 bg-slate-700/80 hover:bg-slate-700 text-indigo-300 hover:text-white w-11 h-11 rounded-xl transition-colors flex items-center justify-center border border-slate-600/60"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* User Text Input */}
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="ჩაწერეთ კითხვა (მაგ: რა არის პითონი? რას აკეთებს კომპანია?)..."
            className="flex-1 bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs sm:text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            autoComplete="off"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputVal.trim() && !selectedImage}
            className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 shrink-0 text-xs sm:text-sm"
          >
            <span>გაგზავნა</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
