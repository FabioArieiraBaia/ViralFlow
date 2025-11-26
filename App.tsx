
import React, { useState, useRef, useEffect } from 'react';
import { VideoStyle, VideoDuration, Scene, VideoPacing, VideoFormat, VideoMetadata, SubtitleStyle, ImageProvider, UserTier, VideoFilter, MusicAction, Language, Theme, OverlayConfig, VideoTransition, PollinationsModel, ParticleEffect, GeminiModel } from './types';
import { generateVideoScript, generateSpeech, generateSceneImage, generateThumbnails, generateMetadata, getApiKeyCount, saveManualKeys, getManualKeys, savePexelsKey, getPexelsKey, savePollinationsToken, getPollinationsToken } from './services/geminiService';
import { translations } from './services/translations';
import { triggerBrowserDownload } from './services/fileSystem';
import VideoPlayer, { VideoPlayerRef } from './components/VideoPlayer';
import { WelcomeModal, UpgradeModal, EditSceneModal } from './components/Modals';
import { Wand2, Film, Download, Loader2, Layers, Zap, Monitor, Music, Smartphone, Image as ImageIcon, Hash, Settings, AlertCircle, CheckCircle2, Crown, Key, Copy, ShieldCheck, RefreshCcw, X, Upload, ZapIcon, Music2, Info, Sparkles, Globe, Sun, Moon, TriangleAlert, Sticker, ImagePlus, ArrowRightLeft, MessageCircle, Captions, Volume2, Lock, Youtube, Edit2, Play, ChevronRight, Terminal } from 'lucide-react';

// --- SALES & SECURITY CONFIG ---
// Safe access to environment variables
const env = (import.meta as any).env || {};
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

