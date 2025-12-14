
import React, { useState } from 'react';
import { Zap, Wand2, Film, Hash, Settings, Crown, Moon, Sun, Menu, X, Globe, Sparkles } from 'lucide-react';
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

  const tabs = [
    { id: 'create', label: t.tabCreate, icon: Wand2 },
    { id: 'preview', label: t.tabEditor, icon: Film },
    { id: 'metadata', label: t.tabMeta, icon: Hash },
    { id: 'settings', label: t.tabConfig, icon: Settings }
  ];

  const themes: { id: Theme; icon: React.ElementType }[] = [
    { id: 'dark', icon: Moon },
    { id: 'clean', icon: Sun },
    { id: 'creator', icon: Sparkles }
  ];

  const cycleTheme = () => {
    const order: Theme[] = ['dark', 'clean', 'creator'];
    const next = (order.indexOf(theme) + 1) % order.length;
    setTheme(order[next]);
  };

  const cycleLang = () => {
    const langs: Language[] = ['pt', 'en', 'es'];
    const next = (langs.indexOf(lang) + 1) % langs.length;
    setLang(langs[next]);
  };

  const ThemeIcon = themes.find(t => t.id === theme)?.icon || Moon;

  return (
    <header className="glass-strong sticky top-0 z-50 safe-top">
      <div className="h-16 flex items-center justify-between px-4 lg:px-6 max-w-[1600px] mx-auto">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
              boxShadow: '0 4px 20px var(--accent-glow)'
            }}
          >
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              ViralFlow <span className="text-gradient">AI</span>
            </h1>
          </div>
          {userTier === UserTier.PRO && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-black">
              <Crown className="w-3 h-3" /> PRO
            </span>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'btn-primary' : ''
              }`}
              style={activeTab !== tab.id ? { color: 'var(--text-secondary)' } : {}}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language */}
          <button
            onClick={cycleLang}
            className="chip touch-target"
          >
            <Globe className="w-4 h-4" />
            <span className="font-semibold">{lang.toUpperCase()}</span>
          </button>

          {/* Theme */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            {themes.map(th => (
              <button
                key={th.id}
                onClick={() => setTheme(th.id)}
                className={`p-2 rounded-md transition-all touch-target ${theme === th.id ? 'btn-primary' : ''}`}
                style={theme !== th.id ? { color: 'var(--text-muted)' } : { padding: '8px' }}
              >
                <th.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* API Status */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className={`w-2 h-2 rounded-full ${apiKeyCount > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                 style={{ boxShadow: apiKeyCount > 0 ? '0 0 8px #10b981' : '0 0 8px #ef4444' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{apiKeyCount}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>keys</span>
          </div>

          {/* Upgrade */}
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all touch-target"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #eab308)',
              color: 'black',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)'
            }}
          >
            <Crown className="w-4 h-4" />
            <span className="hidden xl:inline">{userTier === UserTier.FREE ? t.upgradeBtn : 'PRO'}</span>
          </button>
        </div>

        {/* Mobile Controls */}
        <div className="flex lg:hidden items-center gap-2">
          <button onClick={cycleTheme} className="p-2 rounded-lg touch-target" style={{ background: 'var(--bg-elevated)' }}>
            <ThemeIcon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg touch-target" style={{ background: 'var(--bg-elevated)' }}>
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto safe-bottom animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ background: 'var(--bg-base)' }}
        >
          <div className="p-4 space-y-4">
            {/* Mobile Tabs */}
            <div className="grid grid-cols-2 gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all touch-target ${
                    activeTab === tab.id ? 'btn-primary' : 'card'
                  }`}
                >
                  <tab.icon className="w-6 h-6" />
                  <span className="text-sm font-semibold">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="h-px" style={{ background: 'var(--border)' }} />

            {/* Theme Selection */}
            <div className="space-y-2">
              <span className="label">{t.theme}</span>
              <div className="flex gap-2">
                {themes.map(th => (
                  <button
                    key={th.id}
                    onClick={() => setTheme(th.id)}
                    className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all touch-target ${
                      theme === th.id ? 'btn-primary' : 'card'
                    }`}
                  >
                    <th.icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{t[`theme${th.id.charAt(0).toUpperCase() + th.id.slice(1)}` as keyof typeof t]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px" style={{ background: 'var(--border)' }} />

            {/* Language & Status */}
            <div className="flex gap-3">
              <button onClick={cycleLang} className="flex-1 card flex items-center justify-center gap-2 touch-target">
                <Globe className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                <span className="font-semibold">{lang.toUpperCase()}</span>
              </button>
              <div className="flex-1 card flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${apiKeyCount > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="font-semibold">{apiKeyCount}</span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>keys</span>
              </div>
            </div>

            {/* Upgrade Button */}
            <button
              onClick={() => { setShowUpgradeModal(true); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold touch-target"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #eab308)',
                color: 'black'
              }}
            >
              <Crown className="w-5 h-5" />
              {userTier === UserTier.FREE ? t.upgradeBtn : t.licenseActiveBtn}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
