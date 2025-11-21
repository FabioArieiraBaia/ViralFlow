

import React, { useState, useRef, useEffect } from 'react';
import { VideoStyle, VideoDuration, Scene, VideoPacing, VideoFormat, VideoMetadata, SubtitleStyle, ImageProvider, Soundtrack, UserTier, VideoFilter, ParticleEffect, MusicAction, SceneMusicConfig, Language, Theme } from './types';
import { generateVideoScript, generateSpeech, generateSceneImage, generateThumbnails, generateMetadata, getApiKeyCount, saveManualKeys, getManualKeys, savePexelsKey, getPexelsKey } from './services/geminiService';
import { translations } from './services/translations';
import { getProjectDir, openProjectFolder, triggerBrowserDownload } from './services/fileSystem';
import VideoPlayer, { VideoPlayerRef } from './components/VideoPlayer';
import { Wand2, Video, Download, Loader2, Layers, Film, PlayCircle, Zap, Monitor, Music, Smartphone, Image as ImageIcon, Hash, Clock, Youtube, Captions, Type, Mic, Settings, AlertCircle, CheckCircle2, Save, Palette, StopCircle, RotateCcw, Volume2, Lock, Crown, Key, Copy, ShieldCheck, Edit2, RefreshCcw, X, Upload, FileImage, FileVideo, ZapIcon, Music2, Info, Sparkles, MoveRight, Globe, Sun, Moon } from 'lucide-react';

// --- CONFIGURAÇÃO DE VENDAS ---
const GUMROAD_PRODUCT_PERMALINK: string = 'viralflow'; 
const MASTER_KEY = 'ADMIN-TEST-KEY-2025'; 
const LICENSE_SALT = "VFLOW_SECRET_SIGNATURE_2025_X9";

const verifyLocalKey = (keyInput: string): boolean => {
    const key = keyInput.trim().toUpperCase();
    if (!key.startsWith('VFPRO-')) return false;

    const parts = key.split('-');
    if (parts.length !== 3) return false;

    const randomPart = parts[1];
    const providedSignature = parts[2];

    const signatureSource = randomPart + LICENSE_SALT;
    let hash = 0;
    for (let i = 0; i < signatureSource.length; i++) {
        const char = signatureSource.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; 
    }
    const expectedSignature = Math.abs(hash).toString(16).substring(0, 4).toUpperCase().padStart(4, '0');

    return providedSignature === expectedSignature;
};

const generateLicenseKey = (): string => {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const signatureSource = randomPart + LICENSE_SALT;
    let hash = 0;
    for (let i = 0; i < signatureSource.length; i++) {
        const char = signatureSource.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; 
    }
    const signature = Math.abs(hash).toString(16).substring(0, 4).toUpperCase().padStart(4, '0');
    return `VFPRO-${randomPart}-${signature}`;
};

const VOICE_OPTIONS = [
  { id: 'Auto', label: '🤖 Elenco Automático (Multi-Voz)' },
  { id: 'Fenrir', label: '🎙️ Fenrir (Masc. Épico)' },
  { id: 'Puck', label: '👩 Puck (Fem. Suave)' },
  { id: 'Kore', label: '🧬 Kore (Fem. Tech)' },
  { id: 'Charon', label: '💀 Charon (Masc. Grave)' },
  { id: 'Aoede', label: '🎭 Aoede (Fem. Dramática)' },
  { id: 'Zephyr', label: '🌬️ Zephyr (Masc. Calmo)' },
  { id: 'Custom', label: '✏️ Outra / Personalizada...' }
];

const STOCK_LIBRARY: Soundtrack[] = [
  {
    id: 'epic_orchestral',
    label: '🎻 Épico / Motivacional (Cinemático)',
    url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
    tags: [VideoStyle.MOTIVATIONAL, VideoStyle.HISTORY, VideoStyle.DOCUMENTARY, VideoStyle.STORY]
  },
  {
    id: 'dark_ambient',
    label: '👻 Terror / Suspense (Dark Ambient)',
    url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_9f1691fa33.mp3',
    tags: [VideoStyle.SCARY, VideoStyle.MYSTERY, VideoStyle.CURIOSITY]
  },
  {
    id: 'tech_synth',
    label: '🤖 Tech / Futurista (Synthwave)',
    url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73467.mp3',
    tags: [VideoStyle.TECH_NEWS, VideoStyle.CURIOSITY]
  },
  {
    id: 'lofi_chill',
    label: '☕ Relax / Lo-Fi (Natureza)',
    url: 'https://cdn.pixabay.com/audio/2022/05/05/audio_13dc87d091.mp3',
    tags: [VideoStyle.RELAX, VideoStyle.STORY, VideoStyle.MEME]
  },
  {
    id: 'upbeat_pop',
    label: '⚡ Dinâmico / Viral (Upbeat)',
    url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d46a3b4d8c.mp3',
    tags: [VideoStyle.MEME, VideoStyle.CURIOSITY, VideoStyle.TECH_NEWS]
  }
];

const getMusicForStyle = (style: VideoStyle): Soundtrack => {
    const match = STOCK_LIBRARY.find(t => t.tags.includes(style));
    return match || STOCK_LIBRARY[0];
};

const performAutoCasting = (scenes: Scene[]): Scene[] => {
  const uniqueSpeakers = Array.from(new Set(scenes.map(s => s.speaker)));
  const cast: Record<string, string> = {};

  const maleVoices = ['Fenrir', 'Charon', 'Zephyr'];
  const femaleVoices = ['Puck', 'Kore', 'Aoede'];
  let maleIdx = 0;
  let femaleIdx = 0;
  let neutralIdx = 0;
  
  uniqueSpeakers.forEach(speaker => {
     const lower = speaker.toLowerCase();
     let assigned = '';

     const isFemale = lower.match(/(mulher|woman|ela|rainha|queen|senhora|menina|girl|deusa|mae|chapeuzinho|maria|ana|julia|princesa|bruxa)/);
     const isMale = lower.match(/(homem|man|ele|rei|king|senhor|menino|boy|deus|pai|lobo|joao|pedro|general|soldado|principe|cacador)/);
     const isNarrator = lower.includes('narrador') || lower.includes('narrator');

     if (isNarrator) {
        assigned = 'Fenrir'; 
     } else if (isFemale) {
        assigned = femaleVoices[femaleIdx % femaleVoices.length];
        femaleIdx++;
     } else if (isMale) {
        assigned = maleVoices[maleIdx % maleVoices.length];
        maleIdx++;
     } else {
        const neutralVoices = [...maleVoices, ...femaleVoices];
        assigned = neutralVoices[neutralIdx % neutralVoices.length];
        neutralIdx++;
     }
     cast[speaker] = assigned;
  });

  return scenes.map(scene => ({
    ...scene,
    assignedVoice: cast[scene.speaker] || 'Fenrir'
  }));
};

