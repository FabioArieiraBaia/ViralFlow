import React, { useState, useRef, useEffect } from 'react';
import { Scene, Language, UserTier, ImageProvider, MusicAction, SceneMusicConfig, VideoTransition, PollinationsModel, GeminiModel, VFXConfig, VideoFormat, LayerConfig, ColorGradingPreset, Keyframe, SubtitleStyle, CameraMovement, AudioLayer, LayerAnimation, GeminiTTSModel, ALL_GEMINI_VOICES } from '../types';
import { isVideoModel } from '../services/geminiService';
import { ShieldCheck, Crown, Key, Loader2, X, Edit2, RefreshCcw, ImagePlus, Music2, FileAudio, Zap, Clock, Layers, Play, Pause, Maximize2, MoveUp, MoveDown, Trash2, Plus, Video, Palette, Type, Scissors, Diamond, CheckCircle2, ChevronRight, Wand2, Upload, Mic, AlertCircle, Volume2, MicOff, ArrowRightLeft, Camera, Speaker, Clapperboard, Timer, MoveRight, Image, User } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import { fileToBase64 } from '../services/audioUtils';

export const WelcomeModal: React.FC<{ onClose: () => void, lang: Language, t: any }> = ({ onClose, lang, t }) => {
    const WEBSITE_LINK = "https://fabioarieira.com";
    return (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/90 backdrop-blur-lg p-0 md:p-6 animate-in fade-in duration-500">
            <div className="bg-[var(--bg-secondary)] border themed-border rounded-t-3xl md:rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden text-center animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 duration-300">
                {/* Bottom sheet handle for mobile */}
                <div className="md:hidden w-10 h-1 bg-[var(--bg-elevated)] rounded-full mx-auto mb-4"></div>
                
                <div className="mx-auto w-14 h-14 md:w-16 md:h-16 bg-[var(--accent-primary)]/20 rounded-full flex items-center justify-center mb-4 md:mb-6 border border-[var(--accent-primary)]/30">
                    <ShieldCheck className="w-7 h-7 md:w-8 md:h-8 themed-accent" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black themed-text mb-3 md:mb-4 tracking-tight">{t[lang].welcomeTitle}</h2>
                <div className="space-y-3 md:space-y-4 themed-text-secondary text-sm leading-relaxed">
                    <p><strong className="themed-accent">{t[lang].privacyNote}</strong> {t[lang].privacyDesc}</p>
                    <p>{lang === 'pt' ? 'Todo o processamento acontece' : lang === 'es' ? 'Todo el procesamiento ocurre' : 'All processing happens'} <strong className="themed-text">{t[lang].privacyLocal}</strong>.</p>
                </div>
                <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t themed-border">
                    <p className="text-xs themed-text-secondary mb-1">{t[lang].devBy}</p>
                    <a href={WEBSITE_LINK} target="_blank" rel="noopener noreferrer" className="text-lg font-bold themed-text hover:themed-accent transition-colors">Fabio Arieira</a>
                    <p className="text-[10px] themed-text-secondary mt-1">Full Stack Developer</p>
                </div>
                <button onClick={onClose} className="mt-6 md:mt-8 w-full py-3 md:py-4 themed-btn font-bold rounded-xl transition-all transform hover:scale-[1.02] touch-target">{t[lang].understand}</button>
            </div>
        </div>
    );
};

export const UpgradeModal: React.FC<{ onClose: () => void, onUpgrade: (key: string) => Promise<boolean>, lang: Language, t: any }> = ({ onClose, onUpgrade, lang, t }) => {
    const [key, setKey] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const WHATSAPP_LINK = "https://wa.me/5524993050256?text=Ola,%20tenho%20interesse%20no%20ViralFlow%20PRO";

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
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md p-0 md:p-4">
            <div className="bg-[var(--bg-secondary)] border border-amber-500/30 rounded-t-3xl md:rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 duration-300">
                {/* Bottom sheet handle for mobile */}
                <div className="md:hidden w-10 h-1 bg-[var(--bg-elevated)] rounded-full mx-auto mb-4"></div>
                
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500"></div>
                <div className="text-center mb-6 md:mb-8 mt-2 md:mt-0">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 border border-amber-500/50">
                        <Crown className="w-7 h-7 md:w-8 md:h-8 text-amber-500" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black themed-text mb-2">{t[lang].upgradeTitle}</h2>
                    <p className="themed-text-secondary text-sm">{t[lang].upgradeDesc}</p>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <a href="https://fabioarise.gumroad.com/l/viralflow" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors text-center text-xs touch-target"><Crown className="w-4 h-4"/> Site</a>
                        <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors text-center text-xs touch-target"><Loader2 className="w-4 h-4"/> Pix / WhatsApp</a>
                    </div>
                    {!success ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 themed-text-secondary" />
                                <input type="text" placeholder={t[lang].pasteKey} className="w-full bg-[var(--bg-primary)] border themed-border rounded-lg pl-9 pr-3 py-3 text-sm themed-text focus:ring-1 focus:ring-amber-500 outline-none touch-target" value={key} onChange={(e) => setKey(e.target.value)} />
                            </div>
                            <button onClick={handleVerify} disabled={isValidating || !key} className="bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] themed-text px-4 py-3 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 touch-target">{isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : t[lang].activate}</button>
                        </div>
                    ) : (
                        <div className="bg-[var(--success)]/20 border border-[var(--success)]/50 p-3 rounded-lg text-[var(--success)] text-sm font-medium text-center">{t[lang].licenseActive}</div>
                    )}
                    {error && <p className="text-[var(--error)] text-xs mt-2 text-center">{error}</p>}
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 themed-text-secondary hover:themed-text touch-target p-2"><X className="w-5 h-5" /></button>
            </div>
        </div>
    );
};

