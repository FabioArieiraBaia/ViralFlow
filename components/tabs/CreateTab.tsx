



import React from 'react';
import { 
  Globe, Smartphone, Monitor, Youtube, Lock, AlertCircle, CheckCircle2, 
  Loader2, Wand2, FolderOpen, TriangleAlert, Clapperboard, ChevronRight, Edit2, Zap, Mic 
} from 'lucide-react';
import { Language, VideoStyle, VideoPacing, VideoDuration, VideoFormat, ImageProvider, UserTier, VideoTransition, VisualIntensity, GeminiTTSModel } from '../../types';
import { translations } from '../../services/translations';

// Reusing voice options locally or importing if centralized
const VOICE_OPTIONS = [
  { id: 'Auto', label: '🤖 Elenco Automático' },
  { id: 'Fenrir', label: '🎙️ Fenrir (Masc. Épico)' },
  { id: 'Charon', label: '💀 Charon (Masc. Grave)' },
  { id: 'Zephyr', label: '🌬️ Zephyr (Masc. Calmo)' },
  { id: 'Puck', label: '👩 Puck (Fem. Suave)' },
  { id: 'Kore', label: '🧬 Kore (Fem. Tech)' },
  { id: 'Aoede', label: '🎭 Aoede (Fem. Dramática)' },
  { id: 'Custom', label: '✏️ Outra / Personalizada...' }
];

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
}

