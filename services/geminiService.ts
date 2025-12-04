import { GoogleGenAI, Modality } from "@google/genai";
import { VideoStyle, VideoPacing, VideoFormat, VideoMetadata, ImageProvider, Language, PollinationsModel, GeminiModel, GeminiTTSModel, GeneratedScriptItem, ViralMetadataResult } from "../types";
import { decodeBase64, decodeAudioData, audioBufferToWav, base64ToBlobUrl } from "./audioUtils";
import { getProjectDir, saveBase64File } from "./fileSystem";

// --- KEY MANAGEMENT SYSTEM ---

const STORAGE_KEY = 'viralflow_manual_keys';
const PEXELS_STORAGE_KEY = 'viralflow_pexels_key';
const POLLINATIONS_STORAGE_KEY = 'viralflow_pollinations_key';

let allKeys: string[] = [];
let currentKeyPointer = 0; // Pointer for Round Robin

const cleanKey = (key: string) => {
    return key.replace(/[^a-zA-Z0-9_\-]/g, '').trim();
};

// Initialize once per session/update to avoid constant re-parsing
export const initKeys = () => {
  const env = (import.meta as any).env || {};
  const envKeys = (env.API_KEY as string) || "";
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

export const savePollinationsToken = (token: string) => {
    localStorage.setItem(POLLINATIONS_STORAGE_KEY, token.trim());
};

export const getPollinationsToken = (): string => {
    return localStorage.getItem(POLLINATIONS_STORAGE_KEY) || "";
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
  
  const maxRetries = customRetries !== undefined ? customRetries : Math.min(Math.max(3, allKeys.length), 10);

  let lastError: any = null;

  for (let i = 0; i < maxRetries; i++) {
    if (checkCancelled && checkCancelled()) {
        throw new Error("CANCELLED_BY_USER");
    }

    // Jitter delay to prevent thundering herd on 429
    const jitter = Math.floor(Math.random() * 2000) + 1000; // 1s to 3s
    await new Promise(resolve => setTimeout(resolve, jitter));

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
         console.warn(`[Pollinations Debug] ⚠️ Cota (429) na chave ...${shortKey}. Tentativa (${i+1}/${maxRetries}).`);
         // Exponential backoff for 429
         const backoff = 2000 * Math.pow(1.5, i);
         await new Promise(resolve => setTimeout(resolve, backoff));
         continue;
      } 
      else if (isAuthError) {
         console.error(`❌ Chave inválida ...${key.slice(-4)}. Ignorando.`);
         continue;
      }
      else {
        console.error(`[Pollinations Debug] Erro Genérico (Tentativa ${i+1}/${maxRetries}):`, errorMsg);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  throw lastError;
}

// --- CLEAN PROMPT HELPER ---
function cleanPrompt(prompt: string): string {
    // Remove characters that might break URL generation or JSON parsing
    return prompt
        .replace(/["\n\r]/g, ' ') // Remove quotes and newlines
        .replace(/[^\w\s\-,.]/gi, '') // Keep alphanum, space, hyphen, comma, dot
        .trim()
        .substring(0, 1000); // Limit length
}

// --- GENERATION FUNCTIONS ---

export const generateVideoScript = async (
    topic: string, 
    style: VideoStyle, 
    durationMinutes: number,
    pacing: VideoPacing,
    channelName: string,
    lang: Language,
    checkCancelled: () => boolean,
    chapterContext?: { currentChapter: string, prevChapter: string, chapterIndex: number, totalChapters: number }
): Promise<GeneratedScriptItem[]> => {
    return withRetry(async (ai) => {
        const langName = lang === 'pt' ? 'Portuguese' : lang === 'es' ? 'Spanish' : 'English';
        const isMovieMode = !!chapterContext;
        
        let prompt = "";
        
        if (isMovieMode) {
             prompt = `
              You are a professional screenwriter for a ${style} movie. 
              Write the script for Chapter ${chapterContext.chapterIndex + 1}/${chapterContext.totalChapters}: "${chapterContext.currentChapter}".
              Context from previous chapter: "${chapterContext.prevChapter}".
              Channel: ${channelName}.
              Language: ${langName}.
              
              Format: Strictly JSON Array of objects.
              Objects: { "speaker": "Name", "text": "Dialogue...", "visual_prompt": "Cinematic description...", "cameraMovement": "ZOOM_IN" }.
              Make it detailed, engaging, and suitable for the middle of a movie.
             `;
        } else {
             prompt = `
              Create a viral video script about "${topic}".
              Style: ${style}. Pacing: ${pacing}. Channel: ${channelName}.
              Target Duration: ${durationMinutes} minutes.
              Language: ${langName}.
              
              Strictly output a JSON Array of objects with this schema:
              [
                { 
                  "speaker": "Narrator" or Character Name,
                  "text": "The spoken content...",
                  "visual_prompt": "Detailed image generation prompt for this scene...",
                  "cameraMovement": "ZOOM_IN" | "ZOOM_OUT" | "PAN_LEFT" | "PAN_RIGHT" | "STATIC"
                }
              ]
              Do not include markdown code blocks. Just the raw JSON string.
             `;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        
        const text = response.text || "[]";
        try {
            return JSON.parse(text);
        } catch (e) {
            // Fallback parsing if model adds markdown
            const clean = text.replace(/```json/g, '').replace(/```/g, '');
            return JSON.parse(clean);
        }
    }, checkCancelled);
};

export const generateMovieOutline = async (topic: string, channelName: string, lang: Language, checkCancelled: () => boolean): Promise<{ chapters: string[] }> => {
    return withRetry(async (ai) => {
        const langName = lang === 'pt' ? 'Portuguese' : lang === 'es' ? 'Spanish' : 'English';
        const prompt = `
            Create a movie outline for a documentary/film about "${topic}".
            Language: ${langName}.
            Output JSON: { "chapters": ["Chapter 1 Title", "Chapter 2 Title", ... up to 8 chapters] }
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{"chapters": []}');
    }, checkCancelled);
};

export const generateSpeech = async (
    text: string, 
    speakerName: string, 
    voiceProfile: string, 
    index: number,
    topic: string,
    checkCancelled?: () => boolean,
    stylePrompt?: string,
    model: GeminiTTSModel = 'gemini-2.5-flash-preview-tts'
): Promise<{ url: string, buffer?: AudioBuffer, base64: string, success: boolean }> => {
    return withRetry(async (ai) => {
        // Map internal voice IDs to Gemini Voice names
        // Available: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Zephyr'
        let voiceName = 'Fenrir';
        const lowerProfile = voiceProfile.toLowerCase();
        if (lowerProfile.includes('puck') || lowerProfile.includes('suave')) voiceName = 'Puck';
        else if (lowerProfile.includes('charon') || lowerProfile.includes('grave')) voiceName = 'Charon';
        else if (lowerProfile.includes('kore') || lowerProfile.includes('tech')) voiceName = 'Kore';
        else if (lowerProfile.includes('aoede') || lowerProfile.includes('dramática')) voiceName = 'Aoede';
        else if (lowerProfile.includes('zephyr') || lowerProfile.includes('calmo')) voiceName = 'Zephyr';

        // Add acting direction if stylePrompt is provided
        const finalContent = stylePrompt 
            ? `(Acting Direction: ${stylePrompt}) ${text}`
            : text;

        const response = await ai.models.generateContent({
            model: model,
            contents: finalContent,
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName }
                    }
                }
            }
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data received");

        const rawBytes = decodeBase64(base64Audio);
        const audioBuffer = await decodeAudioData(rawBytes); // Decodes PCM to AudioBuffer
        const wavBlob = audioBufferToWav(audioBuffer); // Converts to WAV Blob
        const url = URL.createObjectURL(wavBlob);

        return { url, buffer: audioBuffer, base64: base64Audio, success: true };
    }, checkCancelled);
};

export const generateSceneImage = async (
    prompt: string, 
    format: VideoFormat, 
    seed: number, 
    topic: string,
    provider: ImageProvider,
    style: VideoStyle,
    pollinationsModel: PollinationsModel = 'turbo',
    geminiModel: GeminiModel = 'gemini-2.5-flash-image',
    checkCancelled?: () => boolean
): Promise<{ imageUrl: string, mediaType: 'image' | 'video', base64?: string, videoUrl?: string }> => {
    
    // Clean Prompt to avoid URL issues
    const safePrompt = cleanPrompt(prompt);
    
    // 1. STOCK VIDEO (PEXELS)
    if (provider === ImageProvider.STOCK_VIDEO) {
        return withRetry(async () => {
             const pexelsKey = getPexelsKey();
             if (!pexelsKey) throw new Error("Pexels key not found");
             
             // Extract keywords from prompt for better search
             const keywords = safePrompt.split(' ').slice(0, 5).join(' ');
             const orientation = format === VideoFormat.PORTRAIT ? 'portrait' : 'landscape';
             
             const res = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(keywords)}&per_page=1&orientation=${orientation}&size=medium`, {
                 headers: { Authorization: pexelsKey }
             });
             const data = await res.json();
             const videoFiles = data.videos?.[0]?.video_files;
             if (!videoFiles || videoFiles.length === 0) throw new Error("No stock video found");
             
             // Find best quality fit (HD)
             const bestVideo = videoFiles.find((v: any) => v.height >= 720) || videoFiles[0];
             
             return { imageUrl: bestVideo.image, videoUrl: bestVideo.link, mediaType: 'video' };
        }, checkCancelled);
    }

    // 2. GEMINI IMAGEN
    if (provider === ImageProvider.GEMINI) {
        return withRetry(async (ai) => {
            const width = format === VideoFormat.PORTRAIT ? 768 : 1280;
            const height = format === VideoFormat.PORTRAIT ? 1280 : 768;
            const aspectRatio = format === VideoFormat.PORTRAIT ? '9:16' : '16:9';

            const response = await ai.models.generateContent({
                model: geminiModel,
                contents: safePrompt + `, ${style} style, high quality, 8k`,
                config: {
                    // Note: aspect ratio param depends on exact model version, 
                    // using prompt injection is often more reliable for flash-image
                }
            });
            
            // Handle image extraction (usually comes as inlineData in parts)
            // Note: The specific response structure depends on the model version.
            // For flash-image, it might return base64.
            // Since SDK typings can be tricky, we iterate parts.
            let base64 = "";
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    base64 = part.inlineData.data;
                    break;
                }
            }
            
            if (!base64) throw new Error("No image data in Gemini response");
            const imageUrl = `data:image/png;base64,${base64}`;
            return { imageUrl, mediaType: 'image', base64 };
        }, checkCancelled);
    }

    // 3. POLLINATIONS (Default Fallback)
    const width = format === VideoFormat.PORTRAIT ? 768 : 1280;
    const height = format === VideoFormat.PORTRAIT ? 1280 : 768;
    const safeSeed = seed || Math.floor(Math.random() * 1000);
    
    // Using a proxy or direct URL
    // Note: To avoid 429s and URL errors, we use the cleaned prompt
    const finalUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(safePrompt)}?width=${width}&height=${height}&seed=${safeSeed}&nologo=true&model=${pollinationsModel}`;
    
    // We fetch it to convert to blob/base64 to ensure it loads and can be saved
    return withRetry(async () => {
        const res = await fetch(finalUrl);
        if (!res.ok) throw new Error(`Pollinations error: ${res.status}`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        // Convert blob to base64 for saving
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => {
                const b64 = (reader.result as string).split(',')[1];
                resolve(b64);
            };
        });
        reader.readAsDataURL(blob);
        const base64 = await base64Promise;

        return { imageUrl: objectUrl, mediaType: 'image', base64 };
    }, checkCancelled, 2); // Less retries for Pollinations
};

export const generateThumbnails = async (topic: string, style: VideoStyle, provider: ImageProvider, checkCancelled?: () => boolean): Promise<string[]> => {
    // Generate 4 variations
    const promises = [1, 2, 3, 4].map(i => 
        generateSceneImage(
            `YouTube thumbnail for video about ${topic}, ${style}, catchy, high contrast, text-free`,
            VideoFormat.LANDSCAPE,
            i * 55,
            topic,
            provider,
            style,
            'flux', // Use better model for thumbs
            'gemini-2.5-flash-image',
            checkCancelled
        ).then(r => r.imageUrl).catch(() => 'https://placehold.co/1280x720/222/FFF.png?text=Thumb+Error')
    );
    return Promise.all(promises);
};

export const generateMetadata = async (topic: string, scriptContext: string, checkCancelled?: () => boolean): Promise<VideoMetadata> => {
    return withRetry(async (ai) => {
        const prompt = `
            Generate YouTube Metadata for a video about: "${topic}".
            Script Context: "${scriptContext.substring(0, 500)}...".
            Output JSON: { "title": "Clickbait Title", "description": "SEO Description...", "tags": ["tag1", "tag2", "tag3"] }
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{}');
    }, checkCancelled);
};

