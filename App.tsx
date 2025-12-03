
import React, { useState, useRef, useEffect } from 'react';
import { VideoStyle, VideoDuration, VideoPacing, VideoFormat, VideoMetadata, SubtitleStyle, ImageProvider, UserTier, VideoFilter, MusicAction, Language, Theme, OverlayConfig, VideoTransition, PollinationsModel, GeminiModel, Scene, ViralMetadataResult } from './types';
import { generateVideoScript, generateSpeech, generateSceneImage, generateThumbnails, generateMetadata, getApiKeyCount, saveManualKeys, getManualKeys, savePexelsKey, getPexelsKey, savePollinationsToken, getPollinationsToken, generateMovieOutline, generateViralMetadata } from './services/geminiService';
import { translations } from './services/translations';
import { triggerBrowserDownload } from './services/fileSystem';
import { downloadBook } from './services/bookService';
import VideoPlayer, { VideoPlayerRef } from './components/VideoPlayer';
import { WelcomeModal, UpgradeModal, EditSceneModal } from './components/Modals';
import { Wand2, Film, Download, Loader2, Layers, Zap, Monitor, Music, Smartphone, Hash, Settings, AlertCircle, CheckCircle2, Crown, Key, Copy, ShieldCheck, RefreshCcw, X, Upload, ZapIcon, Music2, Info, Sparkles, Globe, Sun, Moon, TriangleAlert, ImagePlus, ArrowRightLeft, MessageCircle, Captions, Volume2, Lock, Youtube, Edit2, ChevronRight, Terminal, Clapperboard, FileText, BookOpen, Save, FolderOpen, Square, Plus, Trash2, CheckSquare, Square as SquareIcon, MicOff, Palette, Eye, Move, Smartphone as MobileIcon, Monitor as MonitorIcon, Video } from 'lucide-react';

// --- SALES & SECURITY CONFIG ---
// Safe access to environment variables
const env = (import.meta as any).env || {};
// REVERTED TO PLAINTEXT FOR RELIABILITY
const MASTER_KEY = 'ADMIN-TEST-KEY-2025'; 
const LICENSE_SALT = env.VITE_LICENSE_SALT || 'DEV_SALT_INSECURE';

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

const LandingScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isExiting, setIsExiting] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const { innerWidth, innerHeight } = window;
                const x = (e.clientX / innerWidth - 0.5) * 2; 
                const y = (e.clientY / innerHeight - 0.5) * 2;
                setMousePos({ x, y });
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleEnter = () => {
        setIsExiting(true);
        setTimeout(onComplete, 800);
    };

    return (
        <div ref={containerRef} className={`fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ${isExiting ? 'opacity-0 scale-110 blur-xl' : 'opacity-100'}`}>
            <div className="scene-3d absolute inset-0 w-full h-full pointer-events-none">
                <div className="grid-floor"></div>
                <div className="absolute inset-0 transition-transform duration-100 ease-out" style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)` }}>
                    {[...Array(50)].map((_, i) => (
                        <div key={i} className="absolute rounded-full bg-white animate-pulse" style={{ width: Math.random() * 2 + 'px', height: Math.random() * 2 + 'px', top: Math.random() * 100 + '%', left: Math.random() * 100 + '%', opacity: Math.random() * 0.5 + 0.1, animationDuration: Math.random() * 3 + 2 + 's' }} />
                    ))}
                </div>
            </div>
            <div className="scene-3d mb-12" style={{ transform: `rotateY(${mousePos.x * 20}deg) rotateX(${mousePos.y * -20}deg)`, transition: 'transform 0.1s ease-out' }}>
                <div className="reactor-container">
                    <div className="reactor-ring r-ring-1"></div>
                    <div className="reactor-ring r-ring-2"></div>
                    <div className="reactor-ring r-ring-3"></div>
                    <div className="core-glow"></div>
                </div>
            </div>
            <div className="relative z-10 text-center space-y-6">
                <div className="space-y-2">
                     <div className="flex items-center justify-center gap-2 text-indigo-500 font-mono text-xs tracking-[0.2em] uppercase animate-pulse">
                        <Terminal className="w-3 h-3" /> System Ready
                     </div>
                     <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-purple-400 tracking-tighter drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]">ViralFlow</h1>
                     <div className="flex items-center justify-center gap-3">
                        <span className="h-[1px] w-12 bg-zinc-700"></span>
                        <span className="text-zinc-400 font-mono text-sm">AI VIDEO GENERATOR 2.5</span>
                        <span className="h-[1px] w-12 bg-zinc-700"></span>
                     </div>
                </div>
                <button onClick={handleEnter} className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-none mt-8 transition-all hover:tracking-widest">
                    <div className="absolute inset-0 w-full h-full bg-indigo-600/10 border border-indigo-500/50 skew-x-[-20deg]"></div>
                    <div className="absolute inset-0 w-0 h-full bg-indigo-600/80 skew-x-[-20deg] transition-all duration-300 ease-out group-hover:w-full"></div>
                    <span className="relative flex items-center gap-3 text-indigo-300 group-hover:text-white font-bold font-mono uppercase tracking-wider transition-colors">Initialize <ChevronRight className="w-4 h-4" /></span>
                </button>
            </div>
        </div>
    );
};

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

const performAutoCasting = (scenes: Scene[], style: VideoStyle): Scene[] => {
  const uniqueSpeakers = Array.from(new Set(scenes.map(s => s.speaker)));
  const cast: Record<string, string> = {};
  const maleVoices = ['Fenrir', 'Charon', 'Zephyr'];
  const femaleVoices = ['Puck', 'Kore', 'Aoede'];
  const narratorVoice = 'Fenrir';
  if (style === VideoStyle.DEBATE) { cast['Host'] = 'Zephyr'; cast['Proponent'] = 'Kore'; cast['Opponent'] = 'Charon'; }
  else if (style === VideoStyle.KIDS_STORY) { cast['Narrator'] = 'Puck'; cast['Wolf'] = 'Fenrir'; cast['Bear'] = 'Charon'; cast['Fairy'] = 'Aoede'; cast['Princess'] = 'Kore'; }
  else if (style === VideoStyle.NEWS) { cast['Anchor'] = 'Fenrir'; cast['Reporter'] = 'Puck'; cast['Witness'] = 'Zephyr'; }
  let maleIdx = 0, femaleIdx = 0, neutralIdx = 0;
  uniqueSpeakers.forEach(speaker => {
     if (cast[speaker]) return;
     const lower = speaker.toLowerCase();
     let assigned = '';
     const isFemale = lower.match(/(mulher|woman|ela|rainha|queen|senhora|menina|girl|deusa|mae|chapeuzinho|maria|ana|julia|princesa|bruxa|fairy|fada|witch|avó|grandma|reporter|repórter|little red)/);
     const isMale = lower.match(/(homem|man|ele|rei|king|senhor|menino|boy|deus|pai|lobo|joao|pedro|general|soldado|principe|cacador|wolf|bear|urso|fox|raposa|professor|teacher|anchor|âncora)/);
     const isNarrator = lower.includes('narrador') || lower.includes('narrator');
     if (isNarrator) { assigned = narratorVoice; } 
     else if (isFemale) { assigned = femaleVoices[femaleIdx % femaleVoices.length]; femaleIdx++; } 
     else if (isMale) { assigned = maleVoices[maleIdx % maleVoices.length]; maleIdx++; } 
     else { const neutralVoices = [...maleVoices, ...femaleVoices]; assigned = neutralVoices[neutralIdx % neutralVoices.length]; neutralIdx++; }
     cast[speaker] = assigned;
  });
  return scenes.map(scene => ({ ...scene, assignedVoice: cast[scene.speaker] || 'Fenrir' }));
};

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [lang, setLang] = useState<Language>('pt');
  const [contentLang, setContentLang] = useState<Language>('pt');
  const [theme, setTheme] = useState<Theme>('dark');
  const [topic, setTopic] = useState('Historia do Cafe');
  const [channelName, setChannelName] = useState('CuriosoTech');
  const [style, setStyle] = useState<VideoStyle>(VideoStyle.DOCUMENTARY);
  const [pacing, setPacing] = useState<VideoPacing>(VideoPacing.NORMAL);
  const [duration, setDuration] = useState<VideoDuration>(VideoDuration.SHORT);
  const [format, setFormat] = useState<VideoFormat>(VideoFormat.PORTRAIT);
  const [voice, setVoice] = useState('Auto');
  const [customVoice, setCustomVoice] = useState('');
  const [imageProvider, setImageProvider] = useState<ImageProvider>(ImageProvider.GEMINI);
  const [thumbProvider, setThumbProvider] = useState<ImageProvider>(ImageProvider.GEMINI);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>(SubtitleStyle.KARAOKE); 
  const [activeFilter, setActiveFilter] = useState<VideoFilter>(VideoFilter.NONE);
  const [globalTransition, setGlobalTransition] = useState<VideoTransition>(VideoTransition.NONE);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [bgMusicUrl, setBgMusicUrl] = useState<string>("");
  const [bgMusicVolume, setBgMusicVolume] = useState<number>(0.15);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const [channelLogo, setChannelLogo] = useState<OverlayConfig | undefined>(undefined);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [progress, setProgress] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'create'|'preview'|'metadata'|'settings'>('create');
  const [activeStudioTab, setActiveStudioTab] = useState<'visual'|'audio'|'brand'|'export'>('visual');
  const [apiKeyCount, setApiKeyCount] = useState(getApiKeyCount());
  const [manualKeys, setManualKeys] = useState(getManualKeys());
  const [pexelsKey, setPexelsKeyInput] = useState(getPexelsKey());
  const [pollinationsToken, setPollinationsToken] = useState(getPollinationsToken());
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [userTier, setUserTier] = useState<UserTier>(UserTier.FREE);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [userKey, setUserKey] = useState('');
  const [generatedAdminKey, setGeneratedAdminKey] = useState('');
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(new Set());
  const cancelRef = useRef(false);
  const playerRef = useRef<VideoPlayerRef>(null);

  // --- NEW METADATA STATES ---
  const [metaTopic, setMetaTopic] = useState('');
  const [metaContext, setMetaContext] = useState('');
  const [viralMetaResult, setViralMetaResult] = useState<ViralMetadataResult | null>(null);
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);

  useEffect(() => { if (theme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); }, [theme]);
  useEffect(() => { if (typeof window !== 'undefined') { setCurrentUrl(window.location.host || window.location.origin); } }, []);
  useEffect(() => { const initUser = async () => { const savedKey = localStorage.getItem('viralflow_pro_key'); if (savedKey) { if (savedKey === MASTER_KEY || verifyLocalKey(savedKey)) { setUserTier(UserTier.PRO); setUserKey(savedKey); } } }; initUser(); const seenWelcome = sessionStorage.getItem('viralflow_welcome_seen'); if (seenWelcome) setShowWelcomeModal(false); }, []);

  const handleUpgrade = async (keyInput: string): Promise<boolean> => { const input = keyInput.trim(); if (input === MASTER_KEY) { setUserTier(UserTier.PRO); localStorage.setItem('viralflow_pro_key', input); setUserKey(input); return true; } if (verifyLocalKey(input)) { setUserTier(UserTier.PRO); const formattedKey = input.toUpperCase(); localStorage.setItem('viralflow_pro_key', formattedKey); setUserKey(formattedKey); return true; } return false; };
  const handleCloseWelcome = () => { setShowWelcomeModal(false); sessionStorage.setItem('viralflow_welcome_seen', 'true'); };
  const handleSceneAssetRegeneration = async (scene: Scene, provider: ImageProvider, pollinationsModel?: PollinationsModel, geminiModel?: GeminiModel): Promise<any> => { const index = scenes.findIndex(s => s.id === scene.id); const idx = index >= 0 ? index : 0; try { const result = await generateSceneImage(scene.visualPrompt, format, idx, topic, provider, style, pollinationsModel || 'turbo', geminiModel); return { ...result, success: true }; } catch (e) { alert("Erro ao regenerar asset: " + e); return { success: false }; } };
  const handleSceneAudioRegeneration = async (scene: Scene): Promise<any> => { const index = scenes.findIndex(s => s.id === scene.id); const idx = index >= 0 ? index : 0; try { const audioResult = await generateSpeech(scene.text, scene.speaker, scene.assignedVoice || 'Fenrir', idx, topic); return { ...audioResult, success: true }; } catch (e) { console.error("Regeneration failed", e); return { success: false }; } };
  const generateDraftChapter = async (chapterName: string, prevChapterName: string, chapterIndex: number, totalChapters: number): Promise<Scene[]> => { const rawScript = await generateVideoScript(topic, style, 8, pacing, channelName, contentLang, () => cancelRef.current, { currentChapter: chapterName, prevChapter: prevChapterName, chapterIndex: chapterIndex, totalChapters: totalChapters }); let chunkScenes: Scene[] = rawScript.map((item, idx) => ({ id: `c${chapterIndex}-s${idx}`, speaker: item.speaker, text: item.text, visualPrompt: item.visual_prompt, durationEstimate: Math.max(3, item.text.split(' ').length * 0.4), mediaType: 'image' as const, imageUrl: "https://placehold.co/1280x720/222/FFF.png?text=DRAFT+MODE", isGeneratingImage: false, isGeneratingAudio: false, audioError: false })); if (voice === 'Auto') chunkScenes = performAutoCasting(chunkScenes, style); else chunkScenes = chunkScenes.map(s => ({ ...s, assignedVoice: voice === 'Custom' ? customVoice : voice })); return chunkScenes; };
  const handleGenerateVideo = async () => { if (isGenerating) { cancelRef.current = true; return; } if (getApiKeyCount() === 0) { alert(translations[lang].pleaseConfig); setActiveTab('settings'); return; } if (imageProvider === ImageProvider.STOCK_VIDEO && !pexelsKey) { alert(translations[lang].pleasePexels); setActiveTab('settings'); return; } setIsGenerating(true); setIsReviewing(false); cancelRef.current = false; setScenes([]); setMetadata(null); setThumbnails([]); setProgress(translations[lang].initializing); setActiveTab('preview'); try { if (duration === VideoDuration.MOVIE) { if (userTier === UserTier.FREE) throw new Error("Upgrade to PRO to use Movie Mode"); setProgress("🧠 Agente de Estrutura: Criando índice do filme..."); const outline = await generateMovieOutline(topic, channelName, contentLang, () => cancelRef.current); let draftScenes: Scene[] = []; for (let i = 0; i < outline.chapters.length; i++) { if (cancelRef.current) break; const chapter = outline.chapters[i]; const prevChapter = i > 0 ? outline.chapters[i-1] : "Opening"; setProgress(`📝 Agente Roteirista: Escrevendo Capítulo ${i+1}/${outline.chapters.length}...`); const chapterScenes = await generateDraftChapter(chapter, prevChapter, i, outline.chapters.length); draftScenes = [...draftScenes, ...chapterScenes]; setScenes([...draftScenes]); } if (cancelRef.current) throw new Error("Cancelled"); const refinedScenes = draftScenes; setScenes(refinedScenes); setProgress("🏷️ Gerando Metadados e Capas para Aprovação..."); generateMetadata(topic, JSON.stringify(refinedScenes.slice(0, 10).map(s => s.text)), () => cancelRef.current).then(setMetadata).catch(console.error); generateThumbnails(topic, style, thumbProvider, () => cancelRef.current).then(setThumbnails).catch(console.error); setIsReviewing(true); setProgress("✅ Roteiro Pronto. Escolha: Produzir Vídeo ou Livro."); } else { setProgress(translations[lang].writingScript); const durMinutes = duration === VideoDuration.SHORT ? 0.8 : (duration === VideoDuration.MEDIUM ? 3 : 8); const rawScript = await generateVideoScript(topic, style, durMinutes, pacing, channelName, contentLang, () => cancelRef.current); let minDuration = 3; if (pacing === VideoPacing.HYPER) minDuration = 1.5; if (pacing === VideoPacing.FAST) minDuration = 2.5; if (pacing === VideoPacing.SLOW) minDuration = 6; let newScenes: Scene[] = rawScript.map((item, idx) => ({ id: `scene-${idx}`, speaker: item.speaker, text: item.text, visualPrompt: item.visual_prompt, durationEstimate: Math.max(minDuration, item.text.split(' ').length * 0.4), mediaType: 'image' as const, imageUrl: '', isGeneratingImage: true, isGeneratingAudio: true, audioError: false })); if (voice === 'Auto') newScenes = performAutoCasting(newScenes, style); else newScenes = newScenes.map(s => ({ ...s, assignedVoice: voice === 'Custom' ? customVoice : voice })); setScenes(newScenes); await produceScenes(newScenes); } } catch (error: any) { if (error.message === "Cancelled" || error.message === "CANCELLED_BY_USER") { setProgress(translations[lang].cancelGen); } else { console.error(error); alert(`${translations[lang].errorGen} ${error.message}`); setProgress(translations[lang].fatalError); } } finally { if (duration !== VideoDuration.MOVIE) { setIsGenerating(false); } else { if (isReviewing) setIsGenerating(false); else setIsGenerating(false); } cancelRef.current = false; } };
  const produceScenes = async (scenesToProduce: Scene[]) => { setIsGenerating(true); for (let i = 0; i < scenesToProduce.length; i++) { if (cancelRef.current) break; setProgress(`${translations[lang].producingScene} ${i + 1} / ${scenesToProduce.length}...`); const scene = scenesToProduce[i]; if (scene.audioUrl && scene.imageUrl && !scene.imageUrl.includes('placehold')) continue; let safeImageProvider = imageProvider; if (imageProvider === ImageProvider.NONE) safeImageProvider = ImageProvider.NONE; else if (imageProvider === ImageProvider.GEMINI) safeImageProvider = ImageProvider.POLLINATIONS; setScenes(prev => { const updated = [...prev]; updated[i] = { ...updated[i], isGeneratingAudio: true, isGeneratingImage: true }; return updated; }); const audioPromise = generateSpeech(scene.text, scene.speaker, scene.assignedVoice || 'Fenrir', i, topic, () => cancelRef.current).then(audio => ({ ...audio, success: true })).catch(e => ({ url: '', buffer: undefined, success: false })); const imagePromise = generateSceneImage(scene.visualPrompt, format, i, topic, safeImageProvider, style, 'turbo', 'gemini-2.5-flash-image', () => cancelRef.current).then(img => ({ ...img, success: true })).catch(e => ({ imageUrl: '', mediaType: 'image' as const, success: false, videoUrl: undefined })); const [audioResult, imageResult] = await Promise.all([audioPromise, imagePromise]); if (cancelRef.current) break; setScenes(prev => { const updated = [...prev]; updated[i] = { ...updated[i], audioUrl: audioResult.success ? audioResult.url : undefined, audioBuffer: audioResult.success ? audioResult.buffer : undefined, audioError: !audioResult.success, imageUrl: imageResult.success ? imageResult.imageUrl : "https://placehold.co/1280x720/333/FFF.png?text=Error", videoUrl: imageResult.videoUrl, mediaType: imageResult.mediaType, isGeneratingAudio: false, isGeneratingImage: false }; return updated; }); await new Promise(resolve => setTimeout(resolve, 200)); } if (!cancelRef.current) { setProgress(translations[lang].renderComplete); if (!metadata) generateMetadata(topic, JSON.stringify(scenesToProduce.map(s => s.text).join(' ')), () => cancelRef.current).then(setMetadata).catch(console.error); if (thumbnails.length === 0) generateThumbnails(topic, style, thumbProvider, () => cancelRef.current).then(setThumbnails).catch(console.error); setIsPlaying(true); } else { setProgress(translations[lang].cancelGen); } setIsGenerating(false); };
  const handleApproveMovie = async () => { setIsReviewing(false); await produceScenes(scenes); };
  const handleExportScript = () => { if (scenes.length === 0) return; const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenes, null, 2)); const downloadAnchorNode = document.createElement('a'); downloadAnchorNode.setAttribute("href", dataStr); downloadAnchorNode.setAttribute("download", `${topic.replace(/ /g, "_")}_script.json`); document.body.appendChild(downloadAnchorNode); downloadAnchorNode.click(); downloadAnchorNode.remove(); };
  const handleStopAndSave = () => { cancelRef.current = true; setIsGenerating(false); setIsReviewing(false); setTimeout(() => { handleExportScript(); }, 500); };
  const handleForceRegenerateAll = async () => { const updatedScenes: Scene[] = scenes.map(s => ({ ...s, audioUrl: undefined, imageUrl: undefined, videoUrl: undefined, isGeneratingImage: false, isGeneratingAudio: false, assignedVoice: voice === 'Auto' ? s.assignedVoice : (voice === 'Custom' ? customVoice : voice) })); let finalScenes = updatedScenes; if (voice === 'Auto') { finalScenes = performAutoCasting(updatedScenes, style); } setScenes(finalScenes); await produceScenes(finalScenes); };
  const handleProduceBook = async () => { setIsReviewing(false); setIsGenerating(true); cancelRef.current = false; const bookScenes = [...scenes]; for (let i = 0; i < bookScenes.length; i++) { if (cancelRef.current) break; setProgress(`📖 Gerando Ilustração do Livro ${i + 1}/${bookScenes.length}...`); const scene = bookScenes[i]; const imgResult = await generateSceneImage(scene.visualPrompt, VideoFormat.PORTRAIT, i, topic, ImageProvider.POLLINATIONS, style, 'flux', 'gemini-2.5-flash-image', () => cancelRef.current); bookScenes[i].imageUrl = imgResult.imageUrl; setScenes([...bookScenes]); } if (!cancelRef.current) { setProgress("📚 Diagramando e Baixando Livro..."); const meta = metadata || await generateMetadata(topic, JSON.stringify(bookScenes.map(s => s.text)), () => cancelRef.current); setMetadata(meta); downloadBook(meta.title || topic, bookScenes, meta); setProgress("✅ Livro Gerado com Sucesso!"); } else { setProgress("🛑 Geração do Livro Cancelada."); } setIsGenerating(false); };
  const handleImportScript = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (evt) => { try { const importedScenes = JSON.parse(evt.target?.result as string); if (Array.isArray(importedScenes)) { setScenes(importedScenes); setActiveTab('preview'); } else { alert("Formato de arquivo inválido."); } } catch (err) { alert("Erro ao ler arquivo JSON."); } }; reader.readAsText(file); };
  const updateKeys = (val: string) => { setManualKeys(val); saveManualKeys(val); setApiKeyCount(getApiKeyCount()); };
  const updatePexelsKey = (val: string) => { setPexelsKeyInput(val); savePexelsKey(val); };
  const updatePollinationsToken = (val: string) => { setPollinationsToken(val); savePollinationsToken(val); };
  const handleGenerateLicense = () => { const key = generateLicenseKey(); setGeneratedAdminKey(key); };
  const handleCopyOrigin = () => { if (!currentUrl) return; navigator.clipboard.writeText(currentUrl); setCopiedOrigin(true); setTimeout(() => setCopiedOrigin(false), 2000); };
  const regenerateSceneAsset = async (index: number, type: 'image' | 'video') => { if (isGenerating) return; const scene = scenes[index]; if (!scene) return; setScenes(prev => { const updated = [...prev]; updated[index] = { ...updated[index], isGeneratingImage: true }; return updated; }); try { const result = await generateSceneImage(scene.visualPrompt, format, index, topic, imageProvider, style, 'turbo'); setScenes(prev => { const updated = [...prev]; updated[index] = { ...updated[index], imageUrl: result.imageUrl, videoUrl: result.videoUrl, mediaType: result.mediaType, isGeneratingImage: false }; return updated; }); } catch (e) { console.error("Quick Regen Failed", e); setScenes(prev => { const updated = [...prev]; updated[index] = { ...updated[index], isGeneratingImage: false }; return updated; }); } };
  const saveSceneUpdate = (updated: Scene) => { setScenes(prev => prev.map(s => s.id === updated.id ? updated : s)); setEditingScene(null); };
  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) setBgMusicUrl(URL.createObjectURL(file)); };
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) setChannelLogo({ url: URL.createObjectURL(file), x: 0.8, y: 0.05, scale: 0.3 }); };
  const handleCreateManualProject = () => { setScenes([{ id: `manual-s0`, speaker: 'Narrator', text: 'Welcome to your video.', visualPrompt: 'Cinematic opening scene', durationEstimate: 5, mediaType: 'image', imageUrl: 'https://placehold.co/1280x720/111/FFF.png?text=Scene+1', isGeneratingAudio: false, isGeneratingImage: false, assignedVoice: 'Fenrir' }]); setTopic('Manual Project'); setActiveTab('preview'); };
  const handleAddScene = () => { const newIdx = scenes.length; const newScene: Scene = { id: `manual-s${newIdx}-${Date.now()}`, speaker: 'Narrator', text: 'New scene text...', visualPrompt: 'Describe the scene...', durationEstimate: 5, mediaType: 'image', imageUrl: `https://placehold.co/1280x720/111/FFF.png?text=Scene+${newIdx+1}`, isGeneratingAudio: false, isGeneratingImage: false, assignedVoice: 'Fenrir' }; setScenes(prev => [...prev, newScene]); setTimeout(() => { const el = document.getElementById('timeline-container'); if(el) el.scrollTop = el.scrollHeight; }, 100); };
  const handleToggleSelectScene = (id: string) => { const newSet = new Set(selectedSceneIds); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); setSelectedSceneIds(newSet); };
  const handleSelectAll = () => { if (selectedSceneIds.size === scenes.length) setSelectedSceneIds(new Set()); else setSelectedSceneIds(new Set(scenes.map(s => s.id))); };
  const handleBulkDelete = () => { if (selectedSceneIds.size === 0) return; if (!confirm(`Deletar ${selectedSceneIds.size} cenas?`)) return; setScenes(prev => prev.filter(s => !selectedSceneIds.has(s.id))); setSelectedSceneIds(new Set()); if(scenes.length === 0) setCurrentSceneIndex(0); else if(currentSceneIndex >= scenes.length) setCurrentSceneIndex(0); };
  const handleBulkRegenerate = async (type: 'images' | 'audio') => { if (isGenerating) return; const ids = Array.from(selectedSceneIds); if (ids.length === 0) return; setIsGenerating(true); const scenesToProcess = scenes.filter(s => selectedSceneIds.has(s.id)); setScenes(prev => prev.map(s => selectedSceneIds.has(s.id) ? { ...s, isGeneratingImage: type === 'images', isGeneratingAudio: type === 'audio' } : s)); for (let i = 0; i < scenesToProcess.length; i++) { if (cancelRef.current) break; const scene = scenesToProcess[i]; setProgress(`Bulk: ${type === 'images' ? 'Imagining' : 'Voicing'} ${i+1}/${scenesToProcess.length}`); if (type === 'images') { try { const imgRes = await handleSceneAssetRegeneration(scene, imageProvider, 'turbo', 'gemini-2.5-flash-image'); setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, imageUrl: imgRes.imageUrl, videoUrl: imgRes.videoUrl, mediaType: imgRes.mediaType, isGeneratingImage: false } : s)); } catch(e) { console.error(e); } } else { try { const audioRes = await handleSceneAudioRegeneration(scene); setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, audioUrl: audioRes.url, audioBuffer: audioRes.buffer, audioError: !audioRes.success, isGeneratingAudio: false } : s)); } catch(e) { console.error(e); } } } setIsGenerating(false); setProgress(''); };

  // --- NEW HANDLER: GENERATE VIRAL METADATA ---
  const handleGenerateViralMetadata = async () => {
      if (!metaTopic) return alert("Digite um tópico/título.");
      setIsGeneratingMeta(true);
      try {
          const result = await generateViralMetadata(metaTopic, metaContext || "Video about " + metaTopic);
          setViralMetaResult(result);
      } catch (e) {
          console.error(e);
          alert("Erro ao gerar metadados: " + e);
      } finally {
          setIsGeneratingMeta(false);
      }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      // You could add a toast here
  };

  if (showLanding) return <LandingScreen onComplete={() => setShowLanding(false)} />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500/30 flex flex-col overflow-hidden transition-colors duration-300 animate-in fade-in duration-1000">
      
      {/* HEADER ... (Unchanged) ... */}
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20"><Zap className="w-5 h-5 text-white" /></div>
          <h1 className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white">ViralFlow <span className="text-indigo-600 dark:text-indigo-400">AI</span></h1>
          {userTier === UserTier.FREE ? ( <span onClick={() => setShowUpgradeModal(true)} className="cursor-pointer px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">{translations[lang].free}</span> ) : ( <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 border border-amber-400/50 text-[10px] font-bold text-black shadow-sm">{translations[lang].pro}</span> )}
        </div>
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
          {[{ id: 'create', label: translations[lang].tabCreate, icon: Wand2 }, { id: 'preview', label: translations[lang].tabEditor, icon: Film }, { id: 'metadata', label: translations[lang].tabMeta, icon: Hash }, { id: 'settings', label: translations[lang].tabConfig, icon: Settings }].map(tab => ( <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}><tab.icon className="w-4 h-4" /> {tab.label}</button> ))}
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
              <button onClick={() => setLang(prev => prev === 'pt' ? 'en' : prev === 'en' ? 'es' : 'pt')} className="px-3 py-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800"><span className="font-bold text-xs text-zinc-600 dark:text-zinc-300">{lang.toUpperCase()}</span></button>
              <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">{theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}</button>
           </div>
           <div className="flex flex-col items-end">
               <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{translations[lang].activeKeys}</span>
               <div className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${apiKeyCount > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></span><span className="text-sm font-bold text-zinc-900 dark:text-white">{apiKeyCount}</span></div>
           </div>
           <button onClick={() => setShowUpgradeModal(true)} className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg hover:shadow-amber-500/20 flex items-center gap-2"><Crown className="w-4 h-4" /> {userTier === UserTier.FREE ? translations[lang].upgradeBtn : translations[lang].licenseActiveBtn}</button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-hidden relative flex">
        
        {/* TAB: CREATE */}
        {activeTab === 'create' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {/* ... (Create Tab Content - Unchanged) ... */}
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex justify-between items-center py-8">
                         <div className="text-left space-y-4">
                            <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{translations[lang].whatCreate}</h2>
                            <p className="text-zinc-500 dark:text-zinc-400 text-lg">{translations[lang].appDesc}</p>
                         </div>
                         <button onClick={() => importInputRef.current?.click()} className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-bold transition-colors flex items-center gap-2"><FolderOpen className="w-4 h-4" /> Carregar JSON</button>
                    </div>
                    {/* ... (Rest of Create Tab logic same as before) ... */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 flex items-start gap-3 shadow-sm"><TriangleAlert className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" /><div><h3 className="font-bold text-amber-800 dark:text-amber-400 text-sm mb-1">{translations[lang].copyrightWarning}</h3><p className="text-xs text-amber-700 dark:text-amber-300/80 leading-relaxed">{translations[lang].copyrightBody}</p></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-6">
                             <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].videoTopic}</label><textarea value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-lg text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-sm dark:shadow-inner" placeholder={translations[lang].topicPlaceholder} rows={3}/></div>
                             <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2"><Globe className="w-3 h-3" /> {translations[lang].videoLang}</label><div className="grid grid-cols-3 gap-2">{[{id:'pt', label:'🇧🇷 Português'}, {id:'en', label:'🇺🇸 English'}, {id:'es', label:'🇪🇸 Español'}].map((l) => (<button key={l.id} onClick={() => setContentLang(l.id as any)} className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${contentLang === l.id ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'}`}>{l.label}</button>))}</div></div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].visualStyle}</label><select value={style} onChange={(e) => setStyle(e.target.value as VideoStyle)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none">{Object.values(VideoStyle).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                 <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].pacing}</label><select value={pacing} onChange={(e) => setPacing(e.target.value as VideoPacing)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none">{Object.values(VideoPacing).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                             </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].format}</label><div className="grid grid-cols-2 gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800"><button onClick={() => setFormat(VideoFormat.PORTRAIT)} className={`flex flex-col items-center gap-1 p-2 rounded-md transition-all ${format === VideoFormat.PORTRAIT ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}><Smartphone className="w-4 h-4" /> <span className="text-xs font-bold">Shorts</span></button><button onClick={() => setFormat(VideoFormat.LANDSCAPE)} className={`flex flex-col items-center gap-1 p-2 rounded-md transition-all ${format === VideoFormat.LANDSCAPE ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}><Monitor className="w-4 h-4" /> <span className="text-xs font-bold">Vídeo</span></button></div></div>
                            <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].duration}</label><select value={duration} onChange={(e) => { if (e.target.value === VideoDuration.MOVIE && userTier === UserTier.FREE) { setShowUpgradeModal(true); } else { setDuration(e.target.value as VideoDuration); } }} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none">{Object.values(VideoDuration).map(s => (<option key={s} value={s} disabled={s === VideoDuration.MOVIE && userTier === UserTier.FREE}>{s} {s === VideoDuration.MOVIE && userTier === UserTier.FREE ? '(PRO)' : ''}</option>))}</select></div>
                         </div>
                    </div>
                    <div className="space-y-6">
                         <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].channelName}</label><div className="relative"><Youtube className="absolute left-3 top-3 w-5 h-5 text-zinc-500" /><input value={channelName} onChange={(e) => setChannelName(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none" /></div></div>
                         <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">{translations[lang].narrator} {userTier === UserTier.FREE && <Lock className="w-3 h-3" />}</label><div className="grid grid-cols-2 gap-2">{VOICE_OPTIONS.map(v => (<button key={v.id} onClick={() => { if (userTier === UserTier.PRO) setVoice(v.id); else setShowUpgradeModal(true); }} className={`text-left px-3 py-2 rounded-lg text-xs border transition-all ${voice === v.id ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-indigo-700 dark:text-white' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600'} ${userTier === UserTier.FREE && v.id !== 'Auto' ? 'opacity-50 cursor-not-allowed' : ''}`}>{v.label}</button>))}</div>{voice === 'Custom' && userTier === UserTier.PRO && (<input type="text" value={customVoice} onChange={(e) => setCustomVoice(e.target.value)} placeholder="Nome da voz (ex: en-US-Studio-M)" className="w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none" />)}</div>
                         <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between"><span>{translations[lang].imageProvider}</span>{imageProvider === ImageProvider.GEMINI && <span className="text-[10px] text-amber-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {translations[lang].quota}</span>}</label><div className="grid grid-cols-1 gap-2">{[{ id: ImageProvider.GEMINI, label: '⚡ Gemini 2.5', sub: 'High Quality (Manual Only)' }, { id: ImageProvider.POLLINATIONS, label: '🎨 Pollinations.ai', sub: 'Turbo Model - Free' }, { id: ImageProvider.STOCK_VIDEO, label: '📹 Stock Video', sub: 'Real Footage (Pexels)' }, { id: ImageProvider.NONE, label: translations[lang].providerNone, sub: translations[lang].providerNoneSub }].map(p => (<button key={p.id} onClick={() => setImageProvider(p.id as any)} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${imageProvider === p.id ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}><div className="text-left"><div className={`font-bold text-sm ${imageProvider === p.id ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>{p.label}</div><div className={`text-xs ${imageProvider === p.id ? 'text-indigo-200' : 'text-zinc-500'}`}>{p.sub}</div></div>{imageProvider === p.id && <CheckCircle2 className="w-5 h-5 text-white" />}</button>))}</div></div>
                         <div className="space-y-2"><div className="flex items-center justify-between"><label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2"><ArrowRightLeft className="w-3 h-3" /> {translations[lang].globalTrans}</label>{userTier === UserTier.FREE && <Lock className="w-3 h-3 text-zinc-500" />}</div><select value={globalTransition} onChange={(e) => setGlobalTransition(e.target.value as VideoTransition)} disabled={userTier === UserTier.FREE} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none disabled:opacity-50">{Object.values(VideoTransition).map(s => <option key={s} value={s}>{s}</option>)}</select>{userTier === UserTier.FREE && <p className="text-[10px] text-zinc-500 italic text-right">{translations[lang].onlyPro}</p>}</div>
                    </div>
                    <div className="pt-8 flex flex-col items-center gap-4"><button id="tour-generate-btn" onClick={handleGenerateVideo} disabled={isGenerating} className={`w-full md:w-auto group relative px-8 py-4 rounded-full font-black text-lg shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 ${duration === VideoDuration.MOVIE ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black' : 'bg-zinc-900 dark:bg-white text-white dark:text-black'}`}>{isGenerating ? (<span className="flex items-center gap-3 justify-center"><Loader2 className="w-6 h-6 animate-spin" /> {progress || translations[lang].generating}</span>) : (<span className="flex items-center gap-3 justify-center">{duration === VideoDuration.MOVIE ? 'GERAR FILME (PRO)' : translations[lang].generateVideo} {duration === VideoDuration.MOVIE ? <Clapperboard className="w-6 h-6" /> : <Wand2 className="w-6 h-6 text-indigo-400 dark:text-indigo-600" />}</span>)}</button><div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400"><span>ou</span><button onClick={() => importInputRef.current?.click()} className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1"><FolderOpen className="w-4 h-4" /> Carregar Roteiro (JSON)</button></div></div>
                </div>
            </div>
        )}

        {/* TAB: PREVIEW (EDITOR) */}
        {activeTab === 'preview' && (
             scenes.length > 0 ? (
                <div className="flex-1 flex flex-col md:flex-row h-full items-start overflow-hidden relative">
                    
                    {/* VIDEO PLAYER COLUMN (LEFT) */}
                    <div className="w-full md:w-1/2 lg:w-2/5 bg-zinc-100 dark:bg-black flex flex-col items-center border-r border-zinc-200 dark:border-zinc-800 z-10 md:h-full overflow-y-auto custom-scrollbar">
                         
                         {/* VIDEO PLAYER */}
                         <div className="w-full p-6 pb-0">
                            <div className="w-full max-w-[400px] mx-auto shadow-2xl rounded-lg overflow-hidden border border-zinc-800">
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
                                    onPlaybackComplete={() => setIsPlaying(false)}
                                    channelLogo={channelLogo}
                                    onUpdateChannelLogo={setChannelLogo}
                                    onUpdateSceneOverlay={(id, cfg) => {
                                        setScenes(prev => prev.map(s => s.id === id ? { ...s, overlay: cfg } : s));
                                    }}
                                />
                            </div>
                         </div>

                         {/* STUDIO CONTROLS PANEL */}
                         <div className="w-full p-6 pt-6">
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                                
                                {/* STUDIO TABS */}
                                <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                                    <button onClick={() => setActiveStudioTab('visual')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeStudioTab === 'visual' ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}><Palette className="w-3 h-3" /> Visual</button>
                                    <button onClick={() => setActiveStudioTab('audio')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeStudioTab === 'audio' ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}><Music className="w-3 h-3" /> Áudio</button>
                                    <button onClick={() => setActiveStudioTab('brand')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeStudioTab === 'brand' ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}><Zap className="w-3 h-3" /> Brand</button>
                                    <button onClick={() => setActiveStudioTab('export')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeStudioTab === 'export' ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}><Download className="w-3 h-3" /> Baixar</button>
                                </div>

                                <div className="p-5 space-y-5 min-h-[250px]">
                                    
                                    {/* VISUAL CONTROLS */}
                                    {activeStudioTab === 'visual' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                                            <div>
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Formato de Tela</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button onClick={() => setFormat(VideoFormat.PORTRAIT)} className={`flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${format === VideoFormat.PORTRAIT ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}><MobileIcon className="w-4 h-4" /> <span className="text-xs font-bold">Vertical (9:16)</span></button>
                                                    <button onClick={() => setFormat(VideoFormat.LANDSCAPE)} className={`flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${format === VideoFormat.LANDSCAPE ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}><MonitorIcon className="w-4 h-4" /> <span className="text-xs font-bold">Horizontal (16:9)</span></button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Filtro Global</label>
                                                    <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as VideoFilter)} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs outline-none">
                                                        {Object.values(VideoFilter).map(f => <option key={f} value={f}>{f}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Transição Padrão</label>
                                                    <select value={globalTransition} onChange={(e) => setGlobalTransition(e.target.value as VideoTransition)} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs outline-none">
                                                        {Object.values(VideoTransition).map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Legendas Globais</label>
                                                    <button onClick={() => setShowSubtitles(!showSubtitles)} className={`w-8 h-4 rounded-full transition-colors relative ${showSubtitles ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}><div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showSubtitles ? 'translate-x-4' : 'translate-x-0'}`}></div></button>
                                                </div>
                                                {showSubtitles && (
                                                    <select value={subtitleStyle} onChange={(e) => setSubtitleStyle(e.target.value as SubtitleStyle)} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs outline-none">
                                                        {Object.values(SubtitleStyle).map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* AUDIO CONTROLS */}
                                    {activeStudioTab === 'audio' && (
                                        <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                                            <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors" onClick={() => musicInputRef.current?.click()}>
                                                <Music2 className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                                                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{bgMusicUrl ? "Música Carregada (Trocar)" : "Carregar Música de Fundo"}</p>
                                                <p className="text-[10px] text-zinc-400 mt-1">MP3 ou WAV</p>
                                                <input type="file" ref={musicInputRef} onChange={handleMusicUpload} className="hidden" accept="audio/*" />
                                            </div>

                                            {bgMusicUrl && (
                                                <div className="space-y-4">
                                                    <div>
                                                        <div className="flex justify-between text-xs mb-2 font-medium"><span>Volume da Música</span><span>{Math.round(bgMusicVolume * 100)}%</span></div>
                                                        <input type="range" min="0" max="0.5" step="0.01" value={bgMusicVolume} onChange={(e) => setBgMusicVolume(parseFloat(e.target.value))} className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                                    </div>
                                                    <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                                                        <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                        <div className="flex-1">
                                                            <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Smart Ducking (Auto)</p>
                                                            <p className="text-[10px] text-indigo-700 dark:text-indigo-400/70">Reduz música ao falar.</p>
                                                        </div>
                                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* BRANDING CONTROLS */}
                                    {activeStudioTab === 'brand' && (
                                        <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                                            <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors" onClick={() => logoInputRef.current?.click()}>
                                                {channelLogo ? <img src={channelLogo.url} className="h-10 mx-auto object-contain mb-2" /> : <ImagePlus className="w-6 h-6 text-indigo-500 mx-auto mb-2" />}
                                                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{channelLogo ? "Alterar Logo" : "Upload Logo do Canal"}</p>
                                                <p className="text-[10px] text-zinc-400 mt-1">PNG Transparente recomendado</p>
                                                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                                            </div>

                                            {channelLogo && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Posição X</label>
                                                        <input type="range" min="0" max="1" step="0.01" value={channelLogo.x} onChange={(e) => setChannelLogo({...channelLogo, x: parseFloat(e.target.value)})} className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Posição Y</label>
                                                        <input type="range" min="0" max="1" step="0.01" value={channelLogo.y} onChange={(e) => setChannelLogo({...channelLogo, y: parseFloat(e.target.value)})} className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Tamanho (Escala)</label>
                                                        <input type="range" min="0.1" max="2" step="0.1" value={channelLogo.scale} onChange={(e) => setChannelLogo({...channelLogo, scale: parseFloat(e.target.value)})} className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                                    </div>
                                                    <button onClick={() => setChannelLogo(undefined)} className="w-full py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors mt-2">Remover Logo</button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* EXPORT CONTROLS */}
                                    {activeStudioTab === 'export' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                                            <button onClick={() => playerRef.current?.startRecording(false)} disabled={isGenerating || isPlaying || isReviewing} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-all text-sm disabled:opacity-50 shadow-lg"><Download className="w-5 h-5" /> Exportar HD (720p)</button>
                                            
                                            <button onClick={() => { if(userTier === UserTier.FREE) { setShowUpgradeModal(true); } else { playerRef.current?.startRecording(true); } }} disabled={isGenerating || isPlaying || isReviewing} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold transition-all text-sm relative overflow-hidden group disabled:opacity-50 shadow-lg hover:shadow-amber-500/20"><Crown className="w-5 h-5" /> Exportar 4K Ultra HD {userTier === UserTier.FREE && ( <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity"><Lock className="w-5 h-5 text-white" /></div> )}</button>
                                            
                                            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                                <button onClick={handleExportScript} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs font-medium transition-colors"><Save className="w-4 h-4" /> Salvar Projeto (JSON)</button>
                                            </div>

                                            <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-lg p-3">
                                                 <div onClick={handleForceRegenerateAll} className="cursor-pointer flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white transition-colors">
                                                     <span className="flex items-center gap-2"><RefreshCcw className="w-3 h-3"/> Regenerar Tudo</span>
                                                     <span>{isGenerating ? "..." : "Iniciar"}</span>
                                                 </div>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                         </div>
                    </div>

                    {/* TIMELINE COLUMN (RIGHT) */}
                    <div className="flex-1 h-full bg-white dark:bg-zinc-950 flex flex-col overflow-y-auto custom-scrollbar relative" id="timeline-container">
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-3 sticky top-0 z-20 backdrop-blur-md">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Layers className="w-4 h-4" /> {translations[lang].timeline}</h3>
                                    <button onClick={handleSelectAll} className="text-[10px] px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-indigo-500 hover:text-white transition-colors">{selectedSceneIds.size === scenes.length ? "Desmarcar Todos" : "Selecionar Todos"}</button>
                                </div>
                                <div className="flex gap-2 text-xs">
                                    <div className="bg-zinc-200 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-600 dark:text-zinc-400 font-medium">Cenas: {scenes.length}</div>
                                </div>
                            </div>
                            
                            {/* BULK ACTIONS BAR (Only shows when scenes selected) */}
                            {selectedSceneIds.size > 0 && (
                                <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                                    <button onClick={() => handleBulkRegenerate('images')} className="flex-1 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px] font-bold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1"><ImagePlus className="w-3 h-3"/> Re-Imaginar ({selectedSceneIds.size})</button>
                                    <button onClick={() => handleBulkRegenerate('audio')} className="flex-1 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px] font-bold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1"><Volume2 className="w-3 h-3"/> Re-Dublar ({selectedSceneIds.size})</button>
                                    <button onClick={handleBulkDelete} className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            )}
                        </div>

                        <div className="p-4 space-y-4 pb-32">
                            {scenes.map((scene, index) => (
                                <div key={scene.id} onClick={() => setCurrentSceneIndex(index)} className={`group relative flex gap-4 p-4 rounded-xl border transition-all cursor-pointer ${currentSceneIndex === index ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'} ${selectedSceneIds.has(scene.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/30' : ''}`}>
                                    {/* Selection Checkbox */}
                                    <div onClick={(e) => { e.stopPropagation(); handleToggleSelectScene(scene.id); }} className="absolute -left-2 -top-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity p-2 cursor-pointer" style={{ opacity: selectedSceneIds.has(scene.id) ? 1 : undefined }}>{selectedSceneIds.has(scene.id) ? ( <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-md"><CheckSquare className="w-4 h-4 text-white" /></div> ) : ( <div className="w-6 h-6 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-full flex items-center justify-center shadow-md"><SquareIcon className="w-4 h-4 text-zinc-400" /></div> )}</div>
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-black shrink-0 overflow-hidden relative border border-zinc-200 dark:border-zinc-800">
                                        {scene.isGeneratingImage ? ( <div className="absolute inset-0 flex items-center justify-center bg-zinc-900"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div> ) : scene.mediaType === 'video' && scene.videoUrl ? ( <video src={scene.videoUrl} className="w-full h-full object-cover" muted /> ) : ( <img src={scene.imageUrl} className="w-full h-full object-cover" loading="lazy" /> )}
                                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 rounded font-mono">{index + 1}</div>
                                        {scene.mediaType === 'video' && ( <div className="absolute top-1 right-1"><Film className="w-3 h-3 text-white drop-shadow-md" /></div> )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex flex-col"><span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{scene.speaker}</span><span className="text-[9px] text-zinc-400">{scene.assignedVoice || 'Fenrir'}</span></div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); regenerateSceneAsset(index, 'image'); }} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-500 dark:text-zinc-400" title="Regenerar Imagem"><RefreshCcw className="w-3.5 h-3.5" /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingScene(scene); }} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-500 dark:text-zinc-400" title="Editar Cena"><Edit2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-3 leading-relaxed">{scene.text}</p>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2">
                                            {scene.audioError ? ( <span className="text-[10px] text-red-500 flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" /> Erro Áudio</span> ) : scene.isGeneratingAudio ? ( <span className="text-[10px] text-zinc-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Gerando voz...</span> ) : scene.audioUrl ? ( <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium"><Volume2 className="w-3 h-3" /> Áudio OK</span> ) : ( <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium opacity-60"><MicOff className="w-3 h-3" /> Sem Áudio</span> )}
                                            {scene.layers && scene.layers.length > 0 && ( <span className="text-[10px] text-amber-500 flex items-center gap-1 font-medium"><Layers className="w-3 h-3" /> {scene.layers.length} Camadas</span> )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={handleAddScene} className="w-full py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl flex items-center justify-center gap-2 text-zinc-400 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"><Plus className="w-6 h-6 group-hover:scale-110 transition-transform" /><span className="font-bold text-sm">Adicionar Nova Cena</span></button>
                        </div>
                    </div>
                </div>
            ) : (
                // ... (Empty State Dashboard - Unchanged) ...
                 isGenerating ? (
                   <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in fade-in duration-500">
                       <Loader2 className="w-16 h-16 text-indigo-600 dark:text-indigo-500 animate-spin" />
                       <div className="space-y-2 max-w-md">
                           <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{translations[lang].loadingVideo}</h3>
                           <p className="text-zinc-500 dark:text-zinc-400 text-sm font-mono">{progress}</p>
                           <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-4">{translations[lang].loadingDesc}</p>
                       </div>
                   </div>
                ) : (
                   <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-black/50">
                       <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div onClick={() => setActiveTab('create')} className="group cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:border-indigo-500 transition-all flex flex-col items-center text-center space-y-4 relative overflow-hidden"><div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div><div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><Wand2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /></div><h3 className="text-xl font-bold text-zinc-900 dark:text-white">Criar com IA</h3><p className="text-sm text-zinc-500 dark:text-zinc-400">Geração automática de roteiro, imagens e voz a partir de um tema.</p><span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-4 flex items-center gap-1">Iniciar Wizard <ChevronRight className="w-3 h-3"/></span></div>
                           <div onClick={handleCreateManualProject} className="group cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:border-emerald-500 transition-all flex flex-col items-center text-center space-y-4 relative overflow-hidden"><div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div><div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><Edit2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" /></div><h3 className="text-xl font-bold text-zinc-900 dark:text-white">Editor Manual</h3><p className="text-sm text-zinc-500 dark:text-zinc-400">Comece do zero. Crie cenas manualmente, digite textos e escolha mídias.</p><span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-4 flex items-center gap-1">Abrir Editor <ChevronRight className="w-3 h-3"/></span></div>
                           <div onClick={() => importInputRef.current?.click()} className="group cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:border-amber-500 transition-all flex flex-col items-center text-center space-y-4 relative overflow-hidden"><div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div><div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><FolderOpen className="w-8 h-8 text-amber-600 dark:text-amber-400" /></div><h3 className="text-xl font-bold text-zinc-900 dark:text-white">Importar Roteiro</h3><p className="text-sm text-zinc-500 dark:text-zinc-400">Carregue um arquivo .json de um projeto salvo anteriormente.</p><span className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-4 flex items-center gap-1">Upload Arquivo <ChevronRight className="w-3 h-3"/></span></div>
                       </div>
                   </div>
                )
            )
        )}
        
        <input type="file" ref={importInputRef} onChange={handleImportScript} className="hidden" accept=".json" />

        {/* TAB: METADATA */}
        {activeTab === 'metadata' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-3xl mx-auto space-y-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Hash className="w-6 h-6" /> Viral Metadata Generator
                    </h2>
                    
                    {/* INPUT SECTION */}
                    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
                        <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">Gerador Independente</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Tópico / Título Base</label>
                                <input 
                                    value={metaTopic}
                                    onChange={(e) => setMetaTopic(e.target.value)}
                                    placeholder="Ex: Como ganhar dinheiro na internet" 
                                    className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Contexto (Opcional)</label>
                                <input 
                                    value={metaContext}
                                    onChange={(e) => setMetaContext(e.target.value)}
                                    placeholder="Ex: Focado em marketing digital para iniciantes" 
                                    className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleGenerateViralMetadata}
                            disabled={isGeneratingMeta}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                        >
                            {isGeneratingMeta ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            {isGeneratingMeta ? "Gerando Ouro..." : "Gerar Títulos Virais & SEO"}
                        </button>
                    </div>

                    {/* RESULTS SECTION */}
                    {viralMetaResult && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4">
                            
                            {/* TITLES */}
                            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">5 Títulos Clickbait (Impossível não clicar)</label>
                                <div className="space-y-2">
                                    {viralMetaResult.titles.map((t, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="flex-1 text-sm font-bold text-zinc-800 dark:text-white bg-zinc-100 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                                {t}
                                            </div>
                                            <button onClick={() => copyToClipboard(t)} className="p-3 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-zinc-500 hover:text-indigo-500 transition-colors"><Copy className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* DESCRIPTION */}
                            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-2 relative group">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Descrição (AIDA Framework)</label>
                                    <button onClick={() => copyToClipboard(viralMetaResult.description)} className="text-xs flex items-center gap-1 text-indigo-500 font-bold hover:underline"><Copy className="w-3 h-3" /> Copiar Tudo</button>
                                </div>
                                <div className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap bg-zinc-50 dark:bg-black p-4 rounded-lg border border-transparent focus:border-indigo-500 transition-colors max-h-60 overflow-y-auto custom-scrollbar">
                                    {viralMetaResult.description}
                                </div>
                            </div>

                            {/* TAGS */}
                            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-2 relative">
                                <div className="flex items-center justify-between">
                                     <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tags (Pronto para Copiar e Colar)</label>
                                     <button onClick={() => copyToClipboard(viralMetaResult.tags)} className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-500 transition-colors flex items-center gap-1"><Copy className="w-3 h-3" /> Copiar Lista</button>
                                </div>
                                <textarea 
                                    readOnly 
                                    value={viralMetaResult.tags} 
                                    className="w-full h-24 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs text-zinc-600 dark:text-zinc-400 font-mono resize-none focus:outline-none"
                                />
                            </div>

                        </div>
                    )}

                    {/* EXISTING METADATA FROM PROJECT */}
                    {scenes.length > 0 && (
                        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
                             <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Metadados do Projeto Atual</h3>
                             {metadata ? (
                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{translations[lang].title}</label>
                                        <div className="text-lg font-medium text-zinc-900 dark:text-white select-all bg-zinc-50 dark:bg-black p-3 rounded-lg">{metadata.title}</div>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{translations[lang].description}</label>
                                        <div className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap select-all bg-zinc-50 dark:bg-black p-3 rounded-lg">{metadata.description}</div>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{translations[lang].tags}</label>
                                        <div className="flex flex-wrap gap-2">
                                            {metadata.tags.map(tag => ( <span key={tag} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-100 dark:border-indigo-500/30">#{tag}</span> ))}
                                        </div>
                                    </div>
                                    {thumbnails.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{translations[lang].suggestedThumbs}</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {thumbnails.map((thumb, idx) => (
                                                    <div key={idx} className="group relative aspect-video bg-zinc-100 dark:bg-black rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                                                        <img src={thumb} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                                        <button onClick={() => { const a = document.createElement('a'); a.href = thumb; a.download = `thumbnail_${idx}.png`; a.click(); }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs"><Download className="w-4 h-4 mr-1"/> Baixar</button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={() => generateThumbnails(topic, style, thumbProvider).then(setThumbnails)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"><RefreshCcw className="w-3 h-3"/> {translations[lang].regenerateThumbs}</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                                    <p>{translations[lang].noScenesYet}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: SETTINGS */}
                {activeTab === 'settings' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                        <div className="max-w-2xl mx-auto space-y-8">
                             <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Settings className="w-6 h-6" /> {translations[lang].settings}</h2>
                             
                             <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
                                 <div>
                                     <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Key className="w-4 h-4 text-indigo-500" /> {translations[lang].keysTitle}</h3>
                                     <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{translations[lang].keysDesc}</p>
                                 </div>
                                 <textarea value={manualKeys} onChange={(e) => updateKeys(e.target.value)} className="w-full h-32 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-600 dark:text-zinc-300 outline-none focus:border-indigo-500 resize-none" placeholder="AIzaSy..." />
                                 <div className="flex justify-between items-center">
                                     <div className="flex items-center gap-2">
                                         <div className={`w-2 h-2 rounded-full ${apiKeyCount > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                         <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{apiKeyCount} {translations[lang].activeKeys}</span>
                                     </div>
                                     <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">{translations[lang].getKey} <ChevronRight className="w-3 h-3" /></a>
                                 </div>
                             </div>

                             <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
                                 <div>
                                     <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Video className="w-4 h-4 text-emerald-500" /> {translations[lang].pexelsTitle}</h3>
                                     <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{translations[lang].pexelsDesc}</p>
                                 </div>
                                 <input type="text" value={pexelsKey} onChange={(e) => updatePexelsKey(e.target.value)} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-600 dark:text-zinc-300 outline-none focus:border-emerald-500" placeholder="Pexels API Key..." />
                             </div>
                             
                             <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex gap-3">
                                 <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
                                 <div>
                                     <h4 className="font-bold text-sm text-amber-800 dark:text-amber-400">{translations[lang].localSecurity}</h4>
                                     <p className="text-xs text-amber-700 dark:text-amber-500/80 mt-1">{translations[lang].localSecDesc}</p>
                                 </div>
                             </div>
                        </div>
                    </div>
                )}

            </main>

            {/* MODALS */}
            {showWelcomeModal && <WelcomeModal onClose={handleCloseWelcome} lang={lang} t={translations} />}
            {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} onUpgrade={handleUpgrade} lang={lang} t={translations} />}
            {editingScene && (
                <EditSceneModal 
                    scene={editingScene} 
                    onClose={() => setEditingScene(null)} 
                    onSave={saveSceneUpdate} 
                    onRegenerateAsset={handleSceneAssetRegeneration}
                    onRegenerateAudio={handleSceneAudioRegeneration}
                    lang={lang}
                    userTier={userTier}
                    format={format}
                    t={translations}
                />
            )}

        </div>
    );
};

export default App;
