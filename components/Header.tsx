
import React, { useState } from 'react';
import { Zap, Wand2, Film, Hash, Settings, Crown, Moon, Sun, Menu, X, Globe } from 'lucide-react';
import { Language, Theme, UserTier } from '../types';
import { translations } from '../services/translations';

interface HeaderProps {
  userTier: UserTier;
  setShowUpgradeModal: (show: boolean) => void;
  activeTab: 'create' | 'preview' | 'metadata' | 'settings';
  setActiveTab: (tab: 'create' | 'preview' | 'metadata' | 'settings') => void;
  lang: Language;
  setLang: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  apiKeyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  userTier,
  setShowUpgradeModal,
  activeTab,
  setActiveTab,
  lang,
  setLang,
  theme,
  setTheme,
  apiKeyCount
}) => {
  const t = translations[lang];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const tabs = [
    { id: 'create', label: t.tabCreate, icon: Wand2 },
    { id: 'preview', label: t.tabEditor, icon: Film },
    { id: 'metadata', label: t.tabMeta, icon: Hash },
    { id: 'settings', label: t.tabConfig, icon: Settings }
  ];

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-40">
      <div className="h-16 flex items-center justify-between px-4 md:px-6">
        
        {/* LOGO AREA */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-lg md:text-xl tracking-tight text-zinc-900 dark:text-white truncate">
            ViralFlow <span className="text-indigo-600 dark:text-indigo-400">AI</span>
          </h1>
          {userTier === UserTier.FREE ? (
            <span onClick={() => setShowUpgradeModal(true)} className="cursor-pointer px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors hidden sm:inline-block">
              {t.free}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 border border-amber-400/50 text-[10px] font-bold text-black shadow-sm hidden sm:inline-block">
              {t.pro}
            </span>
          )}
        </div>

        {/* DESKTOP NAV (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* DESKTOP CONTROLS (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'pt' ? 'en' : lang === 'en' ? 'es' : 'pt')}
              className="px-3 py-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800"
            >
              <span className="font-bold text-xs text-zinc-600 dark:text-zinc-300">{lang.toUpperCase()}</span>
            </button>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t.activeKeys}</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${apiKeyCount > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">{apiKeyCount}</span>
            </div>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg hover:shadow-amber-500/20 flex items-center gap-2"
          >
            <Crown className="w-4 h-4" /> {userTier === UserTier.FREE ? t.upgradeBtn : t.licenseActiveBtn}
          </button>
        </div>

        {/* MOBILE HAMBURGER BUTTON */}
        <button 
          onClick={toggleMenu} 
          className="md:hidden p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
          <div className="p-4 space-y-4">
            
            {/* Mobile Tabs */}
            <div className="grid grid-cols-2 gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="text-xs font-bold">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full"></div>

            {/* Mobile Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <button
                  onClick={() => setLang(lang === 'pt' ? 'en' : lang === 'en' ? 'es' : 'pt')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                >
                  <Globe className="w-4 h-4" />
                  <span className="font-bold text-xs text-zinc-900 dark:text-white">{lang.toUpperCase()}</span>
                </button>
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                >
                  {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  <span className="font-bold text-xs text-zinc-900 dark:text-white">{theme === 'light' ? 'Dark' : 'Light'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t.activeKeys}:</span>
                  <span className={`w-2 h-2 rounded-full ${apiKeyCount > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{apiKeyCount}</span>
              </div>
            </div>

            <button
              onClick={() => { setShowUpgradeModal(true); setIsMobileMenuOpen(false); }}
              className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 text-black px-4 py-3 rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" /> {userTier === UserTier.FREE ? t.upgradeBtn : t.licenseActiveBtn}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
