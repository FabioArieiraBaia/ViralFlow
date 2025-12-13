import { GoogleGenAI, Modality } from "@google/genai";
import { VideoStyle, VideoPacing, VideoFormat, VideoMetadata, ImageProvider, Language, PollinationsModel, GeminiModel, GeminiTTSModel, GeneratedScriptItem, ViralMetadataResult, ALL_GEMINI_VOICES } from "../types";
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

// HELPER: Fallback Generator
// If primary model fails with 404 (Not Found), tries fallback model (e.g. 1.5 flash)
async function generateWithFallback(
    ai: GoogleGenAI, 
    primaryModel: string, 
    params: any,
    fallbackModel: string = 'gemini-1.5-flash'
) {
    try {
        return await ai.models.generateContent({ model: primaryModel, ...params });
    } catch (e: any) {
        const msg = (e.message || JSON.stringify(e)).toLowerCase();
        if (msg.includes('not found') || msg.includes('404')) {
            console.warn(`[Gemini] Modelo ${primaryModel} não encontrado (404). Tentando fallback para ${fallbackModel}...`);
            return await ai.models.generateContent({ model: fallbackModel, ...params });
        }
        throw e;
    }
}

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
         console.warn(`[API Debug] ⚠️ Cota (429) na chave ...${shortKey}. Tentativa (${i+1}/${maxRetries}).`);
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
        // Log generic errors but keep trying if it's potentially transient
        console.error(`[API Debug] Erro Genérico (Tentativa ${i+1}/${maxRetries}):`, errorMsg);
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

export interface Chapter {
    title: string;
    summary: string;
}

// AGENT 1: ARCHITECT (Creates the Outline)
export const generateMovieOutline = async (
    topic: string, 
    channelName: string, 
    lang: Language, 
    checkCancelled: () => boolean
): Promise<Chapter[]> => {
    return withRetry(async (ai) => {
        const langName = lang === 'pt' ? 'Portuguese' : lang === 'es' ? 'Spanish' : 'English';
        
        // This prompts the "Architect Agent" to structure a long-form video
        const prompt = `
            Act as a Senior Movie Director and Screenwriter.
            Task: Create a detailed chapter outline for a long-form documentary/movie about: "${topic}".
            Channel Name: ${channelName}.
            Language: ${langName}.
            
            Structure requirements:
            - Create between 8 to 15 chapters (depending on topic depth).
            - Ensure a narrative arc (Introduction, Rising Action, Climax, Conclusion).
            
            Output strictly JSON:
            {
                "chapters": [
                    { "title": "Chapter 1: The Beginning", "summary": "Detailed summary of what happens in this chapter..." },
                    { "title": "Chapter 2: ...", "summary": "..." }
                ]
            }
        `;

        const response = await generateWithFallback(ai, 'gemini-2.5-flash', {
            contents: prompt,
            config: { responseMimeType: "application/json" }
        }, 'gemini-1.5-flash');

        const text = response.text || '{"chapters": []}';
        try {
            const json = JSON.parse(text);
            return json.chapters || [];
        } catch (e) {
            console.error("Outline parsing failed", text);
            return [];
        }
    }, checkCancelled);
};

