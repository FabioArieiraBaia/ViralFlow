
import React, { useState } from 'react';
import { Zap, Wand2, Film, Hash, Settings, Crown, Moon, Sun, Menu, X, Globe, Palette, Sparkles } from 'lucide-react';
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
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const tabs = [
    { id: 'create', label: t.tabCreate, icon: Wand2 },
    { id: 'preview', label: t.tabEditor, icon: Film },
    { id: 'metadata', label: t.tabMeta, icon: Hash },
    { id: 'settings', label: t.tabConfig, icon: Settings }
  ];

  const themes: { id: Theme; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'dark', label: t.themeDark, icon: Moon, color: 'text-indigo-400' },
    { id: 'clean', label: t.themeClean, icon: Sun, color: 'text-sky-400' },
    { id: 'creator', label: t.themeCreator, icon: Sparkles, color: 'text-pink-400' }
  ];

  const currentTheme = themes.find(th => th.id === theme) || themes[0];

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setShowThemeMenu(false);
    
    // Update HTML class
    document.documentElement.classList.remove('theme-dark', 'theme-clean', 'theme-creator');
    document.documentElement.classList.add(`theme-${newTheme}`);
    
    // Toggle creator glow effect
    const glowEl = document.querySelector('.hero-glow');
    if (glowEl) {
      if (newTheme === 'creator') {
        glowEl.classList.remove('hidden');
      } else {
        glowEl.classList.add('hidden');
      }
    }
  };

  const cycleLang = () => {
    const langs: Language[] = ['pt', 'en', 'es'];
    const currentIdx = langs.indexOf(lang);
    const nextIdx = (currentIdx + 1) % langs.length;
    setLang(langs[nextIdx]);
  };

  return (
    <header className="border-b themed-border bg-[var(--bg-secondary)]/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="h-14 md:h-16 flex items-center justify-between px-3 md:px-6">
        
        {/* LOGO AREA */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 bg-[var(--accent-primary)] rounded-lg flex items-center justify-center shadow-lg shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-base md:text-xl tracking-tight themed-text hidden xs:block">
            ViralFlow <span className="themed-accent">AI</span>
          </h1>
          {userTier === UserTier.FREE ? (
            <span 
              onClick={() => setShowUpgradeModal(true)} 
              className="cursor-pointer px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] border themed-border text-[10px] font-bold themed-text-secondary hover:themed-text transition-colors hidden sm:inline-block"
            >
              {t.free}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 border border-amber-400/50 text-[10px] font-bold text-black shadow-sm hidden sm:inline-block">
              {t.pro}
            </span>
          )}
        </div>

        {/* DESKTOP NAV (Hidden on Mobile) */}
        <div className="hidden lg:flex items-center gap-1 bg-[var(--bg-tertiary)] p-1 rounded-lg border themed-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all touch-target ${
                activeTab === tab.id
                  ? 'themed-btn shadow-md'
                  : 'themed-text-secondary hover:themed-text hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* DESKTOP CONTROLS (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language Selector */}
          <button
            onClick={cycleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors border themed-border"
          >
            <Globe className="w-4 h-4 themed-text-secondary" />
            <span className="font-bold text-xs themed-text">{lang.toUpperCase()}</span>
          </button>
          
          {/* Theme Selector */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors border themed-border"
            >
              <currentTheme.icon className={`w-4 h-4 ${currentTheme.color}`} />
              <span className="font-bold text-xs themed-text hidden xl:inline">{currentTheme.label}</span>
            </button>
            
            {showThemeMenu && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-[var(--bg-secondary)] border themed-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {themes.map(th => (
                  <button
                    key={th.id}
                    onClick={() => handleThemeChange(th.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      theme === th.id 
                        ? 'bg-[var(--accent-primary)]/10 themed-accent' 
                        : 'hover:bg-[var(--bg-tertiary)] themed-text'
                    }`}
                  >
                    <th.icon className={`w-4 h-4 ${th.color}`} />
                    <span className="text-sm font-medium">{th.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* API Keys Status */}
          <div className="flex flex-col items-end px-3 py-1">
            <span className="text-[10px] font-medium themed-text-secondary">{t.activeKeys}</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${apiKeyCount > 0 ? 'bg-[var(--success)] shadow-[0_0_8px_var(--success)]' : 'bg-[var(--error)]'}`}></span>
              <span className="text-sm font-bold themed-text">{apiKeyCount}</span>
            </div>
          </div>
          
          {/* Upgrade Button */}
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg hover:shadow-amber-500/20 flex items-center gap-2 touch-target"
          >
            <Crown className="w-4 h-4" /> 
            <span className="hidden xl:inline">{userTier === UserTier.FREE ? t.upgradeBtn : t.licenseActiveBtn}</span>
            <span className="xl:hidden">{t.pro}</span>
          </button>
        </div>

        {/* MOBILE: Quick Actions + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {/* Mobile Theme Toggle */}
          <button
            onClick={() => {
              const nextTheme = theme === 'dark' ? 'clean' : theme === 'clean' ? 'creator' : 'dark';
              handleThemeChange(nextTheme);
            }}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors touch-target"
          >
            <currentTheme.icon className={`w-5 h-5 ${currentTheme.color}`} />
          </button>
          
          {/* Hamburger */}
          <button 
            onClick={toggleMenu} 
            className="p-2 themed-text-secondary hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors touch-target"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-14 bottom-0 bg-[var(--bg-primary)]/95 backdrop-blur-xl z-50 animate-in fade-in duration-200 overflow-y-auto">
          <div className="p-4 space-y-4 pb-safe">
            
            {/* Mobile Tabs - Full Width */}
            <div className="grid grid-cols-2 gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all touch-target ${
                    activeTab === tab.id
                      ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] themed-accent'
                      : 'bg-[var(--bg-secondary)] themed-border themed-text-secondary'
                  }`}
                >
                  <tab.icon className="w-6 h-6" />
                  <span className="text-sm font-bold">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="h-px bg-[var(--border-primary)] w-full"></div>

            {/* Theme Selection - Horizontal */}
            <div className="space-y-2">
              <label className="text-xs font-bold themed-text-secondary uppercase tracking-wider">{t.theme}</label>
              <div className="flex gap-2">
                {themes.map(th => (
                  <button
                    key={th.id}
                    onClick={() => handleThemeChange(th.id)}
                    className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all touch-target ${
                      theme === th.id 
                        ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]' 
                        : 'bg-[var(--bg-secondary)] themed-border'
                    }`}
                  >
                    <th.icon className={`w-5 h-5 ${th.color}`} />
                    <span className={`text-xs font-bold ${theme === th.id ? 'themed-accent' : 'themed-text-secondary'}`}>
                      {th.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-[var(--border-primary)] w-full"></div>

            {/* Language & Status */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={cycleLang}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border themed-border touch-target"
              >
                <Globe className="w-5 h-5 themed-text-secondary" />
                <span className="font-bold text-sm themed-text">{lang.toUpperCase()}</span>
              </button>

              <div className="flex-1 flex items-center justify-center gap-3 px-4 py-3 bg-[var(--bg-secondary)] rounded-xl border themed-border">
                <span className="text-xs font-medium themed-text-secondary">{t.activeKeys}:</span>
                <span className={`w-2 h-2 rounded-full ${apiKeyCount > 0 ? 'bg-[var(--success)]' : 'bg-[var(--error)]'}`}></span>
                <span className="text-sm font-bold themed-text">{apiKeyCount}</span>
              </div>
            </div>

            {/* Upgrade Button */}
            <button
              onClick={() => { setShowUpgradeModal(true); setIsMobileMenuOpen(false); }}
              className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 text-black px-4 py-4 rounded-xl text-base font-bold shadow-lg flex items-center justify-center gap-2 touch-target"
            >
              <Crown className="w-5 h-5" /> {userTier === UserTier.FREE ? t.upgradeBtn : t.licenseActiveBtn}
            </button>
          </div>
        </div>
      )}
      
      {/* Click outside to close theme menu */}
      {showThemeMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowThemeMenu(false)}
        />
      )}
    </header>
  );
};