export const CreateTab: React.FC<CreateTabProps> = ({
  lang, topic, setTopic, contentLang, setContentLang, style, setStyle,
  pacing, setPacing, visualIntensity, setVisualIntensity, format, setFormat, duration, setDuration,
  channelName, setChannelName, voice, setVoice, customVoice, setCustomVoice,
  imageProvider, setImageProvider, globalTransition, setGlobalTransition,
  userTier, isGenerating, progress, handleGenerateVideo, setShowUpgradeModal,
  setActiveTab, importClick, handleCreateManualProject,
  ttsModel, setTtsModel, globalTtsStyle, setGlobalTtsStyle
}) => {
  const t = translations[lang];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <div className="flex justify-between items-center py-8">
            <div className="text-left space-y-4">
            <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{t.whatCreate}</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">{t.appDesc}</p>
            </div>
            <button onClick={importClick} className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-bold transition-colors flex items-center gap-2">
                <FolderOpen className="w-4 h-4" /> Carregar JSON
            </button>
        </div>

        {/* Quick Actions (Cards) */}
        {!isGenerating && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                 <div className="group cursor-pointer bg-white dark:bg-zinc-900 border-2 border-indigo-500/20 hover:border-indigo-500 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center space-y-3 relative overflow-hidden">
                    <Wand2 className="w-8 h-8 text-indigo-500 mb-2 group-hover:scale-110 transition-transform"/>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Criar com IA</h3>
                    <p className="text-xs text-zinc-500">Automático: Roteiro, Voz e Vídeo.</p>
                 </div>
                 <div onClick={handleCreateManualProject} className="group cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center space-y-3">
                    <Edit2 className="w-8 h-8 text-emerald-500 mb-2 group-hover:scale-110 transition-transform"/>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Editor Manual</h3>
                    <p className="text-xs text-zinc-500">Comece do zero, cena a cena.</p>
                 </div>
                 <div onClick={importClick} className="group cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center space-y-3">
                    <FolderOpen className="w-8 h-8 text-amber-500 mb-2 group-hover:scale-110 transition-transform"/>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Importar</h3>
                    <p className="text-xs text-zinc-500">Carregar projeto .json existente.</p>
                 </div>
            </div>
        )}

        {/* Copyright Warning */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <TriangleAlert className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-800 dark:text-amber-400 text-sm mb-1">{t.copyrightWarning}</h3>
            <p className="text-xs text-amber-700 dark:text-amber-300/80 leading-relaxed">{t.copyrightBody}</p>
          </div>
        </div>

        {/* Main Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{t.videoTopic}</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-lg text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-sm dark:shadow-inner"
                placeholder={t.topicPlaceholder}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">
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
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      contentLang === l.id
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{t.visualStyle}</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as VideoStyle)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none"
                >
                  {Object.values(VideoStyle).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{t.pacing}</label>
                  <select
                    value={pacing}
                    onChange={(e) => setPacing(e.target.value as VideoPacing)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none"
                  >
                    {Object.values(VideoPacing).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1"><Zap className="w-3 h-3 text-indigo-500" /> Intensidade Visual</label>
                  <select
                    value={visualIntensity}
                    onChange={(e) => setVisualIntensity(e.target.value as VisualIntensity)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none"
                  >
                    {Object.values(VisualIntensity).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 content-start">
            <div className="col-span-2 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{t.format}</label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <button
                    onClick={() => setFormat(VideoFormat.PORTRAIT)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-md transition-all ${
                        format === VideoFormat.PORTRAIT
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                    >
                    <Smartphone className="w-4 h-4" /> <span className="text-xs font-bold">Shorts</span>
                    </button>
                    <button
                    onClick={() => setFormat(VideoFormat.LANDSCAPE)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-md transition-all ${
                        format === VideoFormat.LANDSCAPE
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                    >
                    <Monitor className="w-4 h-4" /> <span className="text-xs font-bold">Vídeo</span>
                    </button>
                </div>
                </div>
                <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{t.duration}</label>
                <select
                    value={duration}
                    onChange={(e) => {
                    if (e.target.value === VideoDuration.MOVIE && userTier === UserTier.FREE) {
                        setShowUpgradeModal(true);
                    } else {
                        setDuration(e.target.value as VideoDuration);
                    }
                    }}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none"
                >
                    {Object.values(VideoDuration).map(s => (
                    <option key={s} value={s} disabled={s === VideoDuration.MOVIE && userTier === UserTier.FREE}>
                        {s} {s === VideoDuration.MOVIE && userTier === UserTier.FREE ? '(PRO)' : ''}
                    </option>
                    ))}
                </select>
                </div>
            </div>

            <div className="col-span-2 space-y-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{t.channelName}</label>
                <div className="relative">
                    <Youtube className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                    <input
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>
          </div>
        </div>

        {/* TTS & Advanced Settings */}
        <div className="space-y-6">
            <div className="space-y-4 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-2"><Mic className="w-4 h-4" /> Configurações de Voz Avançadas (TTS)</h3>
                
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        {t.narrator} {userTier === UserTier.FREE && <Lock className="w-3 h-3" />}
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {VOICE_OPTIONS.map(v => (
                        <button
                            key={v.id}
                            onClick={() => {
                            if (userTier === UserTier.PRO || v.id === 'Auto') setVoice(v.id);
                            else setShowUpgradeModal(true);
                            }}
                            className={`text-left px-3 py-2 rounded-lg text-xs border transition-all ${
                            voice === v.id
                                ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-indigo-700 dark:text-white'
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600'
                            } ${userTier === UserTier.FREE && v.id !== 'Auto' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {v.label}
                        </button>
                        ))}
                    </div>
                    {voice === 'Custom' && userTier === UserTier.PRO && (
                        <input type="text" value={customVoice} onChange={(e) => setCustomVoice(e.target.value)} placeholder="Nome da voz (ex: en-US-Studio-M)" className="w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none" />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2 block">Modelo TTS</label>
                        <select
                            value={ttsModel}
                            onChange={(e) => setTtsModel(e.target.value as GeminiTTSModel)}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none"
                        >
                            <option value="gemini-2.5-flash-preview-tts">Gemini 2.5 Flash (Rápido)</option>
                            <option value="gemini-2.5-pro-tts">Gemini 2.5 Pro (Qualidade Máxima - Preview)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2 block">Estilo de Fala Global (Acting Prompt)</label>
                        <input
                            type="text"
                            value={globalTtsStyle}
                            onChange={(e) => setGlobalTtsStyle(e.target.value)}
                            placeholder="Ex: Como um repórter animado com sotaque mineiro..."
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                    <span>{t.imageProvider}</span>
                    {imageProvider === ImageProvider.GEMINI && <span className="text-[10px] text-amber-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {t.quota}</span>}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                    { id: ImageProvider.GEMINI, label: '⚡ Gemini 2.5', sub: 'High Quality (Manual Only)' },
                    { id: ImageProvider.POLLINATIONS, label: '🎨 Pollinations.ai', sub: 'Turbo Model - Free' },
                    { id: ImageProvider.STOCK_VIDEO, label: '📹 Stock Video', sub: 'Real Footage (Pexels)' },
                    { id: ImageProvider.NONE, label: t.providerNone, sub: t.providerNoneSub }
                    ].map(p => (
                    <button
                        key={p.id}
                        onClick={() => setImageProvider(p.id as any)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                        imageProvider === p.id
                            ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                    >
                        <div className="text-left">
                        <div className={`font-bold text-sm ${imageProvider === p.id ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>{p.label}</div>
                        <div className={`text-xs ${imageProvider === p.id ? 'text-indigo-200' : 'text-zinc-500'}`}>{p.sub}</div>
                        </div>
                        {imageProvider === p.id && <CheckCircle2 className="w-5 h-5 text-white" />}
                    </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="pt-8 flex flex-col items-center gap-4">
          <button
            id="tour-generate-btn"
            onClick={handleGenerateVideo}
            disabled={isGenerating}
            className={`w-full md:w-auto group relative px-8 py-4 rounded-full font-black text-lg shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 ${
              duration === VideoDuration.MOVIE
                ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black'
                : 'bg-zinc-900 dark:bg-white text-white dark:text-black'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center gap-3 justify-center">
                <Loader2 className="w-6 h-6 animate-spin" /> {progress || t.generating}
              </span>
            ) : (
              <span className="flex items-center gap-3 justify-center">
                {duration === VideoDuration.MOVIE ? 'GERAR FILME (PRO)' : t.generateVideo}
                {duration === VideoDuration.MOVIE ? <Clapperboard className="w-6 h-6" /> : <Wand2 className="w-6 h-6 text-indigo-400 dark:text-indigo-600" />}
              </span>
            )}
          </button>
          
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span>ou</span>
            <button onClick={importClick} className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1">
                <FolderOpen className="w-4 h-4" /> Carregar Roteiro (JSON)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};