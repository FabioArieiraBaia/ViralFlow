

import { GoogleGenAI, Type, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { GeneratedScriptItem, VideoStyle, VideoDuration, VideoPacing, VideoFormat, VideoMetadata, ImageProvider, Language } from "../types";
import { decodeBase64, decodeAudioData, audioBufferToWav, base64ToBlobUrl } from "./audioUtils";
import { getProjectDir, saveBase64File, saveTextFile } from "./fileSystem";

// --- KEY MANAGEMENT SYSTEM ---

const STORAGE_KEY = 'viralflow_manual_keys';
const PEXELS_STORAGE_KEY = 'viralflow_pexels_key';

let allKeys: string[] = [];
let currentKeyPointer = 0; // Pointer for Round Robin

const cleanKey = (key: string) => {
    return key.replace(/[^a-zA-Z0-9_\-]/g, '').trim();
};

// Initialize once per session/update to avoid constant re-parsing
export const initKeys = () => {
  const envKeys = (process.env.API_KEY as string) || "";
  const localKeys = localStorage.getItem(STORAGE_KEY) || "";
  
  // Merge LocalStorage keys (User Input) with Env keys
  const rawKeys = localKeys + "," + envKeys;
  
  // Robust split & Clean
  const candidates = rawKeys
    .split(/[,;\n\s]+/)
    .map(k => cleanKey(k))
    .filter(k => k.length > 20 && k.startsWith('AIza')); 
  
  // Deduplicate
  allKeys = [...new Set(candidates)];
};

export const saveManualKeys = (keysInput: string) => {
  localStorage.setItem(STORAGE_KEY, keysInput);
  initKeys();
  currentKeyPointer = 0; // Reset pointer on save
  console.log(`🔑 Chaves salvas. Total disponível: ${allKeys.length}`);
};

export const getManualKeys = (): string => {
  return localStorage.getItem(STORAGE_KEY) || "";
};

export const savePexelsKey = (key: string) => {
    localStorage.setItem(PEXELS_STORAGE_KEY, key.trim());
};

export const getPexelsKey = (): string => {
    return localStorage.getItem(PEXELS_STORAGE_KEY) || "";
};

export const getApiKeyCount = () => {
  initKeys(); // Ensure we are up to date
  return allKeys.length;
};

// PURE ROUND ROBIN STRATEGY
const getNextApiKey = (): string => {
  if (allKeys.length === 0) initKeys();
  if (allKeys.length === 0) return "";

  const key = allKeys[currentKeyPointer];
  currentKeyPointer = (currentKeyPointer + 1) % allKeys.length;
  return key;
};

// Modified withRetry to accept a cancellation checker and custom retries
async function withRetry<T>(
    operation: (ai: GoogleGenAI) => Promise<T>, 
    checkCancelled?: () => boolean,
    customRetries?: number
): Promise<T> {
  // Ensure keys are loaded
  if (allKeys.length === 0) initKeys();
  
  // URGENT FIX: Default retries lowered significantly to prevent infinite loops.
  // If customRetries is passed, use it. Otherwise default to 3.
  const maxRetries = customRetries !== undefined ? customRetries : 3;

  let lastError: any = null;

  for (let i = 0; i < maxRetries; i++) {
    if (checkCancelled && checkCancelled()) {
        throw new Error("CANCELLED_BY_USER");
    }

    const key = getNextApiKey();
    if (!key) throw new Error("Nenhuma chave de API configurada.");
    
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      return await operation(ai);
    } catch (error: any) {
      if (checkCancelled && checkCancelled()) {
          throw new Error("CANCELLED_BY_USER");
      }

      lastError = error;
      const errorMsg = (error.message || JSON.stringify(error)).toLowerCase();
      
      // STOP CONDITIONS - DO NOT RETRY THESE
      if (errorMsg.includes('safety') || errorMsg.includes('blocked')) throw error;
      if (errorMsg.includes('invalid argument') || errorMsg.includes('malformed')) throw error;
      if (errorMsg.includes('400') && !errorMsg.includes('quota')) throw error;

      const isQuotaError = 
          errorMsg.includes('429') || 
          errorMsg.includes('exhausted') || 
          errorMsg.includes('quota');
          
      const isAuthError = errorMsg.includes('403') || errorMsg.includes('api key');

      if (isQuotaError) {
         const shortKey = key.slice(-4);
         console.warn(`⚠️ Cota (429) na chave ...${shortKey}. Tentativa (${i+1}/${maxRetries}).`);
         await new Promise(resolve => setTimeout(resolve, 1000)); // Short delay
         continue;
      } 
      else if (isAuthError) {
         console.error(`❌ Chave inválida ...${key.slice(-4)}. Ignorando.`);
         continue;
      }
      else {
        console.error(`Erro Genérico (Tentativa ${i+1}/${maxRetries}):`, errorMsg);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  throw lastError || new Error("Falha após tentativas máximas.");
}

// --- GEMINI GENERATORS ---

export const generateVideoScript = async (
  topic: string, 
  style: VideoStyle, 
  durationMinutes: number,
  pacing: VideoPacing,
  channelName: string,
  language: Language,
  checkCancelled?: () => boolean
): Promise<GeneratedScriptItem[]> => {
  
  return withRetry(async (ai) => {
    const totalWords = Math.ceil(durationMinutes * 150);
    const targetLanguage = language === 'pt' ? 'PORTUGUESE (BRAZIL)' : language === 'es' ? 'SPANISH' : 'ENGLISH (US)';
    
    const systemInstruction = `You are a World-Class Video Director and Scriptwriter. Channel: "${channelName}". Style: ${style}. Pacing: ${pacing}.
    
    YOUR MISSION: Create a script that visually tells a story.
    
    MANDATORY VISUAL RULES (FOLLOW STRICTLY):
    1. NO REPETITION: Every scene MUST have a different "visual_prompt". Never use the same setting twice in a row.
    2. CAMERA ANGLES: You MUST start every 'visual_prompt' with a specific camera angle. Rotate through: [Extreme Close-up], [Wide Drone Shot], [Low Angle], [Over-the-shoulder], [Macro Shot], [GoPro POV], [Security Camera View].
    3. SHOW, DON'T TELL: If the text says "He was rich", the visual must be "Close-up of a gold diamond ring on a finger", not "A rich man".
    4. NO TEXT IN IMAGE: The visual prompt must explicitly say "no text, no logos, photorealistic".
    5. STYLE: If style is Documentary, use "NatGeo style, 4k, highly detailed". Avoid "Netflix" keyword.
    6. KEYWORDS: Include 2-3 specific keywords at the end of visual_prompt for search engines (e.g., "gold, ring, luxury").
    7. MANDATORY OUTRO: The FINAL scene MUST be a Call-to-Action (CTA). The narrator explicitly thanks the viewer in the name of the channel "${channelName || 'Narrator'}" and asks for Likes, Comments, and Subscription.
    
    Output ONLY valid JSON array: [{ "speaker": "Name", "text": "Dialogue", "visual_prompt": "CAMERA_ANGLE + Action description" }]
    Language: ${targetLanguage}.`;

    const prompt = `Create a script about: "${topic}".
    Target Duration: ${durationMinutes} minutes (approx ${totalWords} words).
    Constraint: High visual variety. Break the script into scenes of 3-6 seconds.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      }
    });

    if (!response.text) throw new Error("No text generated");
    
    let rawData: any[] = [];
    try {
      rawData = JSON.parse(response.text.trim());
    } catch (e) {
      const cleanText = response.text.replace(/```json|```/g, '').trim();
      rawData = JSON.parse(cleanText);
    }

    return rawData.map((item: any) => ({
       speaker: item.speaker || "Narrator",
       text: item.text || item.dialogue || item.script || "",
       visual_prompt: item.visual_prompt || item.visualPrompt || item.image_prompt || item.imageDescription || `Cinematic scene about ${topic}`
    }));
  }, checkCancelled);
};

export const generateSpeech = async (
    text: string, 
    speakerName: string, 
    voiceId: string, 
    sceneIndex: number, 
    projectTopic: string,
    checkCancelled?: () => boolean
): Promise<{url: string, buffer: AudioBuffer}> => {
  return withRetry(async (ai) => {
    const selectedVoice = voiceId && voiceId.trim().length > 0 ? voiceId : 'Fenrir';
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: { parts: [{ text: text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");

    const rawBytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(rawBytes);
    
    const projectDir = getProjectDir(projectTopic);
    let finalUrl = "";
    
    if (projectDir) {
       const wavBlob = audioBufferToWav(audioBuffer);
       const reader = new FileReader();
       finalUrl = await new Promise((resolve) => {
          reader.onloadend = () => {
             const base64Wav = reader.result as string;
             const savedUrl = saveBase64File(projectDir, `audio_${sceneIndex}_${speakerName}.wav`, base64Wav);
             resolve(savedUrl);
          };
          reader.readAsDataURL(wavBlob);
       });
    } else {
       const wavBlob = audioBufferToWav(audioBuffer);
       finalUrl = URL.createObjectURL(wavBlob);
    }

    return { url: finalUrl, buffer: audioBuffer };
  }, checkCancelled);
};

const sanitizePrompt = (prompt: string): string => {
    if (!prompt) return "Mysterious cinematic scene";
    return prompt
      .replace(/netflix|logo|text|watermark|label|sign|writing|lettering|caption|subtitles/gi, "") 
      .replace(/terror|horror|scary|blood|gore|death|dead|kill|murder|demon|creepy|nightmare/gi, "mysterious")
      .trim();
};

// --- PEXELS INTEGRATION ---
const searchPexelsVideo = async (query: string, format: VideoFormat, checkCancelled?: () => boolean): Promise<{video: string, image: string}> => {
    const pexelsKey = getPexelsKey();
    if (!pexelsKey) throw new Error("Chave Pexels não configurada.");

    // Extract key terms from visual prompt for better search
    const simplifiedQuery = query.split(',').slice(-3).join(' ') // Get last 3 keywords often used
        .replace(/camera angle|shot|cinematic|style|no text|photorealistic/gi, '')
        .trim();
    
    const orientation = format === VideoFormat.PORTRAIT ? 'portrait' : 'landscape';
    
    // Random page to ensure variety if regenerating
    const randomPage = Math.floor(Math.random() * 5) + 1;
    
    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(simplifiedQuery || query)}&orientation=${orientation}&size=medium&per_page=1&page=${randomPage}`;
    
    const response = await fetch(url, {
        headers: { Authorization: pexelsKey }
    });

    if (!response.ok) {
        if (response.status === 401) throw new Error("Chave Pexels Inválida");
        if (response.status === 429) throw new Error("Cota Pexels Excedida");
        throw new Error("Erro ao buscar vídeo no Pexels");
    }

    const data = await response.json();
    if (!data.videos || data.videos.length === 0) {
        throw new Error("Nenhum vídeo encontrado para: " + simplifiedQuery);
    }

    const videoData = data.videos[0];
    // Find best quality video file that matches format
    const videoFile = videoData.video_files.find((f: any) => f.quality === 'hd') || videoData.video_files[0];
    
    return {
        video: videoFile.link,
        image: videoData.image // Thumbnail
    };
};

// --- POLLINATIONS.AI INTEGRATION ---
const generatePollinationsImage = async (prompt: string, width: number, height: number, checkCancelled?: () => boolean): Promise<string> => {
  if (checkCancelled && checkCancelled()) throw new Error("CANCELLED_BY_USER");

  const encodedPrompt = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 1000000);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
  
  const response = await fetch(url);
  if (!response.ok) {
      throw new Error(`Pollinations API Error: ${response.statusText}`);
  }
  
  if (checkCancelled && checkCancelled()) throw new Error("CANCELLED_BY_USER");

  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); 
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
  });
};

// PLACEHOLDER BASE64 (Simple Grey Gradient)
const PLACEHOLDER_IMAGE = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkkAQAAB8AG7jymN8AAAAASUVORK5CYII=";

export const generateSceneImage = async (
    visualPrompt: string, 
    format: VideoFormat, 
    sceneIndex: number, 
    projectTopic: string,
    provider: ImageProvider,
    style: VideoStyle = VideoStyle.STORY,
    checkCancelled?: () => boolean
): Promise<{ imageUrl: string, videoUrl?: string, mediaType: 'image' | 'video' }> => {
  
  if (checkCancelled && checkCancelled()) throw new Error("CANCELLED_BY_USER");

  const isPortrait = format === VideoFormat.PORTRAIT;
  const aspectRatio = isPortrait ? "9:16" : "16:9";
  const width = isPortrait ? 720 : 1280;
  const height = isPortrait ? 1280 : 720;

  const safeVisualPrompt = sanitizePrompt((visualPrompt || "Cinematic scene").substring(0, 400));
  const negativePrompt = "text, watermark, logo, writing, letters, signature, bad anatomy, blurry, netflix logo, company logo";
  const cleanStyle = style === VideoStyle.DOCUMENTARY ? 'National Geographic Style, 4k, hyperrealistic' : style;
  
  const fullPromptGemini = `${safeVisualPrompt}. Style: ${cleanStyle}. High quality, 8k, photorealistic, cinematic lighting. \nNEGATIVE PROMPT: ${negativePrompt}`;
  const fullPromptPollinations = `(masterpiece, best quality, absolute realism), ${safeVisualPrompt}, ${cleanStyle}, detailed lighting. (no text:1.5), (no watermark:1.5), (no logo:1.5), (no netflix:1.5).`;

  // --- STRATEGY: TRY-CATCH BLOCKS WITH STRICT FALLBACKS ---
  // DO NOT allow Gemini if provider is NOT Gemini.
  
  try {
      // 1. STOCK VIDEO PATH
      if (provider === ImageProvider.STOCK_VIDEO) {
          const pexelsData = await searchPexelsVideo(visualPrompt, format, checkCancelled);
          return {
              imageUrl: pexelsData.image,
              videoUrl: pexelsData.video,
              mediaType: 'video'
          };
      }

      // 2. POLLINATIONS PATH
      if (provider === ImageProvider.POLLINATIONS) {
          const base64 = await generatePollinationsImage(fullPromptPollinations, width, height, checkCancelled);
          return processBase64Result(base64, 'image/jpeg', 'jpg', projectTopic, sceneIndex);
      }

      // 3. GEMINI PATH (Only if explicitly requested)
      if (provider === ImageProvider.GEMINI) {
          // FAST FAIL: Try Gemini max 3 times.
          const base64 = await withRetry(async (ai) => {
              const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash-image',
                  contents: { parts: [{ text: fullPromptGemini }] },
                  config: { imageConfig: { aspectRatio: aspectRatio } }
              });
              if (response.candidates?.[0]?.finishReason === 'SAFETY') throw new Error("SAFETY_BLOCK");
              
              let imgData = "";
              if (response.candidates?.[0]?.content?.parts) {
                 for(const p of response.candidates[0].content.parts) {
                     if(p.inlineData) { imgData = p.inlineData.data; break; }
                 }
              }
              if(!imgData) throw new Error("No image data from Gemini");
              return imgData;
          }, checkCancelled, 3); // MAX 3 RETRIES FOR GEMINI IMAGES
          
          return processBase64Result(base64, 'image/png', 'png', projectTopic, sceneIndex);
      }

      // 4. UPLOAD (Should fail over to Placeholder in UI usually, but handle here just in case)
      throw new Error("Provider not handled in generation logic");

  } catch (error: any) {
      if (error.message === "CANCELLED_BY_USER") throw error;

      console.error(`❌ Asset Generation Failed [Provider: ${provider}]:`, error);

      // --- FALLBACK LOGIC ---
      
      // If Gemini failed, or Stock failed -> Try Pollinations ONCE
      if (provider === ImageProvider.GEMINI || provider === ImageProvider.STOCK_VIDEO) {
          try {
              console.log("🔄 Attempting Fallback to Pollinations...");
              const base64 = await generatePollinationsImage(fullPromptPollinations, width, height, checkCancelled);
              return processBase64Result(base64, 'image/jpeg', 'jpg', projectTopic, sceneIndex);
          } catch (fallbackError) {
              console.error("❌ Fallback also failed.", fallbackError);
          }
      }

      // IF EVERYTHING FAILS: Return Placeholder so the app doesn't crash/hang.
      console.warn("⚠️ Returning Placeholder Image for Scene " + sceneIndex);
      return processBase64Result(PLACEHOLDER_IMAGE, 'image/png', 'png', projectTopic, sceneIndex);
  }
};

