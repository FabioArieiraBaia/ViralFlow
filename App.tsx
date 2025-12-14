import React, { useState, useEffect, useRef } from 'react';
import { 
  Scene, VideoFormat, VideoStyle, VideoPacing, VideoDuration, 
  VisualIntensity, Language, Theme, UserTier, ImageProvider, 
  VideoTransition, VFXConfig, SubtitleStyle, SubtitleSettings, 
  OverlayConfig, VideoMetadata, ViralMetadataResult, GeminiTTSModel, 
  PollinationsModel, SpeakerTagStyle, GeminiModel, VideoFilter, LayerConfig, ALL_GEMINI_VOICES, GenerationPhase
} from './types';
import { isVideoModel } from './services/geminiService';
import { Header } from './components/Header';
import { CreateTab } from './components/tabs/CreateTab';
import { EditorTab } from './components/tabs/EditorTab';
import { MetadataTab } from './components/tabs/MetadataTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { WelcomeModal, UpgradeModal, EditSceneModal } from './components/Modals';
import VideoPlayer, { VideoPlayerRef } from './components/VideoPlayer';
import { 
  initKeys, getManualKeys, saveManualKeys, getApiKeyCount, 
  getPexelsKey, savePexelsKey, getPollinationsToken, savePollinationsToken,
  generateVideoScript, generateMovieOutline, reviewScript, generateVisualPrompts, generateSpeech, generateSceneImage, generateMetadata, generateThumbnails, generateVisualVariations
} from './services/geminiService';
import { decodeBase64, decodeAudioData, audioBufferToWav, base64ToBlobUrl } from './services/audioUtils';
import { triggerBrowserDownload } from './services/fileSystem';
import { translations } from './services/translations';

// Helper to calculate shots per scene based on intensity
const calculateShotCount = (duration: number, intensity: VisualIntensity): number => {
    switch (intensity) {
        case VisualIntensity.LOW: return 1;
        case VisualIntensity.MEDIUM: return Math.max(1, Math.ceil(duration / 5)); // A cada 5s
        case VisualIntensity.HIGH: return Math.max(1, Math.ceil(duration / 2.5)); // A cada 2.5s
        case VisualIntensity.HYPER: return Math.max(1, Math.ceil(duration / 1.5)); // A cada 1.5s
        default: return 1;
    }
};

