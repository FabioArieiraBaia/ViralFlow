

import React, { useState } from 'react';
import { 
  Globe, Smartphone, Monitor, Youtube, Lock, AlertCircle, CheckCircle2, 
  Loader2, Wand2, FolderOpen, TriangleAlert, Clapperboard, ChevronRight, Edit2, Zap, Mic,
  Video, Image, Save, Play, ChevronDown, ChevronUp, Sparkles, Clock, Palette
} from 'lucide-react';
import { Language, VideoStyle, VideoPacing, VideoDuration, VideoFormat, ImageProvider, UserTier, VideoTransition, VisualIntensity, GeminiTTSModel, PollinationsModel, ALL_GEMINI_VOICES, GenerationPhase } from '../../types';
import { translations } from '../../services/translations';
import { isVideoModel } from '../../services/geminiService';

interface CreateTabProps {
  lang: Language;
  topic: string;
  setTopic: (v: string) => void;
  contentLang: Language;
  setContentLang: (v: Language) => void;
  style: VideoStyle;
  setStyle: (v: VideoStyle) => void;
  pacing: VideoPacing;
  setPacing: (v: VideoPacing) => void;
  visualIntensity: VisualIntensity;
  setVisualIntensity: (v: VisualIntensity) => void;
  format: VideoFormat;
  setFormat: (v: VideoFormat) => void;
  duration: VideoDuration;
  setDuration: (v: VideoDuration) => void;
  channelName: string;
  setChannelName: (v: string) => void;
  voice: string;
  setVoice: (v: string) => void;
  customVoice: string;
  setCustomVoice: (v: string) => void;
  imageProvider: ImageProvider;
  setImageProvider: (v: ImageProvider) => void;
  globalTransition: VideoTransition;
  setGlobalTransition: (v: VideoTransition) => void;
  userTier: UserTier;
  isGenerating: boolean;
  progress: string;
  handleGenerateVideo: () => void;
  handleImportScriptRef: React.RefObject<HTMLInputElement>;
  setShowUpgradeModal: (v: boolean) => void;
  setActiveTab: (v: any) => void;
  importClick: () => void;
  handleCreateManualProject: () => void;
  // NEW TTS PROPS
  ttsModel: GeminiTTSModel;
  setTtsModel: (v: GeminiTTSModel) => void;
  globalTtsStyle: string;
  setGlobalTtsStyle: (v: string) => void;
  // Pollinations Model State
  pollinationsModel?: PollinationsModel;
  setPollinationsModel?: (v: PollinationsModel) => void;
  isAdmin?: boolean;
  
  // NEW SEQUENTIAL FLOW PROPS
  generationPhase: GenerationPhase;
  runVisualPhase: () => void;
  handleExportScript: () => void;
}

