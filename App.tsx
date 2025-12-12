import React, { useState, useEffect, useRef } from 'react';
import { 
  Scene, VideoFormat, VideoStyle, VideoPacing, VideoDuration, 
  VisualIntensity, Language, Theme, UserTier, ImageProvider, 
  VideoTransition, VFXConfig, SubtitleStyle, SubtitleSettings, 
  OverlayConfig, VideoMetadata, ViralMetadataResult, GeminiTTSModel, 
  PollinationsModel, SpeakerTagStyle, GeminiModel, VideoFilter, LayerConfig, ALL_GEMINI_VOICES, GenerationPhase
} from './types';
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
  generateVideoScript, generateSpeech, generateSceneImage, generateMetadata, generateThumbnails, generateVisualVariations
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
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

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
                    if (s.imageBase64) {
                        try {
                            let mime = 'image/png';
                            if (s.imageBase64.startsWith('/9j/')) mime = 'image/jpeg';
                            else if (s.imageBase64.startsWith('R0lGOD')) mime = 'image/gif';
                            else if (s.imageBase64.startsWith('UklGR')) mime = 'image/webp';
                            s.imageUrl = base64ToBlobUrl(s.imageBase64, mime);
                        } catch (e) { console.warn(`Image Hydration Failed`, e); }
                    }
                    if (s.mediaType === 'video' && s.videoBase64) {
                        try { s.videoUrl = base64ToBlobUrl(s.videoBase64, 'video/mp4'); } catch (e) { console.warn(`Video Hydration Failed`, e); }
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

  // --- PHASE 1: SCRIPT GENERATION ---
  const handleGenerateScript = async () => {
    setGenerationPhase('scripting');
    setProgress(translations[lang].initializing);
    try {
        setProgress(translations[lang].writingScript);
        
        // 1. Script
        const scriptItems = await generateVideoScript(topic, style, 1, pacing, channelName, contentLang, () => false); // Disable cancel check for stability
        
        // Filter Voices based on Gender for Auto Casting
        const maleVoices = ALL_GEMINI_VOICES.filter(v => v.gender === 'male');
        const femaleVoices = ALL_GEMINI_VOICES.filter(v => v.gender === 'female');

        // Character Cache to ensure consistency across scenes
        const characterVoiceMap: Record<string, string> = {};

        // 2. Setup Scenes (INITIAL STATE)
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
                visualPrompt: item.visual_prompt,
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
        alert((e as any).message); 
        setGenerationPhase('idle');
    }
  };

  const handleApproveScript = () => {
      // Called when user clicks "Approve" in EditorTab
      runAudioPhase(scenesRef.current);
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
                    ttsModel
                );

                if (audioRes.success) {
                    setScenes(prev => prev.map((s, idx) => idx === i ? {
                        ...s,
                        audioUrl: audioRes.url,
                        audioBuffer: audioRes.buffer,
                        audioBase64: audioRes.base64,
                        durationEstimate: audioRes.buffer ? audioRes.buffer.duration + 0.2 : s.durationEstimate,
                        isGeneratingAudio: false
                    } : s));
                } else {
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
                
                // Variations logic
                if (shotCount > 1) {
                    try {
                        const variations = await generateVisualVariations(scene.visualPrompt, scene.text, shotCount, () => false);
                        if (variations && variations.length > 0) prompts = variations;
                        while (prompts.length < shotCount) prompts.push(scene.visualPrompt);
                    } catch (err) {
                        prompts = Array(shotCount).fill(scene.visualPrompt);
                    }
                }

                // Generate images for all prompts (Sequential internal loop to be safe)
                const images = [];
                for (let k = 0; k < prompts.length; k++) {
                    if (k > 0) await delay(1000); // Wait between variations too
                    const p = prompts[k];
                    const img = await generateSceneImage(p, format, (i * 100) + k, topic, imageProvider, style, pollinationsModel, 'gemini-2.5-flash-image', () => false);
                    images.push(img);
                }
                
                // Construct Layers
                const segmentDuration = scene.durationEstimate / Math.max(1, images.length);
                const newLayers: LayerConfig[] = images.map((img, shotIdx) => ({
                     id: `auto-shot-${scene.id}-${shotIdx}`,
                     type: img.mediaType,
                     url: img.imageUrl || img.videoUrl,
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
      generateThumbnails(topic, style, imageProvider, () => false).then(thumbs => setThumbnails(thumbs)).catch(console.error);
      generateMetadata(topic, JSON.stringify(scenes), () => false).then(meta => setMetadata(meta)).catch(console.error);
  };

  const handleExportScript = () => {
      const project = { topic, scenes, metadata, style, pacing, format };
      const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
      triggerBrowserDownload(blob, `viralflow_project_${Date.now()}.json`);
  };

  const handleCreateManualProject = () => {
      setScenes([]);
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
  const handleBulkRegenerate = (type: 'images' | 'audio') => { /* Logic */ };
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
  const regenerateSceneAsset = async (index: number, type: 'image') => { /* Logic */ };
  const onRegenerateAsset = async (scene: Scene, provider: ImageProvider, pModel?: PollinationsModel, gModel?: GeminiModel) => {
      return generateSceneImage(scene.visualPrompt, format, 0, topic, provider, style, pModel, gModel);
  };
  const onRegenerateAudio = async (scene: Scene, model?: GeminiTTSModel, style?: string) => {
      return generateSpeech(scene.text, scene.speaker, scene.assignedVoice || 'Fenrir', 0, topic, undefined, style, model);
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