export const VideoTrimmerModal: React.FC<{
    videoUrl: string;
    initialStart: number;
    initialEnd: number;
    totalDuration: number;
    onSave: (start: number, end: number) => void;
    onClose: () => void;
}> = ({ videoUrl, initialStart, initialEnd, totalDuration, onSave, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [start, setStart] = useState(initialStart);
    const [end, setEnd] = useState(initialEnd);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(initialStart);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            if (video.currentTime >= end) {
                video.pause();
                video.currentTime = start;
                setIsPlaying(false);
            }
            setCurrentTime(video.currentTime);
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }, [end, start]);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            if (video.currentTime >= end) {
                video.currentTime = start;
            }
            video.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="max-w-4xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Scissors className="w-5 h-5 text-indigo-500" /> Pré-processamento de Vídeo
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="relative aspect-video bg-black flex items-center justify-center">
                    <video 
                        ref={videoRef}
                        src={videoUrl}
                        className="max-h-full max-w-full"
                        onClick={togglePlay}
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 bg-black/50 p-2 rounded-full backdrop-blur-md">
                        <button onClick={togglePlay} className="p-2 bg-white text-black rounded-full hover:scale-110 transition-transform">
                            {isPlaying ? <Pause className="w-4 h-4 fill-current"/> : <Play className="w-4 h-4 fill-current ml-0.5"/>}
                        </button>
                    </div>
                </div>

                <div className="p-8 bg-zinc-950 space-y-6">
                    <div className="flex justify-between text-xs text-zinc-400 font-mono mb-2">
                        <span>Inicio: {start.toFixed(1)}s</span>
                        <span className="text-white font-bold">{currentTime.toFixed(1)}s</span>
                        <span>Fim: {end.toFixed(1)}s</span>
                    </div>

                    <div className="relative h-12 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 select-none">
                        <div className="absolute inset-y-0 left-0 right-0 bg-zinc-800/50"></div>
                        <div className="absolute inset-y-0 bg-indigo-500/20 border-l-2 border-r-2 border-indigo-500"
                            style={{ left: `${(start / totalDuration) * 100}%`, right: `${100 - (end / totalDuration) * 100}%` }}></div>
                        <div className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none" style={{ left: `${(currentTime / totalDuration) * 100}%` }}></div>

                        <input type="range" min="0" max={totalDuration} step="0.1" value={start} 
                            onChange={(e) => { const val = parseFloat(e.target.value); if(val < end) { setStart(val); if(videoRef.current) videoRef.current.currentTime = val; } }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10" />
                        <input type="range" min="0" max={totalDuration} step="0.1" value={end} 
                            onChange={(e) => { const val = parseFloat(e.target.value); if(val > start) setEnd(val); }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10" style={{ pointerEvents: 'none' }} />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                        <button onClick={onClose} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                        <button onClick={() => onSave(start, end)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20">Salvar Corte</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const EditSceneModal: React.FC<{ 
    scene: Scene, 
    onClose: () => void, 
    onSave: (updatedScene: Scene) => void, 
    onRegenerateAsset: (scene: Scene, provider: ImageProvider, pollinationsModel?: PollinationsModel, geminiModel?: GeminiModel, duration?: number, audio?: boolean) => Promise<any>,
    onRegenerateAudio: (scene: Scene, newModel?: GeminiTTSModel, newStyle?: string) => Promise<any>,
    lang: Language,
    userTier: UserTier,
    format: VideoFormat,
    t: any,
    ttsModel: GeminiTTSModel,
    isAdmin?: boolean
}> = ({ scene, onClose, onSave, onRegenerateAsset, onRegenerateAudio, lang, userTier, format, t, ttsModel, isAdmin }) => {
    
    // Initial Layers Setup
    const initialLayers = scene.layers || (scene.overlay ? [{
        id: 'legacy-overlay', type: 'image' as const, url: scene.overlay.url, name: 'Overlay Inicial',
        x: scene.overlay.x, y: scene.overlay.y, scale: scene.overlay.scale, rotation: 0, opacity: scene.overlay.opacity ?? 1
    }] : []);
    const initialAudioLayers = scene.audioLayers || [];

    const [localScene, setLocalScene] = useState<Scene>({...scene, layers: initialLayers, audioLayers: initialAudioLayers});
    const [activeTab, setActiveTab] = useState<'text'|'visual'|'audio'|'vfx'>('text');
    const [isRegeneratingVisual, setIsRegeneratingVisual] = useState(false);
    const [isRegeneratingAudio, setIsRegeneratingAudio] = useState(false);
    const [audioGenStatus, setAudioGenStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [selectedProvider, setSelectedProvider] = useState<ImageProvider>(ImageProvider.POLLINATIONS);
    const [pollinationsModel, setPollinationsModel] = useState<PollinationsModel>('flux');
    const [videoDuration, setVideoDuration] = useState<number>(5); // Default duration for videos
    const [videoAudio, setVideoAudio] = useState<boolean>(false); // Audio for veo
    
    // Update default duration when model changes
    useEffect(() => {
        if (isVideoModel(pollinationsModel)) {
            if (pollinationsModel === 'veo') {
                setVideoDuration(6); // Default for veo
            } else {
                setVideoDuration(5); // Default for seedance/seedance-pro
            }
        }
    }, [pollinationsModel]);
    
    // TTS Local State for regeneration
    const [localTtsModel, setLocalTtsModel] = useState<GeminiTTSModel>(ttsModel);
    
    // Layer State
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [selectedLayer, setSelectedLayer] = useState<LayerConfig | null>(null);
    const [currentFrameTime, setCurrentFrameTime] = useState(0); 
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
    const [regeneratingLayerIds, setRegeneratingLayerIds] = useState<Set<string>>(new Set());

    // Audio State
    const [musicAction, setMusicAction] = useState<MusicAction>(localScene.musicConfig?.action || MusicAction.CONTINUE);
    const [musicTrackId, setMusicTrackId] = useState<string>(localScene.musicConfig?.trackId || 'none');
    const [musicVolume, setMusicVolume] = useState<number>(localScene.musicConfig?.volume ?? 0.2);
    const [customAudioFile, setCustomAudioFile] = useState<string | undefined>(localScene.musicConfig?.customUrl);
    const [uploadedFileName, setUploadedFileName] = useState<string>('');
    const [sfxUploadName, setSfxUploadName] = useState('');
    
    // Sequence Logic
    const [cutPrompt, setCutPrompt] = useState('');
    const [isGeneratingCut, setIsGeneratingCut] = useState(false);

    // VFX State
    const [vfx, setVfx] = useState<VFXConfig>(localScene.vfxConfig || { shakeIntensity: 0, chromaticAberration: 0, bloomIntensity: 0, vignetteIntensity: 0, filmGrain: 0 });
    const [grading, setGrading] = useState<ColorGradingPreset>(localScene.colorGrading || ColorGradingPreset.NONE);
    const [showTrimmer, setShowTrimmer] = useState(false);
    
    // REFS FOR UPLOADS
    const fileInputRef = useRef<HTMLInputElement>(null);
    const layerInputRef = useRef<HTMLInputElement>(null);
    const musicFileInputRef = useRef<HTMLInputElement>(null);
    const sfxInputRef = useRef<HTMLInputElement>(null);
    const cutInputRef = useRef<HTMLInputElement>(null);
    const baseVisualUploadRef = useRef<HTMLInputElement>(null);
    const layerReplacementUploadRef = useRef<HTMLInputElement>(null);
    const [layerIdToReplace, setLayerIdToReplace] = useState<string | null>(null);

    // Sync Music Config
    useEffect(() => {
        const config: SceneMusicConfig = {
            action: musicAction,
            trackId: musicTrackId,
            volume: musicVolume,
            customUrl: musicTrackId === 'custom' ? customAudioFile : localScene.musicConfig?.customUrl
        };
        setLocalScene(prev => ({ ...prev, musicConfig: config }));
    }, [musicAction, musicTrackId, musicVolume, customAudioFile]);
    
    // Sync VFX
    useEffect(() => {
        setLocalScene(prev => ({ ...prev, vfxConfig: vfx, colorGrading: grading }));
    }, [vfx, grading]);

    // Handle Layer Selection
    useEffect(() => {
        if(selectedLayerId && localScene.layers) {
            const found = localScene.layers.find(l => l.id === selectedLayerId);
            setSelectedLayer(found || null);
            if(found?.type === 'video' && found.url && !found.totalDuration) {
                const vid = document.createElement('video');
                vid.src = found.url;
                vid.onloadedmetadata = () => {
                     updateLayer(found.id, { totalDuration: vid.duration, trimEnd: vid.duration });
                };
            }
        } else {
            setSelectedLayer(null);
        }
    }, [selectedLayerId, localScene.layers]);

    const updateLayer = (id: string, updates: Partial<LayerConfig>) => {
        setLocalScene(prev => ({
            ...prev,
            layers: prev.layers?.map(l => l.id === id ? { ...l, ...updates } : l)
        }));
    };

    const handleBaseVisualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const isVideo = file.type.startsWith('video/');
            const base64 = await fileToBase64(file);
            
            setLocalScene(prev => {
                // CRITICAL FIX: Update or remove existing background layers to prevent conflicts
                // Remove all background layers with startTime 0 (they would override the new base image)
                const existingLayers = prev.layers || [];
                const nonConflictingLayers = existingLayers.filter(l => 
                    !l.isBackground || (l.startTime !== undefined && l.startTime > 0)
                );
                
                return {
                    ...prev,
                    imageUrl: isVideo ? "https://placehold.co/1280x720/000000/FFFFFF.png?text=VIDEO+READY" : url,
                    imageBase64: isVideo ? undefined : base64, // If image, save base64
                    videoUrl: isVideo ? url : undefined,
                    videoBase64: isVideo ? base64 : undefined, // If video, save base64
                    mediaType: isVideo ? 'video' : 'image',
                    isGeneratingImage: false,
                    layers: nonConflictingLayers // Remove conflicting background layers
                };
            });
        }
    };

    const handleLayerReplacementUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && layerIdToReplace) {
            const url = URL.createObjectURL(file);
            const isVideo = file.type.startsWith('video/');
            updateLayer(layerIdToReplace, {
                url: url,
                type: isVideo ? 'video' : 'image',
                name: `Upload: ${file.name.substring(0, 10)}`
            });
            setLayerIdToReplace(null);
        }
    };

    const triggerLayerReplacement = (id: string) => {
        setLayerIdToReplace(id);
        layerReplacementUploadRef.current?.click();
    };

    const handleAddLayer = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const isVideo = file.type.startsWith('video/');
            const newLayer: LayerConfig = {
                id: `layer-${isVideo ? 'vid' : 'img'}-${Date.now()}`,
                type: isVideo ? 'video' : 'image',
                url,
                name: file.name.substring(0, 15) || (isVideo ? 'Video' : 'Imagem'),
                x: 0.5, y: 0.5, scale: 0.5, rotation: 0, opacity: 1.0,
                blendMode: 'source-over',
                trimStart: 0
            };
            if (isVideo) {
                 const vid = document.createElement('video');
                 vid.src = url;
                 vid.onloadedmetadata = () => {
                     newLayer.totalDuration = vid.duration;
                     newLayer.trimEnd = vid.duration;
                     setLocalScene(prev => ({ ...prev, layers: [...(prev.layers || []), newLayer] }));
                     setSelectedLayerId(newLayer.id);
                 };
            } else {
                 setLocalScene(prev => ({ ...prev, layers: [...(prev.layers || []), newLayer] }));
                 setSelectedLayerId(newLayer.id);
            }
        }
    };

    const handleAddTextLayer = () => {
        const newLayer: LayerConfig = {
            id: `layer-txt-${Date.now()}`,
            type: 'text',
            name: 'Texto',
            text: 'Novo Texto',
            fontSize: 50,
            fontColor: '#ffffff',
            x: 0.5, y: 0.5, scale: 1.0, rotation: 0, opacity: 1.0,
            blendMode: 'source-over',
            textShadow: true,
            fontFamily: 'Inter'
        };
        setLocalScene(prev => ({ ...prev, layers: [...(prev.layers || []), newLayer] }));
        setSelectedLayerId(newLayer.id);
    };

    // --- VISUAL SEQUENCE (MULTI-SHOT) LOGIC ---
    const handleGenerateVisualCut = async () => {
        if (!cutPrompt) return alert("Digite um prompt para o corte.");
        setIsGeneratingCut(true);
        try {
            // Fake a scene with the new prompt to reuse the generator logic
            const tempScene = { ...localScene, visualPrompt: cutPrompt };
            // Use the selected model (including video models for PRO users)
            const modelToUse = pollinationsModel || 'flux';
            const durationToUse = isVideoModel(modelToUse) ? videoDuration : undefined;
            const audioToUse = isVideoModel(modelToUse) && modelToUse === 'veo' ? videoAudio : undefined;
            const result = await onRegenerateAsset(tempScene, ImageProvider.POLLINATIONS, modelToUse, undefined, durationToUse, audioToUse);
            
            // CRITICAL FIX: generateSceneImage does NOT return 'success' property
            // Check for imageUrl or videoUrl directly
            if (result && (result.imageUrl || result.videoUrl)) {
                setLocalScene(prev => {
                    const bgLayers = (prev.layers || []).filter(l => l.isBackground);
                    const otherLayers = (prev.layers || []).filter(l => !l.isBackground);
                    
                    const newLayer: LayerConfig = {
                        id: `seq-cut-${Date.now()}`,
                        type: result.mediaType,
                        url: result.videoUrl || result.imageUrl,
                        base64: result.base64, // CRITICAL: Save base64 for persistence
                        name: `Corte ${bgLayers.length + 2}`, // +2 because index 0 is main + current
                        x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1,
                        startTime: 0, // Will be recalculated
                        isBackground: true // MAGIC FLAG
                    };
                    
                    // Add to end and recalculate all times
                    const allBgLayers = [...bgLayers, newLayer];
                    const recalculated = recalculateBackgroundTimes([...otherLayers, ...allBgLayers], prev.durationEstimate);
                    
                    return { ...prev, layers: recalculated };
                });
                setCutPrompt(""); // Clear prompt
            }
        } catch (e) { console.error(e); }
        setIsGeneratingCut(false);
    };

    const handleAddUploadCut = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const isVideo = file.type.startsWith('video/');
            const base64 = await fileToBase64(file);
            
            setLocalScene(prev => {
                const bgLayers = (prev.layers || []).filter(l => l.isBackground);
                const otherLayers = (prev.layers || []).filter(l => !l.isBackground);
                
                const newLayer: LayerConfig = {
                    id: `seq-upload-${Date.now()}`,
                    type: isVideo ? 'video' : 'image',
                    url,
                    base64: base64, // Save base64 for persistence
                    name: file.name.substring(0, 15),
                    x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1,
                    startTime: 0, // Will be recalculated
                    isBackground: true
                };
                
                // Add to end and recalculate all times
                const allBgLayers = [...bgLayers, newLayer];
                const recalculated = recalculateBackgroundTimes([...otherLayers, ...allBgLayers], prev.durationEstimate);
                
                return { ...prev, layers: recalculated };
            });
        }
    };

    const handleRegenerateSequenceLayer = async (layerId: string) => {
        const layer = localScene.layers?.find(l => l.id === layerId);
        if (!layer) return;

        setRegeneratingLayerIds(prev => new Set(prev).add(layerId));

        try {
            const variationPrompt = `${localScene.visualPrompt}. Alternative camera angle, cinematic cut, detailed.`;
            const tempScene = { ...localScene, visualPrompt: variationPrompt };
            // Use the selected model (including video models for PRO users)
            const modelToUse = pollinationsModel || 'flux';
            const durationToUse = isVideoModel(modelToUse) ? videoDuration : undefined;
            const audioToUse = isVideoModel(modelToUse) && modelToUse === 'veo' ? videoAudio : undefined;
            const result = await onRegenerateAsset(tempScene, ImageProvider.POLLINATIONS, modelToUse, undefined, durationToUse, audioToUse);
            
            // CRITICAL FIX: generateSceneImage does NOT return 'success' property
            // Check for imageUrl or videoUrl directly
            if (result && (result.imageUrl || result.videoUrl)) {
                updateLayer(layerId, {
                    url: result.videoUrl || result.imageUrl,
                    type: result.mediaType,
                    base64: result.base64 // CRITICAL: Save base64 for persistence
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setRegeneratingLayerIds(prev => {
                const next = new Set(prev);
                next.delete(layerId);
                return next;
            });
        }
    };

    const removeLayer = (id: string) => {
        setLocalScene(prev => {
            const newLayers = prev.layers?.filter(l => l.id !== id) || [];
            // After removing, recalculate times for remaining background layers
            return { ...prev, layers: recalculateBackgroundTimes(newLayers, prev.durationEstimate) };
        });
        if (selectedLayerId === id) setSelectedLayerId(null);
    };

    const moveLayer = (index: number, direction: 'up' | 'down') => {
        if (!localScene.layers) return;
        const newLayers = [...localScene.layers];
        if (direction === 'up' && index < newLayers.length - 1) {
            [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
        } else if (direction === 'down' && index > 0) {
            [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
        }
        setLocalScene(prev => ({ ...prev, layers: newLayers }));
    };

    // CRITICAL: Recalculate background layer times to distribute evenly
    const recalculateBackgroundTimes = (layers: LayerConfig[], totalDuration: number): LayerConfig[] => {
        const bgLayers = layers.filter(l => l.isBackground).sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0));
        const otherLayers = layers.filter(l => !l.isBackground);
        
        if (bgLayers.length === 0) return layers;
        
        // Distribute evenly across total duration
        const segmentDuration = totalDuration / bgLayers.length;
        
        const recalculatedBg = bgLayers.map((layer, idx) => ({
            ...layer,
            startTime: idx * segmentDuration
        }));
        
        return [...otherLayers, ...recalculatedBg];
    };

    // Distribute times evenly button handler
    const handleDistributeEvenly = () => {
        setLocalScene(prev => ({
            ...prev,
            layers: recalculateBackgroundTimes(prev.layers || [], prev.durationEstimate)
        }));
    };

    // Insert a new layer at a specific position (between existing layers)
    const handleInsertLayerAt = async (afterLayerId: string | null) => {
        if (!cutPrompt) return alert("Digite um prompt para o novo corte.");
        setIsGeneratingCut(true);
        
        try {
            const tempScene = { ...localScene, visualPrompt: cutPrompt };
            const modelToUse = pollinationsModel || 'flux';
            const durationToUse = isVideoModel(modelToUse) ? videoDuration : undefined;
            const audioToUse = isVideoModel(modelToUse) && modelToUse === 'veo' ? videoAudio : undefined;
            const result = await onRegenerateAsset(tempScene, ImageProvider.POLLINATIONS, modelToUse, undefined, durationToUse, audioToUse);
            
            if (result && (result.imageUrl || result.videoUrl)) {
                setLocalScene(prev => {
                    const bgLayers = (prev.layers || []).filter(l => l.isBackground).sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0));
                    const otherLayers = (prev.layers || []).filter(l => !l.isBackground);
                    
                    // Find insertion index
                    let insertIdx = bgLayers.length; // Default: add at end
                    if (afterLayerId) {
                        const foundIdx = bgLayers.findIndex(l => l.id === afterLayerId);
                        if (foundIdx >= 0) insertIdx = foundIdx + 1;
                    }
                    
                    // Create new layer
                    const newLayer: LayerConfig = {
                        id: `seq-cut-${Date.now()}`,
                        type: result.mediaType,
                        url: result.videoUrl || result.imageUrl,
                        base64: result.base64,
                        name: `Corte ${insertIdx + 1}`,
                        x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1,
                        startTime: 0, // Will be recalculated
                        isBackground: true
                    };
                    
                    // Insert at position
                    bgLayers.splice(insertIdx, 0, newLayer);
                    
                    // Recalculate times
                    const allLayers = recalculateBackgroundTimes([...otherLayers, ...bgLayers], prev.durationEstimate);
                    
                    return { ...prev, layers: allLayers };
                });
                setCutPrompt("");
            }
        } catch (e) { 
            console.error(e); 
        }
        setIsGeneratingCut(false);
    };

    const handleAddKeyframe = () => {
        if(!selectedLayer) return;
        const newKeyframe: Keyframe = {
            id: `kf-${Date.now()}`,
            time: currentFrameTime,
            x: selectedLayer.x,
            y: selectedLayer.y,
            scale: selectedLayer.scale,
            rotation: selectedLayer.rotation,
            opacity: selectedLayer.opacity
        };
        const existingKeys = selectedLayer.keyframes || [];
        const filteredKeys = existingKeys.filter(k => Math.abs(k.time - currentFrameTime) > 0.02);
        updateLayer(selectedLayer.id, { keyframes: [...filteredKeys, newKeyframe].sort((a,b) => a.time - b.time) });
    };

    const handleClearKeyframes = () => {
        if(!selectedLayer) return;
        updateLayer(selectedLayer.id, { keyframes: [] });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const isVideo = file.type.startsWith('video/');
            
            setLocalScene(prev => {
                const newState: Scene = { 
                    ...prev, 
                    imageUrl: isVideo ? "https://placehold.co/1280x720/000000/FFFFFF.png?text=VIDEO+READY" : url,
                    videoUrl: isVideo ? url : undefined,
                    mediaType: (isVideo ? 'video' : 'image') as 'image' | 'video'
                };
                return newState;
            });
        }
    };

    const handleRegenerateVisual = async () => {
        setIsRegeneratingVisual(true);
        try {
            // Use the selected model (including video models for PRO users)
            const modelToUse = pollinationsModel || 'flux';
            const durationToUse = isVideoModel(modelToUse) ? videoDuration : undefined;
            const audioToUse = isVideoModel(modelToUse) && modelToUse === 'veo' ? videoAudio : undefined;
            const result = await onRegenerateAsset(localScene, ImageProvider.POLLINATIONS, modelToUse, undefined, durationToUse, audioToUse);
            if(result && (result.imageUrl || result.videoUrl)) {
                setLocalScene(prev => {
                    // CRITICAL FIX: Remove conflicting background layers with startTime 0
                    const existingLayers = prev.layers || [];
                    const nonConflictingLayers = existingLayers.filter(l => 
                        !l.isBackground || (l.startTime !== undefined && l.startTime > 0)
                    );
                    
                    return { 
                        ...prev, 
                        imageUrl: result.imageUrl, 
                        videoUrl: result.videoUrl, 
                        mediaType: result.mediaType || 'image',
                        imageBase64: result.base64, // Save base64 for export
                        videoBase64: result.mediaType === 'video' ? result.base64 : undefined, // Only save video base64 for videos
                        layers: nonConflictingLayers // Remove conflicting background layers
                    };
                });
            }
        } catch(e) { 
            console.error("Regenerate visual error:", e); 
        }
        setIsRegeneratingVisual(false);
    };

    const handleRegenerateAudio = async () => {
        setIsRegeneratingAudio(true);
        setAudioGenStatus('idle');
        try {
            // Pass the local TTS settings
            const res = await onRegenerateAudio(localScene, localTtsModel, localScene.ttsStyle);
            if (res.success) {
                const dur = res.buffer ? res.buffer.duration + 0.2 : localScene.durationEstimate;
                setLocalScene(prev => ({ 
                    ...prev, 
                    audioUrl: res.url, 
                    audioBuffer: res.buffer,
                    audioBase64: res.base64, // Ensure base64 is updated
                    durationEstimate: dur 
                }));
                setAudioGenStatus('success');
                setTimeout(() => setAudioGenStatus('idle'), 3000);
            } else {
                setAudioGenStatus('error');
            }
        } catch (e) { 
            console.error(e);
            setAudioGenStatus('error');
        }
        setIsRegeneratingAudio(false);
    };

    const handleMusicFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCustomAudioFile(URL.createObjectURL(file));
            setUploadedFileName(file.name);
            setMusicTrackId('custom');
        }
    };

    const handleAddAudioLayer = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const newLayer: AudioLayer = {
                id: `sfx-${Date.now()}`,
                name: file.name,
                url: url,
                volume: 0.5,
                startTime: 0,
                type: 'sfx'
            };
            setLocalScene(prev => ({ ...prev, audioLayers: [...(prev.audioLayers || []), newLayer] }));
        }
    };

    const handleRemoveAudioLayer = (id: string) => {
        setLocalScene(prev => ({ ...prev, audioLayers: prev.audioLayers?.filter(l => l.id !== id) }));
    };

    const updateAudioLayer = (id: string, updates: Partial<AudioLayer>) => {
        setLocalScene(prev => ({
            ...prev,
            audioLayers: prev.audioLayers?.map(l => l.id === id ? { ...l, ...updates } : l)
        }));
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col md:flex-row animate-in fade-in duration-300">
            {showTrimmer && selectedLayer?.url && selectedLayer.type === 'video' && (
                <VideoTrimmerModal 
                    videoUrl={selectedLayer.url}
                    initialStart={selectedLayer.trimStart || 0}
                    initialEnd={selectedLayer.trimEnd || selectedLayer.totalDuration || 10}
                    totalDuration={selectedLayer.totalDuration || 100}
                    onClose={() => setShowTrimmer(false)}
                    onSave={(s, e) => { updateLayer(selectedLayer.id, { trimStart: s, trimEnd: e }); setShowTrimmer(false); }}
                />
            )}

            <div className="w-full md:w-1/2 lg:w-3/5 h-[40vh] md:h-full bg-black border-r border-zinc-800 relative flex flex-col">
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                     <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse flex items-center gap-1"><Maximize2 className="w-3 h-3" /> LIVE PREVIEW</span>
                </div>
                <div className="flex-1 flex items-center justify-center p-4 bg-zinc-900/50 overflow-hidden relative">
                    <div className={`max-w-full max-h-full ${format === VideoFormat.PORTRAIT ? 'aspect-[9/16]' : 'aspect-video'} shadow-2xl rounded-lg overflow-hidden border border-zinc-800 relative`}>
                         <VideoPlayer 
                            scenes={[localScene]} 
                            currentSceneIndex={0}
                            setCurrentSceneIndex={() => {}} 
                            isPlaying={isPreviewPlaying} 
                            setIsPlaying={setIsPreviewPlaying}
                            format={format}
                            bgMusicVolume={0}
                            showSubtitles={false}
                            subtitleStyle={SubtitleStyle.MODERN}
                            userTier={userTier}
                            scrubProgress={currentFrameTime}
                            onProgress={(progress) => setCurrentFrameTime(progress)}
                            onPlaybackComplete={() => {
                                setIsPreviewPlaying(false);
                                setCurrentFrameTime(0);
                            }}
                        />
                        {!isPreviewPlaying && (
                             <div className="absolute bottom-0 left-0 h-1 bg-red-500 z-50 pointer-events-none" style={{ width: `${currentFrameTime * 100}%` }}></div>
                        )}
                    </div>
                </div>
                
                <div className="h-28 bg-zinc-950 border-t border-zinc-800 flex flex-col justify-center px-6 gap-2">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <button onClick={() => setIsPreviewPlaying(!isPreviewPlaying)} className="w-10 h-10 rounded-full bg-white text-black hover:scale-110 transition-transform flex items-center justify-center">
                                {isPreviewPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-1" />}
                            </button>
                            <span className="text-xs font-mono text-zinc-400">{(currentFrameTime * localScene.durationEstimate).toFixed(1)}s / {localScene.durationEstimate.toFixed(1)}s</span>
                         </div>
                         {selectedLayer && (
                             <div className="flex items-center gap-2">
                                 <button onClick={handleAddKeyframe} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded flex items-center gap-1"><Diamond className="w-3 h-3" /> + Keyframe</button>
                                 <button onClick={handleClearKeyframes} className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                             </div>
                         )}
                    </div>
                    
                    <div className="relative w-full h-8 flex items-center mt-1">
                        <input type="range" min="0" max="1" step="0.001" value={currentFrameTime} onChange={(e) => { setIsPreviewPlaying(false); setCurrentFrameTime(parseFloat(e.target.value)); }} className="absolute inset-0 w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500 z-10 opacity-50 hover:opacity-100" />
                        {selectedLayer?.keyframes?.map((kf) => (
                            <div key={kf.id} className="absolute w-3 h-3 bg-amber-400 rotate-45 border border-black z-0 pointer-events-none transform -translate-x-1/2 translate-y-[1px]" style={{ left: `${kf.time * 100}%` }}></div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="w-full md:w-1/2 lg:w-2/5 h-full bg-zinc-50 dark:bg-zinc-950 flex flex-col overflow-hidden">
                <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2"><Edit2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> {t[lang].editScene}</h3>
                    <div className="flex items-center gap-2">
                         <button onClick={() => onSave(localScene)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors">{t[lang].saveChanges}</button>
                         <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                </div>

                <div className="shrink-0 px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                    <div className="flex gap-2 w-max">
                        <button onClick={() => setActiveTab('text')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'text' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'}`}><FileAudio className="w-4 h-4" /> {t[lang].tabScript}</button>
                        <button onClick={() => setActiveTab('visual')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'visual' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'}`}><Clapperboard className="w-4 h-4" /> {t[lang].tabVisual}</button>
                        <button onClick={() => setActiveTab('audio')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'audio' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'}`}><Music2 className="w-4 h-4" /> {t[lang].tabAudio}</button>
                        <button onClick={() => setActiveTab('vfx')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'vfx' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'}`}><Layers className="w-4 h-4" /> Camadas & VFX</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32">
                    {activeTab === 'text' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                             <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Roteiro (Texto da Fala)</label>
                                    <textarea value={localScene.text} onChange={(e) => setLocalScene({...localScene, text: e.target.value})} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32" placeholder="Digite o texto que será falado nesta cena..." />
                                </div>
                                
                                {/* SPEAKER NAME INPUT */}
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Nome do Personagem (Speaker Tag)</label>
                                    <input 
                                        type="text" 
                                        value={localScene.speaker} 
                                        onChange={(e) => setLocalScene({...localScene, speaker: e.target.value})} 
                                        className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                                        placeholder="Nome que aparece na tag (ex: Narrador, Batman...)"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Voz do Personagem</label>
                                        <select value={localScene.assignedVoice || 'Fenrir'} onChange={(e) => setLocalScene({...localScene, assignedVoice: e.target.value})} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                            {ALL_GEMINI_VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Modelo TTS</label>
                                        <select value={localTtsModel} onChange={(e) => setLocalTtsModel(e.target.value as GeminiTTSModel)} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                            <option value="gemini-2.5-flash-preview-tts">Flash 2.5</option>
                                            <option value="gemini-2.5-pro-tts">Pro 2.5</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Estilo de Fala (Acting Prompt)</label>
                                    <input 
                                        type="text" 
                                        value={localScene.ttsStyle || ''} 
                                        onChange={(e) => setLocalScene({...localScene, ttsStyle: e.target.value})} 
                                        placeholder="Sobrescreve o estilo global (Ex: Sussurrando...)" 
                                        className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="pt-2 flex flex-col gap-2">
                                     <div className="flex items-center justify-between text-xs px-1">
                                         <label className="font-bold text-zinc-500 uppercase">Status do Áudio:</label>
                                         {localScene.audioUrl ? (
                                             <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded"><Volume2 className="w-3 h-3" /> Áudio Presente ({(localScene.durationEstimate || 0).toFixed(1)}s)</span>
                                         ) : (
                                             <span className="flex items-center gap-1 text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded"><MicOff className="w-3 h-3" /> Sem Áudio</span>
                                         )}
                                     </div>

                                     <button 
                                        onClick={handleRegenerateAudio} 
                                        disabled={isRegeneratingAudio} 
                                        className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md ${
                                            audioGenStatus === 'success' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 
                                            audioGenStatus === 'error' ? 'bg-red-600 hover:bg-red-500 text-white' : 
                                            'bg-zinc-800 hover:bg-zinc-700 text-white'
                                        }`}
                                     >
                                        {isRegeneratingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                                         audioGenStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> : 
                                         audioGenStatus === 'error' ? <AlertCircle className="w-4 h-4" /> : 
                                         <Mic className="w-4 h-4" />}
                                        
                                        {isRegeneratingAudio ? "Gerando Voz..." : 
                                         audioGenStatus === 'success' ? "Áudio Gerado com Sucesso!" : 
                                         audioGenStatus === 'error' ? "Erro ao Gerar Áudio" : 
                                         "Atualizar Áudio (Regenerar Voz)"}
                                     </button>
                                </div>
                             </div>
                        </div>
                    )}

                    {activeTab === 'vfx' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                             {/* Transition Selector */}
                             <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" /> Transição de Saída</h4>
                                <select 
                                    value={localScene.transition || VideoTransition.AUTO} 
                                    onChange={(e) => setLocalScene({...localScene,transition: e.target.value as VideoTransition})}
                                    className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white outline-none"
                                >
                                    <option value={VideoTransition.AUTO}>Padrão (Global)</option>
                                    <option value={VideoTransition.NONE}>Corte Seco (Cut)</option>
                                    <option value={VideoTransition.FADE}>Dissolver (Fade)</option>
                                    <option value={VideoTransition.SLIDE}>Deslizar (Slide)</option>
                                    <option value={VideoTransition.ZOOM}>Zoom</option>
                                    <option value={VideoTransition.WIPE}>Wipe</option>
                                </select>
                             </div>

                             {/* Camera Movement Selector */}
                             <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><Camera className="w-4 h-4" /> Movimento de Câmera (Ken Burns)</h4>
                                <select 
                                    value={localScene.cameraMovement || CameraMovement.STATIC} 
                                    onChange={(e) => setLocalScene({...localScene, cameraMovement: e.target.value as CameraMovement})}
                                    className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white outline-none"
                                >
                                    <option value={CameraMovement.STATIC}>Estático (Sem Movimento)</option>
                                    <option value={CameraMovement.ZOOM_IN}>Zoom In (Aproximar)</option>
                                    <option value={CameraMovement.ZOOM_OUT}>Zoom Out (Afastar)</option>
                                    <option value={CameraMovement.PAN_LEFT}>Panorâmica Esq. (Deslizar)</option>
                                    <option value={CameraMovement.PAN_RIGHT}>Panorâmica Dir. (Deslizar)</option>
                                    <option value={CameraMovement.ROTATE_CW}>Girar Horário (Leve)</option>
                                    <option value={CameraMovement.ROTATE_CCW}>Girar Anti-Horário (Leve)</option>
                                    <option value={CameraMovement.HANDHELD}>Câmera na Mão (Shake)</option>
                                </select>
                             </div>
                             
                             {/* Layers Management */}
                             <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><Layers className="w-4 h-4" /> Camadas (Overlays)</h4>
                                    <div className="flex gap-2">
                                        <button onClick={handleAddTextLayer} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1"><Type className="w-3 h-3"/> Texto</button>
                                        <button onClick={() => layerInputRef.current?.click()} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1"><ImagePlus className="w-3 h-3"/> Mídia</button>
                                        <input type="file" ref={layerInputRef} onChange={handleAddLayer} className="hidden" accept="image/*,video/*" />
                                    </div>
                                </div>

                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                    {localScene.layers?.filter(l => !l.isBackground).length === 0 && (
                                        <div className="text-center text-[10px] text-zinc-400 py-4 italic">Nenhuma camada adicionada.</div>
                                    )}
                                    {localScene.layers?.map((layer, idx) => {
                                         if (layer.isBackground) return null;
                                         return (
                                            <div key={layer.id} onClick={() => setSelectedLayerId(layer.id)} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${selectedLayerId === layer.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'}`}>
                                                {layer.type === 'text' ? <Type className="w-4 h-4 text-zinc-500"/> : layer.type === 'video' ? <Video className="w-4 h-4 text-zinc-500"/> : <ImagePlus className="w-4 h-4 text-zinc-500"/>}
                                                <span className="flex-1 text-xs font-bold truncate">{layer.name || layer.text || "Camada"}</span>
                                                <div className="flex gap-1">
                                                    <button onClick={(e) => { e.stopPropagation(); moveLayer(idx, 'up'); }} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"><MoveUp className="w-3 h-3"/></button>
                                                    <button onClick={(e) => { e.stopPropagation(); moveLayer(idx, 'down'); }} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"><MoveDown className="w-3 h-3"/></button>
                                                    <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 className="w-3 h-3"/></button>
                                                </div>
                                            </div>
                                         );
                                    })}
                                </div>

                                {selectedLayer && !selectedLayer.isBackground && (
                                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-3 animate-in slide-in-from-top-2">
                                        <h5 className="text-[10px] font-bold text-indigo-500 uppercase">Propriedades: {selectedLayer.name}</h5>
                                        
                                        {selectedLayer.type === 'text' && (
                                            <div className="space-y-2">
                                                <input value={selectedLayer.text} onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })} className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded p-1 text-xs" placeholder="Texto..." />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[9px] text-zinc-500 uppercase block">Cor</label>
                                                        <input type="color" value={selectedLayer.fontColor || '#ffffff'} onChange={(e) => updateLayer(selectedLayer.id, { fontColor: e.target.value })} className="w-full h-6 rounded cursor-pointer" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] text-zinc-500 uppercase block">Tamanho</label>
                                                        <input type="number" value={selectedLayer.fontSize || 50} onChange={(e) => updateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) })} className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded p-1 text-xs" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[9px] text-zinc-500 uppercase block">Pos X</label>
                                                <input type="range" min="0" max="1" step="0.01" value={selectedLayer.x} onChange={(e) => updateLayer(selectedLayer.id, { x: parseFloat(e.target.value) })} className="w-full h-1 bg-zinc-300 dark:bg-zinc-700 rounded appearance-none" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-zinc-500 uppercase block">Pos Y</label>
                                                <input type="range" min="0" max="1" step="0.01" value={selectedLayer.y} onChange={(e) => updateLayer(selectedLayer.id, { y: parseFloat(e.target.value) })} className="w-full h-1 bg-zinc-300 dark:bg-zinc-700 rounded appearance-none" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-zinc-500 uppercase block">Escala</label>
                                                <input type="range" min="0.1" max="3" step="0.1" value={selectedLayer.scale} onChange={(e) => updateLayer(selectedLayer.id, { scale: parseFloat(e.target.value) })} className="w-full h-1 bg-zinc-300 dark:bg-zinc-700 rounded appearance-none" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-zinc-500 uppercase block">Rotação</label>
                                                <input type="range" min="0" max="360" step="1" value={selectedLayer.rotation} onChange={(e) => updateLayer(selectedLayer.id, { rotation: parseFloat(e.target.value) })} className="w-full h-1 bg-zinc-300 dark:bg-zinc-700 rounded appearance-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-zinc-500 uppercase block">Opacidade</label>
                                            <input type="range" min="0" max="1" step="0.05" value={selectedLayer.opacity} onChange={(e) => updateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })} className="w-full h-1 bg-zinc-300 dark:bg-zinc-700 rounded appearance-none" />
                                        </div>
                                        
                                        {/* Animation Controls */}
                                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                                            <h6 className="text-[9px] font-bold text-zinc-500 uppercase flex items-center gap-1"><MoveRight className="w-3 h-3"/> Animação In/Out</h6>
                                            
                                            {/* Entry Settings */}
                                            <div className="bg-zinc-50 dark:bg-zinc-950 p-2 rounded border border-zinc-100 dark:border-zinc-800">
                                                <label className="text-[9px] font-bold text-zinc-500 block mb-1">Efeito de Entrada</label>
                                                <div className="flex gap-2 mb-2">
                                                    <select 
                                                        value={selectedLayer.entryEffect || LayerAnimation.NONE} 
                                                        onChange={(e) => updateLayer(selectedLayer.id, { entryEffect: e.target.value as LayerAnimation })}
                                                        className="flex-1 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded p-1 text-[10px]"
                                                    >
                                                        {Object.values(LayerAnimation).map(l => <option key={l} value={l}>{l}</option>)}
                                                    </select>
                                                </div>
                                                <label className="text-[8px] text-zinc-400 block mb-1 flex justify-between">
                                                    <span>Duração Entrada</span>
                                                    <span>{(selectedLayer.entryDuration || 1.0).toFixed(1)}s</span>
                                                </label>
                                                <input 
                                                    type="range" min="0.1" max="3.0" step="0.1" 
                                                    value={selectedLayer.entryDuration !== undefined ? selectedLayer.entryDuration : 1.0} 
                                                    onChange={(e) => updateLayer(selectedLayer.id, { entryDuration: parseFloat(e.target.value) })} 
                                                    className="w-full h-1 bg-zinc-300 dark:bg-zinc-700 rounded appearance-none accent-indigo-500" 
                                                />
                                            </div>

                                            {/* Exit Settings */}
                                            <div className="bg-zinc-50 dark:bg-zinc-950 p-2 rounded border border-zinc-100 dark:border-zinc-800">
                                                <label className="text-[9px] font-bold text-zinc-500 block mb-1">Efeito de Saída</label>
                                                <div className="flex gap-2 mb-2">
                                                    <select 
                                                        value={selectedLayer.exitEffect || LayerAnimation.NONE} 
                                                        onChange={(e) => updateLayer(selectedLayer.id, { exitEffect: e.target.value as LayerAnimation })}
                                                        className="flex-1 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded p-1 text-[10px]"
                                                    >
                                                        {Object.values(LayerAnimation).map(l => <option key={l} value={l}>{l}</option>)}
                                                    </select>
                                                </div>
                                                <label className="text-[8px] text-zinc-400 block mb-1 flex justify-between">
                                                    <span>Duração Saída</span>
                                                    <span>{(selectedLayer.exitDuration || 1.0).toFixed(1)}s</span>
                                                </label>
                                                <input 
                                                    type="range" min="0.1" max="3.0" step="0.1" 
                                                    value={selectedLayer.exitDuration !== undefined ? selectedLayer.exitDuration : 1.0} 
                                                    onChange={(e) => updateLayer(selectedLayer.id, { exitDuration: parseFloat(e.target.value) })} 
                                                    className="w-full h-1 bg-zinc-300 dark:bg-zinc-700 rounded appearance-none accent-red-500" 
                                                />
                                            </div>
                                        </div>

                                    </div>
                                )}
                             </div>

                             <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><Zap className="w-4 h-4" /> Global VFX</h4>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Film Grain</label>
                                    <input type="range" min="0" max="1" step="0.1" value={vfx.filmGrain} onChange={(e) => setVfx({...vfx, filmGrain: parseFloat(e.target.value)})} className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded appearance-none accent-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Chromatic Aberration</label>
                                    <input type="range" min="0" max="10" step="1" value={vfx.chromaticAberration} onChange={(e) => setVfx({...vfx, chromaticAberration: parseFloat(e.target.value)})} className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded appearance-none accent-indigo-500" />
                                </div>
                             </div>
                        </div>
                    )}
                    
                    {activeTab === 'visual' && (
                         <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                             
                             {/* 1. CONFIGURAÇÃO GERAL */}
                             <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
                                 <div className="grid grid-cols-2 gap-4">
                                     <div>
                                         <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Provedor IA</label>
                                         <select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value as ImageProvider)} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs">
                                             <option value={ImageProvider.POLLINATIONS}>Pollinations.ai (Free/Pro)</option>
                                             <option value={ImageProvider.STOCK_VIDEO}>Stock Video (Pexels)</option>
                                         </select>
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Modelo IA</label>
                                         {selectedProvider === ImageProvider.POLLINATIONS && (
                                             <select value={pollinationsModel} onChange={(e) => setPollinationsModel(e.target.value as PollinationsModel)} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs">
                                                 <optgroup label="Modelos de Imagem">
                                                     <option value="flux">Flux (Padrão - Alta Qualidade)</option>
                                                     <option value="flux-realism">Flux Realism</option>
                                                     <option value="flux-3d">Flux 3D (Pixar Style)</option>
                                                     <option value="flux-anime">Flux Anime</option>
                                                     <option value="midjourney">Midjourney Style</option>
                                                     <option value="turbo">Turbo (Super Rápido)</option>
                                                 </optgroup>
                                                 {userTier === UserTier.PRO && (
                                                     <optgroup label="Vídeo (PRO Only)">
                                                         <option value="seedance-pro">🎬 Seedance Pro (Mais Econômico - Recomendado)</option>
                                                         <option value="seedance">Seedance (Audio Reactive)</option>
                                                         <option value="veo">Google Veo 3.1 (Video 1080p)</option>
                                                     </optgroup>
                                                 )}
                                             </select>
                                         )}
                                         {selectedProvider === ImageProvider.STOCK_VIDEO && ( <div className="text-xs text-zinc-500 italic p-2">Busca automática via Pexels API</div> )}
                                     </div>
                                     
                                     {/* Video Settings - Only show for video models */}
                                     {selectedProvider === ImageProvider.POLLINATIONS && isVideoModel(pollinationsModel) && (
                                         <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                             <div>
                                                 <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block flex items-center gap-2">
                                                     <Timer className="w-3 h-3" />
                                                     Duração do Vídeo (segundos)
                                                 </label>
                                                 {pollinationsModel === 'veo' ? (
                                                     <select 
                                                         value={videoDuration} 
                                                         onChange={(e) => setVideoDuration(Number(e.target.value))}
                                                         className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs"
                                                     >
                                                         <option value={4}>4 segundos</option>
                                                         <option value={6}>6 segundos</option>
                                                         <option value={8}>8 segundos</option>
                                                     </select>
                                                 ) : (
                                                     <input 
                                                         type="number" 
                                                         min={2} 
                                                         max={10} 
                                                         value={videoDuration} 
                                                         onChange={(e) => {
                                                             const val = Number(e.target.value);
                                                             if (val >= 2 && val <= 10) setVideoDuration(val);
                                                         }}
                                                         className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs"
                                                         placeholder="2-10 segundos"
                                                     />
                                                 )}
                                                 <p className="text-[10px] text-zinc-400 mt-1">
                                                     {pollinationsModel === 'veo' ? 'veo: 4, 6 ou 8 segundos' : 'seedance: 2-10 segundos'}
                                                 </p>
                                             </div>
                                             
                                             {pollinationsModel === 'veo' && (
                                                 <div>
                                                     <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block flex items-center gap-2">
                                                         <Volume2 className="w-3 h-3" />
                                                         Áudio
                                                     </label>
                                                     <label className="flex items-center gap-2 cursor-pointer">
                                                         <input 
                                                             type="checkbox" 
                                                             checked={videoAudio} 
                                                             onChange={(e) => setVideoAudio(e.target.checked)}
                                                             className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                                                         />
                                                         <span className="text-xs text-zinc-600 dark:text-zinc-400">Gerar vídeo com áudio</span>
                                                     </label>
                                                 </div>
                                             )}
                                         </div>
                                     )}
                                 </div>
                             </div>

                             {/* 2. SEQUÊNCIA VISUAL (MULTI-SHOT) */}
                             <div className="space-y-3">
                                 <div className="flex items-center justify-between">
                                     <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2"><Clapperboard className="w-4 h-4" /> Sequência Visual (Timeline)</h4>
                                     <div className="flex items-center gap-2">
                                         <span className="text-[10px] text-zinc-500">Duração: {localScene.durationEstimate.toFixed(1)}s</span>
                                         <span className="text-[10px] text-zinc-400">|</span>
                                         <span className="text-[10px] text-zinc-500">{(localScene.layers?.filter(l => l.isBackground).length || 0) + 1} cortes</span>
                                         <button 
                                             onClick={handleDistributeEvenly}
                                             className="text-[9px] px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold flex items-center gap-1"
                                             title="Distribuir tempos uniformemente"
                                         >
                                             <Timer className="w-3 h-3" /> Auto
                                         </button>
                                     </div>
                                 </div>
                                 <div className="bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-2">
                                     
                                     {/* Base Image (Shot 1) - Always at 0s */}
                                     <div className="flex items-center gap-3 p-2 bg-white dark:bg-zinc-900 rounded-lg border-2 border-indigo-500/30">
                                         <div className="w-14 h-14 bg-black rounded shrink-0 overflow-hidden relative">
                                            {localScene.mediaType === 'video' ? <video src={localScene.videoUrl} className="w-full h-full object-cover" muted loop autoPlay /> : <img src={localScene.imageUrl} className="w-full h-full object-cover" />}
                                            {localScene.mediaType === 'video' && <div className="absolute top-0 right-0 p-0.5 bg-black/50"><Video className="w-3 h-3 text-white"/></div>}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                                                <span className="text-[8px] text-white font-bold">0s</span>
                                            </div>
                                         </div>
                                         <div className="flex-1 min-w-0">
                                             <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Base Visual</span>
                                                <span className="text-[9px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded font-bold">SHOT 1</span>
                                             </div>
                                             <textarea value={localScene.visualPrompt} onChange={(e) => setLocalScene({...localScene, visualPrompt: e.target.value})} className="w-full text-[10px] bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 outline-none resize-none h-6 text-zinc-500" placeholder="Prompt da imagem base..." />
                                         </div>
                                         <div className="flex flex-col gap-1">
                                            <button onClick={handleRegenerateVisual} disabled={isRegeneratingVisual} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-indigo-500" title="Regenerar Base">{isRegeneratingVisual ? <Loader2 className="w-3 h-3 animate-spin"/> : <RefreshCcw className="w-3 h-3"/>}</button>
                                            <button onClick={() => baseVisualUploadRef.current?.click()} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-indigo-500" title="Upload Mídia"><Upload className="w-3 h-3"/></button>
                                         </div>
                                         <input type="file" ref={baseVisualUploadRef} onChange={handleBaseVisualUpload} className="hidden" accept="image/*,video/*" />
                                     </div>

                                     {/* Additional Shots - Sorted by startTime */}
                                     {localScene.layers?.filter(l => l.isBackground).sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0)).map((layer, idx) => (
                                         <div key={layer.id} className="flex items-center gap-3 p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors group">
                                            <div className="w-14 h-14 bg-black rounded shrink-0 overflow-hidden relative">
                                                {layer.url ? (layer.type === 'video' ? <video src={layer.url} className="w-full h-full object-cover"/> : <img src={layer.url} className="w-full h-full object-cover"/>) : <div className="w-full h-full flex items-center justify-center text-zinc-600"><Image className="w-6 h-6"/></div>}
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                                                    <span className="text-[8px] text-white font-bold">{(layer.startTime || 0).toFixed(1)}s</span>
                                                </div>
                                                {layer.type === 'video' && <div className="absolute top-0 right-0 p-0.5 bg-indigo-600"><Video className="w-2 h-2 text-white"/></div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{layer.name || `Corte ${idx + 2}`}</span>
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded font-bold">SHOT {idx + 2}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-zinc-400"/>
                                                        <input 
                                                            type="number" 
                                                            min="0" 
                                                            max={localScene.durationEstimate} 
                                                            step="0.5" 
                                                            value={layer.startTime || 0} 
                                                            onChange={(e) => updateLayer(layer.id, { startTime: parseFloat(e.target.value) })} 
                                                            className="w-14 bg-zinc-100 dark:bg-zinc-800 border-none rounded p-1 text-[10px] font-bold text-center"
                                                        />
                                                        <span className="text-[9px] text-zinc-400">s</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleRegenerateSequenceLayer(layer.id)}
                                                    disabled={regeneratingLayerIds.has(layer.id)}
                                                    className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-indigo-500"
                                                    title="Regenerar"
                                                >
                                                    {regeneratingLayerIds.has(layer.id) ? <Loader2 className="w-3 h-3 animate-spin"/> : <RefreshCcw className="w-3 h-3"/>}
                                                </button>
                                                <button 
                                                    onClick={() => triggerLayerReplacement(layer.id)}
                                                    className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-indigo-500"
                                                    title="Upload"
                                                >
                                                    <Upload className="w-3 h-3"/>
                                                </button>
                                                <button 
                                                    onClick={() => removeLayer(layer.id)} 
                                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-zinc-400 hover:text-red-500"
                                                    title="Remover"
                                                >
                                                    <Trash2 className="w-3 h-3"/>
                                                </button>
                                            </div>
                                         </div>
                                     ))}

                                     <input type="file" ref={layerReplacementUploadRef} onChange={handleLayerReplacementUpload} className="hidden" accept="image/*,video/*" />

                                     {/* Add New Shot UI - Improved */}
                                     <div className="pt-3 mt-2 border-t border-dashed border-zinc-300 dark:border-zinc-700">
                                         <div className="flex items-center justify-between mb-2">
                                             <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                                                 <Plus className="w-3 h-3"/> Adicionar Corte
                                             </label>
                                         </div>
                                         <div className="flex gap-2">
                                             <input 
                                                 value={cutPrompt} 
                                                 onChange={(e) => setCutPrompt(e.target.value)} 
                                                 placeholder="Descreva a nova imagem..." 
                                                 className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 transition-colors" 
                                                 onKeyDown={(e) => { if (e.key === 'Enter' && cutPrompt) handleGenerateVisualCut(); }}
                                             />
                                             <button 
                                                 onClick={handleGenerateVisualCut} 
                                                 disabled={isGeneratingCut || !cutPrompt} 
                                                 className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center gap-1"
                                             >
                                                 {isGeneratingCut ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>}
                                                 {isGeneratingCut ? "..." : "IA"}
                                             </button>
                                             <button 
                                                 onClick={() => cutInputRef.current?.click()} 
                                                 className="px-3 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1" 
                                                 title="Upload"
                                             >
                                                 <Upload className="w-3 h-3"/>
                                             </button>
                                             <input type="file" ref={cutInputRef} onChange={handleAddUploadCut} className="hidden" accept="image/*,video/*" />
                                         </div>
                                         <p className="text-[9px] text-zinc-400 mt-2 italic">
                                             💡 Dica: Use "Auto" para distribuir os cortes uniformemente pela duração da cena.
                                         </p>
                                     </div>
                                 </div>
                             </div>

                             {/* Legacy Layers Button (Hidden to simplify unless user wants overlays) */}
                             <div className="flex items-center justify-between text-xs text-zinc-400 pt-4">
                                 <span>Deseja adicionar overlays (logos, stickers)? Use a aba <strong>Camadas & VFX</strong>.</span>
                             </div>

                         </div>
                    )}

                    {activeTab === 'audio' && (
                         <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                             {/* Background Music Section */}
                             <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
                                <div className="flex justify-between items-center"><h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2"><Music2 className="w-4 h-4 text-pink-500" /> {t[lang].sceneSoundtrack} (Música de Fundo)</h4></div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-zinc-500 uppercase block">{t[lang].behavior}</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => setMusicAction(MusicAction.CONTINUE)} className={`py-2 text-[10px] font-bold rounded border ${musicAction === MusicAction.CONTINUE ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-50 dark:bg-black text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}>Continuar</button>
                                        <button onClick={() => setMusicAction(MusicAction.START_NEW)} className={`py-2 text-[10px] font-bold rounded border ${musicAction === MusicAction.START_NEW ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-50 dark:bg-black text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}>Nova Música</button>
                                        <button onClick={() => setMusicAction(MusicAction.STOP)} className={`py-2 text-[10px] font-bold rounded border ${musicAction === MusicAction.STOP ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-50 dark:bg-black text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}>Silenciar</button>
                                    </div>
                                </div>
                                {musicAction === MusicAction.START_NEW && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase block">{t[lang].chooseTrack}</label>
                                        <select value={musicTrackId} onChange={(e) => setMusicTrackId(e.target.value)} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs">
                                            <option value="none">Selecione...</option>
                                            <option value="custom">📁 Upload Próprio...</option>
                                            <option value="epic_rise">🔥 Epic Rise (Cinema)</option>
                                            <option value="lofi_chill">☕ Lofi Chill</option>
                                            <option value="dark_ambient">🌑 Dark Ambient</option>
                                            <option value="corporate_upbeat">💼 Corporate Upbeat</option>
                                        </select>
                                        {musicTrackId === 'custom' && (
                                            <div onClick={() => musicFileInputRef.current?.click()} className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-3 text-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <input type="file" ref={musicFileInputRef} onChange={handleMusicFileUpload} className="hidden" accept="audio/*" />
                                                <Upload className="w-4 h-4 text-zinc-400 mx-auto mb-1" />
                                                <span className="text-[10px] text-zinc-500 font-bold">{uploadedFileName || "Clique para escolher arquivo"}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {musicAction !== MusicAction.STOP && (
                                    <div>
                                        <div className="flex justify-between text-xs mb-1"><span className="text-zinc-500 font-bold uppercase">{t[lang].musicVolume}</span><span>{Math.round(musicVolume * 100)}%</span></div>
                                        <input type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={(e) => setMusicVolume(parseFloat(e.target.value))} className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded appearance-none accent-pink-500" />
                                    </div>
                                )}
                             </div>

                             {/* SFX LAYERS */}
                             <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
                                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2"><Speaker className="w-4 h-4 text-emerald-500" /> Efeitos Sonoros (SFX)</h4>
                                    <button onClick={() => sfxInputRef.current?.click()} className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"><Plus className="w-3 h-3"/> Adicionar Áudio</button>
                                    <input type="file" ref={sfxInputRef} onChange={handleAddAudioLayer} className="hidden" accept="audio/*" />
                                </div>
                                
                                {localScene.audioLayers && localScene.audioLayers.length > 0 ? (
                                    <div className="space-y-3">
                                        {localScene.audioLayers.map((layer) => (
                                            <div key={layer.id} className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate w-32">{layer.name}</span>
                                                    <button onClick={() => handleRemoveAudioLayer(layer.id)} className="text-red-500 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Volume</label>
                                                        <input type="range" min="0" max="1" step="0.1" value={layer.volume} onChange={(e) => updateAudioLayer(layer.id, { volume: parseFloat(e.target.value) })} className="w-full h-1 bg-zinc-300 dark:bg-zinc-700 rounded appearance-none" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Delay (Início)</label>
                                                        <input type="number" min="0" step="0.1" value={layer.startTime} onChange={(e) => updateAudioLayer(layer.id, { startTime: parseFloat(e.target.value) })} className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded p-1 text-xs" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-4 text-xs text-zinc-500 italic">Nenhum efeito sonoro adicionado.</div>
                                )}
                             </div>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};