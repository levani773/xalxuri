import React from 'react';
import { CategoryInfo, Article } from '../types';
import { Layers, ArrowRight, HeartPulse, ShieldAlert, Sparkles, Activity, Coffee, Brain } from 'lucide-react';

interface CategoryViewProps {
  categories: CategoryInfo[];
  onSelectCategory: (categoryName: string) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  'ხალხური მედიცინა': HeartPulse,
  'იმუნიტეტი': Sparkles,
  'სახსრები და ძვლები': Activity,
  'საჭმლის მომნელებელი სისტემა': Coffee,
  'გულ-სისხლძარღვთა სისტემა': HeartPulse,
  'ნერვული სისტემა და ძილი': Brain,
  'ბალახეული ნაყენები': Coffee,
  'ზოგადი': Layers,
};

export const CategoryView: React.FC<CategoryViewProps> = ({
  categories,
  onSelectCategory,
}) => {
  return (
    <div className="space-y-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Layers className="w-6 h-6 text-emerald-400" />
          <span>ცოდნის ბაზის კატეგორიები</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          აირჩიეთ სასურველი მიმართულება რეცეპტების, სამკურნალო მცენარეებისა და ხალხური რჩევების გასაცნობად.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(c => {
          const Icon = CATEGORY_ICONS[c.name] || Layers;
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => onSelectCategory(c.name)}
              className="text-left p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all duration-200 group flex items-start justify-between shadow-sm hover:shadow-lg"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                    {c.name}
                  </h3>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {c.count} მასალა
                  </span>
                </div>
              </div>

              <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-emerald-600 group-hover:text-white text-slate-400 flex items-center justify-center transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
