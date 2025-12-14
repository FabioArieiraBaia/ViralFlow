

import React, { useState } from 'react';
import { 
  Globe, Smartphone, Monitor, Youtube, Lock, AlertCircle, CheckCircle2, 
  Loader2, Wand2, FolderOpen, TriangleAlert, Clapperboard, ChevronRight, Edit2, Zap, Mic,
  Video, Image, Save, Play, ChevronDown, ChevronUp, Sparkles, Clock, Palette, Film, 
  Music, Volume2, Sliders, Layers, Timer, ImageIcon
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
  ttsModel: GeminiTTSModel;
  setTtsModel: (v: GeminiTTSModel) => void;
  globalTtsStyle: string;
  setGlobalTtsStyle: (v: string) => void;
  pollinationsModel?: PollinationsModel;
  setPollinationsModel?: (v: PollinationsModel) => void;
  isAdmin?: boolean;
  generationPhase: GenerationPhase;
  runVisualPhase: () => void;
  handleExportScript: () => void;
}

// Helper to get intensity description
const getIntensityInfo = (intensity: VisualIntensity, lang: Language) => {
  const info = {
    [VisualIntensity.LOW]: { 
      images: '1', 
      desc: { pt: '1 imagem por cena', en: '1 image per scene', es: '1 imagen por escena' }
    },
    [VisualIntensity.MEDIUM]: { 
      images: '2-3', 
      desc: { pt: '2-3 imagens por cena (a cada 4-5s)', en: '2-3 images per scene (every 4-5s)', es: '2-3 imágenes por escena (cada 4-5s)' }
    },
    [VisualIntensity.HIGH]: { 
      images: '4-6', 
      desc: { pt: '4-6 imagens por cena (a cada 2-3s)', en: '4-6 images per scene (every 2-3s)', es: '4-6 imágenes por escena (cada 2-3s)' }
    },
    [VisualIntensity.HYPER]: { 
      images: '8+', 
      desc: { pt: '8+ imagens por cena (a cada 1-2s)', en: '8+ images per scene (every 1-2s)', es: '8+ imágenes por escena (cada 1-2s)' }
    }
  };
  return info[intensity] || info[VisualIntensity.MEDIUM];
};

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

  // If props are missing, use local state fallback
  const [localPollinationsModel, setLocalPollinationsModel] = React.useState<PollinationsModel>('flux');
  const activeModel = pollinationsModel || localPollinationsModel;
  const setActiveModel = setPollinationsModel || setLocalPollinationsModel;

  const intensityInfo = getIntensityInfo(visualIntensity, lang);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar hide-scrollbar-mobile animate-in fade-in duration-500">
      
      {/* === GENERATION MODAL OVERLAY === */}
      {(isGenerating || generationPhase === 'ready_for_visuals') && generationPhase !== 'script_approval' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-6">
          <div className="bg-[var(--bg-secondary)] border themed-border p-6 md:p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6">
            
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
                  <button onClick={runVisualPhase} className="w-full py-4 themed-btn rounded-xl shadow-lg flex items-center justify-center gap-2 transform hover:scale-[1.02] transition-all touch-target">
                    <Image className="w-5 h-5" /> {t.generateImages}
                  </button>
                  <button onClick={handleExportScript} className="w-full py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] themed-text-secondary font-bold rounded-xl flex items-center justify-center gap-2 touch-target">
                    <Save className="w-4 h-4" /> {t.saveProjectBackup}
                  </button>
                </div>
              </div>
            )}

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
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        
        {/* === HERO SECTION === */}
        <div className="relative py-4 md:py-8">
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
            <div className="grid-floor"></div>
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-12">
            <div className="text-center lg:text-left space-y-3 md:space-y-4 flex-1">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-black themed-text tracking-tight leading-tight">
                {t.heroTagline.split(' ').slice(0, -2).join(' ')} <span className="gradient-text">{t.heroTagline.split(' ').slice(-2).join(' ')}</span>
              </h2>
              <p className="themed-text-secondary text-sm md:text-lg max-w-md mx-auto lg:mx-0">{t.heroSubtitle}</p>
            </div>
            
            <div className="scene-3d flex items-center justify-center w-40 h-40 md:w-56 md:h-56 shrink-0 hidden md:flex">
              <div className="reactor-container">
                <div className="reactor-ring r-ring-1"></div>
                <div className="reactor-ring r-ring-2"></div>
                <div className="reactor-ring r-ring-3"></div>
                <div className="core-glow"></div>
              </div>
            </div>
          </div>
          
          <div className="absolute top-2 right-2 md:top-4 md:right-0">
            <button onClick={importClick} className="px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] themed-text-secondary text-xs font-bold transition-colors flex items-center gap-2 border themed-border touch-target">
              <FolderOpen className="w-4 h-4" /> 
              <span className="hidden sm:inline">{t.loadJson}</span>
            </button>
          </div>
        </div>

        {/* === QUICK ACTIONS CARDS === */}
        {!isGenerating && (
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="group cursor-pointer bg-gradient-to-br from-[var(--accent-primary)]/10 to-[var(--accent-primary)]/5 border-2 border-[var(--accent-primary)]/30 hover:border-[var(--accent-primary)] p-3 md:p-5 rounded-xl shadow-sm hover:shadow-xl hover:shadow-[var(--accent-glow)] transition-all flex flex-col items-center text-center space-y-1 md:space-y-2 relative overflow-hidden touch-target">
              <div className="absolute top-0 right-0 px-1.5 py-0.5 bg-[var(--accent-primary)] text-white text-[8px] font-bold uppercase rounded-bl-lg hidden md:block">★</div>
              <Wand2 className="w-6 h-6 md:w-8 md:h-8 themed-accent group-hover:scale-110 transition-transform"/>
              <h3 className="text-xs md:text-sm font-bold themed-text">{t.createWithAI}</h3>
            </div>
            
            <div onClick={handleCreateManualProject} className="group cursor-pointer bg-[var(--bg-secondary)] border themed-border hover:border-[var(--success)] p-3 md:p-5 rounded-xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center space-y-1 md:space-y-2 touch-target">
              <Edit2 className="w-6 h-6 md:w-8 md:h-8 text-[var(--success)] group-hover:scale-110 transition-transform"/>
              <h3 className="text-xs md:text-sm font-bold themed-text">{t.manualEditor}</h3>
            </div>
            
            <div onClick={importClick} className="group cursor-pointer bg-[var(--bg-secondary)] border themed-border hover:border-[var(--warning)] p-3 md:p-5 rounded-xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center space-y-1 md:space-y-2 touch-target">
              <FolderOpen className="w-6 h-6 md:w-8 md:h-8 text-[var(--warning)] group-hover:scale-110 transition-transform"/>
              <h3 className="text-xs md:text-sm font-bold themed-text">{t.importProject}</h3>
            </div>
          </div>
        )}

        {/* === MAIN FORM === */}
        <div className="space-y-4 md:space-y-6">
          
          {/* Topic Input */}
          <div className="bg-[var(--bg-secondary)] border themed-border rounded-2xl p-4 md:p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold themed-text-secondary uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3 h-3 themed-accent" /> {t.videoTopic}
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border themed-border rounded-xl p-4 text-base themed-text placeholder:themed-text-secondary focus:ring-2 focus:ring-[var(--accent-primary)] outline-none transition-all resize-none shadow-inner"
                placeholder={t.topicPlaceholder}
                rows={3}
              />
            </div>
            
            {/* Language & Channel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold themed-text-secondary uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-3 h-3" /> {t.videoLang}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pt', label: '🇧🇷 PT' },
                    { id: 'en', label: '🇺🇸 EN' },
                    { id: 'es', label: '🇪🇸 ES' }
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setContentLang(l.id as any)}
                      className={`px-2 py-2 rounded-lg text-xs font-bold border transition-all touch-target ${
                        contentLang === l.id ? 'themed-btn' : 'bg-[var(--bg-primary)] themed-text-secondary themed-border hover:border-[var(--border-accent)]'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold themed-text-secondary uppercase tracking-wider">{t.channelName}</label>
                <div className="relative">
                  <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 themed-text-secondary" />
                  <input
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border themed-border rounded-lg pl-9 pr-4 py-2 text-sm themed-text focus:ring-[var(--accent-primary)] outline-none touch-target"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* === VIDEO FORMAT & STYLE SECTION === */}
          <div className="bg-[var(--bg-secondary)] border themed-border rounded-2xl p-4 md:p-6">
            <h3 className="text-sm font-bold themed-text flex items-center gap-2 mb-4">
              <Film className="w-4 h-4 themed-accent" /> 
              {lang === 'pt' ? 'Formato & Estilo do Vídeo' : lang === 'es' ? 'Formato y Estilo del Video' : 'Video Format & Style'}
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {/* FORMAT - Enhanced */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold themed-text-secondary uppercase tracking-wider">{t.format}</label>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setFormat(VideoFormat.PORTRAIT)}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all touch-target ${
                      format === VideoFormat.PORTRAIT
                        ? 'themed-btn shadow-lg'
                        : 'bg-[var(--bg-primary)] themed-text-secondary themed-border hover:border-[var(--accent-primary)]'
                    }`}
                  >
                    <div className="w-5 h-8 border-2 rounded-sm shrink-0" style={{ borderColor: format === VideoFormat.PORTRAIT ? 'white' : 'var(--border-secondary)' }}></div>
                    <div className="text-left">
                      <div className="text-xs font-bold">9:16</div>
                      <div className="text-[9px] opacity-70">Shorts/Reels</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setFormat(VideoFormat.LANDSCAPE)}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all touch-target ${
                      format === VideoFormat.LANDSCAPE
                        ? 'themed-btn shadow-lg'
                        : 'bg-[var(--bg-primary)] themed-text-secondary themed-border hover:border-[var(--accent-primary)]'
                    }`}
                  >
                    <div className="w-8 h-5 border-2 rounded-sm shrink-0" style={{ borderColor: format === VideoFormat.LANDSCAPE ? 'white' : 'var(--border-secondary)' }}></div>
                    <div className="text-left">
                      <div className="text-xs font-bold">16:9</div>
                      <div className="text-[9px] opacity-70">YouTube</div>
                    </div>
                  </button>
                </div>
              </div>
              
              {/* DURATION - Enhanced */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold themed-text-secondary uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t.duration}
                </label>
                <div className="flex flex-col gap-1">
                  {Object.values(VideoDuration).map(d => {
                    const isMovie = d === VideoDuration.MOVIE;
                    const isLocked = isMovie && userTier === UserTier.FREE;
                    return (
                      <button
                        key={d}
                        onClick={() => {
                          if (isLocked) setShowUpgradeModal(true);
                          else setDuration(d);
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[10px] font-medium transition-all touch-target ${
                          duration === d
                            ? 'themed-btn'
                            : isLocked 
                              ? 'bg-[var(--bg-tertiary)] themed-text-secondary themed-border opacity-50'
                              : 'bg-[var(--bg-primary)] themed-text-secondary themed-border hover:border-[var(--accent-primary)]'
                        }`}
                      >
                        <span className="truncate">{d.split('(')[0].trim()}</span>
                        {isLocked && <Lock className="w-3 h-3 shrink-0" />}
                        {isMovie && !isLocked && <Clapperboard className="w-3 h-3 shrink-0 text-amber-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* VISUAL STYLE - Enhanced */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold themed-text-secondary uppercase tracking-wider flex items-center gap-1">
                  <Palette className="w-3 h-3" /> {t.visualStyle}
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as VideoStyle)}
                  className="w-full bg-[var(--bg-primary)] border themed-border rounded-lg p-2.5 text-[11px] themed-text focus:ring-[var(--accent-primary)] outline-none touch-target"
                >
                  {Object.values(VideoStyle).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <p className="text-[9px] themed-text-secondary">
                  {lang === 'pt' ? 'Define a estética visual' : lang === 'es' ? 'Define la estética visual' : 'Sets the visual aesthetic'}
                </p>
              </div>
              
              {/* PACING - Enhanced */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold themed-text-secondary uppercase tracking-wider flex items-center gap-1">
                  <Timer className="w-3 h-3" /> {t.pacing}
                </label>
                <select
                  value={pacing}
                  onChange={(e) => setPacing(e.target.value as VideoPacing)}
                  className="w-full bg-[var(--bg-primary)] border themed-border rounded-lg p-2.5 text-[11px] themed-text focus:ring-[var(--accent-primary)] outline-none touch-target"
                >
                  {Object.values(VideoPacing).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <p className="text-[9px] themed-text-secondary">
                  {lang === 'pt' ? 'Velocidade dos cortes' : lang === 'es' ? 'Velocidad de los cortes' : 'Cut speed'}
                </p>
              </div>
            </div>
          </div>

          {/* === IMAGES PER SCENE SECTION (RESTORED!) === */}
          <div className="bg-[var(--bg-secondary)] border themed-border rounded-2xl p-4 md:p-6">
            <h3 className="text-sm font-bold themed-text flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-pink-500" /> 
              {lang === 'pt' ? 'Imagens por Cena' : lang === 'es' ? 'Imágenes por Escena' : 'Images per Scene'}
              <span className="ml-auto text-xs font-normal themed-accent bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded-full">
                {intensityInfo.images} {lang === 'pt' ? 'imagens' : lang === 'es' ? 'imágenes' : 'images'}
              </span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.values(VisualIntensity).map(intensity => {
                const info = getIntensityInfo(intensity, lang);
                const isSelected = visualIntensity === intensity;
                return (
                  <button
                    key={intensity}
                    onClick={() => setVisualIntensity(intensity)}
                    className={`p-3 rounded-xl border transition-all touch-target text-left ${
                      isSelected
                        ? 'bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-pink-500 shadow-lg shadow-pink-500/20'
                        : 'bg-[var(--bg-primary)] themed-border hover:border-pink-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isSelected ? 'bg-pink-500 text-white' : 'bg-[var(--bg-tertiary)] themed-text-secondary'}`}>
                        {info.images}
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-pink-500" />}
                    </div>
                    <div className={`text-[10px] font-bold ${isSelected ? 'text-pink-400' : 'themed-text-secondary'}`}>
                      {intensity.split('(')[0].trim()}
                    </div>
                    <div className="text-[9px] themed-text-secondary mt-0.5">
                      {info.desc[lang]}
                    </div>
                  </button>
                );
              })}
            </div>
            
            <p className="text-[10px] themed-text-secondary mt-3 text-center">
              {lang === 'pt' 
                ? '⚡ Mais imagens = mais dinamismo visual, mas consome mais API' 
                : lang === 'es' 
                  ? '⚡ Más imágenes = más dinamismo visual, pero consume más API'
                  : '⚡ More images = more visual dynamism, but consumes more API'}
            </p>
          </div>

          {/* === IMAGE SETTINGS SECTION === */}
          <div className="bg-[var(--bg-secondary)] border themed-border rounded-2xl p-4 md:p-6">
            <h3 className="text-sm font-bold themed-text flex items-center gap-2 mb-4">
              <Image className="w-4 h-4 text-emerald-500" /> 
              {lang === 'pt' ? 'Configurações de Imagem' : lang === 'es' ? 'Configuración de Imagen' : 'Image Settings'}
            </h3>
            
            {/* Image Provider */}
            <div className="space-y-3">
              <label className="text-xs font-bold themed-text-secondary uppercase tracking-wider">{t.imageProvider}</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {[
                  { id: ImageProvider.POLLINATIONS, label: '🎨 Pollinations.ai', sub: 'Flux, Turbo, Midjourney' },
                  { id: ImageProvider.STOCK_VIDEO, label: '📹 Stock Video', sub: 'Pexels (Real)' },
                  { id: ImageProvider.NONE, label: '⛔ ' + (lang === 'pt' ? 'Sem Imagem' : lang === 'es' ? 'Sin Imagen' : 'No Image'), sub: lang === 'pt' ? 'Apenas roteiro' : lang === 'es' ? 'Solo guion' : 'Script only' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setImageProvider(p.id as any)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all touch-target ${
                      imageProvider === p.id
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10'
                        : 'bg-[var(--bg-primary)] themed-border hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="text-left">
                      <div className={`font-bold text-sm ${imageProvider === p.id ? 'text-emerald-400' : 'themed-text'}`}>{p.label}</div>
                      <div className="text-[10px] themed-text-secondary">{p.sub}</div>
                    </div>
                    {imageProvider === p.id && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Pollinations Model Selector */}
            {imageProvider === ImageProvider.POLLINATIONS && (
              <div className="mt-4 p-4 bg-[var(--bg-tertiary)] border themed-border rounded-xl space-y-3 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-bold themed-text-secondary uppercase flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400"/> {t.generationModel}
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
                  className="w-full bg-[var(--bg-primary)] border themed-border rounded-lg p-2 text-xs outline-none focus:border-emerald-500 touch-target"
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
            )}
          </div>

          {/* === AUDIO SETTINGS SECTION (SEPARATED!) === */}
          <div className="bg-[var(--bg-secondary)] border themed-border rounded-2xl p-4 md:p-6">
            <h3 className="text-sm font-bold themed-text flex items-center gap-2 mb-4">
              <Mic className="w-4 h-4 text-indigo-500" /> 
              {lang === 'pt' ? 'Configurações de Áudio (TTS)' : lang === 'es' ? 'Configuración de Audio (TTS)' : 'Audio Settings (TTS)'}
            </h3>
            
            <div className="space-y-4">
              {/* Voice Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold themed-text-secondary uppercase tracking-wider flex items-center gap-2">
                  {t.narrator} {userTier === UserTier.FREE && <Lock className="w-3 h-3" />}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1 bg-[var(--bg-tertiary)] rounded-lg">
                  <button
                    onClick={() => setVoice('Auto')}
                    className={`text-left px-3 py-2 rounded-lg text-xs border transition-all touch-target ${
                      voice === 'Auto'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                        : 'bg-[var(--bg-primary)] themed-border themed-text-secondary hover:border-indigo-500/50'
                    }`}
                  >
                    {t.autoCast}
                  </button>
                  
                  {ALL_GEMINI_VOICES.slice(0, 11).map(v => (
                    <button
                      key={v.id}
                      onClick={() => {
                        if (userTier === UserTier.PRO || v.id === 'Fenrir') setVoice(v.id);
                        else setShowUpgradeModal(true);
                      }}
                      className={`text-left px-3 py-2 rounded-lg text-[10px] border transition-all touch-target ${
                        voice === v.id
                          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                          : 'bg-[var(--bg-primary)] themed-border themed-text-secondary hover:border-indigo-500/50'
                      } ${userTier === UserTier.FREE && v.id !== 'Fenrir' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {v.label.split('(')[0].trim()}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => {
                    if (userTier === UserTier.PRO) setVoice('Custom');
                    else setShowUpgradeModal(true);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs border touch-target ${
                    voice === 'Custom' ? 'bg-indigo-500/20 border-indigo-500' : 'bg-[var(--bg-tertiary)] themed-border'
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
                    className="w-full bg-[var(--bg-primary)] border themed-border rounded-lg px-3 py-2 text-xs themed-text outline-none touch-target" 
                  />
                )}
              </div>

              {/* TTS Model & Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold themed-text-secondary uppercase tracking-wider mb-2 block">{t.ttsModel}</label>
                  <select
                    value={ttsModel}
                    onChange={(e) => setTtsModel(e.target.value as GeminiTTSModel)}
                    className="w-full bg-[var(--bg-primary)] border themed-border rounded-lg p-2 text-xs themed-text focus:ring-indigo-500 outline-none touch-target"
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
                    className="w-full bg-[var(--bg-primary)] border themed-border rounded-lg p-2 text-xs themed-text focus:ring-indigo-500 outline-none touch-target"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* === CTA BUTTON === */}
        <div className="flex flex-col items-center gap-4 pb-8 pt-4">
          <button
            onClick={handleGenerateVideo}
            disabled={isGenerating}
            className={`w-full md:w-auto group relative px-8 py-4 rounded-full font-black text-lg shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 touch-target ${
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