export const generateViralMetadata = async (topic: string, context: string, checkCancelled?: () => boolean): Promise<ViralMetadataResult> => {
    return withRetry(async (ai) => {
        const prompt = `
            You are a Viral YouTube Expert.
            Topic: ${topic}
            Context: ${context}
            Generate:
            1. 5 Clickbait Titles (High CTR).
            2. AIDA Description (Attention, Interest, Desire, Action).
            3. 30 Viral Tags (comma separated).
            
            Output JSON:
            {
                "titles": ["Title 1", ...],
                "description": "Full description text...",
                "tags": "tag1, tag2, tag3..."
            }
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{}');
    }, checkCancelled);
};

export const generateVisualVariations = async (originalPrompt: string, sceneText: string, count: number, checkCancelled?: () => boolean): Promise<string[]> => {
    return withRetry(async (ai) => {
        const prompt = `
            Based on this scene script: "${sceneText}"
            And this base visual style: "${originalPrompt}"
            
            Generate ${count} distinct visual descriptions (prompts) for sequential shots in this scene.
            They should tell a story visually.
            
            Output JSON: { "prompts": ["prompt 1", "prompt 2", ...] }
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const res = JSON.parse(response.text || '{"prompts": []}');
        return res.prompts && res.prompts.length > 0 ? res.prompts : [originalPrompt];
    }, checkCancelled);
};