// AGENT 2: SCREENWRITER (Writes one chapter at a time)
export const generateVideoScript = async (
    topic: string, 
    style: VideoStyle, 
    durationMinutes: number,
    pacing: VideoPacing,
    channelName: string,
    lang: Language,
    checkCancelled: () => boolean,
    chapterContext?: { 
        currentChapterTitle: string, 
        currentChapterSummary: string,
        chapterIndex: number, 
        totalChapters: number 
    }
): Promise<GeneratedScriptItem[]> => {
    return withRetry(async (ai) => {
        const langName = lang === 'pt' ? 'Portuguese' : lang === 'es' ? 'Spanish' : 'English';
        const isMovieMode = !!chapterContext;
        
        let prompt = "";
        
        if (isMovieMode) {
             // MOVIE MODE PROMPT (Focus on depth and quantity for ONE chapter)
             prompt = `
              You are a Screenwriter Agent working on Chapter ${chapterContext.chapterIndex + 1} of ${chapterContext.totalChapters}.
              Movie Topic: "${topic}".
              Current Chapter Title: "${chapterContext.currentChapterTitle}".
              Chapter Summary: "${chapterContext.currentChapterSummary}".
              Style: ${style}. 
              Language: ${langName}.
              
              Task: Write the full script for THIS CHAPTER ONLY.
              REQUIREMENTS:
              - Generate between 20 to 30 scenes for this chapter alone.
              - The script must flow naturally from the summary.
              - Be detailed and cinematic.
              
              Output strictly a JSON Array of objects with this schema:
              [
                { 
                  "speaker": "Narrator" or Character Name,
                  "gender": "male" | "female",
                  "text": "The spoken content (approx 2-3 sentences per scene)...",
                  "visual_prompt": "Highly detailed image generation prompt describing the scene...",
                  "cameraMovement": "ZOOM_IN" | "ZOOM_OUT" | "PAN_LEFT" | "PAN_RIGHT" | "STATIC" | "HANDHELD"
                },
                ... (repeat for 20-30 scenes)
              ]
             `;
        } else {
             // STANDARD MODE PROMPT (Single pass)
             prompt = `
              Create a viral video script about "${topic}".
              Style: ${style}. Pacing: ${pacing}. Channel: ${channelName}.
              Target Duration: ${durationMinutes} minutes.
              Language: ${langName}.
              
              Strictly output a JSON Array of objects with this schema:
              [
                { 
                  "speaker": "Narrator" or Character Name,
                  "gender": "male" | "female",
                  "text": "The spoken content...",
                  "visual_prompt": "Detailed image generation prompt for this scene...",
                  "cameraMovement": "ZOOM_IN" | "ZOOM_OUT" | "PAN_LEFT" | "PAN_RIGHT" | "STATIC"
                }
              ]
              IMPORTANT: The "gender" field is mandatory for correct voice assignment.
              Generate enough scenes to fill ${durationMinutes} minutes (approx 6-8 scenes per minute).
             `;
        }

        // Use Fallback logic here
        const response = await generateWithFallback(ai, 'gemini-2.5-flash', {
            contents: prompt,
            config: { responseMimeType: "application/json" }
        }, 'gemini-1.5-flash');
        
        const text = response.text || "[]";
        try {
            return JSON.parse(text);
        } catch (e) {
            const clean = text.replace(/```json/g, '').replace(/```/g, '');
            return JSON.parse(clean);
        }
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
        let voiceName = 'Fenrir';
        const lowerProfile = voiceProfile.toLowerCase();

        // 1. Check direct match against ALL_GEMINI_VOICES
        const directMatch = ALL_GEMINI_VOICES.find(v => v.id.toLowerCase() === lowerProfile || v.label.toLowerCase() === lowerProfile);
        
        if (directMatch) {
            voiceName = directMatch.id;
        } 
        else {
            // 2. Legacy Fallback Matching
            if (lowerProfile.includes('puck') || lowerProfile.includes('suave')) voiceName = 'Puck'; // Puck is Male
            else if (lowerProfile.includes('charon') || lowerProfile.includes('grave')) voiceName = 'Charon';
            else if (lowerProfile.includes('kore') || lowerProfile.includes('tech')) voiceName = 'Kore';
            else if (lowerProfile.includes('aoede') || lowerProfile.includes('dramática')) voiceName = 'Aoede';
            else if (lowerProfile.includes('zephyr') || lowerProfile.includes('calmo')) voiceName = 'Zephyr'; // Zephyr is Female
            
            // New fallback checks for common categories if exact match fails
            else if (lowerProfile.includes('narrador') || lowerProfile.includes('male')) voiceName = 'Fenrir';
            else if (lowerProfile.includes('female')) voiceName = 'Aoede'; // Changed from Puck to Aoede/Kore since Puck is male
        }

        const finalContent = stylePrompt ? `(Acting Direction: ${stylePrompt}) ${text}` : text;

        // NOTE: TTS usually doesn't fallback to text models, so we just try the requested model
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
    pollinationsModel: PollinationsModel = 'flux', // DEFAULT TO FLUX
    geminiModel: GeminiModel = 'gemini-2.5-flash-image', // Ignored, kept for compat
    checkCancelled?: () => boolean
): Promise<{ imageUrl: string, mediaType: 'image' | 'video', base64?: string, videoUrl?: string }> => {
    
    const safePrompt = cleanPrompt(prompt);
    
    // 1. STOCK VIDEO (PEXELS)
    if (provider === ImageProvider.STOCK_VIDEO) {
        return withRetry(async () => {
             const pexelsKey = getPexelsKey();
             if (!pexelsKey) throw new Error("Pexels key not found");
             
             const keywords = safePrompt.split(' ').slice(0, 5).join(' ');
             const orientation = format === VideoFormat.PORTRAIT ? 'portrait' : 'landscape';
             
             const res = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(keywords)}&per_page=1&orientation=${orientation}&size=medium`, {
                 headers: { Authorization: pexelsKey }
             });
             const data = await res.json();
             const videoFiles = data.videos?.[0]?.video_files;
             if (!videoFiles || videoFiles.length === 0) throw new Error("No stock video found");
             
             const bestVideo = videoFiles.find((v: any) => v.height >= 720) || videoFiles[0];
             
             return { imageUrl: bestVideo.image, videoUrl: bestVideo.link, mediaType: 'video' };
        }, checkCancelled);
    }

    // 2. POLLINATIONS (Sole Image/Video Provider)
    const width = format === VideoFormat.PORTRAIT ? 768 : 1280;
    const height = format === VideoFormat.PORTRAIT ? 1280 : 768;
    const safeSeed = seed || Math.floor(Math.random() * 1000);
    
    const effectiveModel = pollinationsModel || 'flux';
    
    // Check if the selected model is considered a video model
    // Note: Pollinations might not stream video bytes directly on the main endpoint for all models,
    // but the instruction is to use the URL structure. 
    // Admin only models: veo, luma, kling, runway.
    const isVideoModel = ['veo', 'luma', 'kling', 'runway', 'sora'].includes(effectiveModel);
    
    const pollinationsKey = getPollinationsToken();
    
    let queryParams = `width=${width}&height=${height}&seed=${safeSeed}&nologo=true&model=${effectiveModel}`;
    if (pollinationsKey) {
        queryParams += `&api_key=${pollinationsKey}`; // Used for high-tier access if configured
    }

    const baseUrl = "https://image.pollinations.ai/prompt";
    const finalUrl = `${baseUrl}/${encodeURIComponent(safePrompt)}?${queryParams}`;
    
    // If it's a video model (Admin feature), we treat the URL as the video source directly.
    // Pollinations handles the generation and serving.
    if (isVideoModel) {
        // Return videoUrl pointing to the Pollinations endpoint.
        // The VideoPlayer component knows how to handle <video src={videoUrl}>
        return {
            imageUrl: `https://placehold.co/${width}x${height}/000/FFF.png?text=VIDEO+LOADING`, // Placeholder thumb
            videoUrl: finalUrl, // Direct link to Pollinations video stream
            mediaType: 'video',
            base64: '' 
        };
    }

    // Standard Image Generation (Flux, Turbo, etc)
    // We download it as a Blob/Base64 to ensure it's available offline or during export
    return withRetry(async () => {
        const res = await fetch(finalUrl);
        if (!res.ok) throw new Error(`Pollinations error: ${res.status}`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        
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
    }, checkCancelled, 2); 
};

export const generateThumbnails = async (topic: string, style: VideoStyle, provider: ImageProvider, checkCancelled?: () => boolean): Promise<string[]> => {
    const promises = [1, 2, 3, 4].map(i => 
        generateSceneImage(
            `YouTube thumbnail for video about ${topic}, ${style}, catchy, high contrast, text-free`,
            VideoFormat.LANDSCAPE,
            i * 55,
            topic,
            provider,
            style,
            'flux', // Force Flux for thumbs
            'gemini-2.5-flash-image', // Ignored
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
        const response = await generateWithFallback(ai, 'gemini-2.5-flash', {
            contents: prompt,
            config: { responseMimeType: "application/json" }
        }, 'gemini-1.5-flash');
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
        const response = await generateWithFallback(ai, 'gemini-2.5-flash', {
            contents: prompt,
            config: { responseMimeType: "application/json" }
        }, 'gemini-1.5-flash');
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
        const response = await generateWithFallback(ai, 'gemini-2.5-flash', {
            contents: prompt,
            config: { responseMimeType: "application/json" }
        }, 'gemini-1.5-flash');
        const res = JSON.parse(response.text || '{"prompts": []}');
        return res.prompts && res.prompts.length > 0 ? res.prompts : [originalPrompt];
    }, checkCancelled);
};