// --- MODALS ---

const WelcomeModal: React.FC<{ onClose: () => void, lang: Language, t: any }> = ({ onClose, lang, t }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-lg p-6 animate-in fade-in duration-500">
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden text-center">
                
                <div className="mx-auto w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mb-6 border border-indigo-500/30">
                    <ShieldCheck className="w-8 h-8 text-indigo-400" />
                </div>

                <h2 className="text-3xl font-black text-white mb-4 tracking-tight">{t[lang].welcomeTitle}</h2>
                
                <div className="space-y-4 text-zinc-400 text-sm leading-relaxed">
                    <p>
                        <strong className="text-indigo-300">{t[lang].privacyNote}</strong> {t[lang].privacyDesc}
                    </p>
                    <p>
                        All processing happens <strong className="text-white">{t[lang].privacyLocal}</strong>.
                    </p>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-800/50">
                    <p className="text-xs text-zinc-500 mb-1">{t[lang].devBy}</p>
                    <a 
                        href="https://fabioarieira.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-lg font-bold text-white hover:text-indigo-400 transition-colors"
                    >
                        Fabio Arieira
                    </a>
                    <p className="text-[10px] text-zinc-600 mt-1">fabioarieira.com</p>
                </div>

                <button 
                    onClick={onClose}
                    className="mt-8 w-full py-3 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition-all transform hover:scale-[1.02]"
                >
                    {t[lang].understand}
                </button>
            </div>
        </div>
    );
};