// --- LANDING SCREEN COMPONENT (3D HIGH TECH) ---
const LandingScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isExiting, setIsExiting] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const { innerWidth, innerHeight } = window;
                const x = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
                const y = (e.clientY / innerHeight - 0.5) * 2;
                setMousePos({ x, y });
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleEnter = () => {
        setIsExiting(true);
        setTimeout(onComplete, 800); // Wait for animation
    };

    return (
        <div 
            ref={containerRef}
            className={`fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ${isExiting ? 'opacity-0 scale-110 blur-xl' : 'opacity-100'}`}
        >
            {/* Dynamic Background Grid */}
            <div className="scene-3d absolute inset-0 w-full h-full pointer-events-none">
                <div className="grid-floor"></div>
                
                {/* Parallax Stars */}
                <div 
                    className="absolute inset-0 transition-transform duration-100 ease-out"
                    style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)` }}
                >
                    {[...Array(50)].map((_, i) => (
                        <div 
                            key={i}
                            className="absolute rounded-full bg-white animate-pulse"
                            style={{
                                width: Math.random() * 2 + 'px',
                                height: Math.random() * 2 + 'px',
                                top: Math.random() * 100 + '%',
                                left: Math.random() * 100 + '%',
                                opacity: Math.random() * 0.5 + 0.1,
                                animationDuration: Math.random() * 3 + 2 + 's'
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Central 3D Reactor */}
            <div 
                className="scene-3d mb-12"
                style={{ 
                    transform: `rotateY(${mousePos.x * 20}deg) rotateX(${mousePos.y * -20}deg)`,
                    transition: 'transform 0.1s ease-out'
                }}
            >
                <div className="reactor-container">
                    <div className="reactor-ring ring-1"></div>
                    <div className="reactor-ring ring-2"></div>
                    <div className="reactor-ring ring-3"></div>
                    <div className="core-glow"></div>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center space-y-6">
                <div className="space-y-2">
                     <div className="flex items-center justify-center gap-2 text-indigo-500 font-mono text-xs tracking-[0.2em] uppercase animate-pulse">
                        <Terminal className="w-3 h-3" /> System Ready
                     </div>
                     <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-purple-400 tracking-tighter drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                        ViralFlow
                     </h1>
                     <div className="flex items-center justify-center gap-3">
                        <span className="h-[1px] w-12 bg-zinc-700"></span>
                        <span className="text-zinc-400 font-mono text-sm">AI VIDEO GENERATOR 2.5</span>
                        <span className="h-[1px] w-12 bg-zinc-700"></span>
                     </div>
                </div>

                <button 
                    onClick={handleEnter}
                    className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-none mt-8 transition-all hover:tracking-widest"
                >
                    <div className="absolute inset-0 w-full h-full bg-indigo-600/10 border border-indigo-500/50 skew-x-[-20deg]"></div>
                    <div className="absolute inset-0 w-0 h-full bg-indigo-600/80 skew-x-[-20deg] transition-all duration-300 ease-out group-hover:w-full"></div>
                    
                    <span className="relative flex items-center gap-3 text-indigo-300 group-hover:text-white font-bold font-mono uppercase tracking-wider transition-colors">
                        Initialize <ChevronRight className="w-4 h-4" />
                    </span>
                </button>

                <p className="text-zinc-600 text-[10px] font-mono mt-8">
                    POWERED BY GOOGLE GEMINI 2.5 &bull; ELECTRON &bull; REACT
                </p>
            </div>
            
            {/* Vignette */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-black pointer-events-none"></div>
        </div>
    );
}

// All Gemini 2.5 Flash Audio Voices
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
  
  // Specific voices suitable for different roles
  const maleVoices = ['Fenrir', 'Charon', 'Zephyr'];
  const femaleVoices = ['Puck', 'Kore', 'Aoede'];
  const narratorVoice = 'Fenrir';
  
  // Logic for DEBATE Style
  if (style === VideoStyle.DEBATE) {
      cast['Host'] = 'Zephyr'; // Neutral/Calm
      cast['Proponent'] = 'Kore'; // Sharp/Tech
      cast['Opponent'] = 'Charon'; // Deep/Serious
  }

  // Logic for KIDS STORY
  else if (style === VideoStyle.KIDS_STORY) {
      cast['Narrator'] = 'Puck'; // Soft/Storyteller
      cast['Wolf'] = 'Fenrir'; // Deep/Scary
      cast['Bear'] = 'Charon'; // Deep
      cast['Fairy'] = 'Aoede'; // Dramatic/High
      cast['Princess'] = 'Kore'; 
  }

  // Logic for NEWS
  else if (style === VideoStyle.NEWS) {
      cast['Anchor'] = 'Fenrir'; // Authoritative
      cast['Reporter'] = 'Puck'; // Clear
      cast['Witness'] = 'Zephyr'; // Normal
  }

  let maleIdx = 0, femaleIdx = 0, neutralIdx = 0;
  
  uniqueSpeakers.forEach(speaker => {
     if (cast[speaker]) return; // Already casted by special logic above

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
  const [showLanding, setShowLanding] = useState(true); // Controla a tela de entrada
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
  const [progress, setProgress] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'create'|'preview'|'metadata'|'settings'>('create');
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

  const cancelRef = useRef(false);
  const playerRef = useRef<VideoPlayerRef>(null);

  useEffect(() => {
      if (theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
      // Capture the correct origin/host after mount
      if (typeof window !== 'undefined') {
          // Priority to host (domain:port) as it is usually what's needed for Referrer matching
          // Fallback to origin if host is empty
          setCurrentUrl(window.location.host || window.location.origin);
      }
  }, []);

  useEffect(() => {
      const savedKey = localStorage.getItem('viralflow_pro_key');
      if (savedKey) {
          if (savedKey === MASTER_KEY || verifyLocalKey(savedKey)) {
             setUserTier(UserTier.PRO);
             setUserKey(savedKey);
          }
      }
      const seenWelcome = sessionStorage.getItem('viralflow_welcome_seen');
      if (seenWelcome) setShowWelcomeModal(false);
  }, []);

  const handleUpgrade = async (keyInput: string): Promise<boolean> => {
      const input = keyInput.trim();
      
      // Master Key Check (Case Insensitive for user convenience)
      if (input === MASTER_KEY || input.toUpperCase() === MASTER_KEY) {
          setUserTier(UserTier.PRO);
          localStorage.setItem('viralflow_pro_key', MASTER_KEY); 
          setUserKey(MASTER_KEY);
          return true;
      }

      // License Key Check
      if (verifyLocalKey(input)) {
          setUserTier(UserTier.PRO);
          const formattedKey = input.toUpperCase(); 
          localStorage.setItem('viralflow_pro_key', formattedKey);
          setUserKey(formattedKey);
          return true;
      }
      
      return false;
  };

  const handleCloseWelcome = () => {
      setShowWelcomeModal(false);
      sessionStorage.setItem('viralflow_welcome_seen', 'true');
  };

  const handleSceneAssetRegeneration = async (scene: Scene, provider: ImageProvider, pollinationsModel?: PollinationsModel, geminiModel?: GeminiModel): Promise<any> => {
      const index = scenes.findIndex(s => s.id === scene.id);
      const idx = index >= 0 ? index : 0;
      try {
          const result = await generateSceneImage(scene.visualPrompt, format, idx, topic, provider, style, pollinationsModel || 'turbo', geminiModel);
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
         // Uses the newly assignedVoice if it was changed in the modal
         const audioResult = await generateSpeech(scene.text, scene.speaker, scene.assignedVoice || 'Fenrir', idx, topic);
         return { ...audioResult, success: true };
      } catch (e) {
          console.error("Regeneration failed", e);
          return { success: false };
      }
  };

  const handleGenerateVideo = async () => {
    if (isGenerating) { cancelRef.current = true; return; }
    if (getApiKeyCount() === 0) { alert(translations[lang].pleaseConfig); setActiveTab('settings'); return; }
    if (imageProvider === ImageProvider.STOCK_VIDEO && !pexelsKey) { alert(translations[lang].pleasePexels); setActiveTab('settings'); return; }
    
    setIsGenerating(true);
    cancelRef.current = false;
    setScenes([]);
    setProgress(translations[lang].initializing);
    setActiveTab('preview'); 

    try {
      setProgress(translations[lang].writingScript);
      const durMinutes = duration === VideoDuration.SHORT ? 0.8 : (duration === VideoDuration.MEDIUM ? 3 : 8);
      const rawScript = await generateVideoScript(topic, style, durMinutes, pacing, channelName, contentLang, () => cancelRef.current);
      
      let minDuration = 3; 
      if (pacing === VideoPacing.HYPER) minDuration = 1.5;
      if (pacing === VideoPacing.FAST) minDuration = 2.5;
      if (pacing === VideoPacing.SLOW) minDuration = 6;

      let newScenes: Scene[] = rawScript.map((item, idx) => ({
        id: `scene-${idx}`,
        speaker: item.speaker,
        text: item.text,
        visualPrompt: item.visual_prompt,
        durationEstimate: Math.max(minDuration, item.text.split(' ').length * 0.4), 
        mediaType: 'image',
        imageUrl: '', 
        isGeneratingImage: true,
        isGeneratingAudio: true,
        audioError: false
      }));

      // Apply Auto Casting logic passing the current Style
      if (voice === 'Auto') newScenes = performAutoCasting(newScenes, style);
      else newScenes = newScenes.map(s => ({ ...s, assignedVoice: voice === 'Custom' ? customVoice : voice }));

      setScenes(newScenes);
      // setBgMusicUrl(""); // Do not reset if user set it before, or maybe yes? Let's keep manual selection.

      for (let i = 0; i < newScenes.length; i++) {
        if (cancelRef.current) break;
        setProgress(`${translations[lang].producingScene} ${i + 1} / ${newScenes.length}...`);
        const scene = newScenes[i];
        
        let safeImageProvider = imageProvider;
        
        if (imageProvider === ImageProvider.NONE) {
            safeImageProvider = ImageProvider.NONE;
        } else if (imageProvider === ImageProvider.GEMINI) {
            safeImageProvider = ImageProvider.POLLINATIONS;
        }

        const audioPromise = generateSpeech(scene.text, scene.speaker, scene.assignedVoice || 'Fenrir', i, topic, () => cancelRef.current)
            .then(audio => ({ ...audio, success: true }))
            .catch(e => ({ url: '', buffer: undefined, success: false }));
            
        const imagePromise = generateSceneImage(scene.visualPrompt, format, i, topic, safeImageProvider, style, 'turbo', 'gemini-2.5-flash-image', () => cancelRef.current)
            .then(img => ({ ...img, success: true }))
            .catch(e => ({ imageUrl: '', mediaType: 'image' as const, success: false, videoUrl: undefined }));

        const [audioResult, imageResult] = await Promise.all([audioPromise, imagePromise]);
        if (cancelRef.current) break;

        setScenes(prev => {
            const updated = [...prev];
            updated[i] = {
                ...updated[i],
                audioUrl: audioResult.success ? audioResult.url : undefined,
                audioBuffer: audioResult.success ? audioResult.buffer : undefined,
                audioError: !audioResult.success,
                imageUrl: imageResult.success ? imageResult.imageUrl : "https://placehold.co/1280x720/333/FFF.png?text=Error", 
                videoUrl: imageResult.videoUrl,
                mediaType: imageResult.mediaType,
                isGeneratingAudio: false,
                isGeneratingImage: false
            };
            return updated;
        });
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      if (!cancelRef.current) {
          setProgress(translations[lang].renderComplete);
          generateMetadata(topic, JSON.stringify(rawScript), () => cancelRef.current).then(setMetadata).catch(console.error);
          generateThumbnails(topic, style, thumbProvider, () => cancelRef.current).then(setThumbnails).catch(console.error);
          setIsPlaying(true);
      } else { setProgress(translations[lang].cancelGen); }

    } catch (error: any) {
      if (error.message === "Cancelled" || error.message === "CANCELLED_BY_USER") setProgress(translations[lang].cancelGen);
      else { console.error(error); alert(`${translations[lang].errorGen} ${error.message}`); setProgress(translations[lang].fatalError); }
    } finally { setIsGenerating(false); cancelRef.current = false; }
  };

  const updateKeys = (val: string) => { setManualKeys(val); saveManualKeys(val); setApiKeyCount(getApiKeyCount()); };
  const updatePexelsKey = (val: string) => { setPexelsKeyInput(val); savePexelsKey(val); };
  const updatePollinationsToken = (val: string) => { setPollinationsToken(val); savePollinationsToken(val); };
  const handleGenerateLicense = () => { const key = generateLicenseKey(); setGeneratedAdminKey(key); };
  
  const handleCopyOrigin = () => {
     if (!currentUrl) return;
     navigator.clipboard.writeText(currentUrl);
     setCopiedOrigin(true);
     setTimeout(() => setCopiedOrigin(false), 2000);
  };

  const regenerateSceneAsset = async (index: number, type: 'image') => {
      if (isGenerating) return;
      const scene = scenes[index];
      if (!scene) return;
      setScenes(prev => { const updated = [...prev]; updated[index] = { ...updated[index], isGeneratingImage: true }; return updated; });
      try {
          const result = await generateSceneImage(scene.visualPrompt, format, index, topic, imageProvider, style, 'turbo');
          setScenes(prev => {
              const updated = [...prev];
              updated[index] = { ...updated[index], imageUrl: result.imageUrl, videoUrl: result.videoUrl, mediaType: result.mediaType, isGeneratingImage: false };
              return updated;
          });
      } catch (e) {
          console.error("Quick Regen Failed", e);
          setScenes(prev => { const updated = [...prev]; updated[index] = { ...updated[index], isGeneratingImage: false }; return updated; });
      }
  };

  const saveSceneUpdate = (updated: Scene) => { setScenes(prev => prev.map(s => s.id === updated.id ? updated : s)); setEditingScene(null); };
  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) setBgMusicUrl(URL.createObjectURL(file)); };
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) setChannelLogo({ url: URL.createObjectURL(file), x: 0.8, y: 0.05, scale: 1.0 }); };
  const handleMusicSelection = (val: string) => { if (val === 'upload') musicInputRef.current?.click(); else if (val === 'none') setBgMusicUrl(""); };
  const currentMusicId = bgMusicUrl ? 'custom' : 'none';

  // RENDER LANDING OR APP
  if (showLanding) {
      return <LandingScreen onComplete={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500/30 flex flex-col overflow-hidden transition-colors duration-300 animate-in fade-in duration-1000">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20"><Zap className="w-5 h-5 text-white" /></div>
            <h1 className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white">ViralFlow <span className="text-indigo-600 dark:text-indigo-400">AI</span></h1>
            {userTier === UserTier.FREE ? (<span onClick={() => setShowUpgradeModal(true)} className="cursor-pointer px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">{translations[lang].free}</span>) : (<span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 border border-amber-400/50 text-[10px] font-bold text-black shadow-sm">{translations[lang].pro}</span>)}
        </div>
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
            {[{id: 'create', label: translations[lang].tabCreate, icon: Wand2}, {id: 'preview', label: translations[lang].tabEditor, icon: Film}, {id: 'metadata', label: translations[lang].tabMeta, icon: Hash}, {id: 'settings', label: translations[lang].tabConfig, icon: Settings}].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}><tab.icon className="w-4 h-4" /> {tab.label}</button>
            ))}
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><button onClick={() => setLang(prev => prev === 'pt' ? 'en' : prev === 'en' ? 'es' : 'pt')} className="px-3 py-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800"><span className="font-bold text-xs text-zinc-600 dark:text-zinc-300">{lang.toUpperCase()}</span></button><button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">{theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}</button></div>
            <div className="flex flex-col items-end"><span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{translations[lang].activeKeys}</span><div className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${apiKeyCount > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></span><span className="text-sm font-bold text-zinc-900 dark:text-white">{apiKeyCount}</span></div></div>
            <button onClick={() => setShowUpgradeModal(true)} className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg hover:shadow-amber-500/20 flex items-center gap-2"><Crown className="w-4 h-4" /> {userTier === UserTier.FREE ? translations[lang].upgradeBtn : translations[lang].licenseActiveBtn}</button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative flex">
        {activeTab === 'create' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="text-center space-y-4 py-8"><h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{translations[lang].whatCreate}</h2><p className="text-zinc-500 dark:text-zinc-400 text-lg">{translations[lang].appDesc}</p></div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 flex items-start gap-3 shadow-sm"><TriangleAlert className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" /><div><h3 className="font-bold text-amber-800 dark:text-amber-400 text-sm mb-1">{translations[lang].copyrightWarning}</h3><p className="text-xs text-amber-700 dark:text-amber-300/80 leading-relaxed">{translations[lang].copyrightBody}</p></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                             <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].videoTopic}</label><textarea value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-lg text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-sm dark:shadow-inner" placeholder={translations[lang].topicPlaceholder} rows={3}/></div>
                             <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2"><Globe className="w-3 h-3" /> {translations[lang].videoLang}</label><div className="grid grid-cols-3 gap-2">{[{ id: 'pt', label: '🇧🇷 Português' }, { id: 'en', label: '🇺🇸 English' }, { id: 'es', label: '🇪🇸 Español' }].map((l) => (<button key={l.id} onClick={() => setContentLang(l.id as Language)} className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${contentLang === l.id ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'}`}>{l.label}</button>))}</div></div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].visualStyle}</label><select value={style} onChange={(e) => setStyle(e.target.value as VideoStyle)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none">{Object.values(VideoStyle).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].pacing}</label><select value={pacing} onChange={(e) => setPacing(e.target.value as VideoPacing)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none">{Object.values(VideoPacing).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].format}</label><div className="grid grid-cols-2 gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800"><button onClick={() => setFormat(VideoFormat.PORTRAIT)} className={`flex flex-col items-center gap-1 p-2 rounded-md transition-all ${format === VideoFormat.PORTRAIT ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}><Smartphone className="w-4 h-4" /> <span className="text-xs font-bold">Shorts</span></button><button onClick={() => setFormat(VideoFormat.LANDSCAPE)} className={`flex flex-col items-center gap-1 p-2 rounded-md transition-all ${format === VideoFormat.LANDSCAPE ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}><Monitor className="w-4 h-4" /> <span className="text-xs font-bold">Vídeo</span></button></div></div>
                                 <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].duration}</label><select value={duration} onChange={(e) => setDuration(e.target.value as VideoDuration)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none">{Object.values(VideoDuration).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                             </div>
                        </div>
                        <div className="space-y-6">
                             <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].channelName}</label><div className="relative"><Youtube className="absolute left-3 top-3 w-5 h-5 text-zinc-500" /><input value={channelName} onChange={(e) => setChannelName(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none"/></div></div>
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">{translations[lang].narrator} {userTier === UserTier.FREE && <Lock className="w-3 h-3" />}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {VOICE_OPTIONS.map(v => (
                                        <button key={v.id} onClick={() => { if (userTier === UserTier.PRO) setVoice(v.id); else setShowUpgradeModal(true); }} className={`text-left px-3 py-2 rounded-lg text-xs border transition-all ${voice === v.id ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-indigo-700 dark:text-white' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600'} ${userTier === UserTier.FREE && v.id !== 'Auto' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            {v.label}
                                        </button>
                                    ))}
                                </div>
                                {voice === 'Custom' && userTier === UserTier.PRO && (<input type="text" value={customVoice} onChange={(e) => setCustomVoice(e.target.value)} placeholder="Nome da voz (ex: en-US-Studio-M)" className="w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none" />)}
                             </div>
                             <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">{translations[lang].imageProvider}{imageProvider === ImageProvider.GEMINI && <span className="text-[10px] text-amber-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {translations[lang].quota}</span>}</label><div className="grid grid-cols-1 gap-2">{[{id: ImageProvider.GEMINI, label: '✨ Gemini 2.5', sub: 'High Quality (Manual Only)'}, {id: ImageProvider.POLLINATIONS, label: '🎨 Pollinations.ai', sub: 'Turbo Model - Free'}, {id: ImageProvider.STOCK_VIDEO, label: '🎥 Stock Video', sub: 'Real Footage (Pexels)'}, {id: ImageProvider.NONE, label: translations[lang].providerNone, sub: translations[lang].providerNoneSub}].map(p => (<button key={p.id} onClick={() => setImageProvider(p.id as ImageProvider)} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${imageProvider === p.id ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}><div className="text-left"><div className={`font-bold text-sm ${imageProvider === p.id ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>{p.label}</div><div className={`text-xs ${imageProvider === p.id ? 'text-indigo-200' : 'text-zinc-500'}`}>{p.sub}</div></div>{imageProvider === p.id && <CheckCircle2 className="w-5 h-5 text-white" />}</button>))}</div></div>
                             <div className="space-y-2"><div className="flex items-center justify-between"><label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2"><ArrowRightLeft className="w-3 h-3" /> {translations[lang].globalTrans}</label>{userTier === UserTier.FREE && <Lock className="w-3 h-3 text-zinc-500" />}</div><select value={globalTransition} onChange={(e) => setGlobalTransition(e.target.value as VideoTransition)} disabled={userTier === UserTier.FREE} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-indigo-500 outline-none disabled:opacity-50">{Object.values(VideoTransition).map(s => <option key={s} value={s}>{s}</option>)}</select>{userTier === UserTier.FREE && <p className="text-[10px] text-zinc-500 italic text-right">{translations[lang].onlyPro}</p>}</div>
                        </div>
                    </div>
                    <div className="pt-8 flex justify-center"><button id="tour-generate-btn" onClick={handleGenerateVideo} disabled={isGenerating} className="group relative px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full font-black text-lg shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100">{isGenerating ? (<span className="flex items-center gap-3"><Loader2 className="w-6 h-6 animate-spin" /> {progress || translations[lang].generating}</span>) : (<span className="flex items-center gap-3">{translations[lang].generateVideo} <Wand2 className="w-6 h-6 text-indigo-400 dark:text-indigo-600" /></span>)}</button></div>
                </div>
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-2xl mx-auto space-y-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Settings className="w-6 h-6"/> {translations[lang].settings}</h2>
                    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4"><div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{translations[lang].keysTitle}</h3><p className="text-zinc-500 dark:text-zinc-400 text-sm">{translations[lang].keysDesc}</p></div><div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono text-zinc-600 dark:text-zinc-300">{apiKeyCount} {translations[lang].activeKeys}</div></div><textarea value={manualKeys} onChange={(e) => updateKeys(e.target.value)} className="w-full h-32 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 font-mono text-xs text-zinc-600 dark:text-zinc-300 focus:border-indigo-500 outline-none" placeholder="AIzaSy..., AIzaSy..." /><div className="flex justify-end"><a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-indigo-500 dark:text-indigo-400 text-xs hover:underline flex items-center gap-1">{translations[lang].getKey}</a></div></div>
                    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4"><div><h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{translations[lang].pexelsTitle}</h3><p className="text-zinc-500 dark:text-zinc-400 text-sm">{translations[lang].pexelsDesc}</p></div><input type="text" value={pexelsKey} onChange={(e) => updatePexelsKey(e.target.value)} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 font-mono text-sm text-zinc-900 dark:text-white focus:border-indigo-500 outline-none" placeholder="..." /></div>
                    
                    {/* ORIGIN DOMAIN DISPLAY */}
                    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{translations[lang].originDomain}</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm">{translations[lang].originDesc}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="text" 
                                readOnly 
                                value={currentUrl} 
                                className="flex-1 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 font-mono text-sm text-zinc-900 dark:text-white outline-none" 
                            />
                            <button 
                                onClick={handleCopyOrigin} 
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                            >
                                {copiedOrigin ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copiedOrigin ? translations[lang].copied : translations[lang].copy}
                            </button>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/30 flex gap-4 items-start"><ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-1" /><div><h4 className="font-bold text-indigo-900 dark:text-indigo-200">{translations[lang].localSecurity}</h4><p className="text-xs text-indigo-700 dark:text-indigo-300/80 mt-1">{translations[lang].localSecDesc}</p></div></div>
                    
                    {/* ADMIN AREA - ONLY VISIBLE WITH MASTER KEY */}
                    {userKey === MASTER_KEY && (
                        <div className="border-t border-red-900 pt-8 mt-8">
                            <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2"><Lock className="w-4 h-4"/> Área Administrativa</h3>
                            <div className="bg-red-900/10 border border-red-900/30 p-6 rounded-xl space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-red-400 mb-2">Pollinations Token (Flux/Paid Tier)</label>
                                    <input type="text" value={pollinationsToken} onChange={(e) => updatePollinationsToken(e.target.value)} className="w-full bg-black border border-red-900/50 rounded p-2 text-xs text-white font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-red-400 mb-2">Gerador de Licenças</label>
                                    <div className="flex gap-2">
                                        <button onClick={handleGenerateLicense} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-xs font-bold">GERAR NOVA CHAVE</button>
                                        {generatedAdminKey && <div className="flex-1 bg-black border border-red-900/50 rounded p-2 text-xs text-white font-mono flex items-center justify-between">{generatedAdminKey} <Copy className="w-4 h-4 cursor-pointer" onClick={() => navigator.clipboard.writeText(generatedAdminKey)} /></div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'preview' && (
            scenes.length > 0 ? (
                <div className="flex-1 flex flex-col md:flex-row h-full items-start overflow-hidden">
                    <div className="w-full md:w-1/2 lg:w-2/5 bg-zinc-100 dark:bg-black flex flex-col items-center p-6 border-r border-zinc-200 dark:border-zinc-800 z-10 md:sticky md:top-0 md:h-screen md:overflow-y-auto custom-scrollbar">
                        <div className="w-full max-w-[400px]">
                            <VideoPlayer ref={playerRef} scenes={scenes} currentSceneIndex={currentSceneIndex} setCurrentSceneIndex={setCurrentSceneIndex} isPlaying={isPlaying} setIsPlaying={setIsPlaying} format={format} bgMusicUrl={bgMusicUrl} bgMusicVolume={bgMusicVolume} showSubtitles={showSubtitles} subtitleStyle={subtitleStyle} activeFilter={activeFilter} globalTransition={globalTransition} userTier={userTier} onPlaybackComplete={() => setIsPlaying(false)} channelLogo={channelLogo} onUpdateChannelLogo={setChannelLogo} onUpdateSceneOverlay={(id, cfg) => { setScenes(prev => prev.map(s => s.id === id ? { ...s, overlay: cfg } : s)); }} />
                            <div className="mt-6 space-y-4">
                                <div className="flex gap-3">
                                    <button onClick={() => playerRef.current?.startRecording(false)} disabled={isGenerating || isPlaying} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold transition-colors text-xs"><Download className="w-4 h-4" /> {translations[lang].exportHD}</button>
                                    <button onClick={() => { if (userTier === UserTier.FREE) { setShowUpgradeModal(true); } else { playerRef.current?.startRecording(true); } }} disabled={isGenerating || isPlaying} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold transition-all text-xs relative overflow-hidden group"><Crown className="w-4 h-4" /> {translations[lang].export4k}{userTier === UserTier.FREE && (<div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity"><Lock className="w-4 h-4 text-white" /></div>)}</button>
                                </div>
                                
                                {/* RESTORED GLOBAL AUDIO CONTROL */}
                                <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                            <Music className="w-3 h-3" /> Áudio Global
                                        </div>
                                        <div className="text-[10px] text-zinc-400">{Math.round(bgMusicVolume * 100)}%</div>
                                    </div>
                                    <input type="range" min="0" max="1" step="0.05" value={bgMusicVolume} onChange={(e) => setBgMusicVolume(parseFloat(e.target.value))} className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                    <div className="flex gap-2">
                                        <button onClick={() => musicInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors">
                                            <Upload className="w-3 h-3" /> {bgMusicUrl ? translations[lang].fileUploaded : translations[lang].customAudio}
                                        </button>
                                        <input type="file" ref={musicInputRef} onChange={handleMusicUpload} accept="audio/*" className="hidden" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-lg px-3 border border-zinc-200 dark:border-zinc-800"><Captions className="w-4 h-4 text-zinc-400" /><select value={subtitleStyle} onChange={(e) => setSubtitleStyle(e.target.value as SubtitleStyle)} className="bg-transparent text-xs text-zinc-900 dark:text-white outline-none flex-1 py-3 cursor-pointer">{Object.values(SubtitleStyle).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-lg px-3 border border-zinc-200 dark:border-zinc-800"><Sparkles className="w-4 h-4 text-zinc-400" /><select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as VideoFilter)} className="bg-transparent text-xs text-zinc-900 dark:text-white outline-none flex-1 py-3 cursor-pointer">{Object.values(VideoFilter).map(s => <option key={s} value={s}>Filtro: {s}</option>)}</select></div>
                                <div className="flex items-center justify-center gap-2 mt-1"><label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white select-none"><input type="checkbox" checked={showSubtitles} onChange={(e) => setShowSubtitles(e.target.checked)} className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-indigo-600 focus:ring-indigo-500" />{translations[lang].showSub}</label></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 h-full bg-white dark:bg-zinc-950 flex flex-col overflow-y-auto custom-scrollbar">
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-3">
                            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Layers className="w-4 h-4"/> {translations[lang].timeline}</h3>
                            <div className="flex gap-2 text-xs">
                                <div className="bg-zinc-200 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-600 dark:text-zinc-400 font-medium">Cenas: {scenes.length}</div>
                                {userTier === UserTier.FREE && (<div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 px-3 py-1 rounded-full font-medium flex items-center gap-1"><Lock className="w-3 h-3" /> Modo Grátis</div>)}
                            </div>
                        </div>
                        <div className="p-4 space-y-4 pb-24">
                            {scenes.map((scene, index) => (
                                <div key={scene.id} onClick={() => setCurrentSceneIndex(index)} className={`group relative flex gap-4 p-4 rounded-xl border transition-all cursor-pointer ${currentSceneIndex === index ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'}`}>
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-black shrink-0 overflow-hidden relative border border-zinc-200 dark:border-zinc-800">
                                        {scene.isGeneratingImage ? (<div className="absolute inset-0 flex items-center justify-center bg-zinc-900"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>) : scene.mediaType === 'video' && scene.videoUrl ? (<video src={scene.videoUrl} className="w-full h-full object-cover" muted />) : (<img src={scene.imageUrl} className="w-full h-full object-cover" loading="lazy" />)}
                                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 rounded font-mono">{index + 1}</div>
                                        {scene.mediaType === 'video' && <div className="absolute top-1 right-1"><Film className="w-3 h-3 text-white drop-shadow-md" /></div>}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{scene.speaker}</span>
                                                    <span className="text-[9px] text-zinc-400">{scene.assignedVoice || 'Fenrir'}</span>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); regenerateSceneAsset(index, 'image'); }} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-500 dark:text-zinc-400" title="Regenerar Imagem"><RefreshCcw className="w-3.5 h-3.5" /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingScene(scene); }} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-500 dark:text-zinc-400" title="Editar Cena"><Edit2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-3 leading-relaxed">{scene.text}</p>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2">
                                            {scene.audioError ? (<span className="text-[10px] text-red-500 flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" /> Erro Áudio</span>) : scene.isGeneratingAudio ? (<span className="text-[10px] text-zinc-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Gerando voz...</span>) : (<span className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium"><Volume2 className="w-3 h-3" /> Áudio OK</span>)}
                                            {scene.overlay && <span className="text-[10px] text-amber-500 flex items-center gap-1 font-medium"><ImagePlus className="w-3 h-3" /> Overlay</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in fade-in duration-500">
                    <Loader2 className="w-16 h-16 text-indigo-600 dark:text-indigo-500 animate-spin" />
                    <div className="space-y-2 max-w-md">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{translations[lang].loadingVideo}</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-mono">{progress}</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-4">{translations[lang].loadingDesc}</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-200 dark:border-zinc-800"><Film className="w-10 h-10 text-zinc-400" /></div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{translations[lang].noScenesYet}</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-md">{translations[lang].appDesc}</p>
                    <button onClick={() => setActiveTab('create')} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all">{translations[lang].tabCreate}</button>
                </div>
            )
        )}

        {activeTab === 'metadata' && (
             <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-3xl mx-auto space-y-8">
                     <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Hash className="w-6 h-6"/> {translations[lang].seoOptimized}</h2>
                     {metadata ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-2">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].title}</label>
                                <div className="text-lg font-medium text-zinc-900 dark:text-white select-all cursor-text bg-zinc-50 dark:bg-black p-3 rounded-lg border border-transparent focus:border-indigo-500 transition-colors" contentEditable>{metadata.title}</div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-2">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].description}</label>
                                <div className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap select-all cursor-text bg-zinc-50 dark:bg-black p-3 rounded-lg border border-transparent focus:border-indigo-500 transition-colors" contentEditable>{metadata.description}</div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-2">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">{translations[lang].tags}</label>
                                <div className="flex flex-wrap gap-2">
                                    {metadata.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-100 dark:border-indigo-500/30">#{tag}</span>
                                    ))}
                                </div>
                            </div>
                            {thumbnails.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{translations[lang].suggestedThumbs}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {thumbnails.map((url, i) => (
                                            <div key={i} className="group relative aspect-video rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black cursor-pointer shadow-sm hover:shadow-md transition-all">
                                                <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <a href={url} download={`thumbnail_${i}.png`} className="px-4 py-2 bg-white text-black rounded-full font-bold text-xs flex items-center gap-2 hover:bg-zinc-200 transition-colors"><Download className="w-4 h-4" /> Baixar</a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                     ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                             <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center"><Hash className="w-8 h-8 text-zinc-300 dark:text-zinc-600" /></div>
                             <p className="text-zinc-500 dark:text-zinc-400">{translations[lang].noScenesYet}</p>
                        </div>
                     )}
                </div>
             </div>
        )}
      </main>

      {/* MODALS */}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} onUpgrade={handleUpgrade} lang={lang} t={translations} />}
      {showWelcomeModal && !showLanding && <WelcomeModal onClose={handleCloseWelcome} lang={lang} t={translations} />}
      {editingScene && (
          <EditSceneModal 
            scene={editingScene} 
            onClose={() => setEditingScene(null)} 
            onSave={saveSceneUpdate}
            onRegenerateAsset={handleSceneAssetRegeneration}
            onRegenerateAudio={handleSceneAudioRegeneration}
            lang={lang}
            userTier={userTier}
            t={translations}
          />
      )}
    </div>
  );
};

export default App;
