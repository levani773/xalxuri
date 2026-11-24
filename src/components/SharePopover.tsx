import React, { useState } from 'react';
import { Share2, Facebook, Twitter, Send, PhoneCall, Copy, Check, Link as LinkIcon } from 'lucide-react';

interface SharePopoverProps {
  title: string;
  url?: string;
  onShared?: (channel: string) => void;
}

export const SharePopover: React.FC<SharePopoverProps> = ({ title, url, onShared }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(`ცოდნის პორტალი: ${title}`);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if (onShared) onShared('copy');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      if (onShared) onShared('copy');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `გაეცანით ხალხური მედიცინის რეცეპტს: ${title}`,
          url: shareUrl,
        });
        if (onShared) onShared('native');
        setIsOpen(false);
      } catch {
        // User cancelled or not supported
      }
    }
  };

  const shareChannels = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'hover:text-blue-500 hover:bg-blue-500/10',
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'width=600,height=500');
        if (onShared) onShared('facebook');
        setIsOpen(false);
      },
    },
    {
      name: 'Twitter / X',
      icon: Twitter,
      color: 'hover:text-sky-400 hover:bg-sky-400/10',
      action: () => {
        window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, '_blank', 'width=600,height=400');
        if (onShared) onShared('twitter');
        setIsOpen(false);
      },
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'hover:text-sky-500 hover:bg-sky-500/10',
      action: () => {
        window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`, '_blank');
        if (onShared) onShared('telegram');
        setIsOpen(false);
      },
    },
    {
      name: 'WhatsApp',
      icon: PhoneCall,
      color: 'hover:text-emerald-500 hover:bg-emerald-500/10',
      action: () => {
        window.open(`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`, '_blank');
        if (onShared) onShared('whatsapp');
        setIsOpen(false);
      },
    },
  ];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="სოციალურ ქსელში გაზიარება"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors border border-transparent hover:border-slate-700/60"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>გაზიარება</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={e => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div
            onClick={e => e.stopPropagation()}
            className="absolute right-0 bottom-full mb-2 w-56 rounded-xl bg-slate-900 border border-slate-700/80 shadow-xl p-2 z-40 animate-fade-in"
          >
            <div className="text-[11px] font-medium text-slate-400 px-2 py-1 mb-1 border-b border-slate-800 flex items-center justify-between">
              <span>გაზიარება</span>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="text-emerald-400 hover:text-emerald-300 text-[10px] font-medium"
                >
                  მობილურით
                </button>
              )}
            </div>

            <div className="space-y-0.5">
              {shareChannels.map(channel => {
                const Icon = channel.icon;
                return (
                  <button
                    key={channel.name}
                    type="button"
                    onClick={channel.action}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-300 rounded-lg transition-colors ${channel.color}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{channel.name}</span>
                  </button>
                );
              })}

              <div className="pt-1 mt-1 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{copied ? 'დაკოპირდა!' : 'ბმულის კოპირება'}</span>
                  </span>
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