const UpgradeModal: React.FC<{ onClose: () => void, onUpgrade: (key: string) => Promise<boolean>, lang: Language, t: any }> = ({ onClose, onUpgrade, lang, t }) => {
    const [key, setKey] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isValidating, setIsValidating] = useState(false);

    const handleVerify = async () => {
        if (!key) return;
        setIsValidating(true);
        setError('');
        const isValid = await onUpgrade(key);
        setIsValidating(false);
        if (isValid) {
            setSuccess(true);
            setTimeout(onClose, 2000);
        } else {
            setError(t[lang].invalidKey);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="bg-gradient-to-b from-zinc-900 to-black border border-amber-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500"></div>
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/50">
                        <Crown className="w-8 h-8 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">{t[lang].upgradeTitle}</h2>
                    <p className="text-zinc-400 text-sm">{t[lang].upgradeDesc}</p>
                </div>
                <div className="space-y-4">
                    <div className="flex gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span className="text-sm text-zinc-300">{t[lang].noWatermark}</span>
                    </div>
                    <div className="flex gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span className="text-sm text-zinc-300">{t[lang].durationLimit}</span>
                    </div>
                </div>
                <div className="mt-8">
                    <a href="https://fabioarise.gumroad.com/l/viralflow" target="_blank" rel="noopener noreferrer" className="block w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors text-center mb-4">
                        {t[lang].buyLicense}
                    </a>
                    
                    {!success ? (
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Key className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                <input 
                                    type="text" 
                                    placeholder={t[lang].pasteKey} 
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none"
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={handleVerify}
                                disabled={isValidating || !key}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                            >
                                {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : t[lang].activate}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-emerald-500/20 border border-emerald-500/50 p-3 rounded-lg text-emerald-400 text-sm font-medium text-center">
                            {t[lang].licenseActive}
                        </div>
                    )}
                    {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

const EditSceneModal: React.FC<{ 
    scene: Scene, 
    onClose: () => void, 
    onSave: (updatedScene: Scene) => void, 
    onRegenerateAsset: (scene: Scene, provider: ImageProvider) => Promise<any>,
    onRegenerateAudio: (scene: Scene) => Promise<any>,
    lang: Language,
    t: any
}> = ({ scene, onClose, onSave, onRegenerateAsset, onRegenerateAudio, lang, t }) => {
    const [localScene, setLocalScene] = useState<Scene>({...scene});
    const [activeTab, setActiveTab] = useState<'text'|'visual'|'audio'>('text');
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isRegeneratingAudio, setIsRegeneratingAudio] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<ImageProvider>(ImageProvider.GEMINI);

    // Music config state helper
    const [musicAction, setMusicAction] = useState<MusicAction>(localScene.musicConfig?.action || MusicAction.CONTINUE);
    const [musicTrackId, setMusicTrackId] = useState<string>(localScene.musicConfig?.trackId || 'none');
    const [musicVolume, setMusicVolume] = useState<number>(localScene.musicConfig?.volume ?? 0.2);

    useEffect(() => {
        // Sync music state back to localScene
        const config: SceneMusicConfig = {
            action: musicAction,
            trackId: musicTrackId,
            volume: musicVolume,
            customUrl: localScene.musicConfig?.customUrl
        };
        
        // If user chose a specific track, auto-set customUrl if it's in library
        const libTrack = STOCK_LIBRARY.find(t => t.id === musicTrackId);
        if (libTrack) config.customUrl = libTrack.url;

        setLocalScene(prev => ({ ...prev, musicConfig: config }));
    }, [musicAction, musicTrackId, musicVolume]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const isVideo = file.type.startsWith('video/');
            setLocalScene(prev => ({
                ...prev,
                mediaType: isVideo ? 'video' : 'image',
                imageUrl: isVideo ? prev.imageUrl : url, // Keep thumb if video
                videoUrl: isVideo ? url : undefined,
                visualPrompt: t[lang].manualUpload
            }));
        }
    };

    const handleRegenerateVisual = async () => {
        setIsRegenerating(true);
        try {
            const result = await onRegenerateAsset(localScene, selectedProvider);
            if (result.success) {
                setLocalScene(prev => ({
                    ...prev,
                    mediaType: result.mediaType,
                    imageUrl: result.imageUrl,
                    videoUrl: result.videoUrl,
                }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleRegenerateAudio = async () => {
        setIsRegeneratingAudio(true);
        try {
            const result = await onRegenerateAudio(localScene);
            if (result.success) {
                setLocalScene(prev => ({
                    ...prev,
                    audioUrl: result.url,
                    audioBuffer: result.buffer,
                    audioError: false // Clear error on success
                }));
            } else {
                alert(t[lang].audioError);
            }
        } catch (e) {
            console.error("Erro ao regenerar áudio", e);
        } finally {
            setIsRegeneratingAudio(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50">
                    <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Edit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> {t[lang].editScene}
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="flex gap-2 mb-4 bg-zinc-200 dark:bg-zinc-950 p-1 rounded-lg w-fit">
                        <button onClick={() => setActiveTab('text')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'text' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}>{t[lang].tabScript}</button>
                        <button onClick={() => setActiveTab('visual')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'visual' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}>{t[lang].tabVisual}</button>
                        <button onClick={() => setActiveTab('audio')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'audio' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}>{t[lang].tabAudio}</button>
                    </div>

                    {activeTab === 'text' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{t[lang].speaker}</label>
                                <input 
                                    value={localScene.speaker}
                                    onChange={(e) => setLocalScene({...localScene, speaker: e.target.value})}
                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{t[lang].subtitleText}</label>
                                <textarea 
                                    value={localScene.text}
                                    onChange={(e) => setLocalScene({...localScene, text: e.target.value})}
                                    rows={5}
                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
                                />
                            </div>
                             <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t[lang].voiceTTS}</span>
                                    {localScene.audioError ? (
                                         <span className="text-red-500 text-xs font-bold flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3"/> {t[lang].audioError}</span>
                                    ) : (
                                         <span className="text-emerald-500 text-xs font-bold flex items-center gap-1 mt-1"><CheckCircle2 className="w-3 h-3"/> {t[lang].audioSync}</span>
                                    )}
                                </div>
                                <button 
                                    onClick={handleRegenerateAudio}
                                    disabled={isRegeneratingAudio}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50 transition-colors ${localScene.audioError ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white'}`}
                                >
                                    {isRegeneratingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                                    {localScene.audioError ? t[lang].tryAgain : t[lang].regenerateVoice}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'visual' && (
                        <div className="space-y-6">
                            {/* PREVIEW AREA */}
                            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800 relative group">
                                {isRegenerating ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-indigo-400 gap-2 bg-zinc-950">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                        <span className="text-xs font-medium">Gerando...</span>
                                    </div>
                                ) : localScene.mediaType === 'video' && localScene.videoUrl ? (
                                    <video src={localScene.videoUrl} className="w-full h-full object-cover" autoPlay muted loop />
                                ) : (
                                    <img src={localScene.imageUrl} className="w-full h-full object-cover" />
                                )}
                                
                                {!isRegenerating && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <label className="cursor-pointer flex flex-col items-center gap-2 text-white hover:text-indigo-400 transition-colors">
                                            <Upload className="w-8 h-8" />
                                            <span className="text-xs font-medium">{t[lang].manualUpload}</span>
                                            <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                                        </label>
                                    </div>
                                )}
                            </div>
                            
                            {/* VFX Selector */}
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><Sparkles className="w-3 h-3"/> {t[lang].particlesVFX}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(ParticleEffect).map(([key, val]) => (
                                        <button
                                            key={key}
                                            onClick={() => setLocalScene(prev => ({...prev, particleEffect: val as ParticleEffect}))}
                                            className={`text-xs p-2 rounded-lg border transition-all ${localScene.particleEffect === val ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                             </div>

                            {/* GENERATION CONTROLS */}
                            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 shadow-sm">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{t[lang].regenerateMedia}</label>
                                <div className="flex gap-2">
                                    <select 
                                        value={selectedProvider}
                                        onChange={(e) => setSelectedProvider(e.target.value as ImageProvider)}
                                        className="bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 outline-none flex-1"
                                    >
                                        <option value={ImageProvider.GEMINI}>Gemini 2.5 (Cota)</option>
                                        <option value={ImageProvider.POLLINATIONS}>Pollinations (Free)</option>
                                        <option value={ImageProvider.STOCK_VIDEO}>Stock Video (Pexels)</option>
                                    </select>
                                    <button 
                                        onClick={handleRegenerateVisual}
                                        disabled={isRegenerating}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
                                    >
                                        {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ZapIcon className="w-4 h-4" />}
                                        {t[lang].generate}
                                    </button>
                                </div>
                                
                                <textarea 
                                    value={localScene.visualPrompt}
                                    onChange={(e) => setLocalScene({...localScene, visualPrompt: e.target.value})}
                                    rows={2}
                                    placeholder={t[lang].visualPrompt}
                                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-300 text-xs focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'audio' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Music2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                                    <h4 className="font-bold text-zinc-900 dark:text-white">{t[lang].sceneSoundtrack}</h4>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">{t[lang].behavior}</label>
                                        <div className="flex flex-col gap-2">
                                            {[MusicAction.CONTINUE, MusicAction.START_NEW, MusicAction.STOP].map(action => (
                                                <label key={action} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${musicAction === action ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'}`}>
                                                    <input 
                                                        type="radio" 
                                                        name="musicAction" 
                                                        checked={musicAction === action} 
                                                        onChange={() => setMusicAction(action)}
                                                        className="text-indigo-500 focus:ring-indigo-500"
                                                    />
                                                    <span className={`text-sm ${musicAction === action ? 'text-indigo-900 dark:text-white font-medium' : 'text-zinc-500 dark:text-zinc-400'}`}>{action}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {musicAction === MusicAction.START_NEW && (
                                        <div className="animate-in fade-in slide-in-from-top-2 space-y-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{t[lang].chooseTrack}</label>
                                                <select
                                                    value={musicTrackId}
                                                    onChange={(e) => setMusicTrackId(e.target.value)}
                                                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                                                >
                                                    <option value="none">Selecione...</option>
                                                    {STOCK_LIBRARY.map(track => (
                                                        <option key={track.id} value={track.id}>{track.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{t[lang].musicVolume} ({Math.round(musicVolume * 100)}%)</label>
                                                <input 
                                                    type="range" 
                                                    min="0" max="1" step="0.05"
                                                    value={musicVolume}
                                                    onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                                                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">{t[lang].cancel}</button>
                    <button onClick={() => onSave(localScene)} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 transition-colors">{t[lang].saveChanges}</button>
                </div>
            </div>
        </div>
    );
};

// --- APP MAIN ---

const App: React.FC = () => {
  // State
  const [lang, setLang] = useState<Language>('pt');
  const [theme, setTheme] = useState<Theme>('dark');
  
  const [topic, setTopic] = useState('Historia do Cafe');
  const [channelName, setChannelName] = useState('CuriosoTech');
  const [style, setStyle] = useState<VideoStyle>(VideoStyle.DOCUMENTARY);
  const [pacing, setPacing] = useState<VideoPacing>(VideoPacing.NORMAL);
  const [duration, setDuration] = useState<VideoDuration>(VideoDuration.SHORT);
  const [format, setFormat] = useState<VideoFormat>(VideoFormat.PORTRAIT);
  const [voice, setVoice] = useState('Auto');
  const [imageProvider, setImageProvider] = useState<ImageProvider>(ImageProvider.GEMINI);
  const [thumbProvider, setThumbProvider] = useState<ImageProvider>(ImageProvider.GEMINI);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>(SubtitleStyle.KARAOKE); 
  const [activeFilter, setActiveFilter] = useState<VideoFilter>(VideoFilter.NONE);
  
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  
  // Music State
  const [bgMusicUrl, setBgMusicUrl] = useState<string>("");
  const [bgMusicVolume, setBgMusicVolume] = useState<number>(0.15);
  const musicInputRef = useRef<HTMLInputElement>(null);

  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'create'|'preview'|'metadata'|'settings'>('create');
  const [apiKeyCount, setApiKeyCount] = useState(getApiKeyCount());
  const [manualKeys, setManualKeys] = useState(getManualKeys());
  const [pexelsKey, setPexelsKeyInput] = useState(getPexelsKey());
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [userTier, setUserTier] = useState<UserTier>(UserTier.FREE);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [userKey, setUserKey] = useState('');
  
  // Admin
  const [generatedAdminKey, setGeneratedAdminKey] = useState('');

  const cancelRef = useRef(false);
  const playerRef = useRef<VideoPlayerRef>(null);

  // Theme Effect
  useEffect(() => {
      if (theme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }, [theme]);

  useEffect(() => {
      const savedKey = localStorage.getItem('viralflow_pro_key');
      if (savedKey) {
          if (savedKey === MASTER_KEY || verifyLocalKey(savedKey)) {
             setUserTier(UserTier.PRO);
             setUserKey(savedKey);
          }
      }
  }, []);

  const handleUpgrade = async (key: string): Promise<boolean> => {
      if (key === MASTER_KEY || verifyLocalKey(key)) {
          setUserTier(UserTier.PRO);
          localStorage.setItem('viralflow_pro_key', key);
          setUserKey(key);
          return true;
      }
      return false;
  };

  const handleCloseWelcome = () => {
      setShowWelcomeModal(false);
      sessionStorage.setItem('viralflow_welcome_seen', 'true');
  };

  const handleSceneAssetRegeneration = async (scene: Scene, provider: ImageProvider): Promise<any> => {
      const index = scenes.findIndex(s => s.id === scene.id);
      const idx = index >= 0 ? index : 0;
      
      try {
          const result = await generateSceneImage(scene.visualPrompt, format, idx, topic, provider, style);
          return { ...result, success: true };
      } catch (e) {
          alert("Erro ao regenerar asset: " + e);
          return { success: false };
      }
  };

  const handleSceneAudioRegeneration = async (scene: Scene): Promise<any> => {
      const index = scenes.findIndex(s => s.id === scene.id);
      const idx = index >= 0 ? index : 0;
      
      try {
         const audioResult = await generateSpeech(
             scene.text, 
             scene.speaker, 
             scene.assignedVoice || 'Fenrir', 
             idx, 
             topic
         );
         return { ...audioResult, success: true };
      } catch (e) {
          console.error("Regeneration failed", e);
          return { success: false };
      }
  };

  const handleGenerateVideo = async () => {
    if (isGenerating) {
        cancelRef.current = true;
        return;
    }

    if (getApiKeyCount() === 0) {
        alert(translations[lang].pleaseConfig);
        setActiveTab('settings');
        return;
    }
    
    if (imageProvider === ImageProvider.STOCK_VIDEO && !pexelsKey) {
        alert(translations[lang].pleasePexels);
        setActiveTab('settings');
        return;
    }
    
    setIsGenerating(true);
    cancelRef.current = false;
    setScenes([]);
    setProgress(translations[lang].initializing);
    setActiveTab('preview'); // Switch immediately to show Loading screen

    try {
      // 1. Script
      setProgress(translations[lang].writingScript);
      const durMinutes = duration === VideoDuration.SHORT ? 0.8 : (duration === VideoDuration.MEDIUM ? 3 : 8);
      
      // PASS LANG HERE
      const rawScript = await generateVideoScript(topic, style, durMinutes, pacing, channelName, lang, () => cancelRef.current);
      
      let newScenes: Scene[] = rawScript.map((item, idx) => ({
        id: `scene-${idx}`,
        speaker: item.speaker,
        text: item.text,
        visualPrompt: item.visual_prompt,
        durationEstimate: Math.max(3, item.text.split(' ').length * 0.4), 
        mediaType: 'image',
        imageUrl: '', // Placeholder
        isGeneratingImage: true,
        isGeneratingAudio: true,
        audioError: false
      }));

      if (voice === 'Auto') {
         newScenes = performAutoCasting(newScenes);
      } else {
         newScenes = newScenes.map(s => ({ ...s, assignedVoice: voice }));
      }

      setScenes(newScenes);
      
      // Set initial music based on style
      const defaultMusic = getMusicForStyle(style);
      setBgMusicUrl(defaultMusic.url);

      // 2. Parallel Generation Loop
      for (let i = 0; i < newScenes.length; i++) {
        if (cancelRef.current) throw new Error("Cancelled");
        
        setProgress(`${translations[lang].producingScene} ${i + 1} / ${newScenes.length}...`);
        
        const scene = newScenes[i];
        
        const audioPromise = generateSpeech(scene.text, scene.speaker, scene.assignedVoice || 'Fenrir', i, topic, () => cancelRef.current)
            .then(audio => ({ ...audio, success: true }))
            .catch(e => {
                console.error(`Audio error scene ${i}:`, e);
                return { url: '', buffer: undefined, success: false };
            });

        const imagePromise = generateSceneImage(scene.visualPrompt, format, i, topic, imageProvider, style, () => cancelRef.current)
            .then(img => ({ ...img, success: true }))
            .catch(e => {
                console.error(`Image error scene ${i}:`, e);
                return { imageUrl: '', mediaType: 'image' as const, success: false, videoUrl: undefined };
            });

        const [audioResult, imageResult] = await Promise.all([audioPromise, imagePromise]);

        setScenes(prev => {
            const updated = [...prev];
            updated[i] = {
                ...updated[i],
                audioUrl: audioResult.success ? audioResult.url : undefined,
                audioBuffer: audioResult.success ? audioResult.buffer : undefined,
                audioError: !audioResult.success,
                imageUrl: imageResult.success ? imageResult.imageUrl : "https://placehold.co/1280x720/333/FFF.png?text=Error+Generating+Image", 
                videoUrl: imageResult.videoUrl,
                mediaType: imageResult.mediaType,
                isGeneratingAudio: false,
                isGeneratingImage: false
            };
            return updated;
        });
      }
      
      setProgress(translations[lang].renderComplete);
      
      generateMetadata(topic, JSON.stringify(rawScript), () => cancelRef.current).then(setMetadata).catch(console.error);
      generateThumbnails(topic, style, thumbProvider, () => cancelRef.current).then(setThumbnails).catch(console.error);
      
      setIsPlaying(true);

    } catch (error: any) {
      if (error.message === "Cancelled" || error.message === "CANCELLED_BY_USER") {
          setProgress(translations[lang].cancelGen);
      } else {
          console.error(error);
          alert(`${translations[lang].errorGen} ${error.message}`);
          setProgress(translations[lang].fatalError);
      }
    } finally {
      setIsGenerating(false);
      cancelRef.current = false;
    }
  };

  const updateKeys = (val: string) => {
      setManualKeys(val);
      saveManualKeys(val);
      setApiKeyCount(getApiKeyCount());
  };

  const updatePexelsKey = (val: string) => {
      setPexelsKeyInput(val);
      savePexelsKey(val);
  };

  const saveSceneUpdate = (updated: Scene) => {
      setScenes(prev => prev.map(s => s.id === updated.id ? updated : s));
      setEditingScene(null);
  };

  const regenerateSceneAsset = async (index: number, type: 'image'|'audio') => {
      const scene = scenes[index];
      if (!scene) return;

      if (type === 'image') {
          setScenes(curr => {
             const up = [...curr];
             up[index].isGeneratingImage = true;
             return up;
          });
          try {
             const res = await generateSceneImage(scene.visualPrompt, format, index, topic, imageProvider, style);
             setScenes(curr => {
                 const up = [...curr];
                 up[index] = { ...up[index], imageUrl: res.imageUrl, videoUrl: res.videoUrl, mediaType: res.mediaType, isGeneratingImage: false };
                 return up;
             });
          } catch (e) {
             alert("Erro ao regenerar imagem.");
             setScenes(curr => { curr[index].isGeneratingImage = false; return [...curr]; });
          }
      }
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          setBgMusicUrl(url);
      }
  };

  const handleMusicSelection = (val: string) => {
      if (val === 'upload') {
          musicInputRef.current?.click();
      } else if (val === 'none') {
          setBgMusicUrl("");
      } else {
          const track = STOCK_LIBRARY.find(t => t.id === val);
          if (track) setBgMusicUrl(track.url);
      }
  };

  const currentMusicId = STOCK_LIBRARY.find(t => t.url === bgMusicUrl)?.id || (bgMusicUrl ? 'custom' : 'none');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500/30 flex flex-col overflow-hidden transition-colors duration-300">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white">ViralFlow <span className="text-indigo-600 dark:text-indigo-400">AI</span></h1>
            {userTier === UserTier.FREE ? (
                <span onClick={() => setShowUpgradeModal(true)} className="cursor-pointer px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">{translations[lang].free}</span>
            ) : (
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 border border-amber-400/50 text-[10px] font-bold text-black shadow-sm">{translations[lang].pro}</span>
            )}
        </div>

        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
            {[
                {id: 'create', label: translations[lang].tabCreate, icon: Wand2},
                {id: 'preview', label: translations[lang].tabEditor, icon: Film},
                {id: 'metadata', label: translations[lang].tabMeta, icon: Hash},
                {id: 'settings', label: translations[lang].tabConfig, icon: Settings},
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                >
                    <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
            ))}
        </div>

        <div className="flex items-center gap-4">
            
            {/* Language & Theme Toggles */}
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setLang(prev => prev === 'pt' ? 'en' : prev === 'en' ? 'es' : 'pt')} 
                    className="px-3 py-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800"
                >
                    <span className="font-bold text-xs text-zinc-600 dark:text-zinc-300">{lang.toUpperCase()}</span>
                </button>
                <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                     {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>
            </div>

            <div className="flex flex-col items-end">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{translations[lang].activeKeys}</span>
                <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${apiKeyCount > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">{apiKeyCount}</span>
                </div>
            </div>
            <button onClick={() => setShowUpgradeModal(true)} className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg hover:shadow-amber-500/20 flex items-center gap-2">
                <Crown className="w-4 h-4" /> {userTier === UserTier.FREE ? translations[lang].upgradeBtn : translations[lang].licenseActiveBtn}
            </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative flex">
        
        {/* CREATE TAB */}
        {activeTab === 'create' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="text-center space-y-4 py-8">
                         <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{translations[lang].whatCreate}</h2>
                         <p className="text-zinc-500 dark:text-zinc-400 text-lg">{translations[lang].appDesc}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* COLUMN 1 */}
                        <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].videoTopic}</label>
                                <textarea 
                                    value={topic} 
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-lg text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-sm dark:shadow-inner"
                                    placeholder={translations[lang].topicPlaceholder}
                                    rows={3}
                                />
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].visualStyle}</label>
                                    <select value={style} onChange={(e) => setStyle(e.target.value as VideoStyle)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none">
                                        {Object.values(VideoStyle).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].pacing}</label>
                                    <select value={pacing} onChange={(e) => setPacing(e.target.value as VideoPacing)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none">
                                        {Object.values(VideoPacing).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].format}</label>
                                    <div className="grid grid-cols-2 gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                        <button onClick={() => setFormat(VideoFormat.PORTRAIT)} className={`flex flex-col items-center gap-1 p-2 rounded-md transition-all ${format === VideoFormat.PORTRAIT ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}>
                                            <Smartphone className="w-4 h-4" /> <span className="text-xs font-bold">Shorts</span>
                                        </button>
                                        <button onClick={() => setFormat(VideoFormat.LANDSCAPE)} className={`flex flex-col items-center gap-1 p-2 rounded-md transition-all ${format === VideoFormat.LANDSCAPE ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}>
                                            <Monitor className="w-4 h-4" /> <span className="text-xs font-bold">Vídeo</span>
                                        </button>
                                    </div>
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].duration}</label>
                                    <select value={duration} onChange={(e) => setDuration(e.target.value as VideoDuration)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none">
                                        {Object.values(VideoDuration).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                 </div>
                             </div>
                        </div>

                        {/* COLUMN 2 */}
                        <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].channelName}</label>
                                <div className="relative">
                                    <Youtube className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                                    <input 
                                        value={channelName}
                                        onChange={(e) => setChannelName(e.target.value)}
                                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                             </div>

                             <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].narrator}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {VOICE_OPTIONS.map(v => (
                                        <button 
                                            key={v.id} 
                                            onClick={() => setVoice(v.id)}
                                            className={`text-left px-3 py-2 rounded-lg text-xs border transition-all ${voice === v.id ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-indigo-700 dark:text-white' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
                                        >
                                            {v.label}
                                        </button>
                                    ))}
                                </div>
                             </div>

                             <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                                    {translations[lang].imageProvider}
                                    {imageProvider === ImageProvider.GEMINI && <span className="text-[10px] text-amber-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {translations[lang].quota}</span>}
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        {id: ImageProvider.GEMINI, label: '✨ Gemini 2.5', sub: 'High Quality'},
                                        {id: ImageProvider.POLLINATIONS, label: '🎨 Pollinations.ai', sub: 'Flux Model - Free'},
                                        {id: ImageProvider.STOCK_VIDEO, label: '🎥 Stock Video', sub: 'Real Footage (Pexels)'},
                                    ].map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setImageProvider(p.id as ImageProvider)}
                                            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${imageProvider === p.id ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
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
                    </div>

                    <div className="pt-8 flex justify-center">
                        <button 
                            onClick={handleGenerateVideo}
                            disabled={isGenerating}
                            className="group relative px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full font-black text-lg shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                        >
                           {isGenerating ? (
                               <span className="flex items-center gap-3"><Loader2 className="w-6 h-6 animate-spin" /> {translations[lang].generating} {progress && '...'}</span>
                           ) : (
                               <span className="flex items-center gap-3">{translations[lang].generateVideo} <Wand2 className="w-6 h-6 text-indigo-400 dark:text-indigo-600" /></span>
                           )}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-2xl mx-auto space-y-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Settings className="w-6 h-6"/> {translations[lang].settings}</h2>

                    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
                         <div className="flex items-center justify-between">
                             <div>
                                 <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{translations[lang].keysTitle}</h3>
                                 <p className="text-zinc-500 dark:text-zinc-400 text-sm">{translations[lang].keysDesc}</p>
                             </div>
                             <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono text-zinc-600 dark:text-zinc-300">{apiKeyCount} {translations[lang].activeKeys}</div>
                         </div>
                         <textarea 
                            value={manualKeys}
                            onChange={(e) => updateKeys(e.target.value)}
                            className="w-full h-32 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 font-mono text-xs text-zinc-600 dark:text-zinc-300 focus:border-indigo-500 outline-none"
                            placeholder="AIzaSy..., AIzaSy..."
                         />
                         <div className="flex justify-end">
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-indigo-500 dark:text-indigo-400 text-xs hover:underline flex items-center gap-1">{translations[lang].getKey} <ExternalLinkIcon /></a>
                         </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
                         <div>
                             <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{translations[lang].pexelsTitle}</h3>
                             <p className="text-zinc-500 dark:text-zinc-400 text-sm">{translations[lang].pexelsDesc}</p>
                         </div>
                         <input 
                            type="text"
                            value={pexelsKey}
                            onChange={(e) => updatePexelsKey(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 font-mono text-sm text-zinc-900 dark:text-white focus:border-indigo-500 outline-none"
                            placeholder="..."
                         />
                    </div>
                    
                    <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/30 flex gap-4 items-start">
                        <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-1" />
                        <div>
                            <h4 className="font-bold text-indigo-900 dark:text-indigo-200">{translations[lang].localSecurity}</h4>
                            <p className="text-xs text-indigo-700 dark:text-indigo-300/80 mt-1">{translations[lang].localSecDesc}</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* PREVIEW / EDITOR TAB */}
        {activeTab === 'preview' && (
             scenes.length > 0 ? (
                <div className="flex-1 flex flex-col md:flex-row h-full">
                    {/* LEFT: PLAYER */}
                    <div className="w-full md:w-1/2 lg:w-2/5 bg-zinc-100 dark:bg-black flex items-center justify-center p-6 border-r border-zinc-200 dark:border-zinc-800 relative">
                        <div className="w-full max-w-[400px]">
                            <VideoPlayer 
                                ref={playerRef}
                                scenes={scenes}
                                currentSceneIndex={currentSceneIndex}
                                setCurrentSceneIndex={setCurrentSceneIndex}
                                isPlaying={isPlaying}
                                setIsPlaying={setIsPlaying}
                                format={format}
                                bgMusicUrl={bgMusicUrl}
                                bgMusicVolume={bgMusicVolume}
                                showSubtitles={showSubtitles}
                                subtitleStyle={subtitleStyle}
                                activeFilter={activeFilter}
                                userTier={userTier}
                                onPlaybackComplete={() => setIsPlaying(false)}
                            />
                            
                            {/* Quick Controls */}
                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => playerRef.current?.startRecording()}
                                    className="flex items-center justify-center gap-2 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-colors"
                                >
                                    <div className="w-3 h-3 rounded-full bg-white"></div> {translations[lang].recExport}
                                </button>
                                
                                {/* Subtitle Style Selector */}
                                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-lg px-3 border border-zinc-200 dark:border-zinc-800">
                                    <Captions className="w-4 h-4 text-zinc-400" />
                                    <select 
                                        value={subtitleStyle} 
                                        onChange={(e) => setSubtitleStyle(e.target.value as SubtitleStyle)}
                                        className="bg-transparent text-xs text-zinc-900 dark:text-white outline-none flex-1 py-3 cursor-pointer"
                                    >
                                        {Object.values(SubtitleStyle).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                {/* Video Filter Selector */}
                                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-lg px-3 border border-zinc-200 dark:border-zinc-800 col-span-2">
                                    <Sparkles className="w-4 h-4 text-zinc-400" />
                                    <select 
                                        value={activeFilter} 
                                        onChange={(e) => setActiveFilter(e.target.value as VideoFilter)}
                                        className="bg-transparent text-xs text-zinc-900 dark:text-white outline-none flex-1 py-3 cursor-pointer"
                                    >
                                        {Object.values(VideoFilter).map(s => <option key={s} value={s}>Filtro: {s}</option>)}
                                    </select>
                                </div>

                                <div className="col-span-2 flex items-center justify-center gap-2 mt-1">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={showSubtitles} 
                                            onChange={(e) => setShowSubtitles(e.target.checked)} 
                                            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        {translations[lang].showSub}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: TIMELINE & ASSETS */}
                    <div className="flex-1 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden">
                        
                        {/* MUSIC & ATMOSPHERE CONTROL PANEL */}
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-3">
                            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 text-sm">
                                <Music2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> {translations[lang].tabAudio}
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
                                {/* Music Selector */}
                                <div className="relative">
                                    <select
                                        value={currentMusicId}
                                        onChange={(e) => handleMusicSelection(e.target.value)}
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-3 pr-8 py-2 text-xs text-zinc-900 dark:text-white appearance-none focus:ring-1 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="none">🔇 Sem Música (Global)</option>
                                        {STOCK_LIBRARY.map(track => (
                                            <option key={track.id} value={track.id}>🎵 {track.label}</option>
                                        ))}
                                        <option value="upload">📂 Upload Próprio...</option>
                                        {currentMusicId === 'custom' && <option value="custom" disabled>Arquivo Carregado</option>}
                                    </select>
                                    <div className="absolute right-3 top-2.5 pointer-events-none">
                                        <Volume2 className="w-3 h-3 text-zinc-500" />
                                    </div>
                                </div>

                                {/* Volume Control */}
                                <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2">
                                    <Volume2 className="w-4 h-4 text-zinc-400 shrink-0" />
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="1" 
                                        step="0.05" 
                                        value={bgMusicVolume}
                                        onChange={(e) => setBgMusicVolume(parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 w-8 text-right">{Math.round(bgMusicVolume * 100)}%</span>
                                </div>
                            </div>
                            
                            {/* Hidden File Input */}
                            <input 
                                type="file" 
                                ref={musicInputRef}
                                onChange={handleMusicUpload}
                                accept="audio/*"
                                className="hidden" 
                            />
                        </div>

                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Layers className="w-4 h-4" /> {translations[lang].timeline} ({scenes.length})</h3>
                            <div className="flex gap-2">
                                 <button onClick={() => setActiveTab('metadata')} className="text-xs bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-3 py-1.5 rounded-lg transition-colors">{translations[lang].viewMeta}</button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {scenes.map((scene, idx) => (
                                <div 
                                    key={scene.id} 
                                    onClick={() => { setCurrentSceneIndex(idx); setIsPlaying(false); }}
                                    className={`group relative flex gap-4 p-3 rounded-xl border transition-all cursor-pointer ${idx === currentSceneIndex ? 'bg-zinc-100 dark:bg-zinc-800 border-indigo-500 shadow-lg shadow-indigo-500/10' : 'bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'} ${scene.audioError ? 'border-red-500/50 bg-red-50 dark:bg-red-900/10' : ''}`}
                                >
                                    {/* THUMBNAIL */}
                                    <div className="w-24 aspect-video bg-zinc-200 dark:bg-black rounded-lg overflow-hidden relative shrink-0 border border-zinc-300 dark:border-zinc-700">
                                        {scene.isGeneratingImage ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
                                        ) : scene.mediaType === 'video' && scene.videoUrl ? (
                                             <video src={scene.videoUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={scene.imageUrl || "https://placehold.co/100x100/111/333"} className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute bottom-1 right-1 bg-black/80 text-[8px] text-white px-1 rounded">{scene.durationEstimate.toFixed(1)}s</div>
                                        
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); regenerateSceneAsset(idx, 'image'); }}
                                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Regenerar Visual"
                                        >
                                            <RefreshCcw className="w-5 h-5 text-white hover:text-indigo-400 hover:rotate-180 transition-all duration-500" />
                                        </button>
                                    </div>

                                    {/* CONTENT */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{scene.speaker} ({scene.assignedVoice})</span>
                                            <div className="flex gap-1">
                                                <button onClick={(e) => { e.stopPropagation(); setEditingScene(scene); }} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><Edit2 className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">"{scene.text}"</p>
                                        
                                        {/* META INFO */}
                                        <div className="mt-2 flex flex-wrap items-center gap-3">
                                            {scene.isGeneratingAudio ? (
                                                 <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Gerando...</span>
                                            ) : scene.audioError ? (
                                                <span className="text-[10px] text-red-500 flex items-center gap-1 font-bold"><AlertCircle className="w-3 h-3"/> Error</span>
                                            ) : (
                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-500 flex items-center gap-1"><Volume2 className="w-3 h-3"/> OK</span>
                                            )}

                                            {scene.particleEffect && scene.particleEffect !== ParticleEffect.NONE && (
                                                <span className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 bg-blue-100 dark:bg-blue-400/10 px-1.5 py-0.5 rounded"><Sparkles className="w-3 h-3"/> {scene.particleEffect}</span>
                                            )}
                                            
                                            {scene.musicConfig && scene.musicConfig.action === MusicAction.START_NEW && (
                                                 <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-100 dark:bg-amber-400/10 px-1.5 py-0.5 rounded"><Music2 className="w-3 h-3"/> Nova Faixa</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center h-full bg-zinc-50 dark:bg-black p-8 text-center space-y-6">
                    {isGenerating ? (
                        <>
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                                <Loader2 className="w-16 h-16 text-indigo-600 dark:text-indigo-400 animate-spin relative z-10" />
                            </div>
                            <div className="space-y-2 max-w-md">
                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white animate-pulse">{translations[lang].loadingVideo}</h2>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-mono">{progress || translations[lang].loadingDesc}</p>
                                
                                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-4 relative">
                                    <div className="absolute top-0 left-0 h-full w-1/2 bg-indigo-600 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-20"></div>
                                    <div className="absolute top-0 left-0 h-full w-1/3 bg-indigo-600 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
                                </div>
                            </div>
                            <button onClick={() => cancelRef.current = true} className="text-red-500 text-xs hover:underline mt-4">
                                {translations[lang].cancel}
                            </button>
                        </>
                    ) : (
                        <div className="text-zinc-500 dark:text-zinc-400">
                            <Film className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>{translations[lang].noScenesYet}</p>
                            <button onClick={() => setActiveTab('create')} className="mt-4 text-indigo-500 hover:underline">
                                {translations[lang].tabCreate}
                            </button>
                        </div>
                    )}
                </div>
             )
        )}

        {/* METADATA & EXPORT TAB */}
        {activeTab === 'metadata' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Hash className="w-5 h-5" /> {translations[lang].seoOptimized}</h3>
                            
                            {metadata ? (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500 dark:text-zinc-500 font-bold uppercase">{translations[lang].title}</label>
                                        <div className="bg-zinc-100 dark:bg-black p-3 rounded-lg text-zinc-900 dark:text-white font-medium border border-zinc-200 dark:border-zinc-800 flex justify-between items-center group">
                                            {metadata.title}
                                            <Copy className="w-4 h-4 text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigator.clipboard.writeText(metadata.title)} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500 dark:text-zinc-500 font-bold uppercase">{translations[lang].description}</label>
                                        <div className="bg-zinc-100 dark:bg-black p-3 rounded-lg text-zinc-700 dark:text-zinc-300 text-sm border border-zinc-200 dark:border-zinc-800 h-32 overflow-y-auto whitespace-pre-wrap relative group">
                                            {metadata.description}
                                            <Copy className="absolute top-2 right-2 w-4 h-4 text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-100 dark:bg-black" onClick={() => navigator.clipboard.writeText(metadata.description)} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500 dark:text-zinc-500 font-bold uppercase">{translations[lang].tags}</label>
                                        <div className="flex flex-wrap gap-2">
                                            {metadata.tags.map(tag => (
                                                <span key={tag} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-md">#{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-zinc-600">
                                    {isGenerating ? <Loader2 className="w-8 h-8 animate-spin" /> : "Gere o vídeo para ver os metadados."}
                                </div>
                            )}
                         </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
                             <div className="flex justify-between items-center">
                                 <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2"><ImageIcon className="w-5 h-5" /> {translations[lang].suggestedThumbs}</h3>
                                 <select value={thumbProvider} onChange={(e) => setThumbProvider(e.target.value as ImageProvider)} className="bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 outline-none">
                                     <option value={ImageProvider.GEMINI}>Gemini</option>
                                     <option value={ImageProvider.POLLINATIONS}>Pollinations</option>
                                     <option value={ImageProvider.STOCK_VIDEO}>Stock (Pexels)</option>
                                 </select>
                             </div>
                             
                             <div className="grid grid-cols-1 gap-4">
                                 {thumbnails.length > 0 ? thumbnails.map((thumb, i) => (
                                     <div key={i} className="aspect-video bg-zinc-100 dark:bg-black rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 group relative">
                                         <img src={thumb} className="w-full h-full object-cover" />
                                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                             <button onClick={() => triggerBrowserDownload(dataURItoBlob(thumb), `thumbnail_${i}.png`)} className="p-2 bg-white text-black rounded-full hover:scale-110 transition-transform"><Download className="w-5 h-5" /></button>
                                         </div>
                                     </div>
                                 )) : (
                                    <div className="h-48 bg-zinc-100 dark:bg-black/30 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-600 text-sm border border-dashed border-zinc-300 dark:border-zinc-800">
                                        Aguardando geração...
                                    </div>
                                 )}
                             </div>
                             {thumbnails.length > 0 && (
                                 <button onClick={() => generateThumbnails(topic, style, thumbProvider).then(setThumbnails)} className="w-full py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center gap-2">
                                     <RefreshCcw className="w-3 h-3" /> {translations[lang].regenerateThumbs}
                                 </button>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        )}

      </main>

      {showWelcomeModal && <WelcomeModal onClose={handleCloseWelcome} lang={lang} t={translations} />}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} onUpgrade={handleUpgrade} lang={lang} t={translations} />}
      {editingScene && <EditSceneModal scene={editingScene} onClose={() => setEditingScene(null)} onSave={saveSceneUpdate} onRegenerateAsset={handleSceneAssetRegeneration} onRegenerateAudio={handleSceneAudioRegeneration} lang={lang} t={translations} />}

    </div>
  );
};

const ExternalLinkIcon = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;

function dataURItoBlob(dataURI: string) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], {type: mimeString});
}

export default App;