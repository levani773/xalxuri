import React, { useState } from 'react';
import {
  Share2,
  Facebook,
  Twitter,
  Send,
  PhoneCall,
  Copy,
  Check,
  Link as LinkIcon,
  Image as ImageIcon,
  Smartphone,
} from 'lucide-react';

interface SharePopoverProps {
  title: string;
  summary?: string;
  image?: string;
  articleId?: string;
  url?: string;
  onShared?: (channel: string) => void;
}

export const SharePopover: React.FC<SharePopoverProps> = ({
  title,
  summary,
  image,
  articleId,
  url,
  onShared,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fallback to og-image.jpg if no specific image is provided
  const displayImage = image || '/og-image.jpg';

  // Construct sharing URL
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://xalxuri.netlify.app';

  const shareUrl =
    url ||
    (articleId ? `${baseUrl}/#article-${articleId}` : baseUrl);

  const encodedUrl = encodeURIComponent(shareUrl);
  const shareText = `🌿 ${title}${summary ? ` — ${summary.slice(0, 100)}...` : ''}`;
  const encodedTitle = encodeURIComponent(shareText);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if (onShared) onShared('copy');
      setTimeout(() => setCopied(false), 2000);
    } catch {
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
        const shareData: ShareData = {
          title: `ცოდნის პორტალი: ${title}`,
          text: `${title}\n${summary || 'ხალხური მედიცინის რეცეპტი და რჩევები'}`,
          url: shareUrl,
        };

        // Try attaching the image file if available and supported
        if (displayImage && navigator.canShare) {
          try {
            const res = await fetch(displayImage);
            const blob = await res.blob();
            const file = new File([blob], 'recipe-share.jpg', { type: blob.type || 'image/jpeg' });
            if (navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          } catch {
            // fallback without file
          }
        }

        await navigator.share(shareData);
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
      color: 'hover:text-blue-500 hover:bg-blue-500/10 text-blue-400',
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
          '_blank',
          'width=600,height=500'
        );
        if (onShared) onShared('facebook');
        setIsOpen(false);
      },
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'hover:text-sky-500 hover:bg-sky-500/10 text-sky-400',
      action: () => {
        window.open(
          `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
          '_blank'
        );
        if (onShared) onShared('telegram');
        setIsOpen(false);
      },
    },
    {
      name: 'WhatsApp',
      icon: PhoneCall,
      color: 'hover:text-emerald-500 hover:bg-emerald-500/10 text-emerald-400',
      action: () => {
        window.open(
          `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
          '_blank'
        );
        if (onShared) onShared('whatsapp');
        setIsOpen(false);
      },
    },
    {
      name: 'Twitter / X',
      icon: Twitter,
      color: 'hover:text-slate-200 hover:bg-slate-700/50 text-slate-300',
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
          '_blank',
          'width=600,height=400'
        );
        if (onShared) onShared('twitter');
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
            className="absolute right-0 bottom-full mb-2 w-72 rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl p-3 z-40 animate-fade-in text-left"
          >
            {/* Header & Preview */}
            <div className="pb-2.5 mb-2 border-b border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>გაზიარება სურათით</span>
                </span>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 text-[10px] font-medium transition-colors"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>მობილურით</span>
                  </button>
                )}
              </div>

              {/* Visual Card Preview */}
              <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-2 flex items-center gap-2.5">
                <div className="w-14 h-14 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-800/80 flex items-center justify-center">
                  <img
                    src={displayImage}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.target as HTMLImageElement).src = '/og-image.jpg';
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-200 truncate leading-snug">
                    {title}
                  </p>
                  <p className="text-[10px] text-emerald-400/90 truncate mt-0.5">
                    xalxuri.netlify.app
                  </p>
                  <span className="inline-block text-[9px] text-slate-500 leading-tight">
                    სურათი გამოჩნდება Facebook-ზე
                  </span>
                </div>
              </div>
            </div>

            {/* Channels List */}
            <div className="space-y-0.5">
              {shareChannels.map(channel => {
                const Icon = channel.icon;
                return (
                  <button
                    key={channel.name}
                    type="button"
                    onClick={channel.action}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-300 rounded-xl transition-colors ${channel.color}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{channel.name}</span>
                  </button>
                );
              })}

              <div className="pt-1.5 mt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <span className="flex items-center gap-2 font-medium">
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
