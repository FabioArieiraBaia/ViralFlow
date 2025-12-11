
import React, { useState, useRef, useEffect } from 'react';
import { VideoStyle, VideoDuration, VideoPacing, VideoFormat, VideoMetadata, SubtitleStyle, ImageProvider, UserTier, VideoFilter, Language, Theme, OverlayConfig, VideoTransition, PollinationsModel, GeminiModel, Scene, ViralMetadataResult, CameraMovement, VFXConfig, SubtitleSettings, VisualIntensity, LayerConfig, GeminiTTSModel, ALL_GEMINI_VOICES } from './types';
import { generateVideoScript, generateSpeech, generateSceneImage, generateThumbnails, generateMetadata, getApiKeyCount, saveManualKeys, getManualKeys, savePexelsKey, getPexelsKey, savePollinationsToken, getPollinationsToken, generateMovieOutline, generateViralMetadata, generateVisualVariations } from './services/geminiService';
import { translations } from './services/translations';
import { decodeBase64, decodeAudioData, base64ToBlobUrl, audioBufferToWav, getAudioContext } from './services/audioUtils';
import { VideoPlayerRef } from './components/VideoPlayer';
import { WelcomeModal, UpgradeModal, EditSceneModal } from './components/Modals';
import { triggerBrowserDownload } from './services/fileSystem';

// Components (Modularized)
import { Header } from './components/Header';
import { CreateTab } from './components/tabs/CreateTab';
import { EditorTab } from './components/tabs/EditorTab';
import { MetadataTab } from './components/tabs/MetadataTab';
import { SettingsTab } from './components/tabs/SettingsTab';

// --- SALES & SECURITY CONFIG ---
const env = (import.meta as any).env || {};
const MASTER_KEY = 'ADMIN-TEST-KEY-2025'; 
const LICENSE_SALT = env.VITE_LICENSE_SALT || 'DEV_SALT_INSECURE';
type LicenseType = 'VF-M' | 'VF-T' | 'VF-A' | 'VF-L'; 