// Helper to convert Duration Enum to Minutes Number
const getDurationInMinutes = (d: VideoDuration): number => {
    switch (d) {
        case VideoDuration.SHORT: return 1; // ~60s
        case VideoDuration.MEDIUM: return 4; // ~4 min
        case VideoDuration.LONG: return 12; // ~12 min
        case VideoDuration.MOVIE: return 25; // ~25 min (Force High Scene Count)
        default: return 1;
    }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const App: React.FC = () => {
  // --- STATE ---
  const [lang, setLang] = useState<Language>('pt');
  const [theme, setTheme] = useState<Theme>('dark');
  const [activeTab, setActiveTab] = useState<'create' | 'preview' | 'metadata' | 'settings'>('create');
  const [userTier, setUserTier] = useState<UserTier>(UserTier.FREE);

  // Video Config
  const [topic, setTopic] = useState('');
  const [contentLang, setContentLang] = useState<Language>('pt');
  const [style, setStyle] = useState<VideoStyle>(VideoStyle.DOCUMENTARY);
  const [pacing, setPacing] = useState<VideoPacing>(VideoPacing.NORMAL);
  const [visualIntensity, setVisualIntensity] = useState<VisualIntensity>(VisualIntensity.MEDIUM);
  const [format, setFormat] = useState<VideoFormat>(VideoFormat.PORTRAIT);
  const [duration, setDuration] = useState<VideoDuration>(VideoDuration.SHORT);
  const [channelName, setChannelName] = useState('');
  const [voice, setVoice] = useState('Auto');
  const [customVoice, setCustomVoice] = useState('');
  const [imageProvider, setImageProvider] = useState<ImageProvider>(ImageProvider.POLLINATIONS);
  const [globalTransition, setGlobalTransition] = useState<VideoTransition>(VideoTransition.NONE);
  const [ttsModel, setTtsModel] = useState<GeminiTTSModel>('gemini-2.5-flash-preview-tts');
  const [globalTtsStyle, setGlobalTtsStyle] = useState('');
  const [pollinationsModel, setPollinationsModel] = useState<PollinationsModel>('flux');
  
  // Ensure FREE users can't use video models
  useEffect(() => {
    if (userTier !== UserTier.PRO && isVideoModel(pollinationsModel)) {
      setPollinationsModel('flux');
    }
  }, [userTier, pollinationsModel]);

  // Editor State
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bgMusicUrl, setBgMusicUrl] = useState('');
  const [bgMusicPlaylist, setBgMusicPlaylist] = useState<string[]>([]);
  const [bgMusicVolume, setBgMusicVolume] = useState(0.2);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>(SubtitleStyle.MODERN);
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>({ fontSizeMultiplier: 1, yPosition: 0.9, fontFamily: 'Inter' });
  const [activeFilter, setActiveFilter] = useState<VideoFilter>(VideoFilter.NONE);
  const [globalVfx, setGlobalVfx] = useState<VFXConfig>({ shakeIntensity: 0, chromaticAberration: 0, bloomIntensity: 0, vignetteIntensity: 0, filmGrain: 0 });
  const [channelLogo, setChannelLogo] = useState<OverlayConfig>();
  const [showSpeakerTags, setShowSpeakerTags] = useState(false);
  const [speakerTagStyle, setSpeakerTagStyle] = useState<SpeakerTagStyle>(SpeakerTagStyle.CINEMATIC);

  // Generation
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('idle');
  const [progress, setProgress] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  // Metadata
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [metaTopic, setMetaTopic] = useState('');
  const [metaContext, setMetaContext] = useState('');
  const [viralMetaResult, setViralMetaResult] = useState<ViralMetadataResult | null>(null);

  // Settings
  const [manualKeys, setManualKeys] = useState(getManualKeys());
  const [apiKeyCount, setApiKeyCount] = useState(getApiKeyCount());
  const [pexelsKey, setPexelsKey] = useState(getPexelsKey());
  const [pollinationsToken, setPollinationsToken] = useState(getPollinationsToken());
  const [userKey, setUserKey] = useState('');
  const [selectedLicenseType, setSelectedLicenseType] = useState('VF-L');
  const [generatedAdminKey, setGeneratedAdminKey] = useState('');

  // Modals
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showEditSceneModal, setShowEditSceneModal] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);

  const playerRef = useRef<VideoPlayerRef>(null);
  const handleImportScriptRef = useRef<HTMLInputElement>(null);

  // Refs for Access in Async Loops (Crucial for state consistency)
  const scenesRef = useRef(scenes);
  useEffect(() => { scenesRef.current = scenes; }, [scenes]);

  useEffect(() => {
    initKeys();
    setApiKeyCount(getApiKeyCount());
    const seenWelcome = localStorage.getItem('viralflow_welcome_seen');
    if (!seenWelcome) setShowWelcomeModal(true);
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
    }
    
    // Check local storage for persistent user key (optional enhancement, but good for UX)
    const savedUserKey = localStorage.getItem('viralflow_user_key');
    if (savedUserKey) {
       onUpgrade(savedUserKey);
    }
  }, []);

  useEffect(() => {
    // Remove all theme classes first
    document.documentElement.classList.remove('dark', 'clean', 'creator');
    // Add the current theme class
    document.documentElement.classList.add(theme);
    // Save to localStorage
    localStorage.setItem('viralflow_theme', theme);
  }, [theme]);

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('viralflow_theme') as Theme | null;
    if (savedTheme && ['dark', 'clean', 'creator'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  const handleImportScript = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const content = ev.target?.result as string;
                if (!content) return;
                const json = JSON.parse(content);
                let loadedScenes: Scene[] = [];
                if (json.scenes && Array.isArray(json.scenes)) {
                    loadedScenes = json.scenes;
                    if (json.topic) setTopic(json.topic);
                    if (json.metadata) setMetadata(json.metadata);
                } else if (Array.isArray(json)) {
                    // Spread all properties from the item to ensure audioBase64/imageBase64/existing ids are preserved
                    loadedScenes = json.map((item: any, idx: number) => ({
                        ...item, // CRITICAL FIX: Keep all existing data
                        id: item.id || `imported-${Date.now()}-${idx}`,
                        speaker: item.speaker || "Narrator",
                        text: item.text || "",
                        visualPrompt: item.visual_prompt || item.visualPrompt || "",
                        durationEstimate: item.durationEstimate || 5,
                        mediaType: item.mediaType || 'image',
                        isGeneratingImage: false,
                        isGeneratingAudio: false,
                        cameraMovement: item.cameraMovement || 'STATIC'
                    }));
                } else {
                    alert("Formato inválido.");
                    return;
                }
                const hydratedScenes = await Promise.all(loadedScenes.map(async (s) => {
                    const isAudioInvalid = !s.audioBuffer || Object.keys(s.audioBuffer).length === 0 || (typeof s.audioUrl === 'string' && s.audioUrl.startsWith('blob:'));
                    if (s.audioBase64 && isAudioInvalid) {
                        try {
                            const bytes = decodeBase64(s.audioBase64);
                            const buffer = await decodeAudioData(bytes);
                            const wavBlob = audioBufferToWav(buffer);
                            s.audioBuffer = buffer;
                            s.audioUrl = URL.createObjectURL(wavBlob);
                            if(buffer.duration > 0) s.durationEstimate = buffer.duration + 0.5;
                        } catch (e) { console.warn(`Audio Hydration Failed`, e); }
                    }
                    
                    // CRITICAL: Hydrate main image/video
                    if (s.imageBase64) {
                        try {
                            let mime = 'image/png';
                            if (s.imageBase64.startsWith('/9j/')) mime = 'image/jpeg';
                            else if (s.imageBase64.startsWith('R0lGOD')) mime = 'image/gif';
                            else if (s.imageBase64.startsWith('UklGR')) mime = 'image/webp';
                            s.imageUrl = base64ToBlobUrl(s.imageBase64, mime);
                        } catch (e) { console.warn(`Image Hydration Failed`, e); }
                    }
                    // Videos: base64 is not saved (too large), so only use URL if available
                    // If video URL is missing, user will need to regenerate the video
                    if (s.mediaType === 'video' && s.videoBase64) {
                        // Legacy support: if old JSON has videoBase64, try to hydrate
                        try { s.videoUrl = base64ToBlobUrl(s.videoBase64, 'video/mp4'); } catch (e) { console.warn(`Video Hydration Failed`, e); }
                    } else if (s.mediaType === 'video' && s.hasVideo && !s.videoUrl) {
                        // New format: video was present but base64 excluded due to size
                        console.warn(`Video layer detected but no URL available. Video will need to be regenerated.`);
                    }
                    
                    // CRITICAL: Hydrate ALL layers with base64 data (images only, videos use URL)
                    if (s.layers && Array.isArray(s.layers)) {
                        s.layers = s.layers.map(layer => {
                            // Images: If layer has base64 but no valid URL, convert base64 to blob URL
                            if (layer.type === 'image' && layer.base64 && (!layer.url || layer.url.startsWith('blob:'))) {
                                try {
                                    let mimeType = 'image/png';
                                    if (layer.base64.startsWith('/9j/')) {
                                        mimeType = 'image/jpeg';
                                    } else if (layer.base64.startsWith('R0lGOD')) {
                                        mimeType = 'image/gif';
                                    } else if (layer.base64.startsWith('UklGR')) {
                                        mimeType = 'image/webp';
                                    }
                                    layer.url = base64ToBlobUrl(layer.base64, mimeType);
                                } catch (e) {
                                    console.warn(`Layer ${layer.id} hydration failed:`, e);
                                }
                            }
                            // Videos: base64 is not saved (too large), so only use URL if available
                            // If video URL is missing and hasVideo flag is set, user will need to regenerate
                            if (layer.type === 'video' && layer.hasVideo && !layer.url) {
                                console.warn(`Video layer ${layer.id} detected but no URL available. Video will need to be regenerated.`);
                            }
                            return layer;
                        });
                    }
                    
                    return s;
                }));
                setScenes(hydratedScenes);
                setGenerationPhase('done');
                setActiveTab('preview');
            } catch (err) { alert("Erro ao processar JSON: " + err); }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

  // --- PHASE 1: SCRIPT GENERATION (AGENT PIPELINE) ---
  const handleGenerateScript = async () => {
    setGenerationPhase('scripting');
    setProgress(translations[lang].initializing);
    
    try {
        let scriptItems: any[] = [];

        // MOVIE MODE: AGENT PIPELINE
        if (duration === VideoDuration.MOVIE) {
            setProgress("🤖 Agente Arquiteto: Criando Outline do Filme...");
            
            // 1. Generate Chapter Outline (Architect Agent)
            const chapters = await generateMovieOutline(topic, channelName, contentLang, () => false);
            
            if (!chapters || chapters.length === 0) throw new Error("Falha ao gerar outline do filme.");

            // 2. Loop through chapters (Screenwriter Agent)
            for (let i = 0; i < chapters.length; i++) {
                const chapter = chapters[i];
                setProgress(`✍️ Agente Roteirista: Escrevendo Capítulo ${i + 1}/${chapters.length} - "${chapter.title}"...`);
                
                // Add delay to avoid immediate rate limits
                await delay(1000);

                const chapterScenes = await generateVideoScript(
                    topic, 
                    style,
                    visualIntensity,
                    0, // Ignored in movie mode logic
                    pacing, 
                    channelName, 
                    contentLang, 
                    () => false,
                    {
                        currentChapterTitle: chapter.title,
                        currentChapterSummary: chapter.summary,
                        chapterIndex: i,
                        totalChapters: chapters.length
                    }
                );
                
                scriptItems = [...scriptItems, ...chapterScenes];
            }

        } else {
            // STANDARD MODE: Single Pass
            setProgress(translations[lang].writingScript);
            const durationMins = getDurationInMinutes(duration);
            scriptItems = await generateVideoScript(topic, style, visualIntensity, durationMins, pacing, channelName, contentLang, () => false);
        }
        
        // AGENT 3: GENERAL REVIEWER / DIRECTOR (Reviews and refines the script)
        setProgress("🎬 Agente Revisor Geral/Diretor: Revisando e refinando o roteiro...");
        scriptItems = await reviewScript(scriptItems, topic, style, pacing, contentLang, () => false);
        
        // Filter Voices based on Gender for Auto Casting
        const maleVoices = ALL_GEMINI_VOICES.filter(v => v.gender === 'male');
        const femaleVoices = ALL_GEMINI_VOICES.filter(v => v.gender === 'female');

        // Character Cache to ensure consistency across scenes
        const characterVoiceMap: Record<string, string> = {};

        // 3. Setup Scenes (INITIAL STATE)
        const newScenes: Scene[] = scriptItems.map((item, idx) => {
            let assignedVoice = 'Fenrir'; // Fallback Default

            if (voice === 'Auto') {
                if (characterVoiceMap[item.speaker]) {
                    assignedVoice = characterVoiceMap[item.speaker];
                } else {
                    // Pick strictly based on gender requested by LLM
                    if (item.gender === 'female') {
                        const randomFem = femaleVoices[Math.floor(Math.random() * femaleVoices.length)];
                        assignedVoice = randomFem.id;
                    } else {
                        // Default to male if unspecified or male
                        const randomMale = maleVoices[Math.floor(Math.random() * maleVoices.length)];
                        assignedVoice = randomMale.id;
                    }
                    // Cache it
                    characterVoiceMap[item.speaker] = assignedVoice;
                }
            } else if (voice === 'Custom') {
                assignedVoice = customVoice;
            } else {
                assignedVoice = voice;
            }

            return {
                id: `scene-${Date.now()}-${idx}`,
                speaker: item.speaker,
                text: item.text,
                visualPrompt: item.visual_prompt || '', // Will be generated by Photography Director after approval
                cameraMovement: item.cameraMovement as any || 'STATIC',
                mediaType: 'image',
                durationEstimate: item.text.length * 0.08 + 2,
                isGeneratingImage: false, // Set to FALSE initially
                isGeneratingAudio: false, // Set to FALSE initially
                assignedVoice: assignedVoice,
                imageUrl: "https://placehold.co/1280x720/000/FFF.png?text=Waiting+for+Visuals...",
                layers: []
            };
        });
        
        setScenes(newScenes);
        scenesRef.current = newScenes; // Update Ref immediately
        
        // --- NEW APPROVAL FLOW ---
        // Instead of running audio, we pause and switch to Editor for user approval.
        setGenerationPhase('script_approval');
        setActiveTab('preview');

    } catch (e) { 
        console.error(e);
        alert("Erro na geração do roteiro: " + (e as any).message); 
        setGenerationPhase('idle');
    }
  };

  const handleApproveScript = (generateImagesFirst: boolean = false) => {
      // Called when user clicks "Approve" in EditorTab
      // First, generate visual prompts with Photography Director Agent
      setGenerationPhase('scripting'); // Temporary phase for visual prompts generation
      setProgress("📸 Agente Diretor de Fotografia: Gerando prompts visuais para cada cena...");
      
      (async () => {
          try {
              // Convert scenes back to script items for Photography Director
              const scriptItemsForVisual: any[] = scenesRef.current.map(scene => ({
                  speaker: scene.speaker,
                  gender: scene.assignedVoice ? (ALL_GEMINI_VOICES.find(v => v.id === scene.assignedVoice)?.gender || 'male') : 'male',
                  text: scene.text,
                  cameraMovement: scene.cameraMovement || 'STATIC'
              }));
              
              // AGENT 4: PHOTOGRAPHY DIRECTOR (Generates visual prompts)
              const scriptWithVisuals = await generateVisualPrompts(
                  scriptItemsForVisual,
                  topic,
                  style,
                  visualIntensity,
                  contentLang,
                  () => false
              );
              
              // Update scenes with visual prompts
              const updatedScenes = scenesRef.current.map((scene, idx) => {
                  const visualItem = scriptWithVisuals[idx];
                  return {
                      ...scene,
                      visualPrompt: visualItem?.visual_prompt || scene.visualPrompt || `${scene.text}. Cinematic shot, detailed.`
                  };
              });
              
              setScenes(updatedScenes);
              scenesRef.current = updatedScenes;
              
              // Now proceed based on user choice
              if (generateImagesFirst) {
                  runVisualPhase();
              } else {
                  runAudioPhase(updatedScenes);
              }
          } catch (e) {
              console.error("Error generating visual prompts:", e);
              // Fallback: proceed without visual prompts
              if (generateImagesFirst) {
                  runVisualPhase();
              } else {
                  runAudioPhase(scenesRef.current);
              }
          }
      })();
  };

  // --- PHASE 2: AUDIO BATCH (SEQUENTIAL) ---
  const runAudioPhase = async (scenesToProcess: Scene[]) => {
      setGenerationPhase('audio_processing');
      
      // Iterate sequentially to avoid Rate Limits
      for (let i = 0; i < scenesToProcess.length; i++) {
          const scene = scenesToProcess[i];
          setProgress(`Gerando Áudio: Cena ${i + 1}/${scenesToProcess.length}`);
          
          // Mark current scene as generating
          setScenes(prev => prev.map((s, idx) => idx === i ? { ...s, isGeneratingAudio: true } : s));
          
          try {
                // Wait 1s between requests to cool down API Key or Rotate
                if (i > 0) await delay(1000); 

                const audioRes = await generateSpeech(
                    scene.text, 
                    scene.speaker, 
                    scene.assignedVoice || 'Fenrir', 
                    i, 
                    topic, 
                    () => false, 
                    globalTtsStyle, 
                    ttsModel,
                    contentLang // Pass content language for accent reinforcement
                );

                if (audioRes.success && audioRes.url && audioRes.buffer && audioRes.base64) {
                    console.log(`[runAudioPhase] Scene ${i}: Audio generated successfully, saving...`, {
                        hasUrl: !!audioRes.url,
                        hasBuffer: !!audioRes.buffer,
                        hasBase64: !!audioRes.base64,
                        base64Length: audioRes.base64.length,
                        bufferDuration: audioRes.buffer.duration
                    });
                    setScenes(prev => prev.map((s, idx) => idx === i ? {
                        ...s,
                        audioUrl: audioRes.url,
                        audioBuffer: audioRes.buffer,
                        audioBase64: audioRes.base64,
                        durationEstimate: audioRes.buffer ? audioRes.buffer.duration + 0.2 : s.durationEstimate,
                        isGeneratingAudio: false,
                        audioError: false
                    } : s));
                } else {
                    console.error(`[runAudioPhase] Scene ${i}: Audio generation failed or incomplete`, {
                        success: audioRes.success,
                        hasUrl: !!audioRes.url,
                        hasBuffer: !!audioRes.buffer,
                        hasBase64: !!audioRes.base64
                    });
                    setScenes(prev => prev.map((s, idx) => idx === i ? { ...s, isGeneratingAudio: false, audioError: true } : s));
                }
          } catch (e) {
                console.error(`Audio Error Scene ${i}`, e);
                setScenes(prev => prev.map((s, idx) => idx === i ? { ...s, isGeneratingAudio: false, audioError: true } : s));
          }
      }

      // Audio Done -> Pause state to allow user to save project JSON
      setGenerationPhase('ready_for_visuals');
      setProgress("Áudios concluídos! Salve o projeto ou inicie o visual.");
      setActiveTab('create'); // Go back to create tab to show the "Audio Done" modal with "Next Step" options
  };

  // --- PHASE 3: VISUAL BATCH (SEQUENTIAL) ---
  const runVisualPhase = async () => {
      setGenerationPhase('visual_processing');
      const currentScenes = scenesRef.current; // Get latest state

      for (let i = 0; i < currentScenes.length; i++) {
          const scene = currentScenes[i];
          setProgress(`Gerando Visual: Cena ${i + 1}/${currentScenes.length}`);
          
          // Mark generating
          setScenes(prev => prev.map((s, idx) => idx === i ? { ...s, isGeneratingImage: true } : s));

          try {
                // Wait 2s between visual requests (heavier load)
                if (i > 0) await delay(2000);

                const shotCount = calculateShotCount(scene.durationEstimate, visualIntensity);
                let prompts: string[] = [scene.visualPrompt];
                
                // Variations logic - CRITICAL: Pass visualIntensity to generate proper variations
                if (shotCount > 1) {
                    try {
                        const variations = await generateVisualVariations(scene.visualPrompt, scene.text, shotCount, () => false, visualIntensity);
                        if (variations && variations.length > 0) {
                            prompts = variations;
                            console.log(`[Visual Variations] Generated ${variations.length} distinct prompts for scene ${i + 1} with intensity ${visualIntensity}`);
                        }
                        while (prompts.length < shotCount) prompts.push(scene.visualPrompt);
                    } catch (err) {
                        console.error(`[Visual Variations] Error generating variations:`, err);
                        prompts = Array(shotCount).fill(scene.visualPrompt);
                    }
                }

                // Generate images for all prompts (Sequential internal loop to be safe)
                // CRITICAL: Video models are ONLY available in manual scene editing, NEVER in auto-generation
                // Auto-generation always uses image models (flux) to save API costs
                const safeModel = isVideoModel(pollinationsModel) ? 'flux' : pollinationsModel;
                
                const images: { imageUrl: string; mediaType: 'image' | 'video'; base64?: string; videoUrl?: string }[] = [];
                for (let k = 0; k < prompts.length; k++) {
                    if (k > 0) await delay(1000); // Wait between variations
                    const p = prompts[k];
                    const img = await generateSceneImage(p, format, (i * 100) + k, topic, ImageProvider.POLLINATIONS, style, safeModel, undefined, () => false);
                    images.push(img);
                }
                
                // Construct Layers
                const segmentDuration = scene.durationEstimate / Math.max(1, images.length);
                const newLayers: LayerConfig[] = images.map((img, shotIdx) => ({
                     id: `auto-shot-${scene.id}-${shotIdx}`,
                     type: img.mediaType,
                     url: img.imageUrl || img.videoUrl,
                     base64: img.base64, // CRITICAL: Save base64 for persistence
                     name: `Shot ${shotIdx+1}`,
                     x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1,
                     startTime: shotIdx * segmentDuration,
                     endTime: (shotIdx === images.length - 1) ? 9999 : (shotIdx + 1) * segmentDuration,
                     isBackground: true
                }));

                // Update Scene
                setScenes(prev => prev.map((s, idx) => idx === i ? {
                    ...s,
                    imageUrl: images[0].imageUrl, // Main thumb
                    videoUrl: images[0].videoUrl,
                    mediaType: images[0].mediaType,
                    imageBase64: images[0].base64,
                    layers: [...(s.layers || []), ...newLayers], // Append shots
                    isGeneratingImage: false
                } : s));

          } catch (e) {
                console.error(`Image Error Scene ${i}`, e);
                setScenes(prev => prev.map((s, idx) => idx === i ? { ...s, isGeneratingImage: false, imageUrl: 'https://placehold.co/1280x720/333/FFF.png?text=Error' } : s));
          }
      }

      setGenerationPhase('done');
      setActiveTab('preview');
      setProgress("Geração Completa!");
      
      // Final Metadata Generation
      // CRITICAL FIX: Always use Pollinations for thumbnails
      generateThumbnails(topic, style, ImageProvider.POLLINATIONS, () => false).then(thumbs => setThumbnails(thumbs)).catch(console.error);
      generateMetadata(topic, JSON.stringify(scenes), () => false).then(meta => setMetadata(meta)).catch(console.error);
  };

  const handleExportScript = () => {
      // CRITICAL: Serialize scenes with all layers and base64 data preserved
      const serializedScenes = scenes.map(scene => {
          // Serialize all layers with base64 preserved
          const serializedLayers = (scene.layers || []).map(layer => {
              const serialized: any = {
                  id: layer.id,
                  type: layer.type,
                  name: layer.name,
                  x: layer.x,
                  y: layer.y,
                  scale: layer.scale,
                  rotation: layer.rotation,
                  opacity: layer.opacity,
                  startTime: layer.startTime,
                  endTime: layer.endTime,
                  isBackground: layer.isBackground
              };
              
              // CRITICAL: Include base64 for images only (videos are too large for JSON)
              if (layer.type === 'image') {
                  serialized.base64 = layer.base64 || null; // Use null instead of undefined so it's included in JSON
                  // CRITICAL: Always include URL as fallback (even if base64 exists, URL helps with rendering)
                  serialized.url = layer.url || null;
              } else if (layer.type === 'video') {
                  // Videos: Only include URL (base64 is too large for JSON.stringify)
                  // Videos will need to be re-downloaded or re-generated on import
                  serialized.url = layer.url || null;
                  // Store a flag indicating video was present but base64 was excluded due to size
                  serialized.hasVideo = true;
              }
              
              // Include text properties if it's a text layer
              if (layer.type === 'text') {
                  serialized.text = layer.text;
                  serialized.fontSize = layer.fontSize;
                  serialized.fontColor = layer.fontColor;
                  serialized.fontFamily = layer.fontFamily;
                  serialized.fontWeight = layer.fontWeight;
                  serialized.textShadow = layer.textShadow;
              }
              
              // Include other optional properties
              if (layer.blendMode) serialized.blendMode = layer.blendMode;
              if (layer.keyframes) serialized.keyframes = layer.keyframes;
              if (layer.entryEffect) serialized.entryEffect = layer.entryEffect;
              if (layer.entryDuration) serialized.entryDuration = layer.entryDuration;
              if (layer.exitEffect) serialized.exitEffect = layer.exitEffect;
              if (layer.exitDuration) serialized.exitDuration = layer.exitDuration;
              if (layer.trimStart !== undefined) serialized.trimStart = layer.trimStart;
              if (layer.trimEnd !== undefined) serialized.trimEnd = layer.trimEnd;
              if (layer.totalDuration !== undefined) serialized.totalDuration = layer.totalDuration;
              if (layer.shadowColor) serialized.shadowColor = layer.shadowColor;
              if (layer.shadowBlur !== undefined) serialized.shadowBlur = layer.shadowBlur;
              if (layer.shadowOffsetX !== undefined) serialized.shadowOffsetX = layer.shadowOffsetX;
              if (layer.shadowOffsetY !== undefined) serialized.shadowOffsetY = layer.shadowOffsetY;
              
              return serialized;
          });
          
          const serialized: any = {
              id: scene.id,
              speaker: scene.speaker,
              text: scene.text,
              visualPrompt: scene.visualPrompt,
              durationEstimate: scene.durationEstimate,
              mediaType: scene.mediaType,
              assignedVoice: scene.assignedVoice,
              ttsStyle: scene.ttsStyle,
              cameraMovement: scene.cameraMovement,
              particleEffect: scene.particleEffect,
              musicConfig: scene.musicConfig,
              transition: scene.transition,
              vfxConfig: scene.vfxConfig,
              colorGrading: scene.colorGrading,
              isGeneratingImage: scene.isGeneratingImage,
              isGeneratingAudio: scene.isGeneratingAudio,
              audioError: scene.audioError
          };
          
          // CRITICAL: Include base64 for images and audio only (videos are too large for JSON)
          serialized.imageBase64 = scene.imageBase64 || (scene.layers?.find(l => l.isBackground && l.type === 'image')?.base64) || null;
          // Videos: Only include URL (base64 causes "Invalid string length" error in JSON.stringify)
          // Store flag to indicate video was present
          if (scene.videoBase64 || scene.layers?.find(l => l.isBackground && l.type === 'video')?.base64) {
              serialized.hasVideo = true;
          }
          serialized.videoBase64 = null; // Explicitly set to null (videos too large for JSON)
          serialized.audioBase64 = scene.audioBase64 || null;
          
          // CRITICAL: Always include URLs as fallback (even if base64 exists)
          // URLs help with immediate rendering, base64 is for persistence
          serialized.imageUrl = scene.imageUrl || null;
          serialized.videoUrl = scene.videoUrl || null;
          serialized.audioUrl = scene.audioUrl || null;
          
          // CRITICAL: Include ALL layers with their base64 data
          serialized.layers = serializedLayers;
          
          // Include audioLayers if they exist
          if (scene.audioLayers && scene.audioLayers.length > 0) {
              serialized.audioLayers = scene.audioLayers.map(al => ({
                  id: al.id,
                  name: al.name,
                  url: al.url,
                  volume: al.volume,
                  startTime: al.startTime,
                  type: al.type
              }));
          }
          
          return serialized;
      });
      
      const project = { 
          topic, 
          scenes: serializedScenes, 
          metadata, 
          style, 
          pacing, 
          format 
      };
      
      // Use a replacer to ensure null values are included (not omitted)
      const jsonString = JSON.stringify(project, (key, value) => {
          // Keep null values (they indicate "no data" vs undefined which means "not set")
          return value === undefined ? null : value;
      }, 2);
      
      const blob = new Blob([jsonString], { type: 'application/json' });
      triggerBrowserDownload(blob, `viralflow_project_${Date.now()}.json`);
  };

  const handleCreateManualProject = () => {
      // Create an initial empty scene so the editor opens properly
      const initialScene: Scene = {
          id: `manual-${Date.now()}`,
          speaker: 'Narrator',
          text: '',
          visualPrompt: '',
          mediaType: 'image',
          durationEstimate: 5,
          isGeneratingImage: false,
          isGeneratingAudio: false,
          imageUrl: undefined,
          audioUrl: undefined
      };
      setScenes([initialScene]);
      setCurrentSceneIndex(0);
      setTopic("Manual Project");
      setGenerationPhase('done');
      setActiveTab('preview');
  };

  const updateKeys = (v: string) => { setManualKeys(v); saveManualKeys(v); setApiKeyCount(getApiKeyCount()); };
  const updatePexelsKey = (v: string) => { setPexelsKey(v); savePexelsKey(v); };
  const updatePollinationsToken = (v: string) => { setPollinationsToken(v); savePollinationsToken(v); };
  
  const onUpgrade = async (key: string): Promise<boolean> => {
      const trimmedKey = key.trim();
      
      // ADMIN KEY OVERRIDE
      if (trimmedKey === 'ADMIN-TEST-KEY-2025') { 
          setUserTier(UserTier.PRO); 
          setUserKey(trimmedKey); 
          localStorage.setItem('viralflow_user_key', trimmedKey); // Auto-save
          return true; 
      }
      
      // STANDARD PRO KEY
      if (trimmedKey.startsWith('VFPRO')) { 
          setUserTier(UserTier.PRO); 
          setUserKey(trimmedKey);
          localStorage.setItem('viralflow_user_key', trimmedKey); // Auto-save
          return true; 
      }
      return false;
  };
  
  const handleGenerateLicense = () => { setGeneratedAdminKey(`VFPRO-${selectedLicenseType}-${Date.now()}`); };

  // Editor Bulk Actions
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(new Set());
  const handleToggleSelectScene = (id: string) => {
      const next = new Set(selectedSceneIds);
      if (next.has(id)) next.delete(id); else next.add(id);
      setSelectedSceneIds(next);
  };
  const handleSelectAll = () => {
      if (selectedSceneIds.size === scenes.length) setSelectedSceneIds(new Set());
      else setSelectedSceneIds(new Set(scenes.map(s => s.id)));
  };
  
  // FIX: Implement handleBulkRegenerate to iterate through selected scenes
  const handleBulkRegenerate = async (type: 'images' | 'audio') => { 
      const targets = scenes.filter(s => selectedSceneIds.has(s.id));
      if (targets.length === 0) return;

      // Set global loading state to show progress overlay if wanted, 
      // or just manage local loading states. 
      // For UX consistency with main flow, let's use generationPhase 
      // OR just local state if we want to stay in Editor. 
      // Using generationPhase forces a fullscreen overlay which might be annoying for small edits.
      // Let's stick to local state updates + top bar progress if possible, 
      // BUT `generationPhase` controls the big loading screen. 
      // Let's use `visual_processing` / `audio_processing` to reuse the existing overlay logic for now to ensure feedback.
      
      setGenerationPhase(type === 'images' ? 'visual_processing' : 'audio_processing');

      for (let i = 0; i < targets.length; i++) {
          const scene = targets[i];
          const index = scenes.findIndex(s => s.id === scene.id); // Get global index
          
          setProgress(`Regenerando ${type === 'images' ? 'Visual' : 'Áudio'} (${i+1}/${targets.length})`);

          if (type === 'images') {
                // Mark generating
                setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, isGeneratingImage: true } : s));
                
                try {
                    if (i > 0) await delay(1500); // Rate limit protection

                    const shotCount = calculateShotCount(scene.durationEstimate, visualIntensity);
                    let prompts: string[] = [scene.visualPrompt];
                    
                    // Variations logic - CRITICAL: Pass visualIntensity to generate proper variations
                    if (shotCount > 1) {
                        try {
                            const variations = await generateVisualVariations(scene.visualPrompt, scene.text, shotCount, () => false, visualIntensity);
                            if (variations && variations.length > 0) {
                                prompts = variations;
                                console.log(`[Visual Variations] Generated ${variations.length} distinct prompts for bulk regeneration with intensity ${visualIntensity}`);
                            }
                            while (prompts.length < shotCount) prompts.push(scene.visualPrompt);
                        } catch (err) {
                            console.error(`[Visual Variations] Error in bulk regeneration:`, err);
                            prompts = Array(shotCount).fill(scene.visualPrompt);
                        }
                    }

                    const newImages: { imageUrl: string; mediaType: 'image' | 'video'; base64?: string; videoUrl?: string }[] = [];
                    // CRITICAL: Bulk regeneration ALWAYS uses image models (flux) to save API costs
                    // Video models are ONLY available in manual scene editing
                    const safeModel = isVideoModel(pollinationsModel) ? 'flux' : pollinationsModel;
                    
                    for (let k = 0; k < prompts.length; k++) {
                        if (k > 0) await delay(1000); // Wait between variations
                        const img = await generateSceneImage(prompts[k], format, (index * 100) + k, topic, ImageProvider.POLLINATIONS, style, safeModel, undefined, () => false);
                        newImages.push(img);
                    }

                    // Construct Layers
                    const segmentDuration = scene.durationEstimate / Math.max(1, newImages.length);
                    const newLayers: LayerConfig[] = newImages.map((img, shotIdx) => ({
                        id: `bulk-shot-${scene.id}-${shotIdx}-${Date.now()}`,
                        type: img.mediaType,
                        url: img.imageUrl || img.videoUrl,
                        base64: img.base64, // CRITICAL: Save base64 for persistence
                        name: `Shot ${shotIdx+1}`,
                        x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1,
                        startTime: shotIdx * segmentDuration,
                        endTime: (shotIdx === newImages.length - 1) ? 9999 : (shotIdx + 1) * segmentDuration,
                        isBackground: true
                    }));

                    // Preserve non-background layers (overlays/text)
                    const existingOverlays = scene.layers?.filter(l => !l.isBackground) || [];

                    setScenes(prev => prev.map(s => s.id === scene.id ? {
                        ...s,
                        imageUrl: newImages[0].imageUrl,
                        videoUrl: newImages[0].videoUrl,
                        mediaType: newImages[0].mediaType,
                        imageBase64: newImages[0].base64,
                        layers: [...existingOverlays, ...newLayers],
                        isGeneratingImage: false
                    } : s));

                } catch (e) {
                    console.error("Bulk Image Error", e);
                    setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, isGeneratingImage: false } : s));
                }

          } else {
                // Audio
                setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, isGeneratingAudio: true } : s));
                try {
                    if (i > 0) await delay(1000);
                    const audioRes = await generateSpeech(
                        scene.text, 
                        scene.speaker, 
                        scene.assignedVoice || 'Fenrir', 
                        index, 
                        topic, 
                        () => false, 
                        globalTtsStyle, 
                        ttsModel,
                        contentLang // Pass content language for accent reinforcement
                    );

                    if (audioRes.success && audioRes.url && audioRes.buffer && audioRes.base64) {
                        console.log(`[handleBulkRegenerate] Scene ${scene.id}: Audio generated successfully, saving...`, {
                            hasUrl: !!audioRes.url,
                            hasBuffer: !!audioRes.buffer,
                            hasBase64: !!audioRes.base64,
                            base64Length: audioRes.base64.length,
                            bufferDuration: audioRes.buffer.duration
                        });
                        setScenes(prev => prev.map(s => s.id === scene.id ? {
                            ...s,
                            audioUrl: audioRes.url,
                            audioBuffer: audioRes.buffer,
                            audioBase64: audioRes.base64,
                            durationEstimate: audioRes.buffer ? audioRes.buffer.duration + 0.2 : s.durationEstimate,
                            isGeneratingAudio: false,
                            audioError: false
                        } : s));
                    } else {
                        console.error(`[handleBulkRegenerate] Scene ${scene.id}: Audio generation failed or incomplete`, {
                            success: audioRes.success,
                            hasUrl: !!audioRes.url,
                            hasBuffer: !!audioRes.buffer,
                            hasBase64: !!audioRes.base64
                        });
                        setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, isGeneratingAudio: false, audioError: true } : s));
                    }
                } catch (e) {
                    console.error("Bulk Audio Error", e);
                    setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, isGeneratingAudio: false, audioError: true } : s));
                }
          }
      }

      // Finish
      setGenerationPhase('done'); 
      // Reset to preview after short delay so user sees "Done"
      setTimeout(() => {
          // If we are in 'done' phase, the UI might show a "Generation Complete" screen.
          // We usually want to go back to Editor interaction. 
          // Setting phase to 'idle' or 'script_approval' (if script logic) or just staying in 'preview' tab is key.
          // Since we are in EditorTab, we just need to clear the overlay.
          setGenerationPhase('idle'); 
          setProgress('');
      }, 1000);
  };

  const handleBulkDelete = () => { setScenes(scenes.filter(s => !selectedSceneIds.has(s.id))); setSelectedSceneIds(new Set()); };
  const handleAddScene = () => {
      const newScene: Scene = {
          id: `manual-${Date.now()}`,
          speaker: 'Narrator',
          text: 'New Scene Text',
          visualPrompt: 'A beautiful placeholder scene',
          mediaType: 'image',
          durationEstimate: 5,
          isGeneratingImage: false,
          isGeneratingAudio: false,
          imageUrl: 'https://placehold.co/1280x720/222/FFF.png?text=New+Scene'
      };
      setScenes([...scenes, newScene]);
  };
  const regenerateSceneAsset = async (index: number, type: 'image') => {
      const scene = scenes[index];
      if (!scene) return;
      
      setScenes(prev => prev.map((s, idx) => idx === index ? { ...s, isGeneratingImage: true } : s));
      
      try {
          // CRITICAL: Individual regeneration also uses image models (flux) to save API costs
          // Video models are ONLY available in manual scene editing
          const safeModel = isVideoModel(pollinationsModel) ? 'flux' : pollinationsModel;
          const result = await generateSceneImage(scene.visualPrompt, format, index * 100, topic, ImageProvider.POLLINATIONS, style, safeModel, undefined, () => false);
          
          setScenes(prev => prev.map((s, idx) => idx === index ? {
              ...s,
              imageUrl: result.imageUrl,
              videoUrl: result.videoUrl,
              mediaType: result.mediaType,
              imageBase64: result.base64,
              isGeneratingImage: false
          } : s));
      } catch (e) {
          console.error("Regenerate error", e);
          setScenes(prev => prev.map((s, idx) => idx === index ? { ...s, isGeneratingImage: false } : s));
      }
  };
  
  const onRegenerateAsset = async (scene: Scene, provider: ImageProvider, pModel?: PollinationsModel, gModel?: GeminiModel, duration?: number, audio?: boolean) => {
      // Use the selected model (including video models for PRO users in manual editing)
      // Video models are only available in manual scene editing, not in auto-generation
      const modelToUse = pModel || 'flux';
      return generateSceneImage(scene.visualPrompt, format, 0, topic, ImageProvider.POLLINATIONS, style, modelToUse as PollinationsModel, undefined, undefined, duration, audio);
  };
  const onRegenerateAudio = async (scene: Scene, model?: GeminiTTSModel, style?: string) => {
      return generateSpeech(scene.text, scene.speaker, scene.assignedVoice || 'Fenrir', 0, topic, undefined, style, model, contentLang);
  };
  const handleForceRegenerateAll = () => { /* Logic */ };

  return (
    <div className={`flex flex-col h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 transition-colors duration-300 font-sans`}>
        <Header 
            userTier={userTier} setShowUpgradeModal={setShowUpgradeModal} activeTab={activeTab} setActiveTab={setActiveTab}
            lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} apiKeyCount={apiKeyCount}
        />
        {activeTab === 'create' && (
            <CreateTab 
                lang={lang} topic={topic} setTopic={setTopic} contentLang={contentLang} setContentLang={setContentLang}
                style={style} setStyle={setStyle} pacing={pacing} setPacing={setPacing}
                visualIntensity={visualIntensity} setVisualIntensity={setVisualIntensity} format={format} setFormat={setFormat}
                duration={duration} setDuration={setDuration} channelName={channelName} setChannelName={setChannelName}
                voice={voice} setVoice={setVoice} customVoice={customVoice} setCustomVoice={setCustomVoice}
                imageProvider={imageProvider} setImageProvider={setImageProvider}
                globalTransition={globalTransition} setGlobalTransition={setGlobalTransition}
                userTier={userTier} 
                isGenerating={generationPhase !== 'idle' && generationPhase !== 'done' && generationPhase !== 'ready_for_visuals' && generationPhase !== 'script_approval'} 
                progress={progress}
                handleGenerateVideo={handleGenerateScript} handleImportScriptRef={handleImportScriptRef}
                setShowUpgradeModal={setShowUpgradeModal} setActiveTab={setActiveTab}
                importClick={() => handleImportScriptRef.current?.click()} handleCreateManualProject={handleCreateManualProject}
                ttsModel={ttsModel} setTtsModel={setTtsModel} globalTtsStyle={globalTtsStyle} setGlobalTtsStyle={setGlobalTtsStyle}
                pollinationsModel={pollinationsModel} setPollinationsModel={setPollinationsModel} isAdmin={userKey === 'ADMIN-TEST-KEY-2025'}
                generationPhase={generationPhase} runVisualPhase={runVisualPhase} handleExportScript={handleExportScript}
            />
        )}
        <input type="file" ref={handleImportScriptRef} onChange={handleImportScript} className="hidden" accept=".json" />
        {activeTab === 'preview' && (
            <EditorTab 
                scenes={scenes} setScenes={setScenes} currentSceneIndex={currentSceneIndex} setCurrentSceneIndex={setCurrentSceneIndex}
                isPlaying={isPlaying} setIsPlaying={setIsPlaying} format={format} setFormat={setFormat}
                bgMusicUrl={bgMusicUrl} setBgMusicUrl={setBgMusicUrl} bgMusicPlaylist={bgMusicPlaylist} setBgMusicPlaylist={setBgMusicPlaylist}
                bgMusicVolume={bgMusicVolume} setBgMusicVolume={setBgMusicVolume} showSubtitles={showSubtitles} setShowSubtitles={setShowSubtitles}
                subtitleStyle={subtitleStyle} setSubtitleStyle={setSubtitleStyle} subtitleSettings={subtitleSettings} setSubtitleSettings={setSubtitleSettings}
                activeFilter={activeFilter} setActiveFilter={setActiveFilter} globalTransition={globalTransition} setGlobalTransition={setGlobalTransition}
                globalVfx={globalVfx} setGlobalVfx={setGlobalVfx} userTier={userTier} channelLogo={channelLogo} setChannelLogo={setChannelLogo}
                isGenerating={generationPhase !== 'idle' && generationPhase !== 'done' && generationPhase !== 'script_approval'} isReviewing={isReviewing} handleForceRegenerateAll={handleForceRegenerateAll}
                handleExportScript={handleExportScript} playerRef={playerRef} lang={lang} setShowUpgradeModal={setShowUpgradeModal}
                showSpeakerTags={showSpeakerTags} setShowSpeakerTags={setShowSpeakerTags} speakerTagStyle={speakerTagStyle} setSpeakerTagStyle={setSpeakerTagStyle}
                selectedSceneIds={selectedSceneIds} handleToggleSelectScene={handleToggleSelectScene} handleSelectAll={handleSelectAll}
                handleBulkRegenerate={handleBulkRegenerate} handleBulkDelete={handleBulkDelete} handleAddScene={handleAddScene}
                regenerateSceneAsset={regenerateSceneAsset} setEditingScene={(s) => { setEditingScene(s); setShowEditSceneModal(true); }}
                // New Props for Approval
                generationPhase={generationPhase}
                onApproveScript={handleApproveScript}
            />
        )}
        {activeTab === 'metadata' && (
            <MetadataTab 
                lang={lang} metaTopic={metaTopic} setMetaTopic={setMetaTopic} metaContext={metaContext} setMetaContext={setMetaContext}
                viralMetaResult={viralMetaResult} setViralMetaResult={setViralMetaResult} metadata={metadata} thumbnails={thumbnails} setThumbnails={setThumbnails}
                scenesLength={scenes.length} topic={topic} style={style} thumbProvider={imageProvider}
            />
        )}
        {activeTab === 'settings' && (
            <SettingsTab 
                lang={lang} manualKeys={manualKeys} updateKeys={updateKeys} apiKeyCount={apiKeyCount} pexelsKey={pexelsKey} updatePexelsKey={updatePexelsKey}
                pollinationsToken={pollinationsToken} updatePollinationsToken={updatePollinationsToken} userKey={userKey} selectedLicenseType={selectedLicenseType}
                setSelectedLicenseType={setSelectedLicenseType} handleGenerateLicense={handleGenerateLicense} generatedAdminKey={generatedAdminKey}
            />
        )}
        {showWelcomeModal && <WelcomeModal onClose={() => { setShowWelcomeModal(false); localStorage.setItem('viralflow_welcome_seen', 'true'); }} lang={lang} t={translations} />}
        {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} onUpgrade={onUpgrade} lang={lang} t={translations} />}
        {showEditSceneModal && editingScene && (
            <EditSceneModal 
                scene={editingScene} onClose={() => { setShowEditSceneModal(false); setEditingScene(null); }}
                onSave={(updated) => { setScenes(scenes.map(s => s.id === updated.id ? updated : s)); setShowEditSceneModal(false); }}
                onRegenerateAsset={onRegenerateAsset} onRegenerateAudio={onRegenerateAudio}
                lang={lang} userTier={userTier} format={format} t={translations} ttsModel={ttsModel} isAdmin={userKey === 'ADMIN-TEST-KEY-2025'}
            />
        )}
    </div>
  );
};

export default App;