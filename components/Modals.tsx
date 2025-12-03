


import React, { useState, useRef, useEffect } from 'react';
import { Scene, Language, UserTier, ImageProvider, ParticleEffect, MusicAction, SceneMusicConfig, VideoTransition, PollinationsModel, GeminiModel, VFXConfig, VideoFormat, LayerConfig, ColorGradingPreset, CameraMovement } from '../types';
import { ShieldCheck, Crown, Key, Loader2, CheckCircle2, X, Edit2, RefreshCcw, Upload, ImagePlus, Sparkles, ArrowRightLeft, Music2, FileAudio, AlertCircle, Zap, MicOff, Clock, Layers, Wand2, Play, Pause, Maximize2, MoveUp, MoveDown, Trash2, Plus, GripVertical, Video, Palette, Type, Video as VideoIcon, Move } from 'lucide-react';
import VideoPlayer from './VideoPlayer';

// ... (WelcomeModal and UpgradeModal remain unchanged) ...
export const WelcomeModal: React.FC<{ onClose: () => void, lang: Language, t: any }> = ({ onClose, lang, t }) => {
    const WEBSITE_LINK = "https://fabioarieira.com";
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-lg p-6 animate-in fade-in duration-500">
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden text-center">
                <div className="mx-auto w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mb-6 border border-indigo-500/30">
                    <ShieldCheck className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-3xl font-black text-white mb-4 tracking-tight">{t[lang].welcomeTitle}</h2>
                <div className="space-y-4 text-zinc-400 text-sm leading-relaxed">
                    <p><strong className="text-indigo-300">{t[lang].privacyNote}</strong> {t[lang].privacyDesc}</p>
                    <p>All processing happens <strong className="text-white">{t[lang].privacyLocal}</strong>.</p>
                </div>
                <div className="mt-8 pt-6 border-t border-zinc-800/50">
                    <p className="text-xs text-zinc-500 mb-1">{t[lang].devBy}</p>
                    <a href={WEBSITE_LINK} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-white hover:text-indigo-400 transition-colors">Fabio Arieira</a>
                    <p className="text-[10px] text-zinc-600 mt-1">Full Stack Developer</p>
                </div>
                <button onClick={onClose} className="mt-8 w-full py-3 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition-all transform hover:scale-[1.02]">{t[lang].understand}</button>
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
                <div className="mt-8">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <a href="https://fabioarise.gumroad.com/l/viralflow" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors text-center text-xs"><Crown className="w-4 h-4"/> Site</a>
                        <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors text-center text-xs"><Loader2 className="w-4 h-4"/> Pix / WhatsApp</a>
                    </div>
                    {!success ? (
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Key className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                <input type="text" placeholder={t[lang].pasteKey} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none" value={key} onChange={(e) => setKey(e.target.value)} />
                            </div>
                            <button onClick={handleVerify} disabled={isValidating || !key} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 rounded-lg font-medium text-sm transition-colors disabled:opacity-50">{isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : t[lang].activate}</button>
                        </div>
                    ) : (
                        <div className="bg-emerald-500/20 border border-emerald-500/50 p-3 rounded-lg text-emerald-400 text-sm font-medium text-center">{t[lang].licenseActive}</div>
                    )}
                    {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
        </div>
    );
};

