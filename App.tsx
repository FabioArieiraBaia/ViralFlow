import React, { useState, useRef, useEffect } from 'react';
import { VideoStyle, VideoDuration, Scene, VideoPacing, VideoFormat, VideoMetadata, SubtitleStyle, ImageProvider, Soundtrack, UserTier, VideoFilter, ParticleEffect, MusicAction, SceneMusicConfig, Language, Theme, OverlayConfig, VideoTransition } from './types';
import { generateVideoScript, generateSpeech, generateSceneImage, generateThumbnails, generateMetadata, getApiKeyCount, saveManualKeys, getManualKeys, savePexelsKey, getPexelsKey } from './services/geminiService';
import { translations } from './services/translations';
import { getProjectDir, openProjectFolder, triggerBrowserDownload } from './services/fileSystem';
import VideoPlayer, { VideoPlayerRef } from './components/VideoPlayer';
import OnboardingTour, { TourStep } from './components/OnboardingTour';
import { Wand2, Video, Download, Loader2, Layers, Film, PlayCircle, Zap, Monitor, Music, Smartphone, Image as ImageIcon, Hash, Clock, Youtube, Captions, Type, Mic, Settings, AlertCircle, CheckCircle2, Save, Palette, StopCircle, RotateCcw, Volume2, Lock, Crown, Key, Copy, ShieldCheck, Edit2, RefreshCcw, X, Upload, FileImage, FileVideo, ZapIcon, Music2, Info, Sparkles, MoveRight, Globe, Sun, Moon, FileAudio, TriangleAlert, Sticker, ImagePlus, MousePointer2, ArrowRightLeft, HelpCircle } from 'lucide-react';

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
    userTier: UserTier,
    t: any
}> = ({ scene, onClose, onSave, onRegenerateAsset, onRegenerateAudio, lang, userTier, t }) => {
    const [localScene, setLocalScene] = useState<Scene>({...scene});
    const [activeTab, setActiveTab] = useState<'text'|'visual'|'audio'>('text');
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isRegeneratingAudio, setIsRegeneratingAudio] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<ImageProvider>(ImageProvider.GEMINI);

    // Music config state helper
    const [musicAction, setMusicAction] = useState<MusicAction>(localScene.musicConfig?.action || MusicAction.CONTINUE);
    const [musicTrackId, setMusicTrackId] = useState<string>(localScene.musicConfig?.trackId || 'none');
    const [musicVolume, setMusicVolume] = useState<number>(localScene.musicConfig?.volume ?? 0.2);
    const [customAudioFile, setCustomAudioFile] = useState<string | undefined>(localScene.musicConfig?.customUrl);
    const [uploadedFileName, setUploadedFileName] = useState<string>('');

    const musicFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Sync music state back to localScene
        const config: SceneMusicConfig = {
            action: musicAction,
            trackId: musicTrackId,
            volume: musicVolume,
            customUrl: musicTrackId === 'custom' ? customAudioFile : localScene.musicConfig?.customUrl
        };
        
        setLocalScene(prev => ({ ...prev, musicConfig: config }));
    }, [musicAction, musicTrackId, musicVolume, customAudioFile]);

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

    const handleOverlayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setLocalScene(prev => ({
                ...prev,
                overlay: {
                    url,
                    x: 0.5, // Center
                    y: 0.5,
                    scale: 1.0
                }
            }));
        }
    };

    const handleMusicFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCustomAudioFile(url);
            setUploadedFileName(file.name);
            setMusicTrackId('custom');
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
                            
                            {/* PRO: SCENE OVERLAY */}
                            <div className={`p-4 rounded-lg border ${userTier === UserTier.PRO ? 'border-amber-500/30 bg-amber-500/5' : 'border-zinc-200 dark:border-zinc-800 opacity-70'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
                                        <ImagePlus className="w-4 h-4" /> {t[lang].sceneOverlay}
                                    </label>
                                    {userTier === UserTier.FREE && <Lock className="w-3 h-3 text-zinc-500" />}
                                </div>
                                {userTier === UserTier.PRO ? (
                                    <div className="flex items-center gap-4">
                                        {localScene.overlay ? (
                                            <div className="flex items-center gap-3 flex-1">
                                                 <img src={localScene.overlay.url} className="w-10 h-10 object-contain bg-black/20 rounded" />
                                                 <div className="flex-1 text-xs text-zinc-500">
                                                     {t[lang].dragToMove}
                                                 </div>
                                                 <button onClick={() => setLocalScene(prev => ({...prev, overlay: undefined}))} className="text-red-500 hover:bg-red-100 p-1 rounded"><X className="w-4 h-4"/></button>
                                            </div>
                                        ) : (
                                            <label className="flex-1 cursor-pointer border border-dashed border-amber-500/30 rounded-lg p-3 text-center hover:bg-amber-500/10 transition-colors">
                                                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Upload PNG (Overlay)</span>
                                                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleOverlayUpload} />
                                            </label>
                                        )}
                                        {localScene.overlay && (
                                            <button 
                                                onClick={() => setLocalScene(prev => ({...prev, overlay: prev.overlay ? { ...prev.overlay, x: 0.5, y: 0.5, scale: 1.0 } : undefined}))}
                                                className="text-xs text-zinc-500 underline"
                                            >
                                                {t[lang].resetPos}
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-zinc-500">{t[lang].onlyPro}</p>
                                )}
                            </div>

                             {/* PRO: SCENE TRANSITION */}
                             <div className={`p-4 rounded-lg border ${userTier === UserTier.PRO ? 'border-amber-500/30 bg-amber-500/5' : 'border-zinc-200 dark:border-zinc-800 opacity-70'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
                                        <ArrowRightLeft className="w-4 h-4" /> {t[lang].sceneTrans}
                                    </label>
                                    {userTier === UserTier.FREE && <Lock className="w-3 h-3 text-zinc-500" />}
                                </div>
                                <select 
                                    value={localScene.transition || VideoTransition.NONE}
                                    onChange={(e) => setLocalScene(prev => ({...prev, transition: e.target.value as VideoTransition}))}
                                    disabled={userTier === UserTier.FREE}
                                    className="w-full bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 outline-none disabled:opacity-50"
                                >
                                    {Object.values(VideoTransition).map(tr => (
                                        <option key={tr} value={tr}>{tr}</option>
                                    ))}
                                </select>
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
                                                    <option value="custom">{t[lang].customAudio}</option>
                                                </select>
                                            </div>

                                            {musicTrackId === 'custom' && (
                                                <div className="bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-4 text-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer" onClick={() => musicFileInputRef.current?.click()}>
                                                    <div className="flex flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400">
                                                        <FileAudio className="w-8 h-8 text-indigo-500" />
                                                        <span className="text-xs font-medium">{uploadedFileName || t[lang].uploadAudioTip}</span>
                                                    </div>
                                                    <input 
                                                        type="file" 
                                                        ref={musicFileInputRef} 
                                                        onChange={handleMusicFileUpload} 
                                                        accept="audio/*" 
                                                        className="hidden" 
                                                    />
                                                    {customAudioFile && <div className="mt-2 text-[10px] text-emerald-500 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3"/> {t[lang].fileUploaded}</div>}
                                                </div>
                                            )}
                                            
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
  const [globalTransition, setGlobalTransition] = useState<VideoTransition>(VideoTransition.NONE);
  
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  
  // Music State
  const [bgMusicUrl, setBgMusicUrl] = useState<string>("");
  const [bgMusicVolume, setBgMusicVolume] = useState<number>(0.15);
  const musicInputRef = useRef<HTMLInputElement>(null);

  // Branding State
  const [channelLogo, setChannelLogo] = useState<OverlayConfig | undefined>(undefined);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
  
  // INITIALIZE WELCOME MODAL BASED ON SESSION
  const [showWelcomeModal, setShowWelcomeModal] = useState(!sessionStorage.getItem('viralflow_welcome_seen'));
  const [userKey, setUserKey] = useState('');
  
  // Admin
  const [generatedAdminKey, setGeneratedAdminKey] = useState('');

  const cancelRef = useRef(false);
  const playerRef = useRef<VideoPlayerRef>(null);

  // Tour State
  const [isTourOpen, setIsTourOpen] = useState(false);

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

      // Check if tour has been seen
      const tourSeen = localStorage.getItem('viralflow_tour_seen');
      
      // ONLY trigger tour if Welcome Modal is NOT active. 
      // If modal is active, tour triggers on close (handleCloseWelcome)
      if (!tourSeen && !showWelcomeModal) {
          setTimeout(() => setIsTourOpen(true), 1000);
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
      // Trigger tour after welcome modal closes if not seen
      const tourSeen = localStorage.getItem('viralflow_tour_seen');
      if (!tourSeen) {
          setIsTourOpen(true);
      }
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
      
      // Determine Min Scene Duration based on Pacing
      let minDuration = 3; // Default Normal
      if (pacing === VideoPacing.HYPER) minDuration = 1.5;
      if (pacing === VideoPacing.FAST) minDuration = 2.5;
      if (pacing === VideoPacing.SLOW) minDuration = 6;

      let newScenes: Scene[] = rawScript.map((item, idx) => ({
        id: `scene-${idx}`,
        speaker: item.speaker,
        text: item.text,
        visualPrompt: item.visual_prompt,
        // DYNAMIC DURATION ESTIMATE based on Pacing
        durationEstimate: Math.max(minDuration, item.text.split(' ').length * 0.4), 
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

      // Set auto transition if selected
      if (globalTransition === VideoTransition.AUTO) {
         // We don't bake it in, player handles it dynamically, or we could bake it here?
         // Player handling is better for "re-roll" effect if we change global transition.
      }

      setScenes(newScenes);
      setBgMusicUrl(""); // Start empty, user must upload

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
             .catch(e => ({ imageUrl: '', videoUrl: undefined, mediaType: 'image' as const, success: false }));

        // Wait for both
        const [audioResult, imageResult] = await Promise.all([audioPromise, imagePromise]);

        // Update scene in place
        newScenes[i] = {
             ...newScenes[i],
             audioUrl: audioResult.url,
             audioBuffer: audioResult.buffer,
             imageUrl: imageResult.imageUrl,
             videoUrl: imageResult.videoUrl,
             mediaType: imageResult.mediaType,
             isGeneratingAudio: false,
             isGeneratingImage: false
        };
        
        // Update state incrementally to show progress
        setScenes([...newScenes]);
      }

      // 3. Thumbnails & Metadata
      setProgress(translations[lang].renderComplete);
      
      const thumbsPromise = generateThumbnails(topic, style, thumbProvider, () => cancelRef.current);
      const metaPromise = generateMetadata(topic, rawScript.map(s => s.text).join(' '), () => cancelRef.current);

      const [thumbs, meta] = await Promise.all([thumbsPromise, metaPromise]);
      
      setThumbnails(thumbs);
      setMetadata(meta);
      
      setIsGenerating(false);
      setCurrentSceneIndex(0);
      setIsPlaying(true); // Auto play

    } catch (e: any) {
      if (e.message === "CANCELLED_BY_USER" || e.message === "Cancelled") {
          setProgress(translations[lang].cancelGen);
      } else {
          console.error(e);
          setProgress(translations[lang].errorGen + " " + e.message);
          alert(translations[lang].fatalError + "\n" + e.message);
      }
      setIsGenerating(false);
    }
  };

  return (
    <div className={`min-h-screen bg-zinc-950 text-white font-sans selection:bg-indigo-500/30 ${theme}`}>
       {/* UI Implementation */}
       <div className="container mx-auto p-4">
          {/* Render Player if scenes exist */}
          {scenes.length > 0 ? (
             <div className="flex flex-col items-center gap-6">
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
                    globalTransition={globalTransition}
                    userTier={userTier}
                    channelLogo={channelLogo}
                 />
                 {/* Controls for Export */}
                 <div className="flex gap-4">
                    <button onClick={() => setActiveTab('create')} className="text-sm text-zinc-400 hover:text-white">{translations[lang].tabCreate}</button>
                    <button onClick={() => playerRef.current?.startRecording(userTier === UserTier.PRO)} className="bg-red-600 px-6 py-2 rounded-full font-bold hover:bg-red-500 transition-colors">
                       {translations[lang].recExport} {userTier === UserTier.PRO ? '(4K)' : '(HD)'}
                    </button>
                    <button onClick={() => { setScenes([]); setIsPlaying(false); }} className="text-sm text-zinc-400 hover:text-white">
                        {translations[lang].cancel}
                    </button>
                 </div>
             </div>
          ) : (
             <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                 <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">ViralFlow AI</h1>
                 <p className="text-zinc-400 max-w-md">{translations[lang].appDesc}</p>
                 
                 <div className="w-full max-w-md bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4">
                     <input 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder={translations[lang].topicPlaceholder}
                        className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500"
                     />
                     <button 
                        onClick={handleGenerateVideo} 
                        disabled={isGenerating}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                     >
                        {isGenerating ? (
                           <><Loader2 className="animate-spin"/> {translations[lang].generating}</>
                        ) : (
                           <><Wand2 className="w-5 h-5"/> {translations[lang].generateVideo}</>
                        )}
                     </button>
                     {isGenerating && <div className="text-xs text-zinc-500 animate-pulse">{progress}</div>}
                     
                     <div className="text-xs text-zinc-500 pt-4 border-t border-zinc-800">
                        {apiKeyCount} keys loaded | <button onClick={() => setActiveTab('settings')} className="underline">Settings</button>
                     </div>
                 </div>
             </div>
          )}
       </div>

       {/* Modals */}
       {showWelcomeModal && <WelcomeModal onClose={handleCloseWelcome} lang={lang} t={translations} />}
       {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} onUpgrade={handleUpgrade} lang={lang} t={translations} />}
       {editingScene && (
            <EditSceneModal 
                scene={editingScene} 
                onClose={() => setEditingScene(null)} 
                onSave={(updated) => {
                    const newScenes = [...scenes];
                    const idx = newScenes.findIndex(s => s.id === updated.id);
                    if (idx !== -1) newScenes[idx] = updated;
                    setScenes(newScenes);
                    setEditingScene(null);
                }}
                onRegenerateAsset={handleSceneAssetRegeneration}
                onRegenerateAudio={handleSceneAudioRegeneration}
                lang={lang}
                userTier={userTier}
                t={translations}
            />
       )}
       
       <OnboardingTour 
          isOpen={isTourOpen} 
          onClose={() => setIsTourOpen(false)} 
          lang={lang}
          steps={[
             { targetId: 'topic-input', translationKey: 'tourStep1', position: 'bottom' },
             { targetId: 'generate-btn', translationKey: 'tourStep4', position: 'bottom' }
          ]} 
       />
    </div>
  );
};

export default App;