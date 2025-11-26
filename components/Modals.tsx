
import React, { useState, useRef, useEffect } from 'react';
import { Scene, Language, UserTier, ImageProvider, ParticleEffect, MusicAction, SceneMusicConfig, VideoTransition, PollinationsModel, GeminiModel } from '../types';
import { ShieldCheck, Crown, Key, Loader2, CheckCircle2, X, Edit2, RefreshCcw, Upload, ImagePlus, Sparkles, ArrowRightLeft, Music2, FileAudio, AlertCircle, Zap, Mic } from 'lucide-react';

// --- WELCOME MODAL ---
export const WelcomeModal: React.FC<{ onClose: () => void, lang: Language, t: any }> = ({ onClose, lang, t }) => {
    const WHATSAPP_LINK = "https://wa.me/5524993050256?text=Ola,%20tenho%20interesse%20no%20ViralFlow%20PRO";
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

// --- UPGRADE MODAL ---
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

// --- EDIT SCENE MODAL ---
export const EditSceneModal: React.FC<{ 
    scene: Scene, 
    onClose: () => void, 
    onSave: (updatedScene: Scene) => void, 
    onRegenerateAsset: (scene: Scene, provider: ImageProvider, pollinationsModel?: PollinationsModel, geminiModel?: GeminiModel) => Promise<any>,
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
    const [pollinationsModel, setPollinationsModel] = useState<PollinationsModel>('turbo');
    const [geminiModel, setGeminiModel] = useState<GeminiModel>('gemini-2.5-flash-image');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [musicAction, setMusicAction] = useState<MusicAction>(localScene.musicConfig?.action || MusicAction.CONTINUE);
    const [musicTrackId, setMusicTrackId] = useState<string>(localScene.musicConfig?.trackId || 'none');
    const [musicVolume, setMusicVolume] = useState<number>(localScene.musicConfig?.volume ?? 0.2);
    const [customAudioFile, setCustomAudioFile] = useState<string | undefined>(localScene.musicConfig?.customUrl);
    const [uploadedFileName, setUploadedFileName] = useState<string>('');

    const musicFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
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
                imageUrl: isVideo ? prev.imageUrl : url,
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
                overlay: { url, x: 0.5, y: 0.5, scale: 1.0 }
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50">
                    <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2"><Edit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> {t[lang].editScene}</h3>
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
                            <div><label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{t[lang].speaker}</label><input value={localScene.speaker} onChange={(e) => setLocalScene({...localScene, speaker: e.target.value})} className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none"/></div>
                            <div><label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{t[lang].subtitleText}</label><textarea value={localScene.text} onChange={(e) => setLocalScene({...localScene, text: e.target.value})} rows={5} className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none leading-relaxed"/></div>
                             <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 shadow-sm">
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t[lang].voiceTTS}</span>
                                    <div className="flex items-center gap-2">
                                        <select 
                                            value={localScene.assignedVoice || 'Fenrir'} 
                                            onChange={(e) => setLocalScene({...localScene, assignedVoice: e.target.value})} 
                                            className="bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 outline-none flex-1"
                                        >
                                            <option value="Fenrir">Fenrir (Masc. Épico)</option>
                                            <option value="Charon">Charon (Masc. Grave)</option>
                                            <option value="Zephyr">Zephyr (Masc. Calmo)</option>
                                            <option value="Puck">Puck (Fem. Suave)</option>
                                            <option value="Kore">Kore (Fem. Tech)</option>
                                            <option value="Aoede">Aoede (Fem. Dramática)</option>
                                        </select>
                                    </div>
                                    {localScene.audioError ? (<span className="text-red-500 text-xs font-bold flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3"/> {t[lang].audioError}</span>) : (<span className="text-emerald-500 text-xs font-bold flex items-center gap-1 mt-1"><CheckCircle2 className="w-3 h-3"/> {t[lang].audioSync}</span>)}
                                </div>
                                <button onClick={handleRegenerateAudio} disabled={isRegeneratingAudio} className={`w-full px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors ${localScene.audioError ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>{isRegeneratingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}{t[lang].regenerateVoice}</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'visual' && (
                        <div className="space-y-6">
                            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800 relative group">
                                {isRegenerating ? (<div className="w-full h-full flex flex-col items-center justify-center text-indigo-400 gap-2 bg-zinc-950"><Loader2 className="w-8 h-8 animate-spin" /><span className="text-xs font-medium">Gerando...</span></div>) : localScene.mediaType === 'video' && localScene.videoUrl ? (<video src={localScene.videoUrl} className="w-full h-full object-cover" autoPlay muted loop />) : (<img src={localScene.imageUrl} className="w-full h-full object-cover" />)}
                            </div>
                            <div className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                <div className="text-xs text-zinc-600 dark:text-zinc-300">Deseja usar uma mídia própria?</div>
                                <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-md text-xs font-bold text-zinc-800 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-600 flex items-center gap-2 transition-colors"><Upload className="w-3 h-3" /> 📂 {t[lang].manualUpload}</button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                            </div>
                            {userTier === UserTier.PRO && (
                                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <div className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2"><ImagePlus className="w-4 h-4" /> {t[lang].sceneOverlay}</div>
                                    <div className="flex items-center gap-2">{localScene.overlay ? (<button onClick={() => setLocalScene(prev => ({ ...prev, overlay: undefined }))} className="text-xs text-red-500 hover:underline">Remover</button>) : (<label className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-md text-xs font-bold cursor-pointer transition-colors">Upload PNG<input type="file" className="hidden" accept="image/png,image/jpeg" onChange={handleOverlayUpload} /></label>)}</div>
                                </div>
                            )}
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><Sparkles className="w-3 h-3"/> {t[lang].particlesVFX}</label>
                                <div className="grid grid-cols-3 gap-2">{Object.entries(ParticleEffect).map(([key, val]) => (<button key={key} onClick={() => setLocalScene(prev => ({...prev, particleEffect: val as ParticleEffect}))} className={`text-xs p-2 rounded-lg border transition-all ${localScene.particleEffect === val ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'}`}>{val}</button>))}</div>
                             </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><ArrowRightLeft className="w-3 h-3"/> {t[lang].sceneTrans}</label>
                                <select value={localScene.transition || VideoTransition.NONE} onChange={(e) => setLocalScene(prev => ({...prev, transition: e.target.value as VideoTransition}))} disabled={userTier === UserTier.FREE} className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs text-zinc-900 dark:text-white outline-none">{Object.values(VideoTransition).map(s => <option key={s} value={s}>{s}</option>)}</select>
                            </div>
                            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 shadow-sm">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{t[lang].regenerateMedia}</label>
                                <div className="flex gap-2 flex-wrap">
                                    <select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value as ImageProvider)} className="bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 outline-none flex-1">
                                        <option value={ImageProvider.GEMINI}>Gemini 2.5 (Cota)</option>
                                        <option value={ImageProvider.POLLINATIONS}>Pollinations (Free)</option>
                                        <option value={ImageProvider.STOCK_VIDEO}>Stock Video (Pexels)</option>
                                    </select>
                                    {selectedProvider === ImageProvider.POLLINATIONS && (
                                        <select value={pollinationsModel} onChange={(e) => setPollinationsModel(e.target.value as PollinationsModel)} className="bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 outline-none w-32">
                                            <option value="turbo">Turbo (Recomendado)</option>
                                            <option value="flux">Flux</option>
                                            <option value="dreamshaper">Dreamshaper</option>
                                            <option value="deliberate">Deliberate</option>
                                            <option value="midjourney">Midjourney (Style)</option>
                                        </select>
                                    )}
                                    {selectedProvider === ImageProvider.GEMINI && (
                                        <select value={geminiModel} onChange={(e) => setGeminiModel(e.target.value as GeminiModel)} className="bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 outline-none w-36">
                                            <option value="gemini-2.5-flash-image">Flash 2.5 (Rápido)</option>
                                            <option value="imagen-3.0-generate-001">Imagen 3.0 (HQ)</option>
                                        </select>
                                    )}
                                    <button onClick={handleRegenerateVisual} disabled={isRegenerating} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50 transition-colors">{isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}{t[lang].generate}</button>
                                </div>
                                <textarea value={localScene.visualPrompt} onChange={(e) => setLocalScene({...localScene, visualPrompt: e.target.value})} rows={2} placeholder={t[lang].visualPrompt} className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-300 text-xs focus:ring-1 focus:ring-indigo-500 outline-none resize-none"/>
                            </div>
                        </div>
                    )}

                    {activeTab === 'audio' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2"><Music2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /><h4 className="font-bold text-zinc-900 dark:text-white">{t[lang].sceneSoundtrack}</h4></div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">{t[lang].behavior}</label>
                                        <div className="flex flex-col gap-2">{[MusicAction.CONTINUE, MusicAction.START_NEW, MusicAction.STOP].map(action => (<label key={action} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${musicAction === action ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'}`}><input type="radio" name="musicAction" checked={musicAction === action} onChange={() => setMusicAction(action)} className="text-indigo-500 focus:ring-indigo-500" /><span className={`text-sm ${musicAction === action ? 'text-indigo-900 dark:text-white font-medium' : 'text-zinc-500 dark:text-zinc-400'}`}>{action}</span></label>))}</div>
                                    </div>
                                    {musicAction === MusicAction.START_NEW && (
                                        <div className="animate-in fade-in slide-in-from-top-2 space-y-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{t[lang].chooseTrack}</label>
                                                <select value={musicTrackId} onChange={(e) => setMusicTrackId(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500">
                                                    <option value="none">Selecione...</option>
                                                    <option value="custom">{t[lang].customAudio}</option>
                                                </select>
                                            </div>
                                            {musicTrackId === 'custom' && (
                                                <div className="bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-4 text-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer" onClick={() => musicFileInputRef.current?.click()}>
                                                    <div className="flex flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400"><FileAudio className="w-8 h-8 text-indigo-500" /><span className="text-xs font-medium">{uploadedFileName || t[lang].uploadAudioTip}</span></div>
                                                    <input type="file" ref={musicFileInputRef} onChange={handleMusicFileUpload} accept="audio/*" className="hidden" />
                                                    {customAudioFile && <div className="mt-2 text-[10px] text-emerald-500 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3"/> {t[lang].fileUploaded}</div>}
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{t[lang].musicVolume} ({Math.round(musicVolume * 100)}%)</label>
                                                <input type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={(e) => setMusicVolume(parseFloat(e.target.value))} className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
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