const verifyLocalKey = (keyInput: string): boolean => {
    const key = keyInput.trim().toUpperCase();
    if (key === MASTER_KEY) return true;
    const parts = key.split('-');
    if (parts.length < 3 || parts.length > 4) return false;
    let randomPart = '';
    let providedSignature = '';
    if (parts[0] === 'VFPRO' && parts.length === 3) {
        randomPart = parts[1];
        providedSignature = parts[2];
    } else if (parts.length === 4 && ['VF', 'VFPRO'].includes(parts[0])) {
         randomPart = parts[2];
         providedSignature = parts[3];
    } else {
        return false;
    }
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

const generateLicenseKey = (type: LicenseType = 'VF-L'): string => {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const signatureSource = randomPart + LICENSE_SALT;
    let hash = 0;
    for (let i = 0; i < signatureSource.length; i++) {
        const char = signatureSource.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; 
    }
    const signature = Math.abs(hash).toString(16).substring(0, 4).toUpperCase().padStart(4, '0');
    const prefixMap: Record<string, string> = {
        'VF-M': 'VF-M', 'VF-T': 'VF-T', 'VF-A': 'VF-A', 'VF-L': 'VF-L'
    };
    return `${prefixMap[type]}-${randomPart}-${signature}`;
};

const performAutoCasting = (scenes: Scene[], style: VideoStyle): Scene[] => {
  const uniqueSpeakers = Array.from(new Set(scenes.map(s => s.speaker)));
  const cast: Record<string, string> = {};
  
  // Categorize voices from the centralized list
  const maleVoices = ALL_GEMINI_VOICES.filter(v => v.gender === 'male').map(v => v.id);
  const femaleVoices = ALL_GEMINI_VOICES.filter(v => v.gender === 'female').map(v => v.id);
  
  const narratorVoice = 'Fenrir'; // Default epic narrator
  
  // Pre-assignments based on style
  if (style === VideoStyle.DEBATE) { cast['Host'] = 'Zephyr'; cast['Proponent'] = 'Kore'; cast['Opponent'] = 'Charon'; }
  else if (style === VideoStyle.KIDS_STORY) { cast['Narrator'] = 'Puck'; cast['Wolf'] = 'Fenrir'; cast['Bear'] = 'Charon'; cast['Fairy'] = 'Aoede'; cast['Princess'] = 'Kore'; }
  else if (style === VideoStyle.NEWS) { cast['Anchor'] = 'Fenrir'; cast['Reporter'] = 'Puck'; cast['Witness'] = 'Zephyr'; }
  
  let maleIdx = 0, femaleIdx = 0, neutralIdx = 0;
  
  uniqueSpeakers.forEach(speaker => {
     if (cast[speaker]) return;
     const lower = speaker.toLowerCase();
     let assigned = '';
     
     const isFemale = lower.match(/(mulher|woman|ela|rainha|queen|senhora|menina|girl|deusa|mae|chapeuzinho|maria|ana|julia|princesa|bruxa|fairy|fada|witch|avó|grandma|reporter|repórter|little red|jane|sarah|linda)/);
     const isMale = lower.match(/(homem|man|ele|rei|king|senhor|menino|boy|deus|pai|lobo|joao|pedro|general|soldado|principe|cacador|wolf|bear|urso|fox|raposa|professor|teacher|anchor|âncora|joe|john)/);
     const isNarrator = lower.includes('narrador') || lower.includes('narrator');
     
     if (isNarrator) { 
         assigned = narratorVoice; 
     } 
     else if (isFemale) { 
         assigned = femaleVoices[femaleIdx % femaleVoices.length]; 
         femaleIdx++; 
     } 
     else if (isMale) { 
         assigned = maleVoices[maleIdx % maleVoices.length]; 
         maleIdx++; 
     } 
     else { 
         const neutralVoices = [...maleVoices, ...femaleVoices]; 
         // Shuffle neutral slightly to vary
         assigned = neutralVoices[(neutralIdx + Math.floor(Math.random()*5)) % neutralVoices.length]; 
         neutralIdx++; 
     }
     cast[speaker] = assigned;
  });
  return scenes.map(scene => ({ ...scene, assignedVoice: cast[scene.speaker] || 'Fenrir' }));
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('pt');
  const [contentLang, setContentLang] = useState<Language>('pt');
  const [theme, setTheme] = useState<Theme>('dark');
  const [topic, setTopic] = useState('Historia do Cafe');
  const [channelName, setChannelName] = useState('CuriosoTech');
  const [style, setStyle] = useState<VideoStyle>(VideoStyle.DOCUMENTARY);
  const [pacing, setPacing] = useState<VideoPacing>(VideoPacing.NORMAL);
  const [visualIntensity, setVisualIntensity] = useState<VisualIntensity>(VisualIntensity.LOW);
  const [duration, setDuration] = useState<VideoDuration>(VideoDuration.SHORT);
  const [format, setFormat] = useState<VideoFormat>(VideoFormat.PORTRAIT);
  const [voice, setVoice] = useState('Auto');
  const [customVoice, setCustomVoice] = useState('');
  const [imageProvider, setImageProvider] = useState<ImageProvider>(ImageProvider.POLLINATIONS);
  const [pollinationsModel, setPollinationsModel] = useState<PollinationsModel>('flux'); // NEW: Global state for Pollinations model
  const [thumbProvider, setThumbProvider] = useState<ImageProvider>(ImageProvider.POLLINATIONS);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>(SubtitleStyle.KARAOKE); 
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>({ fontSizeMultiplier: 1.0, yPosition: 0.9, fontFamily: 'Inter' });
  const [activeFilter, setActiveFilter] = useState<VideoFilter>(VideoFilter.NONE);
  const [globalTransition, setGlobalTransition] = useState<VideoTransition>(VideoTransition.FADE);
  
  // TTS SETTINGS
  const [ttsModel, setTtsModel] = useState<GeminiTTSModel>('gemini-2.5-flash-preview-tts');
  const [globalTtsStyle, setGlobalTtsStyle] = useState<string>('');

  // GLOBAL VFX STATE
  const [globalVfx, setGlobalVfx] = useState<VFXConfig>({
      shakeIntensity: 0,
      chromaticAberration: 0,
      bloomIntensity: 0,
      vignetteIntensity: 0.3, // Default vignette for cinematic look
      filmGrain: 0.05 // Default slight grain
  });

  const [scenes, setScenes] = useState<Scene[]>([]);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [bgMusicUrl, setBgMusicUrl] = useState<string>("");
  const [bgMusicVolume, setBgMusicVolume] = useState<number>(0.15);
  const [channelLogo, setChannelLogo] = useState<OverlayConfig | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
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
  const [selectedLicenseType, setSelectedLicenseType] = useState<LicenseType>('VF-M');
  const importInputRef = useRef<HTMLInputElement>(null);
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(new Set());
  const cancelRef = useRef(false);
  const playerRef = useRef<VideoPlayerRef>(null);

  // Metadata States
  const [metaTopic, setMetaTopic] = useState('');
  const [metaContext, setMetaContext] = useState('');
  const [viralMetaResult, setViralMetaResult] = useState<ViralMetadataResult | null>(null);

  // ADMIN CHECK
  const isMasterAdmin = userKey === MASTER_KEY;

  useEffect(() => { if (theme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); }, [theme]);
  useEffect(() => { const initUser = async () => { const savedKey = localStorage.getItem('viralflow_pro_key'); if (savedKey) { if (savedKey === MASTER_KEY || verifyLocalKey(savedKey)) { setUserTier(UserTier.PRO); setUserKey(savedKey); } } }; initUser(); const seenWelcome = sessionStorage.getItem('viralflow_welcome_seen'); if (seenWelcome) setShowWelcomeModal(false); }, []);

  const handleUpgrade = async (keyInput: string): Promise<boolean> => { 
      const input = keyInput.trim(); 
      if (input === MASTER_KEY) { setUserTier(UserTier.PRO); localStorage.setItem('viralflow_pro_key', input); setUserKey(input); return true; } 
      if (verifyLocalKey(input)) { setUserTier(UserTier.PRO); const formattedKey = input.toUpperCase(); localStorage.setItem('viralflow_pro_key', formattedKey); setUserKey(formattedKey); return true; } 
      return false; 
  };
  const handleCloseWelcome = () => { setShowWelcomeModal(false); sessionStorage.setItem('viralflow_welcome_seen', 'true'); };
  
  const handleSceneAssetRegeneration = async (scene: Scene, provider: ImageProvider, pModel?: PollinationsModel, geminiModel?: GeminiModel): Promise<any> => { 
      const index = scenes.findIndex(s => s.id === scene.id); const idx = index >= 0 ? index : 0; 
      const safeProvider = provider; 
      try { 
          const result = await generateSceneImage(scene.visualPrompt, format, idx, topic, safeProvider, style, pModel || pollinationsModel, geminiModel); 
          return { ...result, success: true }; 
      } 
      catch (e) { alert("Erro ao regenerar asset: " + e); return { success: false }; } 
  };
  
  const handleSceneAudioRegeneration = async (scene: Scene, newModel?: GeminiTTSModel, newStyle?: string): Promise<any> => { 
      const index = scenes.findIndex(s => s.id === scene.id); const idx = index >= 0 ? index : 0; 
      const effectiveStyle = newStyle !== undefined ? newStyle : (scene.ttsStyle || globalTtsStyle);
      const effectiveModel = newModel || ttsModel;

      try { 
          const audioResult = await generateSpeech(scene.text, scene.speaker, scene.assignedVoice || 'Fenrir', idx, topic, undefined, effectiveStyle, effectiveModel); 
          return { ...audioResult, success: true }; 
      } 
      catch (e) { console.error("Regeneration failed", e); return { success: false }; } 
  };
  
  const generateDraftChapter = async (chapterName: string, prevChapterName: string, chapterIndex: number, totalChapters: number): Promise<Scene[]> => { const rawScript = await generateVideoScript(topic, style, 8, pacing, channelName, contentLang, () => cancelRef.current, { currentChapter: chapterName, prevChapter: prevChapterName, chapterIndex: chapterIndex, totalChapters: totalChapters }); let chunkScenes: Scene[] = rawScript.map((item, idx) => ({ id: `c${chapterIndex}-s${idx}`, speaker: item.speaker, text: item.text, visualPrompt: item.visual_prompt, durationEstimate: Math.max(3, item.text.split(' ').length * 0.4), mediaType: 'image' as const, imageUrl: "https://placehold.co/1280x720/222/FFF.png?text=DRAFT+MODE", isGeneratingImage: false, isGeneratingAudio: false, audioError: false, cameraMovement: item.cameraMovement as CameraMovement || CameraMovement.ZOOM_IN, ttsStyle: "" })); if (voice === 'Auto') chunkScenes = performAutoCasting(chunkScenes, style); else chunkScenes = chunkScenes.map(s => ({ ...s, assignedVoice: voice === 'Custom' ? customVoice : voice })); return chunkScenes; };
  
  const handleGenerateVideo = async () => { 
      if (isGenerating) { cancelRef.current = true; return; } 
      if (getApiKeyCount() === 0) { alert(translations[lang].pleaseConfig); setActiveTab('settings'); return; } 
      try { await getAudioContext().resume(); } catch(e) {}
      
      setIsGenerating(true); setIsReviewing(false); cancelRef.current = false; setScenes([]); setMetadata(null); setThumbnails([]); setProgress(translations[lang].initializing); setActiveTab('preview'); 
      try { 
          if (duration === VideoDuration.MOVIE) { 
              if (userTier === UserTier.FREE) throw new Error("Upgrade to PRO to use Movie Mode"); 
              const outline = await generateMovieOutline(topic, channelName, contentLang, () => cancelRef.current); 
              let draftScenes: Scene[] = []; 
              for (let i = 0; i < outline.chapters.length; i++) { if (cancelRef.current) break; const chapter = outline.chapters[i]; const prevChapter = i > 0 ? outline.chapters[i-1] : "Opening"; setProgress(`📝 Agente Roteirista: Escrevendo Capítulo ${i+1}/${outline.chapters.length}...`); const chapterScenes = await generateDraftChapter(chapter, prevChapter, i, outline.chapters.length); draftScenes = [...draftScenes, ...chapterScenes]; setScenes([...draftScenes]); } 
              if (cancelRef.current) throw new Error("Cancelled"); setScenes(draftScenes); setProgress("🏷️ Gerando Metadados..."); generateMetadata(topic, JSON.stringify(draftScenes.slice(0, 10).map(s => s.text)), () => cancelRef.current).then(setMetadata).catch(console.error); setIsReviewing(true); setProgress("✅ Roteiro Pronto."); 
          } else { 
              setProgress(translations[lang].writingScript); 
              const durMinutes = duration === VideoDuration.SHORT ? 0.8 : (duration === VideoDuration.MEDIUM ? 3 : 8); 
              const rawScript = await generateVideoScript(topic, style, durMinutes, pacing, channelName, contentLang, () => cancelRef.current); 
              let minDuration = 3; if (pacing === VideoPacing.HYPER) minDuration = 1.5; if (pacing === VideoPacing.FAST) minDuration = 2.5; if (pacing === VideoPacing.SLOW) minDuration = 6; 
              
              const movements = [CameraMovement.ZOOM_IN, CameraMovement.ZOOM_OUT, CameraMovement.PAN_LEFT, CameraMovement.PAN_RIGHT];

              let newScenes: Scene[] = rawScript.map((item, idx) => ({ 
                  id: `scene-${idx}`, 
                  speaker: item.speaker, 
                  text: item.text, 
                  visualPrompt: item.visual_prompt, 
                  durationEstimate: Math.max(minDuration, item.text.split(' ').length * 0.4), 
                  mediaType: 'image' as const, 
                  imageUrl: '', 
                  isGeneratingImage: true, 
                  isGeneratingAudio: true, 
                  audioError: false, 
                  cameraMovement: (item.cameraMovement as CameraMovement) || movements[idx % movements.length],
                  ttsStyle: globalTtsStyle 
              })); 
              
              if (voice === 'Auto') newScenes = performAutoCasting(newScenes, style); else newScenes = newScenes.map(s => ({ ...s, assignedVoice: voice === 'Custom' ? customVoice : voice })); 
              setScenes(newScenes); await produceScenes(newScenes); 
          } 
      } catch (error: any) { 
          if (error.message === "Cancelled" || error.message === "CANCELLED_BY_USER") setProgress(translations[lang].cancelGen); 
          else { console.error(error); alert(`${translations[lang].errorGen} ${error.message}`); setProgress(translations[lang].fatalError); } 
      } finally { setIsGenerating(false); cancelRef.current = false; } 
  };
  
  const produceScenes = async (scenesToProduce: Scene[]) => { 
      setIsGenerating(true); 
      
      // BATCH CONFIGURATION - KEEP AT 1 TO AVOID 429
      const BATCH_SIZE = 1; 
      const chunks: Scene[][] = [];
      for (let i = 0; i < scenesToProduce.length; i += BATCH_SIZE) {
          chunks.push(scenesToProduce.slice(i, i + BATCH_SIZE));
      }

      let processedCount = 0;

      for (let i = 0; i < chunks.length; i++) {
          if (cancelRef.current) break;
          
          const batch = chunks[i];
          setProgress(`${translations[lang].producingScene} ${processedCount + 1} / ${scenesToProduce.length}...`);
          
          // Mark batch as generating
          setScenes(prev => {
              const updated = [...prev];
              batch.forEach(s => {
                  const idx = updated.findIndex(u => u.id === s.id);
                  if (idx !== -1) updated[idx] = { ...updated[idx], isGeneratingAudio: true, isGeneratingImage: true };
              });
              return updated;
          });

          // Delay for rate limiting
          if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Process batch
          await Promise.all(batch.map(async (scene) => {
              if (scene.audioUrl && scene.imageUrl && !scene.imageUrl.includes('placehold')) return;

              const idxInTotal = scenesToProduce.findIndex(s => s.id === scene.id);
              
              let safeImageProvider = imageProvider; 
              if (imageProvider === ImageProvider.NONE) safeImageProvider = ImageProvider.NONE; 
              else safeImageProvider = ImageProvider.POLLINATIONS;

              // 1. GENERATE AUDIO
              let audioResult;
              try {
                  const effectiveStyle = scene.ttsStyle || globalTtsStyle;
                  audioResult = await generateSpeech(scene.text, scene.speaker, scene.assignedVoice || 'Fenrir', idxInTotal, topic, () => cancelRef.current, effectiveStyle, ttsModel);
              } catch(e) {
                  audioResult = { url: '', buffer: undefined, base64: '', success: false };
              }
              const duration = (audioResult.buffer?.duration || scene.durationEstimate) + 0.2;

              // 2. DETERMINE CUTS
              let cutInterval = 100;
              if (visualIntensity === VisualIntensity.HYPER) cutInterval = 1.8;
              else if (visualIntensity === VisualIntensity.HIGH) cutInterval = 2.5;
              else if (visualIntensity === VisualIntensity.MEDIUM) cutInterval = 4.5;
              
              const numCuts = (visualIntensity === VisualIntensity.LOW) ? 1 : Math.ceil(duration / cutInterval);
              const finalNumCuts = Math.max(1, numCuts);
              
              // 3. GENERATE PROMPTS
              let visualPrompts: string[] = [scene.visualPrompt];
              if (finalNumCuts > 1 && safeImageProvider !== ImageProvider.NONE) {
                  try {
                       visualPrompts = await generateVisualVariations(scene.visualPrompt, scene.text, finalNumCuts, () => cancelRef.current);
                  } catch(e) { /* fallback to single prompt */ }
              }

              // 4. GENERATE IMAGES (OR VIDEO IF MODEL IS VEO)
              const generatedLayers: LayerConfig[] = [];
              let mainImageResult: any = { imageUrl: "https://placehold.co/1280x720/333/FFF.png?text=Error", success: false, mediaType: 'image' };

              for (let cutIdx = 0; cutIdx < visualPrompts.length; cutIdx++) {
                  if (cancelRef.current) break;
                  const prompt = visualPrompts[cutIdx];
                  const seedIndex = (idxInTotal * 1000) + (cutIdx * 55);

                  // USE SELECTED MODEL FROM STATE (veo, flux, etc)
                  const imgRes = await generateSceneImage(prompt, format, seedIndex, topic, safeImageProvider, style, pollinationsModel, 'gemini-2.5-flash-image', () => cancelRef.current)
                      .then(r => ({ ...r, success: true }))
                      .catch(e => ({ imageUrl: '', mediaType: 'image' as const, base64: '', success: false, videoUrl: undefined }));
                  
                  if (cutIdx === 0) {
                      mainImageResult = imgRes;
                  } else {
                      if (imgRes.success) {
                          generatedLayers.push({
                              id: `auto-seq-${idxInTotal}-${cutIdx}`,
                              type: imgRes.mediaType,
                              url: imgRes.videoUrl || imgRes.imageUrl,
                              name: `Auto Cut ${cutIdx + 1}`,
                              x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1,
                              startTime: cutIdx * cutInterval,
                              isBackground: true
                          });
                      }
                  }
              }

              // UPDATE SCENE STATE
              setScenes(prev => { 
                  const updated = [...prev]; 
                  const targetIdx = updated.findIndex(u => u.id === scene.id);
                  if (targetIdx === -1) return updated;

                  let finalMovement = updated[targetIdx].cameraMovement;
                  if (!finalMovement || finalMovement === 'STATIC' as any) {
                      const movements = [CameraMovement.ZOOM_IN, CameraMovement.ZOOM_OUT, CameraMovement.PAN_LEFT, CameraMovement.PAN_RIGHT];
                      finalMovement = movements[Math.floor(Math.random() * movements.length)];
                  }

                  updated[targetIdx] = { 
                      ...updated[targetIdx], 
                      durationEstimate: duration,
                      audioUrl: audioResult.url, 
                      audioBuffer: audioResult.buffer, 
                      audioBase64: audioResult.base64, 
                      audioError: !audioResult.buffer, 
                      
                      imageUrl: mainImageResult.imageUrl, 
                      imageBase64: mainImageResult.base64, 
                      videoUrl: mainImageResult.videoUrl, 
                      mediaType: mainImageResult.mediaType,
                      
                      layers: generatedLayers.length > 0 ? [...(updated[targetIdx].layers || []), ...generatedLayers] : updated[targetIdx].layers,
                      
                      cameraMovement: finalMovement, 
                      isGeneratingAudio: false, 
                      isGeneratingImage: false 
                  }; 
                  return updated; 
              });
          }));

          processedCount += batch.length;
      }

      if (!cancelRef.current) { 
          setProgress(translations[lang].renderComplete); 
          try {
             const fullScriptContext = scenesToProduce.map(s => s.text).join(' ').substring(0, 5000);
             generateMetadata(topic, fullScriptContext, () => cancelRef.current).then(setMetadata);
             generateViralMetadata(topic, fullScriptContext, () => cancelRef.current).then(setViralMetaResult);
             setMetaTopic(topic);
          } catch(e) {}
          if (thumbnails.length === 0) generateThumbnails(topic, style, thumbProvider, () => cancelRef.current).then(setThumbnails).catch(console.error); 
          setIsPlaying(true); 
      } else { setProgress(translations[lang].cancelGen); } 
      setIsGenerating(false); 
  };
  
  const handleExportScript = () => { 
      if (scenes.length === 0) return; 
      
      // Use Blob to handle large amounts of base64 data safely
      const jsonString = JSON.stringify(scenes, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const filename = `${topic.replace(/ /g, "_")}_script.json`;
      
      triggerBrowserDownload(blob, filename);
  };
  
  const handleForceRegenerateAll = async () => { const updatedScenes: Scene[] = scenes.map(s => ({ ...s, audioUrl: undefined, imageUrl: undefined, videoUrl: undefined, isGeneratingImage: false, isGeneratingAudio: false, assignedVoice: voice === 'Auto' ? s.assignedVoice : (voice === 'Custom' ? customVoice : voice) })); let finalScenes = updatedScenes; if (voice === 'Auto') { finalScenes = performAutoCasting(updatedScenes, style); } setScenes(finalScenes); await produceScenes(finalScenes); };
  
  const handleImportScript = (e: React.ChangeEvent<HTMLInputElement>) => { 
      const file = e.target.files?.[0]; if (!file) return; 
      const reader = new FileReader(); 
      reader.onload = async (evt) => { 
          try { 
              const importedScenes = JSON.parse(evt.target?.result as string); 
              if (Array.isArray(importedScenes)) { 
                  // CRITICAL: Resume audio context before attempting decode
                  const ctx = getAudioContext();
                  if (ctx.state === 'suspended') await ctx.resume();
                  
                  const restoredScenes: Scene[] = await Promise.all(importedScenes.map(async (s: Scene) => {
                      const newScene = { ...s };
                      // Audio Hydration from Base64
                      if (newScene.audioBase64) {
                          try {
                              const rawBytes = decodeBase64(newScene.audioBase64);
                              // Ensure decoding happens safely
                              const buffer = await decodeAudioData(rawBytes);
                              const wavBlob = audioBufferToWav(buffer);
                              newScene.audioUrl = URL.createObjectURL(wavBlob);
                              newScene.audioBuffer = buffer;
                              // Update duration based on restored buffer if missing or wrong
                              if (buffer.duration > 0) {
                                  newScene.durationEstimate = buffer.duration + 0.2;
                              }
                              newScene.audioError = false;
                          } catch (err) { console.error(`Failed to restore audio for scene ${s.id}`, err); newScene.audioError = true; }
                      } else { newScene.audioBuffer = undefined; }
                      // Image Hydration from Base64
                      if (newScene.imageBase64) { try { newScene.imageUrl = base64ToBlobUrl(newScene.imageBase64, 'image/png'); } catch (err) { console.error(err); } }
                      return newScene;
                  }));
                  setScenes(restoredScenes); setActiveTab('preview'); 
              } else { alert("Arquivo JSON inválido."); } 
          } catch (err) { console.error(err); alert("Erro ao ler arquivo."); } 
      }; 
      reader.readAsText(file); 
  };

  const updateKeys = (val: string) => { setManualKeys(val); saveManualKeys(val); setApiKeyCount(getApiKeyCount()); };
  const updatePexelsKey = (val: string) => { setPexelsKeyInput(val); savePexelsKey(val); };
  const updatePollinationsToken = (val: string) => { setPollinationsToken(val); savePollinationsToken(val); };
  const handleGenerateLicense = () => { const key = generateLicenseKey(selectedLicenseType); setGeneratedAdminKey(key); };
  
  const regenerateSceneAsset = async (index: number, type: 'image') => { 
      if (isGenerating) return; 
      const scene = scenes[index]; if (!scene) return; 
      setScenes(prev => { const updated = [...prev]; updated[index] = { ...updated[index], isGeneratingImage: true }; return updated; }); 
      try { 
          // Always use Pollinations now
          const result = await generateSceneImage(scene.visualPrompt, format, index, topic, ImageProvider.POLLINATIONS, style, pollinationsModel); 
          setScenes(prev => { const updated = [...prev]; updated[index] = { ...updated[index], imageUrl: result.imageUrl, imageBase64: result.base64, videoUrl: result.videoUrl, mediaType: result.mediaType, isGeneratingImage: false }; return updated; }); 
      } catch (e) { console.error(e); setScenes(prev => { const updated = [...prev]; updated[index] = { ...updated[index], isGeneratingImage: false }; return updated; }); } 
  };
  
  const saveSceneUpdate = (updated: Scene) => { setScenes(prev => prev.map(s => s.id === updated.id ? updated : s)); setEditingScene(null); };
  const handleCreateManualProject = () => { setScenes([{ id: `manual-s0`, speaker: 'Narrator', text: 'Welcome.', visualPrompt: 'Cinematic opening', durationEstimate: 5, mediaType: 'image', imageUrl: 'https://placehold.co/1280x720/111/FFF.png?text=Scene+1', isGeneratingAudio: false, isGeneratingImage: false, assignedVoice: 'Fenrir', cameraMovement: CameraMovement.ZOOM_IN, ttsStyle: globalTtsStyle }]); setTopic('Manual Project'); setActiveTab('preview'); };
  const handleAddScene = () => { const newIdx = scenes.length; const newScene: Scene = { id: `manual-s${newIdx}-${Date.now()}`, speaker: 'Narrator', text: 'New scene...', visualPrompt: 'Describe...', durationEstimate: 5, mediaType: 'image', imageUrl: `https://placehold.co/1280x720/111/FFF.png?text=Scene+${newIdx+1}`, isGeneratingAudio: false, isGeneratingImage: false, assignedVoice: 'Fenrir', cameraMovement: CameraMovement.ZOOM_IN, ttsStyle: globalTtsStyle }; setScenes(prev => [...prev, newScene]); };
  const handleToggleSelectScene = (id: string) => { const newSet = new Set(selectedSceneIds); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); setSelectedSceneIds(newSet); };
  const handleSelectAll = () => { if (selectedSceneIds.size === scenes.length) setSelectedSceneIds(new Set()); else setSelectedSceneIds(new Set(scenes.map(s => s.id))); };
  const handleBulkDelete = () => { if (selectedSceneIds.size === 0) return; if (!confirm(`Deletar ${selectedSceneIds.size} cenas?`)) return; setScenes(prev => prev.filter(s => !selectedSceneIds.has(s.id))); setSelectedSceneIds(new Set()); if(scenes.length === 0) setCurrentSceneIndex(0); };
  
  const handleBulkRegenerate = async (type: 'images' | 'audio') => { 
      if (isGenerating) return; 
      const ids = Array.from(selectedSceneIds); if (ids.length === 0) return; 
      setIsGenerating(true); 
      const scenesToProcess = scenes.filter(s => selectedSceneIds.has(s.id)); 
      
      const BATCH_SIZE = 1;
      const chunks: Scene[][] = [];
      for(let i=0; i<scenesToProcess.length; i+=BATCH_SIZE) chunks.push(scenesToProcess.slice(i, i+BATCH_SIZE));
      
      setScenes(prev => prev.map(s => selectedSceneIds.has(s.id) ? { ...s, isGeneratingImage: type === 'images', isGeneratingAudio: type === 'audio' } : s)); 
      
      for(const batch of chunks) {
          if (cancelRef.current) break;
          await new Promise(resolve => setTimeout(resolve, 1000));

          await Promise.all(batch.map(async (scene) => {
              if (type === 'images') { 
                  try { const imgRes = await handleSceneAssetRegeneration(scene, ImageProvider.POLLINATIONS, pollinationsModel, 'gemini-2.5-flash-image'); setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, imageUrl: imgRes.imageUrl, imageBase64: imgRes.base64, videoUrl: imgRes.videoUrl, mediaType: imgRes.mediaType, isGeneratingImage: false } : s)); } catch(e) {} 
              } else { 
                  try { 
                      const audioRes = await handleSceneAudioRegeneration(scene, ttsModel, globalTtsStyle); 
                      let exactDuration = scene.durationEstimate;
                      if (audioRes.success && audioRes.buffer) exactDuration = audioRes.buffer.duration + 0.2;
                      setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, audioUrl: audioRes.url, audioBuffer: audioRes.buffer, audioBase64: audioRes.base64, audioError: !audioRes.success, durationEstimate: exactDuration, isGeneratingAudio: false } : s)); 
                  } catch(e) {} 
              }
          }));
      }
      setIsGenerating(false); setProgress(''); 
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500/30 flex flex-col overflow-hidden transition-colors duration-300">
      
      <Header 
        userTier={userTier} setShowUpgradeModal={setShowUpgradeModal} activeTab={activeTab} 
        setActiveTab={setActiveTab} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} apiKeyCount={apiKeyCount} 
      />

      <main className="flex-1 overflow-hidden relative flex">
        {activeTab === 'create' && (
          <CreateTab 
            lang={lang} topic={topic} setTopic={setTopic} contentLang={contentLang} setContentLang={setContentLang}
            style={style} setStyle={setStyle} pacing={pacing} setPacing={setPacing} visualIntensity={visualIntensity} setVisualIntensity={setVisualIntensity} format={format} setFormat={setFormat}
            duration={duration} setDuration={setDuration} channelName={channelName} setChannelName={setChannelName}
            voice={voice} setVoice={setVoice} customVoice={customVoice} setCustomVoice={setCustomVoice}
            imageProvider={imageProvider} setImageProvider={setImageProvider} globalTransition={globalTransition}
            setGlobalTransition={setGlobalTransition} userTier={userTier} isGenerating={isGenerating} progress={progress}
            handleGenerateVideo={handleGenerateVideo} handleImportScriptRef={importInputRef} 
            setShowUpgradeModal={setShowUpgradeModal} setActiveTab={setActiveTab} 
            importClick={() => importInputRef.current?.click()} handleCreateManualProject={handleCreateManualProject}
            ttsModel={ttsModel} setTtsModel={setTtsModel} globalTtsStyle={globalTtsStyle} setGlobalTtsStyle={setGlobalTtsStyle}
            pollinationsModel={pollinationsModel} setPollinationsModel={setPollinationsModel}
            isAdmin={isMasterAdmin}
          />
        )}

        {activeTab === 'preview' && (
           <EditorTab 
             scenes={scenes} setScenes={setScenes} currentSceneIndex={currentSceneIndex} setCurrentSceneIndex={setCurrentSceneIndex}
             isPlaying={isPlaying} setIsPlaying={setIsPlaying} format={format} setFormat={setFormat}
             bgMusicUrl={bgMusicUrl} setBgMusicUrl={setBgMusicUrl} bgMusicVolume={bgMusicVolume} setBgMusicVolume={setBgMusicVolume}
             showSubtitles={showSubtitles} setShowSubtitles={setShowSubtitles} subtitleStyle={subtitleStyle} setSubtitleStyle={setSubtitleStyle}
             subtitleSettings={subtitleSettings} setSubtitleSettings={setSubtitleSettings}
             activeFilter={activeFilter} setActiveFilter={setActiveFilter} globalTransition={globalTransition} setGlobalTransition={setGlobalTransition}
             globalVfx={globalVfx} setGlobalVfx={setGlobalVfx}
             userTier={userTier} channelLogo={channelLogo} setChannelLogo={setChannelLogo} isGenerating={isGenerating} isReviewing={isReviewing}
             handleForceRegenerateAll={handleForceRegenerateAll} handleExportScript={handleExportScript} playerRef={playerRef} lang={lang}
             setShowUpgradeModal={setShowUpgradeModal} selectedSceneIds={selectedSceneIds} handleToggleSelectScene={handleToggleSelectScene}
             handleSelectAll={handleSelectAll} handleBulkRegenerate={handleBulkRegenerate} handleBulkDelete={handleBulkDelete}
             handleAddScene={handleAddScene} regenerateSceneAsset={regenerateSceneAsset} setEditingScene={setEditingScene}
           />
        )}

        {activeTab === 'metadata' && (
           <MetadataTab 
             lang={lang} metaTopic={metaTopic} setMetaTopic={setMetaTopic} metaContext={metaContext} setMetaContext={setMetaContext}
             viralMetaResult={viralMetaResult} setViralMetaResult={setViralMetaResult} metadata={metadata} thumbnails={thumbnails}
             setThumbnails={setThumbnails} scenesLength={scenes.length} topic={topic} style={style} thumbProvider={thumbProvider}
           />
        )}

        {activeTab === 'settings' && (
            <SettingsTab 
                lang={lang} manualKeys={manualKeys} updateKeys={updateKeys} apiKeyCount={apiKeyCount}
                pexelsKey={pexelsKey} updatePexelsKey={updatePexelsKey} 
                pollinationsToken={pollinationsToken} updatePollinationsToken={updatePollinationsToken}
                userKey={userKey}
                selectedLicenseType={selectedLicenseType} setSelectedLicenseType={setSelectedLicenseType}
                handleGenerateLicense={handleGenerateLicense} generatedAdminKey={generatedAdminKey}
            />
        )}
      </main>

      <input type="file" ref={importInputRef} onChange={handleImportScript} className="hidden" accept=".json" />
      
      {showWelcomeModal && <WelcomeModal onClose={handleCloseWelcome} lang={lang} t={translations} />}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} onUpgrade={handleUpgrade} lang={lang} t={translations} />}
      {editingScene && (
        <EditSceneModal 
            scene={editingScene} onClose={() => setEditingScene(null)} onSave={saveSceneUpdate} 
            onRegenerateAsset={handleSceneAssetRegeneration} onRegenerateAudio={handleSceneAudioRegeneration}
            lang={lang} userTier={userTier} format={format} t={translations} ttsModel={ttsModel}
            isAdmin={isMasterAdmin}
        />
      )}
    </div>
  );
};

export default App;