export const EditSceneModal: React.FC<{ 
    scene: Scene, 
    onClose: () => void, 
    onSave: (updatedScene: Scene) => void, 
    onRegenerateAsset: (scene: Scene, provider: ImageProvider, pollinationsModel?: PollinationsModel, geminiModel?: GeminiModel) => Promise<any>,
    onRegenerateAudio: (scene: Scene) => Promise<any>,
    lang: Language,
    userTier: UserTier,
    format: VideoFormat,
    t: any
}> = ({ scene, onClose, onSave, onRegenerateAsset, onRegenerateAudio, lang, userTier, format, t }) => {
    // Migration for legacy overlay
    const initialLayers = scene.layers || (scene.overlay ? [{
        id: 'legacy-overlay', type: 'image' as const, url: scene.overlay.url, name: 'Overlay Inicial',
        x: scene.overlay.x, y: scene.overlay.y, scale: scene.overlay.scale, rotation: 0, opacity: scene.overlay.opacity ?? 1
    }] : []);

    const [localScene, setLocalScene] = useState<Scene>({...scene, layers: initialLayers});
    const [activeTab, setActiveTab] = useState<'text'|'visual'|'audio'|'vfx'>('text');
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isRegeneratingAudio, setIsRegeneratingAudio] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<ImageProvider>(ImageProvider.GEMINI);
    const [pollinationsModel, setPollinationsModel] = useState<PollinationsModel>('turbo');
    const [geminiModel, setGeminiModel] = useState<GeminiModel>('gemini-2.5-flash-image');
    
    // Layer State
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [selectedLayer, setSelectedLayer] = useState<LayerConfig | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const layerInputRef = useRef<HTMLInputElement>(null);

    // Audio & Music Config
    const [musicAction, setMusicAction] = useState<MusicAction>(localScene.musicConfig?.action || MusicAction.CONTINUE);
    const [musicTrackId, setMusicTrackId] = useState<string>(localScene.musicConfig?.trackId || 'none');
    const [musicVolume, setMusicVolume] = useState<number>(localScene.musicConfig?.volume ?? 0.2);
    const [customAudioFile, setCustomAudioFile] = useState<string | undefined>(localScene.musicConfig?.customUrl);
    const [uploadedFileName, setUploadedFileName] = useState<string>('');
    
    // VFX Config
    const [vfx, setVfx] = useState<VFXConfig>(localScene.vfxConfig || { shakeIntensity: 0, chromaticAberration: 0, bloomIntensity: 0, vignetteIntensity: 0, filmGrain: 0 });
    const [grading, setGrading] = useState<ColorGradingPreset>(localScene.colorGrading || ColorGradingPreset.NONE);

    const musicFileInputRef = useRef<HTMLInputElement>(null);
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

    useEffect(() => {
        const config: SceneMusicConfig = {
            action: musicAction,
            trackId: musicTrackId,
            volume: musicVolume,
            customUrl: musicTrackId === 'custom' ? customAudioFile : localScene.musicConfig?.customUrl
        };
        setLocalScene(prev => ({ ...prev, musicConfig: config }));
    }, [musicAction, musicTrackId, musicVolume, customAudioFile]);
    
    useEffect(() => {
        setLocalScene(prev => ({ ...prev, vfxConfig: vfx, colorGrading: grading }));
    }, [vfx, grading]);

    // Keep selectedLayer state in sync with localScene.layers
    useEffect(() => {
        if(selectedLayerId && localScene.layers) {
            const found = localScene.layers.find(l => l.id === selectedLayerId);
            setSelectedLayer(found || null);
        } else {
            setSelectedLayer(null);
        }
    }, [selectedLayerId, localScene.layers]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const isVideo = file.type.startsWith('video/');
            setLocalScene(prev => ({
                ...prev,
                mediaType: isVideo ? 'video' : 'image',
                imageUrl: isVideo ? prev.imageUrl : url,
                videoUrl: isVideo ? url : undefined,
                visualPrompt: t[lang].manualUpload
            }));
        }
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
                x: 0.5, y: 0.5, scale: 1.0, rotation: 0, opacity: 1.0,
                blendMode: 'source-over'
            };
            setLocalScene(prev => ({ ...prev, layers: [...(prev.layers || []), newLayer] }));
            setSelectedLayerId(newLayer.id);
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

    const updateLayer = (id: string, updates: Partial<LayerConfig>) => {
        setLocalScene(prev => ({
            ...prev,
            layers: prev.layers?.map(l => l.id === id ? { ...l, ...updates } : l)
        }));
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

    const removeLayer = (id: string) => {
        setLocalScene(prev => ({ ...prev, layers: prev.layers?.filter(l => l.id !== id) }));
        if (selectedLayerId === id) setSelectedLayerId(null);
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
            const result = await onRegenerateAsset(localScene, selectedProvider, pollinationsModel, geminiModel);
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
                    audioError: false 
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
        <div className="fixed inset-0 z-[100] bg-black flex flex-col md:flex-row animate-in fade-in duration-300">
            {/* LEFT SIDE: LIVE PREVIEW */}
            <div className="w-full md:w-1/2 lg:w-3/5 h-[40vh] md:h-full bg-black border-r border-zinc-800 relative flex flex-col">
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                     <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse flex items-center gap-1">
                        <Maximize2 className="w-3 h-3" /> LIVE PREVIEW
                     </span>
                </div>
                <div className="flex-1 flex items-center justify-center p-4 bg-zinc-900/50 overflow-hidden relative">
                    <div className="max-w-full max-h-full aspect-video shadow-2xl rounded-lg overflow-hidden border border-zinc-800">
                         <VideoPlayer 
                            scenes={[localScene]} 
                            currentSceneIndex={0}
                            setCurrentSceneIndex={() => {}} 
                            isPlaying={isPreviewPlaying}
                            setIsPlaying={setIsPreviewPlaying}
                            format={format}
                            bgMusicVolume={0}
                            showSubtitles={true}
                            subtitleStyle="Moderno (Caixa Escura)"
                            userTier={userTier}
                        />
                    </div>
                </div>
                <div className="h-16 bg-zinc-950 border-t border-zinc-800 flex items-center justify-center gap-6">
                    <button onClick={() => setIsPreviewPlaying(!isPreviewPlaying)} className="w-12 h-12 rounded-full bg-white text-black hover:scale-110 transition-transform flex items-center justify-center">
                        {isPreviewPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                    </button>
                </div>
            </div>

            {/* RIGHT SIDE: TOOLS */}
            <div className="w-full md:w-1/2 lg:w-2/5 h-full bg-zinc-50 dark:bg-zinc-950 flex flex-col overflow-hidden">
                <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2"><Edit2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> {t[lang].editScene}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="shrink-0 px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                    <div className="flex gap-2 w-max">
                        <button onClick={() => setActiveTab('text')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'text' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'}`}><FileAudio className="w-4 h-4" /> {t[lang].tabScript}</button>
                        <button onClick={() => setActiveTab('visual')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'visual' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'}`}><ImagePlus className="w-4 h-4" /> {t[lang].tabVisual}</button>
                        <button onClick={() => setActiveTab('audio')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'audio' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'}`}><Music2 className="w-4 h-4" /> {t[lang].tabAudio}</button>
                        <button onClick={() => setActiveTab('vfx')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'vfx' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'}`}><Layers className="w-4 h-4" /> Camadas & VFX</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32">
                    {activeTab === 'text' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex flex-col p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-200 dark:border-indigo-800/30 gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg"><Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-300" /></div>
                                    <div className="flex flex-col"><span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">Duração</span><span className="text-[10px] text-zinc-500">Tempo em segundos</span></div>
                                </div>
                                <div className="flex items-center gap-4">
                                     <input type="range" min="0.5" max="30" step="0.1" value={localScene.durationEstimate} onChange={(e) => setLocalScene({...localScene, durationEstimate: parseFloat(e.target.value)})} className="flex-1 h-2 bg-indigo-200 dark:bg-indigo-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                     <input type="number" step="0.1" min="0.5" value={localScene.durationEstimate} onChange={(e) => setLocalScene({...localScene, durationEstimate: parseFloat(e.target.value)})} className="w-20 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-2 text-center font-mono font-bold outline-none focus:border-indigo-500 transition-colors" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div><label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">{t[lang].speaker}</label><input value={localScene.speaker} onChange={(e) => setLocalScene({...localScene, speaker: e.target.value})} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/></div>
                                <div><label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">{t[lang].subtitleText}</label><textarea value={localScene.text} onChange={(e) => setLocalScene({...localScene, text: e.target.value})} rows={6} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed shadow-sm"/></div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t[lang].voiceTTS}</span>
                                    <select value={localScene.assignedVoice || 'Fenrir'} onChange={(e) => setLocalScene({...localScene, assignedVoice: e.target.value})} className="w-full bg-zinc-100 dark:bg-black text-zinc-900 dark:text-white text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-3 outline-none">
                                        <option value="Fenrir">Fenrir (Masc. Épico)</option>
                                        <option value="Charon">Charon (Masc. Grave)</option>
                                        <option value="Zephyr">Zephyr (Masc. Calmo)</option>
                                        <option value="Puck">Puck (Fem. Suave)</option>
                                        <option value="Kore">Kore (Fem. Tech)</option>
                                        <option value="Aoede">Aoede (Fem. Dramática)</option>
                                    </select>
                                </div>
                                <button onClick={handleRegenerateAudio} disabled={isRegeneratingAudio} className={`w-full px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg ${localScene.audioError ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'}`}>{isRegeneratingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}{t[lang].regenerateVoice}</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'visual' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-2 block">Mídia Base (Background)</label>
                                
                                <div className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Upload Próprio</div>
                                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-800 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2 transition-colors"><Upload className="w-3 h-3" /> 📂 {t[lang].manualUpload}</button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                                </div>
                                
                                <div className="flex gap-2 flex-col">
                                    <select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value as ImageProvider)} className="w-full bg-zinc-100 dark:bg-black text-zinc-900 dark:text-white text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-3 outline-none">
                                        <option value={ImageProvider.GEMINI}>Gemini 2.5</option>
                                        <option value={ImageProvider.POLLINATIONS}>Pollinations</option>
                                        <option value={ImageProvider.STOCK_VIDEO}>Stock Video</option>
                                    </select>
                                    <textarea value={localScene.visualPrompt} onChange={(e) => setLocalScene({...localScene, visualPrompt: e.target.value})} rows={2} placeholder={t[lang].visualPrompt} className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-zinc-900 dark:text-zinc-300 text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none leading-relaxed"/>
                                    <button onClick={handleRegenerateVisual} disabled={isRegenerating} className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/20">{isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}{t[lang].generate}</button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-2 block">Comportamento da Câmera</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(CameraMovement).map(([key, label]) => (
                                        <button 
                                            key={key} 
                                            onClick={() => setLocalScene(prev => ({...prev, cameraMovement: label as CameraMovement}))}
                                            className={`text-xs px-3 py-2 rounded-lg border font-medium transition-all ${localScene.cameraMovement === label ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'}`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-2 font-medium text-zinc-700 dark:text-zinc-300">
                                        <span>Intensidade (Camera Shake)</span>
                                        <span className="font-mono bg-zinc-100 dark:bg-black px-1.5 rounded">{vfx.shakeIntensity}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="10" 
                                        step="1" 
                                        value={vfx.shakeIntensity} 
                                        onChange={(e) => setVfx({...vfx, shakeIntensity: parseFloat(e.target.value)})} 
                                        className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                                    />
                                    <p className="text-[10px] text-zinc-500 mt-1">Afeta a velocidade e força do efeito "Câmera na Mão"</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'audio' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                           <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2"><Music2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /><h4 className="font-bold text-zinc-900 dark:text-white">{t[lang].sceneSoundtrack}</h4></div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">{t[lang].behavior}</label>
                                        <div className="flex flex-col gap-2">{[MusicAction.CONTINUE, MusicAction.START_NEW, MusicAction.STOP].map(action => (<label key={action} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${musicAction === action ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-zinc-50 dark:bg-black border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'}`}><input type="radio" name="musicAction" checked={musicAction === action} onChange={() => setMusicAction(action)} className="text-indigo-500 focus:ring-indigo-500" /><span className={`text-sm ${musicAction === action ? 'text-indigo-900 dark:text-white font-bold' : 'text-zinc-500 dark:text-zinc-400'}`}>{action}</span></label>))}</div>
                                    </div>
                                    {musicAction === MusicAction.START_NEW && (
                                        <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                            <div><label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">{t[lang].chooseTrack}</label><select value={musicTrackId} onChange={(e) => setMusicTrackId(e.target.value)} className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500"><option value="none">Selecione...</option><option value="custom">{t[lang].customAudio}</option></select></div>
                                            {musicTrackId === 'custom' && (<div className="bg-zinc-50 dark:bg-black border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 text-center hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => musicFileInputRef.current?.click()}><div className="flex flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400"><FileAudio className="w-8 h-8 text-indigo-500" /><span className="text-xs font-medium">{uploadedFileName || t[lang].uploadAudioTip}</span></div><input type="file" ref={musicFileInputRef} onChange={handleMusicFileUpload} accept="audio/*" className="hidden" />{customAudioFile && <div className="mt-2 text-[10px] text-emerald-500 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3"/> {t[lang].fileUploaded}</div>}</div>)}
                                            <div><label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">{t[lang].musicVolume} ({Math.round(musicVolume * 100)}%)</label><input type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={(e) => setMusicVolume(parseFloat(e.target.value))} className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" /></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'vfx' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            
                            {/* COLOR GRADING (LUTs) */}
                            <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Palette className="w-4 h-4" /> Color Grading (Cinematic LUTs)
                                </h4>
                                <select value={grading} onChange={(e) => setGrading(e.target.value as ColorGradingPreset)} className="w-full bg-zinc-100 dark:bg-black text-zinc-900 dark:text-white text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-3 outline-none mb-2">
                                    {Object.values(ColorGradingPreset).map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>

                            {/* LAYER MANAGEMENT */}
                            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                     <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                        <Layers className="w-4 h-4" /> Gerenciador de Camadas
                                     </h4>
                                     <div className="flex gap-2">
                                         <button onClick={handleAddTextLayer} className="text-[10px] px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 rounded font-bold flex items-center gap-1 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                                            <Type className="w-3 h-3" /> Texto
                                         </button>
                                         <button onClick={() => layerInputRef.current?.click()} className="text-[10px] px-2 py-1 bg-indigo-600 text-white rounded font-bold flex items-center gap-1 hover:bg-indigo-500 transition-colors">
                                            <ImagePlus className="w-3 h-3" /> Mídia (Img/Vid)
                                         </button>
                                     </div>
                                     <input type="file" className="hidden" ref={layerInputRef} accept="image/*,video/*" onChange={handleAddLayer} />
                                </div>
                                
                                <div className="max-h-60 overflow-y-auto">
                                    {/* BASE LAYER (Cannot move) */}
                                    <div className="flex items-center gap-3 p-3 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 opacity-70">
                                        <Video className="w-4 h-4 text-zinc-400" />
                                        <span className="text-xs font-bold flex-1 text-zinc-500">Mídia Base (Background)</span>
                                        <span className="text-[9px] bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">Fixo</span>
                                    </div>

                                    {/* DYNAMIC LAYERS */}
                                    {localScene.layers?.slice().reverse().map((layer, idx) => {
                                        // Reverse index for rendering list (Top first) but move logic needs original index
                                        const originalIndex = (localScene.layers?.length || 0) - 1 - idx;
                                        const isSelected = selectedLayerId === layer.id;
                                        
                                        return (
                                            <div 
                                                key={layer.id} 
                                                onClick={() => setSelectedLayerId(layer.id)}
                                                className={`flex items-center gap-3 p-3 border-b border-zinc-100 dark:border-zinc-800/50 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                                            >
                                                <GripVertical className="w-4 h-4 text-zinc-300" />
                                                <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded overflow-hidden flex items-center justify-center relative">
                                                    {layer.type === 'text' ? (
                                                        <Type className="w-4 h-4 text-zinc-500" />
                                                    ) : layer.type === 'video' ? (
                                                        <div className="w-full h-full bg-black flex items-center justify-center"><VideoIcon className="w-4 h-4 text-white"/></div>
                                                    ) : (
                                                        <img src={layer.url} className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col flex-1">
                                                    <span className={`text-xs font-bold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-300'}`}>{layer.name}</span>
                                                    {layer.type === 'text' && <span className="text-[9px] text-zinc-400 truncate w-32">{layer.text}</span>}
                                                </div>
                                                
                                                <div className="flex items-center gap-1">
                                                    <button onClick={(e) => { e.stopPropagation(); moveLayer(originalIndex, 'up'); }} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-400"><MoveUp className="w-3 h-3" /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); moveLayer(originalIndex, 'down'); }} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-400"><MoveDown className="w-3 h-3" /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-400"><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {(!localScene.layers || localScene.layers.length === 0) && (
                                        <div className="p-4 text-center text-xs text-zinc-400 italic">Nenhuma camada extra adicionada.</div>
                                    )}
                                </div>
                            </div>

                            {/* SELECTED LAYER CONTROLS */}
                            {selectedLayer && (
                                <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800/30 animate-in fade-in slide-in-from-bottom-2">
                                    <h5 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider mb-4 border-b border-indigo-200 dark:border-indigo-800/30 pb-2">
                                        Editando: {selectedLayer.name} ({selectedLayer.type})
                                    </h5>

                                    {/* TEXT SPECIFIC CONTROLS */}
                                    {selectedLayer.type === 'text' && (
                                        <div className="space-y-3 mb-4 border-b border-indigo-200 dark:border-indigo-800/30 pb-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Conteúdo do Texto</label>
                                                <input type="text" value={selectedLayer.text} onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })} className="w-full bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800 rounded px-2 py-1.5 text-xs" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Fonte</label>
                                                <select value={selectedLayer.fontFamily || 'Inter'} onChange={(e) => updateLayer(selectedLayer.id, { fontFamily: e.target.value })} className="w-full bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800 rounded px-2 py-1.5 text-xs outline-none">
                                                    <option value="Inter">Inter (Padrão)</option>
                                                    <option value="Roboto">Roboto</option>
                                                    <option value="Oswald">Oswald (Impact)</option>
                                                    <option value="Montserrat">Montserrat</option>
                                                    <option value="Playfair Display">Playfair Display (Serif)</option>
                                                    <option value="Comic Neue">Comic Neue (Fun)</option>
                                                    <option value="JetBrains Mono">JetBrains Mono (Code)</option>
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Tamanho da Fonte</label>
                                                    <input type="number" value={selectedLayer.fontSize} onChange={(e) => updateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) })} className="w-full bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800 rounded px-2 py-1.5 text-xs" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Cor</label>
                                                    <div className="flex gap-2">
                                                        <input type="color" value={selectedLayer.fontColor} onChange={(e) => updateLayer(selectedLayer.id, { fontColor: e.target.value })} className="h-8 w-8 cursor-pointer rounded border-0" />
                                                        <input type="text" value={selectedLayer.fontColor} onChange={(e) => updateLayer(selectedLayer.id, { fontColor: e.target.value })} className="flex-1 bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800 rounded px-2 py-1.5 text-xs" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* SHADOW CONTROLS */}
                                    <div className="space-y-3 mb-4 border-b border-indigo-200 dark:border-indigo-800/30 pb-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase block">Efeito de Sombra (Drop Shadow)</label>
                                            <input type="checkbox" checked={!!selectedLayer.textShadow || !!selectedLayer.shadowColor} onChange={(e) => updateLayer(selectedLayer.id, { textShadow: e.target.checked, shadowColor: e.target.checked ? '#000000' : undefined })} className="rounded text-indigo-600" />
                                        </div>
                                        
                                        {(selectedLayer.textShadow || selectedLayer.shadowColor) && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                     <label className="text-[9px] text-zinc-400 block mb-1">Cor da Sombra</label>
                                                     <input type="color" value={selectedLayer.shadowColor || '#000000'} onChange={(e) => updateLayer(selectedLayer.id, { shadowColor: e.target.value })} className="w-full h-6 cursor-pointer rounded border-0" />
                                                </div>
                                                <div>
                                                     <label className="text-[9px] text-zinc-400 block mb-1">Blur ({selectedLayer.shadowBlur || 0})</label>
                                                     <input type="range" min="0" max="50" value={selectedLayer.shadowBlur || 0} onChange={(e) => updateLayer(selectedLayer.id, { shadowBlur: parseInt(e.target.value) })} className="w-full h-1 bg-indigo-200 dark:bg-indigo-900 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                                </div>
                                                <div>
                                                     <label className="text-[9px] text-zinc-400 block mb-1">Offset X</label>
                                                     <input type="range" min="-50" max="50" value={selectedLayer.shadowOffsetX || 0} onChange={(e) => updateLayer(selectedLayer.id, { shadowOffsetX: parseInt(e.target.value) })} className="w-full h-1 bg-indigo-200 dark:bg-indigo-900 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                                </div>
                                                <div>
                                                     <label className="text-[9px] text-zinc-400 block mb-1">Offset Y</label>
                                                     <input type="range" min="-50" max="50" value={selectedLayer.shadowOffsetY || 0} onChange={(e) => updateLayer(selectedLayer.id, { shadowOffsetY: parseInt(e.target.value) })} className="w-full h-1 bg-indigo-200 dark:bg-indigo-900 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Posição X</label>
                                            <input type="range" min="0" max="1" step="0.01" value={selectedLayer.x} onChange={(e) => updateLayer(selectedLayer.id, { x: parseFloat(e.target.value) })} className="w-full h-1 bg-indigo-200 dark:bg-indigo-900 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Posição Y</label>
                                            <input type="range" min="0" max="1" step="0.01" value={selectedLayer.y} onChange={(e) => updateLayer(selectedLayer.id, { y: parseFloat(e.target.value) })} className="w-full h-1 bg-indigo-200 dark:bg-indigo-900 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Escala ({selectedLayer.scale.toFixed(1)}x)</label>
                                            <input type="range" min="0.1" max="3" step="0.1" value={selectedLayer.scale} onChange={(e) => updateLayer(selectedLayer.id, { scale: parseFloat(e.target.value) })} className="w-full h-1 bg-indigo-200 dark:bg-indigo-900 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Rotação ({Math.round(selectedLayer.rotation)}°)</label>
                                            <input type="range" min="0" max="360" step="5" value={selectedLayer.rotation} onChange={(e) => updateLayer(selectedLayer.id, { rotation: parseFloat(e.target.value) })} className="w-full h-1 bg-indigo-200 dark:bg-indigo-900 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Opacidade</label>
                                            <input type="range" min="0" max="1" step="0.1" value={selectedLayer.opacity} onChange={(e) => updateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })} className="w-full h-1 bg-indigo-200 dark:bg-indigo-900 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Blend Mode</label>
                                            <select value={selectedLayer.blendMode || 'source-over'} onChange={(e) => updateLayer(selectedLayer.id, { blendMode: e.target.value as GlobalCompositeOperation })} className="w-full bg-white dark:bg-black text-xs rounded border border-indigo-200 dark:border-indigo-800 p-1">
                                                <option value="source-over">Normal</option>
                                                <option value="screen">Screen (Clarear)</option>
                                                <option value="overlay">Overlay (Contraste)</option>
                                                <option value="multiply">Multiply (Escurecer)</option>
                                                <option value="soft-light">Soft Light</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ADVANCED VFX */}
                            <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm mt-8">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Wand2 className="w-4 h-4" /> Cinematic VFX</h4>
                                <div className="space-y-5">
                                    <div><div className="flex justify-between text-xs mb-2 font-medium text-zinc-700 dark:text-zinc-300"><span>Camera Shake (Ação)</span><span className="font-mono bg-zinc-100 dark:bg-black px-1.5 rounded">{vfx.shakeIntensity}</span></div><input type="range" min="0" max="10" step="1" value={vfx.shakeIntensity} onChange={(e) => setVfx({...vfx, shakeIntensity: parseFloat(e.target.value)})} className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" /></div>
                                    <div><div className="flex justify-between text-xs mb-2 font-medium text-zinc-700 dark:text-zinc-300"><span>Chromatic Aberration (Glitch)</span><span className="font-mono bg-zinc-100 dark:bg-black px-1.5 rounded">{vfx.chromaticAberration}</span></div><input type="range" min="0" max="10" step="1" value={vfx.chromaticAberration} onChange={(e) => setVfx({...vfx, chromaticAberration: parseFloat(e.target.value)})} className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" /></div>
                                    <div><div className="flex justify-between text-xs mb-2 font-medium text-zinc-700 dark:text-zinc-300"><span>Bloom (Brilho/Glow)</span><span className="font-mono bg-zinc-100 dark:bg-black px-1.5 rounded">{vfx.bloomIntensity}</span></div><input type="range" min="0" max="1" step="0.1" value={vfx.bloomIntensity} onChange={(e) => setVfx({...vfx, bloomIntensity: parseFloat(e.target.value)})} className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" /></div>
                                    <div><div className="flex justify-between text-xs mb-2 font-medium text-zinc-700 dark:text-zinc-300"><span>Vignette (Foco)</span><span className="font-mono bg-zinc-100 dark:bg-black px-1.5 rounded">{vfx.vignetteIntensity}</span></div><input type="range" min="0" max="1" step="0.1" value={vfx.vignetteIntensity} onChange={(e) => setVfx({...vfx, vignetteIntensity: parseFloat(e.target.value)})} className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" /></div>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><Sparkles className="w-3 h-3"/> {t[lang].particlesVFX}</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{Object.entries(ParticleEffect).map(([key, val]) => (<button key={key} onClick={() => setLocalScene(prev => ({...prev, particleEffect: val as ParticleEffect}))} className={`text-xs p-3 rounded-lg border font-bold transition-all ${localScene.particleEffect === val ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'}`}>{val}</button>))}</div>
                             </div>
                        </div>
                    )}

                    {/* ACTIONS FOOTER */}
                    <div className="shrink-0 p-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-end gap-3 z-20">
                        <button onClick={onClose} className="px-6 py-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">{t[lang].cancel}</button>
                        <button onClick={() => onSave(localScene)} className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105">{t[lang].saveChanges}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
