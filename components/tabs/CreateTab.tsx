
import React, { useState } from 'react';
import { 
  Globe, Smartphone, Monitor, Youtube, Lock, CheckCircle2, 
  Loader2, Wand2, FolderOpen, Clapperboard, Edit2, Zap, Mic,
  Image, Save, ChevronDown, Sparkles, Clock, Palette, Layers
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

export const CreateTab: React.FC<CreateTabProps> = ({
  lang, topic, setTopic, contentLang, setContentLang, style, setStyle,
  pacing, setPacing, visualIntensity, setVisualIntensity, format, setFormat, duration, setDuration,
  channelName, setChannelName, voice, setVoice, customVoice, setCustomVoice,
  imageProvider, setImageProvider,
  userTier, isGenerating, progress, handleGenerateVideo, setShowUpgradeModal,
  importClick, handleCreateManualProject,
  ttsModel, setTtsModel, globalTtsStyle, setGlobalTtsStyle,
  pollinationsModel, setPollinationsModel,
  generationPhase, runVisualPhase, handleExportScript
}) => {
  const t = translations[lang];
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localPollinationsModel, setLocalPollinationsModel] = useState<PollinationsModel>('flux');
  const activeModel = pollinationsModel || localPollinationsModel;
  const setActiveModel = setPollinationsModel || setLocalPollinationsModel;

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar">
      {/* Generation Modal */}
      {(isGenerating || generationPhase === 'ready_for_visuals') && generationPhase !== 'script_approval' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)' }}>
          <div className="card gradient-border max-w-md w-full p-8 text-center space-y-6">
            {(generationPhase === 'scripting' || generationPhase === 'audio_processing') && (
              <div className="space-y-4">
                <div className="mx-auto w-20 h-20 relative">
                  <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '3px solid var(--accent)', borderTopColor: 'transparent' }} />
                  <Mic className="absolute inset-0 m-auto w-8 h-8 animate-pulse" style={{ color: 'var(--accent)' }} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t.creatingScriptVoices}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{progress}</p>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                  <div className="h-full w-1/2 animate-pulse rounded-full" style={{ background: 'var(--accent)' }} />
                </div>
              </div>
            )}

            {generationPhase === 'ready_for_visuals' && (
              <div className="space-y-6 animate-in zoom-in duration-300">
                <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.2)', border: '2px solid #10b981' }}>
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t.audiosGenerated}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.scriptVoicesReady}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={runVisualPhase} className="btn-primary py-4 flex items-center justify-center gap-2 touch-target">
                    <Image className="w-5 h-5" /> {t.generateImages}
                  </button>
                  <button onClick={handleExportScript} className="btn-secondary py-3 flex items-center justify-center gap-2 touch-target">
                    <Save className="w-4 h-4" /> {t.saveProjectBackup}
                  </button>
                </div>
              </div>
            )}

            {generationPhase === 'visual_processing' && (
              <div className="space-y-4">
                <div className="mx-auto w-20 h-20 relative">
                  <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '3px solid #ec4899', borderTopColor: 'transparent' }} />
                  <Image className="absolute inset-0 m-auto w-8 h-8 animate-pulse text-pink-400" />
                </div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t.generatingVisuals}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{progress}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">
        {/* Hero Section */}
        <div className="relative text-center py-8 md:py-12">
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
            <div className="reactor">
              <div className="reactor-ring" />
              <div className="reactor-ring" />
              <div className="reactor-ring" />
              <div className="reactor-core" />
            </div>
          </div>
          
          <div className="relative z-10 space-y-4">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {t.heroTagline} <span className="text-gradient">✨</span>
            </h1>
            <p className="text-base md:text-lg max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              {t.heroSubtitle}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        {!isGenerating && (
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="card card-glow gradient-border p-4 md:p-6 flex flex-col items-center text-center gap-3 cursor-pointer group">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-light))' }}>
                <Wand2 className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>{t.createWithAI}</h3>
                <p className="text-xs hidden md:block" style={{ color: 'var(--text-muted)' }}>{t.createWithAIDesc}</p>
              </div>
            </div>
            
            <div onClick={handleCreateManualProject} className="card card-glow p-4 md:p-6 flex flex-col items-center text-center gap-3 cursor-pointer group">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center bg-emerald-500/20 group-hover:scale-110 transition-transform">
                <Edit2 className="w-6 h-6 md:w-7 md:h-7 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>{t.manualEditor}</h3>
                <p className="text-xs hidden md:block" style={{ color: 'var(--text-muted)' }}>{t.manualEditorDesc}</p>
              </div>
            </div>
            
            <div onClick={importClick} className="card card-glow p-4 md:p-6 flex flex-col items-center text-center gap-3 cursor-pointer group">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center bg-amber-500/20 group-hover:scale-110 transition-transform">
                <FolderOpen className="w-6 h-6 md:w-7 md:h-7 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>{t.importProject}</h3>
                <p className="text-xs hidden md:block" style={{ color: 'var(--text-muted)' }}>{t.importProjectDesc}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="card p-6 md:p-8 space-y-6">
          {/* Topic */}
          <div className="space-y-2">
            <label className="label flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              {t.videoTopic}
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input-field resize-none"
              placeholder={t.topicPlaceholder}
              rows={3}
            />
          </div>

          {/* Language & Format Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Language */}
            <div className="space-y-2">
              <label className="label flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t.videoLang}
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'pt', flag: '🇧🇷' },
                  { id: 'en', flag: '🇺🇸' },
                  { id: 'es', flag: '🇪🇸' }
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setContentLang(l.id as any)}
                    className={`flex-1 py-2 rounded-lg text-lg transition-all touch-target ${
                      contentLang === l.id ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {l.flag}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div className="space-y-2">
              <label className="label">{t.format}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat(VideoFormat.PORTRAIT)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all touch-target ${
                    format === VideoFormat.PORTRAIT ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-xs font-semibold">9:16</span>
                </button>
                <button
                  onClick={() => setFormat(VideoFormat.LANDSCAPE)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all touch-target ${
                    format === VideoFormat.LANDSCAPE ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  <Monitor className="w-5 h-5" />
                  <span className="text-xs font-semibold">16:9</span>
                </button>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="label flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t.duration}
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
                className="input-field"
              >
                {Object.values(VideoDuration).map(s => (
                  <option key={s} value={s} disabled={s === VideoDuration.MOVIE && userTier === UserTier.FREE}>
                    {s} {s === VideoDuration.MOVIE && userTier === UserTier.FREE ? '🔒' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Style & Pacing Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="label flex items-center gap-2">
                <Palette className="w-4 h-4" />
                {t.visualStyle}
              </label>
              <select value={style} onChange={(e) => setStyle(e.target.value as VideoStyle)} className="input-field">
                {Object.values(VideoStyle).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="label">{t.pacing}</label>
              <select value={pacing} onChange={(e) => setPacing(e.target.value as VideoPacing)} className="input-field">
                {Object.values(VideoPacing).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="label flex items-center gap-2">
                <Layers className="w-4 h-4" />
                {t.visualIntensity}
              </label>
              <select value={visualIntensity} onChange={(e) => setVisualIntensity(e.target.value as VisualIntensity)} className="input-field">
                {Object.values(VisualIntensity).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Channel Name */}
          <div className="space-y-2">
            <label className="label">{t.channelName}</label>
            <div className="relative">
              <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              <input
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="input-field pl-12"
                placeholder="@YourChannel"
              />
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-4 rounded-xl transition-all touch-target"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <span className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              <Zap className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              {t.advancedVoiceSettings}
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* Advanced Settings Content */}
          {showAdvanced && (
            <div className="space-y-6 animate-in slide-in-from-top-2 duration-200 p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              {/* Voice Selection */}
              <div className="space-y-3">
                <label className="label flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  {t.narrator}
                  {userTier === UserTier.FREE && <Lock className="w-3 h-3" />}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto hide-scrollbar">
                  <button
                    onClick={() => setVoice('Auto')}
                    className={`chip ${voice === 'Auto' ? 'active' : ''}`}
                  >
                    🤖 {t.autoCast}
                  </button>
                  {ALL_GEMINI_VOICES.slice(0, 8).map(v => (
                    <button
                      key={v.id}
                      onClick={() => {
                        if (userTier === UserTier.PRO || v.id === 'Fenrir') setVoice(v.id);
                        else setShowUpgradeModal(true);
                      }}
                      className={`chip ${voice === v.id ? 'active' : ''} ${userTier === UserTier.FREE && v.id !== 'Fenrir' ? 'opacity-50' : ''}`}
                    >
                      {v.label.split('(')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* TTS Model & Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label">{t.ttsModel}</label>
                  <select value={ttsModel} onChange={(e) => setTtsModel(e.target.value as GeminiTTSModel)} className="input-field">
                    <option value="gemini-2.5-flash-preview-tts">{t.ttsModelFast}</option>
                    <option value="gemini-2.5-pro-tts">{t.ttsModelQuality}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label">{t.globalSpeechStyle}</label>
                  <input
                    type="text"
                    value={globalTtsStyle}
                    onChange={(e) => setGlobalTtsStyle(e.target.value)}
                    placeholder={t.speechStylePlaceholder}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Image Provider */}
              <div className="space-y-3">
                <label className="label">{t.imageProvider}</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    { id: ImageProvider.POLLINATIONS, icon: '🎨', label: 'Pollinations.ai' },
                    { id: ImageProvider.STOCK_VIDEO, icon: '📹', label: 'Stock Video' },
                    { id: ImageProvider.NONE, icon: '⛔', label: t.providerNone }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setImageProvider(p.id as any)}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all touch-target ${
                        imageProvider === p.id ? 'btn-primary' : 'btn-secondary'
                      }`}
                    >
                      <span className="text-xl">{p.icon}</span>
                      <span className="font-semibold text-sm">{p.label}</span>
                    </button>
                  ))}
                </div>

                {imageProvider === ImageProvider.POLLINATIONS && (
                  <div className="mt-3 p-4 rounded-xl space-y-3" style={{ background: 'var(--bg-muted)' }}>
                    <label className="label">{t.generationModel}</label>
                    <select 
                      value={activeModel} 
                      onChange={(e) => {
                        const newModel = e.target.value as PollinationsModel;
                        if (userTier !== UserTier.PRO && isVideoModel(newModel)) {
                          setActiveModel('flux' as PollinationsModel);
                          return;
                        }
                        setActiveModel(newModel);
                      }}
                      className="input-field"
                    >
                      <optgroup label={t.imageModelsPublic}>
                        <option value="flux">Flux (Default)</option>
                        <option value="flux-realism">Flux Realism</option>
                        <option value="flux-3d">Flux 3D</option>
                        <option value="flux-anime">Flux Anime</option>
                        <option value="turbo">Turbo (Fast)</option>
                      </optgroup>
                    </select>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.videoModelsNote}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div className="flex flex-col items-center gap-4 pb-8">
          <button
            onClick={handleGenerateVideo}
            disabled={isGenerating}
            className="w-full md:w-auto px-10 py-5 rounded-2xl font-black text-lg transition-all disabled:opacity-50 touch-target"
            style={{
              background: duration === VideoDuration.MOVIE 
                ? 'linear-gradient(135deg, #f59e0b, #eab308)' 
                : 'linear-gradient(135deg, var(--accent), var(--accent-light))',
              color: duration === VideoDuration.MOVIE ? 'black' : 'white',
              boxShadow: `0 8px 40px ${duration === VideoDuration.MOVIE ? 'rgba(245, 158, 11, 0.4)' : 'var(--accent-glow)'}`
            }}
          >
            {isGenerating ? (
              <span className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin" /> {progress || t.generating}
              </span>
            ) : (
              <span className="flex items-center gap-3">
                {duration === VideoDuration.MOVIE ? t.generateMovie : t.generateVideo}
                {duration === VideoDuration.MOVIE ? <Clapperboard className="w-6 h-6" /> : <Wand2 className="w-6 h-6" />}
              </span>
            )}
          </button>
          
          <button onClick={importClick} className="flex items-center gap-2 text-sm font-semibold touch-target" style={{ color: 'var(--accent)' }}>
            <FolderOpen className="w-4 h-4" /> {t.loadScriptJson}
          </button>
        </div>
      </div>
    </div>
  );
};