export const CreateTab: React.FC<CreateTabProps> = ({
  lang, topic, setTopic, contentLang, setContentLang, style, setStyle,
  pacing, setPacing, visualIntensity, setVisualIntensity, format, setFormat, duration, setDuration,
  channelName, setChannelName, voice, setVoice, customVoice, setCustomVoice,
  imageProvider, setImageProvider, globalTransition, setGlobalTransition,
  userTier, isGenerating, progress, handleGenerateVideo, setShowUpgradeModal,
  setActiveTab, importClick, handleCreateManualProject,
  ttsModel, setTtsModel, globalTtsStyle, setGlobalTtsStyle,
  pollinationsModel, setPollinationsModel, isAdmin,
  generationPhase, runVisualPhase, handleExportScript
}) => {
  const t = translations[lang];
  const [showAdvanced, setShowAdvanced] = useState(false);

  // If props are missing, use local state fallback
  const [localPollinationsModel, setLocalPollinationsModel] = React.useState<PollinationsModel>('flux');
  const activeModel = pollinationsModel || localPollinationsModel;
  const setActiveModel = setPollinationsModel || setLocalPollinationsModel;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar hide-scrollbar-mobile animate-in fade-in duration-500">
      
      {/* === GENERATION MODAL OVERLAY === */}
      {(isGenerating || generationPhase === 'ready_for_visuals') && generationPhase !== 'script_approval' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-6">
          <div className="bg-[var(--bg-secondary)] border themed-border p-6 md:p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6">
            
            {/* AUDIO / SCRIPT PHASE */}
            {(generationPhase === 'scripting' || generationPhase === 'audio_processing') && (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 relative">
                  <div className="absolute inset-0 border-4 border-[var(--accent-primary)]/30 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
                  <Mic className="absolute inset-0 m-auto w-6 h-6 themed-accent animate-pulse" />
                </div>
                <h3 className="text-xl font-bold themed-text">{t.creatingScriptVoices}</h3>
                <p className="themed-text-secondary text-sm">{progress}</p>
                <div className="w-full bg-[var(--bg-tertiary)] h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--accent-primary)] animate-pulse w-full origin-left scale-x-50 transition-transform"></div>
                </div>
                <p className="text-[10px] themed-text-secondary">{t.respectingApiLimit}</p>
              </div>
            )}

            {/* READY FOR VISUALS (CHECKPOINT) */}
            {generationPhase === 'ready_for_visuals' && (
              <div className="space-y-6 animate-in zoom-in duration-300">
                <div className="mx-auto w-16 h-16 bg-[var(--success)]/20 rounded-full flex items-center justify-center border border-[var(--success)]">
                  <CheckCircle2 className="w-8 h-8 text-[var(--success)]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold themed-text mb-2">{t.audiosGenerated}</h3>
                  <p className="themed-text-secondary text-sm">{t.scriptVoicesReady}</p>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={runVisualPhase} 
                    className="w-full py-4 themed-btn rounded-xl shadow-lg flex items-center justify-center gap-2 transform hover:scale-[1.02] transition-all touch-target"
                  >
                    <Image className="w-5 h-5" /> {t.generateImages}
                  </button>
                  <button 
                    onClick={handleExportScript} 
                    className="w-full py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] themed-text-secondary font-bold rounded-xl flex items-center justify-center gap-2 touch-target"
                  >
                    <Save className="w-4 h-4" /> {t.saveProjectBackup}
                  </button>
                </div>
              </div>
            )}

            {/* VISUAL PHASE */}
            {generationPhase === 'visual_processing' && (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 relative">
                  <div className="absolute inset-0 border-4 border-pink-500/30 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                  <Image className="absolute inset-0 m-auto w-6 h-6 text-pink-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold themed-text">{t.generatingVisuals}</h3>
                <p className="themed-text-secondary text-sm">{progress}</p>
                <p className="text-[10px] themed-text-secondary">{t.renderingScenesDelay}</p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* === MAIN CONTENT === */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        
        {/* === HERO SECTION === */}
        <div className="relative py-6 md:py-12">
          {/* Background Grid Effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
            <div className="grid-floor"></div>
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-12">
            {/* Text Content */}
            <div className="text-center lg:text-left space-y-3 md:space-y-4 flex-1">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black themed-text tracking-tight leading-tight">
                {t.heroTagline.split(' ').slice(0, -2).join(' ')} <span className="gradient-text">{t.heroTagline.split(' ').slice(-2).join(' ')}</span>
              </h2>
              <p className="themed-text-secondary text-base md:text-lg max-w-md mx-auto lg:mx-0">{t.heroSubtitle}</p>
            </div>
            
            {/* 3D Reactor */}
            <div className="scene-3d flex items-center justify-center w-48 h-48 md:w-64 md:h-64 shrink-0 hidden md:flex">
              <div className="reactor-container">
                <div className="reactor-ring r-ring-1"></div>
                <div className="reactor-ring r-ring-2"></div>
                <div className="reactor-ring r-ring-3"></div>
                <div className="core-glow"></div>
              </div>
            </div>
          </div>
          
          {/* Quick Action: Import */}
          <div className="absolute top-4 right-4 md:top-6 md:right-0">
            <button 
              onClick={importClick} 
              className="px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] themed-text-secondary text-xs md:text-sm font-bold transition-colors flex items-center gap-2 border themed-border touch-target"
            >
              <FolderOpen className="w-4 h-4" /> 
              <span className="hidden sm:inline">{t.loadJson}</span>
            </button>
          </div>
        </div>

        {/* === QUICK ACTIONS CARDS === */}
        {!isGenerating && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
            {/* Primary: Create with AI */}
            <div className="sm:col-span-1 group cursor-pointer bg-gradient-to-br from-[var(--accent-primary)]/10 to-[var(--accent-primary)]/5 border-2 border-[var(--accent-primary)]/30 hover:border-[var(--accent-primary)] p-4 md:p-6 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-[var(--accent-glow)] transition-all flex flex-col items-center text-center space-y-2 md:space-y-3 relative overflow-hidden touch-target">
              <div className="absolute top-0 right-0 px-2 py-1 bg-[var(--accent-primary)] text-white text-[9px] font-bold uppercase rounded-bl-lg">
                {lang === 'pt' ? 'Recomendado' : lang === 'es' ? 'Recomendado' : 'Recommended'}
              </div>
              <Wand2 className="w-8 h-8 themed-accent group-hover:scale-110 transition-transform"/>
              <h3 className="text-base md:text-lg font-bold themed-text">{t.createWithAI}</h3>
              <p className="text-[11px] md:text-xs themed-text-secondary">{t.createWithAIDesc}</p>
            </div>
            
            {/* Manual Editor */}
            <div 
              onClick={handleCreateManualProject} 
              className="group cursor-pointer bg-[var(--bg-secondary)] border themed-border hover:border-[var(--success)] p-4 md:p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center space-y-2 md:space-y-3 touch-target"
            >
              <Edit2 className="w-8 h-8 text-[var(--success)] group-hover:scale-110 transition-transform"/>
              <h3 className="text-base md:text-lg font-bold themed-text">{t.manualEditor}</h3>
              <p className="text-[11px] md:text-xs themed-text-secondary">{t.manualEditorDesc}</p>
            </div>
            
            {/* Import */}
            <div 
              onClick={importClick} 
              className="group cursor-pointer bg-[var(--bg-secondary)] border themed-border hover:border-[var(--warning)] p-4 md:p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center space-y-2 md:space-y-3 touch-target"
            >
              <FolderOpen className="w-8 h-8 text-[var(--warning)] group-hover:scale-110 transition-transform"/>
              <h3 className="text-base md:text-lg font-bold themed-text">{t.importProject}</h3>
              <p className="text-[11px] md:text-xs themed-text-secondary">{t.importProjectDesc}</p>
            </div>
          </div>
        )}

        {/* === MAIN FORM === */}
        <div className="bg-[var(--bg-secondary)] border themed-border rounded-2xl p-4 md:p-6 space-y-5 md:space-y-6">
          
          {/* Topic Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold themed-text-secondary uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3 h-3 themed-accent" /> {t.videoTopic}
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border themed-border rounded-xl p-4 text-base md:text-lg themed-text placeholder:themed-text-secondary focus:ring-2 focus:ring-[var(--accent-primary)] outline-none transition-all resize-none shadow-inner"
              placeholder={t.topicPlaceholder}
              rows={3}
            />
          </div>
          
          {/* Language Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold themed-text-secondary uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-3 h-3" /> {t.videoLang}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'pt', label: '🇧🇷 Português' },
                { id: 'en', label: '🇺🇸 English' },
                { id: 'es', label: '🇪🇸 Español' }
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => setContentLang(l.id as any)}
                  className={`px-3 py-2 md:py-3 rounded-lg text-xs md:text-sm font-medium border transition-all touch-target ${
                    contentLang === l.id
                      ? 'themed-btn'
                      : 'bg-[var(--bg-primary)] themed-text-secondary themed-border hover:border-[var(--border-accent)]'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Options Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {/* Format */}
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-bold themed-text-secondary uppercase tracking-wider">{t.format}</label>
              <div className="grid grid-cols-2 gap-1 bg-[var(--bg-tertiary)] p-1 rounded-lg border themed-border">
                <button
                  onClick={() => setFormat(VideoFormat.PORTRAIT)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-md transition-all touch-target ${
                    format === VideoFormat.PORTRAIT
                      ? 'themed-btn shadow-sm'
                      : 'themed-text-secondary hover:themed-text'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> <span className="text-[10px] font-bold">Shorts</span>
                </button>
                <button
                  onClick={() => setFormat(VideoFormat.LANDSCAPE)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-md transition-all touch-target ${
                    format === VideoFormat.LANDSCAPE
                      ? 'themed-btn shadow-sm'
                      : 'themed-text-secondary hover:themed-text'
                  }`}
                >
                  <Monitor className="w-4 h-4" /> <span className="text-[10px] font-bold">Video</span>
                </button>
              </div>
            </div>
            
            {/* Duration */}
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-bold themed-text-secondary uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> {t.duration}
              </label>
              <select
                value={duration}
                onChange={(e) => {
                  if (e.target.value === VideoDuration.MOVIE && userTier === UserTier.FREE) {
                    setShowUpgradeModal(true);
                  } else {
                    setDuration(e.target.value as VideoDuration);
                  }
                }}
                className="w-full bg-[var(--bg-primary)] border themed-border rounded-lg p-2 md:p-3 text-xs md:text-sm themed-text focus:ring-[var(--accent-primary)] outline-none touch-target"
              >
                {Object.values(VideoDuration).map(s => (
                  <option key={s} value={s} disabled={s === VideoDuration.MOVIE && userTier === UserTier.FREE}>
                    {s} {s === VideoDuration.MOVIE && userTier === UserTier.FREE ? '(PRO)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Style */}
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-bold themed-text-secondary uppercase tracking-wider flex items-center gap-1">
                <Palette className="w-3 h-3" /> {t.visualStyle}
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as VideoStyle)}
                className="w-full bg-[var(--bg-primary)] border themed-border rounded-lg p-2 md:p-3 text-xs md:text-sm themed-text focus:ring-[var(--accent-primary)] outline-none touch-target"
              >
                {Object.values(VideoStyle).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            {/* Pacing */}
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-bold themed-text-secondary uppercase tracking-wider">{t.pacing}</label>
              <select
                value={pacing}
                onChange={(e) => setPacing(e.target.value as VideoPacing)}
                className="w-full bg-[var(--bg-primary)] border themed-border rounded-lg p-2 md:p-3 text-xs md:text-sm themed-text focus:ring-[var(--accent-primary)] outline-none touch-target"
              >
                {Object.values(VideoPacing).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Channel Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold themed-text-secondary uppercase tracking-wider">{t.channelName}</label>
            <div className="relative">
              <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 themed-text-secondary" />
              <input
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border themed-border rounded-lg pl-10 pr-4 py-3 themed-text focus:ring-[var(--accent-primary)] outline-none touch-target"
              />
            </div>
          </div>

          {/* Advanced Settings Accordion */}
          <div className="border themed-border rounded-xl overflow-hidden">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-4 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] transition-colors touch-target"
            >
              <span className="text-sm font-bold themed-text flex items-center gap-2">
                <Zap className="w-4 h-4 themed-accent" /> 
                {t.advancedVoiceSettings}
              </span>
              {showAdvanced ? <ChevronUp className="w-5 h-5 themed-text-secondary" /> : <ChevronDown className="w-5 h-5 themed-text-secondary" />}
            </button>
            
            {showAdvanced && (
              <div className="p-4 space-y-4 bg-[var(--bg-primary)] animate-in slide-in-from-top-2 duration-200">
                {/* Voice Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold themed-text-secondary uppercase tracking-wider flex items-center gap-2">
                    {t.narrator} {userTier === UserTier.FREE && <Lock className="w-3 h-3" />}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                    <button
                      onClick={() => setVoice('Auto')}
                      className={`text-left px-3 py-2 rounded-lg text-xs border transition-all touch-target ${
                        voice === 'Auto'
                          ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] themed-accent'
                          : 'bg-[var(--bg-secondary)] themed-border themed-text-secondary hover:border-[var(--border-accent)]'
                      }`}
                    >
                      {t.autoCast}
                    </button>
                    
                    {ALL_GEMINI_VOICES.map(v => (
                      <button
                        key={v.id}
                        onClick={() => {
                          if (userTier === UserTier.PRO || v.id === 'Fenrir') setVoice(v.id);
                          else setShowUpgradeModal(true);
                        }}
                        className={`text-left px-3 py-2 rounded-lg text-xs border transition-all touch-target ${
                          voice === v.id
                            ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] themed-accent'
                            : 'bg-[var(--bg-secondary)] themed-border themed-text-secondary hover:border-[var(--border-accent)]'
                        } ${userTier === UserTier.FREE && v.id !== 'Fenrir' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (userTier === UserTier.PRO) setVoice('Custom');
                      else setShowUpgradeModal(true);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs border mt-2 touch-target ${
                      voice === 'Custom' 
                        ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]' 
                        : 'bg-[var(--bg-tertiary)] themed-border'
                    } ${userTier === UserTier.FREE ? 'opacity-50' : ''}`}
                  >
                    {t.customVoice}
                  </button>
                  {voice === 'Custom' && userTier === UserTier.PRO && (
                    <input 
                      type="text" 
                      value={customVoice} 
                      onChange={(e) => setCustomVoice(e.target.value)} 
                      placeholder="Nome da voz (ex: en-US-Studio-M)" 
                      className="w-full mt-2 bg-[var(--bg-primary)] border themed-border rounded-lg px-3 py-2 text-xs themed-text outline-none touch-target" 
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold themed-text-secondary uppercase tracking-wider mb-2 block">{t.ttsModel}</label>
                    <select
                      value={ttsModel}
                      onChange={(e) => setTtsModel(e.target.value as GeminiTTSModel)}
                      className="w-full bg-[var(--bg-primary)] border themed-border rounded-lg p-2 text-xs themed-text focus:ring-[var(--accent-primary)] outline-none touch-target"
                    >
                      <option value="gemini-2.5-flash-preview-tts">{t.ttsModelFast}</option>
                      <option value="gemini-2.5-pro-tts">{t.ttsModelQuality}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold themed-text-secondary uppercase tracking-wider mb-2 block">{t.globalSpeechStyle}</label>
                    <input
                      type="text"
                      value={globalTtsStyle}
                      onChange={(e) => setGlobalTtsStyle(e.target.value)}
                      placeholder={t.speechStylePlaceholder}
                      className="w-full bg-[var(--bg-primary)] border themed-border rounded-lg p-2 text-xs themed-text focus:ring-[var(--accent-primary)] outline-none touch-target"
                    />
                  </div>
                </div>

                {/* Visual Intensity */}
                <div className="space-y-2">
                  <label className="text-xs font-bold themed-text-secondary uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3 h-3 themed-accent" /> {t.visualIntensity}
                  </label>
                  <select
                    value={visualIntensity}
                    onChange={(e) => setVisualIntensity(e.target.value as VisualIntensity)}
                    className="w-full bg-[var(--bg-primary)] border themed-border rounded-lg p-2 text-xs themed-text focus:ring-[var(--accent-primary)] outline-none touch-target"
                  >
                    {Object.values(VisualIntensity).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Image Provider */}
                <div className="space-y-2">
                  <label className="text-xs font-bold themed-text-secondary uppercase tracking-wider">{t.imageProvider}</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { id: ImageProvider.POLLINATIONS, label: '🎨 Pollinations.ai', sub: 'Models: Flux, Turbo' },
                      { id: ImageProvider.STOCK_VIDEO, label: '📹 Stock Video', sub: 'Real Footage (Pexels)' },
                      { id: ImageProvider.NONE, label: t.providerNone, sub: t.providerNoneSub }
                    ].map(p => (
                      <button
                        key={p.id}
                        onClick={() => setImageProvider(p.id as any)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all touch-target ${
                          imageProvider === p.id
                            ? 'themed-btn shadow-lg'
                            : 'bg-[var(--bg-secondary)] themed-border hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        <div className="text-left">
                          <div className={`font-bold text-sm ${imageProvider === p.id ? 'text-white' : 'themed-text'}`}>{p.label}</div>
                          <div className={`text-xs ${imageProvider === p.id ? 'text-white/70' : 'themed-text-secondary'}`}>{p.sub}</div>
                        </div>
                        {imageProvider === p.id && <CheckCircle2 className="w-5 h-5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pollinations Model Selector */}
                {imageProvider === ImageProvider.POLLINATIONS && (
                  <div className="p-4 bg-[var(--bg-tertiary)] border themed-border rounded-xl space-y-3 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-bold themed-accent uppercase flex items-center gap-2">
                      <Zap className="w-3 h-3"/> {t.pollinationsModels}
                    </h4>
                    
                    <div>
                      <label className="text-[10px] font-bold themed-text-secondary mb-1 block flex items-center gap-1">
                        <Image className="w-3 h-3"/> {t.generationModel}
                      </label>
                      <select 
                        value={activeModel} 
                        onChange={(e) => {
                          if(e.target.value) {
                            const newModel = e.target.value as PollinationsModel;
                            if (userTier !== UserTier.PRO && isVideoModel(newModel)) {
                              setActiveModel('flux' as PollinationsModel);
                              return;
                            }
                            setActiveModel(newModel);
                          }
                        }}
                        className="w-full bg-[var(--bg-primary)] border themed-border rounded-lg p-2 text-xs outline-none focus:border-[var(--accent-primary)] touch-target"
                      >
                        <optgroup label={t.imageModelsPublic}>
                          <option value="flux">Flux (Default - High Quality)</option>
                          <option value="flux-realism">Flux Realism</option>
                          <option value="flux-3d">Flux 3D (Pixar Style)</option>
                          <option value="flux-anime">Flux Anime</option>
                          <option value="flux-cne">Flux Cinematic</option>
                          <option value="midjourney">Midjourney Style</option>
                          <option value="any-dark">Any Dark</option>
                          <option value="turbo">Turbo (Super Fast)</option>
                        </optgroup>
                      </select>
                    </div>
                    <p className="text-[10px] themed-text-secondary italic">{t.videoModelsNote}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* === CTA BUTTON === */}
        <div className="flex flex-col items-center gap-4 pb-8">
          <button
            onClick={handleGenerateVideo}
            disabled={isGenerating}
            className={`w-full md:w-auto group relative px-6 md:px-8 py-4 rounded-full font-black text-base md:text-lg shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 touch-target ${
              duration === VideoDuration.MOVIE
                ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black'
                : 'themed-btn'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center gap-3 justify-center">
                <Loader2 className="w-6 h-6 animate-spin" /> {progress || t.generating}
              </span>
            ) : (
              <span className="flex items-center gap-3 justify-center">
                {duration === VideoDuration.MOVIE ? t.generateMovie : t.generateVideo}
                {duration === VideoDuration.MOVIE ? <Clapperboard className="w-6 h-6" /> : <Wand2 className="w-6 h-6" />}
              </span>
            )}
          </button>
          
          <div className="flex items-center gap-2 text-sm themed-text-secondary">
            <span>{t.orText}</span>
            <button onClick={importClick} className="themed-accent hover:underline font-bold flex items-center gap-1 touch-target">
              <FolderOpen className="w-4 h-4" /> {t.loadScriptJson}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