// Helper to save/format result
function processBase64Result(base64: string, mimeType: string, ext: string, projectTopic: string, sceneIndex: number) {
    const projectDir = getProjectDir(projectTopic);
    let finalUrl = "";
    if (projectDir) {
        const dataUrl = `data:${mimeType};base64,${base64}`;
        finalUrl = saveBase64File(projectDir, `image_${sceneIndex}.${ext}`, dataUrl);
    } else {
        finalUrl = base64ToBlobUrl(base64, mimeType);
    }
    return { imageUrl: finalUrl, mediaType: 'image' as const };
}

export const generateThumbnails = async (
    topic: string, 
    style: VideoStyle,
    provider: ImageProvider = ImageProvider.GEMINI,
    checkCancelled?: () => boolean
): Promise<string[]> => {
  const prompts = [
    `YouTube thumbnail for "${topic}", style ${style}, close-up emotion, vibrant colors, 4k, detailed, catchy, no text`,
    `Cinematic composition regarding "${topic}", ${style}, dramatic lighting, mysterious background, no text`
  ];

  const results = [];
  for (const prompt of prompts) {
      if (checkCancelled && checkCancelled()) break;
      try {
          const result = await generateSceneImage(prompt, VideoFormat.LANDSCAPE, 999, topic, provider, style, checkCancelled);
          results.push(result.imageUrl);
      } catch (e) {
          console.error("Thumb failed", e);
      }
  }
  return results;
};

export const generateMetadata = async (
    topic: string, 
    scriptContext: string,
    checkCancelled?: () => boolean
): Promise<VideoMetadata> => {
    return withRetry(async (ai) => {
        const prompt = `Generate YouTube SEO metadata for "${topic}". Output JSON: { "title": "", "description": "", "tags": [] }`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text.trim()) as VideoMetadata;
    }, checkCancelled);
};