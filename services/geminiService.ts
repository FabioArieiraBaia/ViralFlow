import { GoogleGenAI, Modality } from "@google/genai";
import { VideoStyle, VideoPacing, VideoFormat, VideoMetadata, ImageProvider, Language, PollinationsModel, GeminiModel, GeminiTTSModel, GeneratedScriptItem, ViralMetadataResult, ALL_GEMINI_VOICES, VisualIntensity } from "../types";
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

// AGENT 2: SCREENWRITER (Writes one chapter at a time) - WITHOUT visual prompts
export const generateVideoScript = async (
    topic: string, 
    style: VideoStyle, 
    visualIntensity: VisualIntensity,
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
        
        // AGENT INSTRUCTION: Visual Intensity Logic
        let intensityInstruction = "";
        switch(visualIntensity) {
            case VisualIntensity.LOW: 
                intensityInstruction = "VISUAL INSTRUCTION: Keep it calm. Describe static shots, slow pans, and focus on a single subject. Minimal cuts."; 
                break;
            case VisualIntensity.MEDIUM: 
                intensityInstruction = "VISUAL INSTRUCTION: Balanced pacing. Use a mix of wide shots and close-ups. Standard documentary style."; 
                break;
            case VisualIntensity.HIGH: 
                intensityInstruction = "VISUAL INSTRUCTION: High energy! Fast cuts, dynamic camera movements (zoom, whip pan), detailed action scenes. Keep the viewer engaged."; 
                break;
            case VisualIntensity.HYPER: 
                intensityInstruction = "VISUAL INSTRUCTION: CHAOTIC & HYPER. Extremely fast cuts, glitch aesthetics, constant motion, overwhelming details. Gen Z / TikTok style."; 
                break;
        }

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
              - DO NOT include visual_prompt - that will be generated later by the Photography Director Agent.
              
              Output strictly a JSON Array of objects with this schema:
              [
                { 
                  "speaker": "Narrator" or Character Name,
                  "gender": "male" | "female",
                  "text": "The spoken content (approx 2-3 sentences per scene)...",
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
                  "cameraMovement": "ZOOM_IN" | "ZOOM_OUT" | "PAN_LEFT" | "PAN_RIGHT" | "STATIC" | "HANDHELD"
                }
              ]
              NOTE: DO NOT include visual_prompt - that will be generated later by the Photography Director Agent.
             `;
        }

        const response = await generateWithFallback(ai, 'gemini-2.5-flash', {
            contents: prompt,
            config: { responseMimeType: "application/json" }
        }, 'gemini-1.5-flash');

        const text = response.text || '[]';
        try {
            const json = JSON.parse(text);
            return Array.isArray(json) ? json : [];
        } catch (e) {
            console.error("Script parsing failed", text);
            return [];
        }
    }, checkCancelled);
};

// AGENT 3: GENERAL REVIEWER / DIRECTOR (Reviews and refines the script)
export const reviewScript = async (
    scriptItems: GeneratedScriptItem[],
    topic: string,
    style: VideoStyle,
    pacing: VideoPacing,
    lang: Language,
    checkCancelled?: () => boolean
): Promise<GeneratedScriptItem[]> => {
    return withRetry(async (ai) => {
        const langName = lang === 'pt' ? 'Portuguese' : lang === 'es' ? 'Spanish' : 'English';
        
        const prompt = `You are a Senior Film Director and General Reviewer Agent.
        
Topic: "${topic}"
Style: ${style}
Pacing: ${pacing}
Language: ${langName}

Task: Review and refine the script below. Ensure:
- Narrative flow is smooth and engaging
- Dialogues are natural and appropriate for the style
- Pacing matches the requested pacing setting
- Content is coherent and well-structured
- Each scene transitions smoothly to the next

Original Script (JSON):
${JSON.stringify(scriptItems, null, 2)}

Output strictly a JSON Array with the SAME structure, but refined and improved. Keep the same number of scenes unless you find critical issues.
Do NOT add visual_prompt - that will be generated later by the Photography Director Agent.

Output format:
[
  { 
    "speaker": "...",
    "gender": "male" | "female",
    "text": "...",
    "cameraMovement": "..."
  },
  ...
]`;

        const response = await generateWithFallback(ai, 'gemini-2.5-flash', {
            contents: prompt,
            config: { responseMimeType: "application/json" }
        }, 'gemini-1.5-flash');

        const text = response.text || '[]';
        try {
            const json = JSON.parse(text);
            return Array.isArray(json) ? json : scriptItems; // Fallback to original if parsing fails
        } catch (e) {
            console.error("Script review parsing failed", text);
            return scriptItems; // Return original if review fails
        }
    }, checkCancelled);
};

// AGENT 4: PHOTOGRAPHY DIRECTOR (Generates visual prompts for each scene)
export const generateVisualPrompts = async (
    scriptItems: GeneratedScriptItem[],
    topic: string,
    style: VideoStyle,
    visualIntensity: VisualIntensity,
    lang: Language,
    checkCancelled?: () => boolean
): Promise<GeneratedScriptItem[]> => {
    return withRetry(async (ai) => {
        const langName = lang === 'pt' ? 'Portuguese' : lang === 'es' ? 'Spanish' : 'English';
        
        // Build intensity-specific instructions
        let intensityInstruction = "";
        switch(visualIntensity) {
            case VisualIntensity.LOW: 
                intensityInstruction = "VISUAL INSTRUCTION: Keep it calm. Describe static shots, slow pans, and focus on a single subject. Minimal cuts."; 
                break;
            case VisualIntensity.MEDIUM: 
                intensityInstruction = "VISUAL INSTRUCTION: Balanced pacing. Use a mix of wide shots and close-ups. Standard documentary style."; 
                break;
            case VisualIntensity.HIGH: 
                intensityInstruction = "VISUAL INSTRUCTION: High energy! Fast cuts, dynamic camera movements (zoom, whip pan), detailed action scenes. Keep the viewer engaged."; 
                break;
            case VisualIntensity.HYPER: 
                intensityInstruction = "VISUAL INSTRUCTION: CHAOTIC & HYPER. Extremely fast cuts, glitch aesthetics, constant motion, overwhelming details. Gen Z / TikTok style."; 
                break;
        }
        
        const prompt = `You are a Photography Director Agent.
        
Topic: "${topic}"
Style: ${style}
Language: ${langName}

${intensityInstruction}

Task: Generate highly detailed visual prompts for each scene in the script below.
Each visual_prompt should:
- Be highly detailed and descriptive
- Follow the Visual Intensity instruction above strictly
- Match the scene's text and context
- Be optimized for image generation AI
- Include camera angles, lighting, composition, and visual style details

Script (JSON):
${JSON.stringify(scriptItems, null, 2)}

Output strictly a JSON Array with the SAME structure, but with "visual_prompt" added to each scene:
[
  { 
    "speaker": "...",
    "gender": "...",
    "text": "...",
    "visual_prompt": "Highly detailed image generation prompt describing the scene...",
    "cameraMovement": "..."
  },
  ...
]`;

        const response = await generateWithFallback(ai, 'gemini-2.5-flash', {
            contents: prompt,
            config: { responseMimeType: "application/json" }
        }, 'gemini-1.5-flash');

        const text = response.text || '[]';
        try {
            const json = JSON.parse(text);
            if (Array.isArray(json) && json.length > 0) {
                return json;
            }
            // If failed, add basic visual prompts as fallback
            return scriptItems.map(item => ({
                ...item,
                visual_prompt: `${item.text}. Cinematic shot, detailed, ${style} style.`
            }));
        } catch (e) {
            console.error("Visual prompts generation parsing failed", text);
            // Fallback: add basic visual prompts
            return scriptItems.map(item => ({
                ...item,
                visual_prompt: `${item.text}. Cinematic shot, detailed, ${style} style.`
            }));
        }
    }, checkCancelled);
};

// TTS Generation
export const generateSpeech = async (
    text: string,
    speaker: string,
    voice: string,
    sceneIndex: number,
    topic: string,
    checkCancelled?: () => boolean,
    ttsStyle?: string,
    model: GeminiTTSModel = 'gemini-2.5-flash-preview-tts'
): Promise<{ success: boolean; url?: string; buffer?: AudioBuffer; base64?: string }> => {
    try {
        return await withRetry(async (ai) => {
            if (checkCancelled && checkCancelled()) {
                throw new Error("CANCELLED_BY_USER");
            }

            const stylePrompt = ttsStyle ? ` Style: ${ttsStyle}.` : '';
            const prompt = `Generate natural speech for: "${text}". Speaker: ${speaker}.${stylePrompt}`;

            // CRITICAL FIX: Use correct API structure for TTS voice configuration
            // The API expects speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, not audioConfig.voice
            const requestPayload = {
                model: model,
                contents: prompt,
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: voice
                            }
                        }
                    }
                }
            };
            
            console.log(`[generateSpeech] Generating audio for scene ${sceneIndex} with model ${model}, voice "${voice}"`);
            console.log(`[generateSpeech] REQUEST PAYLOAD:`, JSON.stringify(requestPayload, null, 2));
            console.log(`[generateSpeech] Voice parameter type: ${typeof voice}, value: "${voice}", length: ${voice?.length}`);

            const response = await (ai.models.generateContent as any)({
                model: model,
                contents: prompt,
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: voice
                            }
                        }
                    }
                }
            });

            const responseAny = response as any;
            
            // Debug: Log complete response structure (deep inspection)
            console.log(`[generateSpeech] Full response structure:`, {
                responseType: typeof response,
                responseKeys: Object.keys(responseAny || {}),
                hasResponse: !!responseAny,
                responseText: responseAny?.text,
                responseAudio: responseAny?.audio,
                responseCandidates: responseAny?.candidates,
                responseResult: responseAny?.result,
                hasAudioMethod: typeof responseAny?.audio === 'function',
                hasGetAudioMethod: typeof responseAny?.getAudio === 'function',
                responseMethods: Object.getOwnPropertyNames(responseAny || {}).filter(name => typeof (responseAny as any)[name] === 'function')
            });
            
            // Try to get audio using method if available
            let audioFromMethod: any = null;
            if (typeof responseAny?.audio === 'function') {
                try {
                    audioFromMethod = responseAny.audio();
                    console.log(`[generateSpeech] Got audio from .audio() method:`, audioFromMethod);
                } catch (e) {
                    console.warn(`[generateSpeech] .audio() method failed:`, e);
                }
            }
            if (typeof responseAny?.getAudio === 'function') {
                try {
                    audioFromMethod = responseAny.getAudio();
                    console.log(`[generateSpeech] Got audio from .getAudio() method:`, audioFromMethod);
                } catch (e) {
                    console.warn(`[generateSpeech] .getAudio() method failed:`, e);
                }
            }
            
            // Also log the raw response to see its actual structure
            console.log(`[generateSpeech] Raw response object (first level):`, {
                ...responseAny,
                // Don't stringify the whole thing as it might be huge
                _type: responseAny?.constructor?.name
            });
            
            // Try multiple possible response structures
            let audioData: string | undefined;
            
            // Path 0: From method call result
            if (audioFromMethod?.data) {
                audioData = audioFromMethod.data;
                console.log(`[generateSpeech] Found audio data from method call`);
            }
            // Path 1: response.audio.data (most common)
            else if (responseAny?.audio?.data) {
                audioData = responseAny.audio.data;
                console.log(`[generateSpeech] Found audio data at response.audio.data`);
            }
            // Path 1b: response.audio (if it's a getter that returns data directly)
            else if (typeof responseAny?.audio === 'string' && responseAny.audio.length > 100) {
                audioData = responseAny.audio;
                console.log(`[generateSpeech] Found audio data as response.audio (string)`);
            }
            // Path 2: response.candidates[0].content.parts[0].inlineData.data
            else if (responseAny?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
                audioData = responseAny.candidates[0].content.parts[0].inlineData.data;
                console.log(`[generateSpeech] Found audio data at response.candidates[0].content.parts[0].inlineData.data`);
            }
            // Path 2b: response.candidates[0].content.parts[0] (if audio is a property)
            else if (responseAny?.candidates?.[0]?.content?.parts?.[0]?.audio?.data) {
                audioData = responseAny.candidates[0].content.parts[0].audio.data;
                console.log(`[generateSpeech] Found audio data at response.candidates[0].content.parts[0].audio.data`);
            }
            // Path 3: response.result.audio.data
            else if (responseAny?.result?.audio?.data) {
                audioData = responseAny.result.audio.data;
                console.log(`[generateSpeech] Found audio data at response.result.audio.data`);
            }
            // Path 4: response.text (base64 encoded)
            else if (responseAny?.text && responseAny.text.length > 100) {
                // Sometimes audio comes as base64 in text field
                audioData = responseAny.text;
                console.log(`[generateSpeech] Found audio data in response.text (base64)`);
            }
            
            console.log(`[generateSpeech] Response analysis:`, {
                hasAudio: !!responseAny?.audio,
                hasData: !!audioData,
                dataLength: audioData?.length || 0,
                audioDataType: typeof audioData
            });

            if (audioData) {
                try {
                    const base64 = audioData;
                    console.log(`[generateSpeech] Base64 data length: ${base64.length}`);
                    
                    const bytes = decodeBase64(base64);
                    console.log(`[generateSpeech] Decoded bytes length: ${bytes.length}`);
                    
                    if (bytes.length === 0) {
                        console.error(`[generateSpeech] ERROR: Decoded bytes is empty!`);
                        return { success: false };
                    }
                    
                    const buffer = await decodeAudioData(bytes);
                    console.log(`[generateSpeech] AudioBuffer created: duration=${buffer.duration}s, sampleRate=${buffer.sampleRate}`);
                    
                    if (!buffer || buffer.duration === 0) {
                        console.error(`[generateSpeech] ERROR: Invalid AudioBuffer!`);
                        return { success: false };
                    }
                    
                    const wavBlob = audioBufferToWav(buffer);
                    const url = URL.createObjectURL(wavBlob);
                    console.log(`[generateSpeech] SUCCESS: Audio generated and saved. URL: ${url.substring(0, 50)}..., base64 length: ${base64.length}`);
                    
                    return { success: true, url, buffer, base64 };
                } catch (processError) {
                    console.error(`[generateSpeech] ERROR processing audio data:`, processError);
                    return { success: false };
                }
            }

            console.warn(`[generateSpeech] WARNING: No audio data in response`);
            return { success: false };
        }, checkCancelled);
    } catch (error) {
        console.error(`[generateSpeech] FATAL ERROR:`, error);
        return { success: false };
    }
};

// Helper function to detect if a model is a video model
export const isVideoModel = (model: string): boolean => {
    // Apenas modelos documentados oficialmente pela Pollinations API
    const videoModels = ['veo', 'seedance', 'seedance-pro'];
    return videoModels.includes(model.toLowerCase());
};

// Image/Video Generation
// CRITICAL: NEVER USE GEMINI FOR IMAGES - ONLY POLLINATIONS
export const generateSceneImage = async (
    prompt: string,
    format: VideoFormat,
    seed: number,
    topic: string,
    provider: ImageProvider, // IGNORED - Always uses Pollinations
    style: VideoStyle,
    pollinationsModel?: PollinationsModel,
    geminiModel?: GeminiModel, // IGNORED - Never used
    checkCancelled?: () => boolean,
    duration?: number, // Optional: Video duration in seconds (veo: 4,6,8 | seedance: 2-10)
    audio?: boolean // Optional: Enable audio for veo (default: false)
): Promise<{ imageUrl: string; mediaType: 'image' | 'video'; base64?: string; videoUrl?: string }> => {
    // CRITICAL FIX: ALWAYS USE POLLINATIONS - NEVER GEMINI FOR IMAGES
    // Ignore provider parameter completely - Gemini is ONLY for text and TTS
    // Always use Pollinations regardless of provider parameter
    console.log(`[generateSceneImage] ALWAYS USING POLLINATIONS - Provider parameter (${provider}) IGNORED - Gemini NEVER used for images`);
    const model = pollinationsModel || 'flux';
    const token = getPollinationsToken().trim();
    const isVideo = isVideoModel(model);
    
    // Use the correct endpoint: gen.pollinations.ai (not image.pollinations.ai)
    // Build the URL with appropriate parameters
    // For images: use width/height
    // For videos: use aspectRatio (width/height not needed per API docs)
    let requestUrl: string;
    if (isVideo) {
        // For videos: aspectRatio is used instead of width/height
        const aspectRatio = format === VideoFormat.PORTRAIT ? '9:16' : '16:9';
        requestUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=${model}&seed=${seed}&aspectRatio=${aspectRatio}`;
    } else {
        // For images: use width/height
        const width = format === VideoFormat.PORTRAIT ? 720 : 1280;
        const height = format === VideoFormat.PORTRAIT ? 1280 : 720;
        requestUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=${model}&seed=${seed}`;
    }
    
    // For video models, add duration and other video-specific parameters
    if (isVideo) {
        // Validate and set duration based on model requirements
        let videoDuration: number;
        if (duration !== undefined) {
            // User provided duration - validate it
            const modelLower = model.toLowerCase();
            if (modelLower === 'veo') {
                // veo: 4, 6, or 8 seconds
                if (duration === 4 || duration === 6 || duration === 8) {
                    videoDuration = duration;
                } else {
                    console.warn(`Invalid duration ${duration} for veo. Using default 6. Valid values: 4, 6, 8`);
                    videoDuration = 6;
                }
            } else if (modelLower === 'seedance' || modelLower === 'seedance-pro') {
                // seedance/seedance-pro: 2-10 seconds
                if (duration >= 2 && duration <= 10) {
                    videoDuration = duration;
                } else {
                    console.warn(`Invalid duration ${duration} for ${model}. Using default 5. Valid range: 2-10`);
                    videoDuration = 5;
                }
            } else {
                // Unknown video model, use default
                videoDuration = 5;
            }
        } else {
            // No duration provided - use defaults
            videoDuration = model.toLowerCase() === 'veo' ? 6 : 5;
        }
        requestUrl += `&duration=${videoDuration}`;
        
        // Audio parameter (only for veo)
        if (model.toLowerCase() === 'veo') {
            const enableAudio = audio === true;
            requestUrl += `&audio=${enableAudio}`;
        }
    }
    
    // If we have a token, use Authorization Bearer header (required by API)
    if (token && token.length > 0) {
        console.log(`[Pollinations] Using API token for ${isVideo ? 'video' : 'image'} generation with model ${model}`);
        try {
            const response = await fetch(requestUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Pollinations API Error: ${response.status} - ${errorText}`);
                throw new Error(`Pollinations API Error: ${response.status} - ${errorText}`);
            }
            
            const blob = await response.blob();
            const contentType = response.headers.get('Content-Type') || '';
            
            // Check if it's actually a video based on content-type or file signature
            const isActuallyVideo = isVideo || contentType.includes('video') || contentType.includes('mp4');
            
            if (isActuallyVideo) {
                const url = URL.createObjectURL(blob);
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
                return { imageUrl: url, mediaType: 'video', videoUrl: url, base64 };
            } else {
                // It's an image
                const url = URL.createObjectURL(blob);
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
                return { imageUrl: url, mediaType: 'image', base64 };
            }
        } catch (e) {
            console.error("Error fetching from Pollinations with API Key:", e);
            // CRITICAL: If we have a token but fetch fails, throw error instead of returning public URL
            // Returning public URL would cause 401 when browser tries to load it without Authorization header
            throw new Error(`Failed to generate image with Pollinations API: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    
    // No token, return public URL (may have rate limits)
    // Note: Public URLs may not work for all models or may have rate limits
    console.warn(`[Pollinations] No API token found. Using public URL (may have rate limits or require authentication)`);
    return { imageUrl: requestUrl, mediaType: isVideo ? 'video' : 'image' };
};

// Metadata Generation
export const generateMetadata = async (
    topic: string,
    scriptJson: string,
    checkCancelled?: () => boolean
): Promise<VideoMetadata> => {
    return withRetry(async (ai) => {
        const prompt = `Generate SEO-optimized metadata for a video about: "${topic}". Script: ${scriptJson.substring(0, 1000)}. Output JSON: { "title": "...", "description": "...", "tags": ["tag1", "tag2"] }`;
        
        const response = await generateWithFallback(ai, 'gemini-2.5-flash', {
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const text = response.text || '{"title":"","description":"","tags":[]}';
        try {
            return JSON.parse(text);
        } catch (e) {
            return { title: topic, description: `Video about ${topic}`, tags: [] };
        }
    }, checkCancelled);
};

// Thumbnails Generation
export const generateThumbnails = async (
    topic: string,
    style: VideoStyle,
    provider: ImageProvider,
    checkCancelled?: () => boolean
): Promise<string[]> => {
    // CRITICAL FIX: Always use Pollinations for thumbnails, never Gemini
    const prompts = [
        `Thumbnail for video: ${topic}, style: ${style}, eye-catching, YouTube thumbnail`,
        `Alternative thumbnail: ${topic}, ${style}, viral, clickbait style`,
        `Third thumbnail option: ${topic}, ${style}, engaging, professional`
    ];

    const thumbnails: string[] = [];
    for (const prompt of prompts) {
        if (checkCancelled && checkCancelled()) break;
        const img = await generateSceneImage(prompt, VideoFormat.LANDSCAPE, Math.random() * 10000, topic, ImageProvider.POLLINATIONS, style, 'flux' as PollinationsModel, undefined, checkCancelled);
        if (img.imageUrl) thumbnails.push(img.imageUrl);
    }

    return thumbnails;
};

// Visual Variations
export const generateVisualVariations = async (
    basePrompt: string,
    sceneText: string,
    count: number,
    checkCancelled?: () => boolean,
    visualIntensity?: VisualIntensity
): Promise<string[]> => {
    return withRetry(async (ai) => {
        // Build intensity-specific instructions
        let intensityGuidance = "";
        switch(visualIntensity) {
            case VisualIntensity.LOW:
                intensityGuidance = "Keep variations subtle: different angles of the same subject, slight lighting changes, minimal movement. Static compositions.";
                break;
            case VisualIntensity.MEDIUM:
                intensityGuidance = "Create moderate variations: alternate camera angles (wide shot, medium shot, close-up), different perspectives, balanced pacing.";
                break;
            case VisualIntensity.HIGH:
                intensityGuidance = "Generate dynamic variations: fast cuts, dramatic angle changes (extreme close-up, bird's eye, low angle), dynamic camera movements (zoom, pan, whip), high energy scenes.";
                break;
            case VisualIntensity.HYPER:
                intensityGuidance = "Create CHAOTIC variations: extremely fast cuts, glitch aesthetics, constant motion, overwhelming details, rapid perspective shifts, Gen Z / TikTok style, maximum visual intensity.";
                break;
            default:
                intensityGuidance = "Create varied camera angles and perspectives.";
        }
        
        const prompt = `You are a Professional Photography Director and Cinematographer. Generate ${count} DISTINCT visual variations that follow the NARRATIVE PROGRESSION of this scene.

BASE VISUAL PROMPT: "${basePrompt}"
SCENE NARRATION/TEXT (FULL): "${sceneText}"

Analyze the complete narrative text above. Break it down into ${count} distinct narrative moments or visual beats that progress through the story.

INTENSITY GUIDANCE: ${intensityGuidance}

CRITICAL REQUIREMENTS - NARRATIVE-DRIVEN VARIATIONS:
1. **FOLLOW THE STORY**: Each variation must represent a different moment or aspect of the narrative described in the scene text. Do NOT just change camera angles - change WHAT is being shown to match the story progression.

2. **PHOTOGRAPHIC DIRECTION**: Create a coherent visual narrative that follows the story:
   - Variation 1: Should represent the beginning/introduction of the narrative moment
   - Variation 2+: Should progress through the story, showing different elements, actions, or details mentioned in the narration
   - Final variation: Should represent the conclusion/climax of that narrative moment

3. **NARRATIVE PROGRESSION**: Each variation should:
   - Show different elements, subjects, or actions mentioned in the scene text
   - Progress through the story logically (setup → development → conclusion)
   - Reveal different aspects of the narrative, not just different camera positions
   - Match the visual content to what is being said at that moment

4. **VISUAL COHERENCE**: 
   - Maintain thematic and stylistic consistency
   - All variations should feel like they belong to the same scene/story
   - Follow the intensity guidance for pacing and energy

5. **NO REPETITIVE ANGLES**: Do NOT create variations that are just "same subject, different angle". Instead, show:
   - Different subjects or elements from the narrative
   - Different moments or actions in the story
   - Different details or aspects being described
   - Progression of the narrative visually

EXAMPLE: If the scene text is "The ancient book opens, revealing mysterious symbols. The scholar examines the pages carefully, discovering hidden meanings."
- Variation 1: "Close-up of an ancient book opening, mysterious symbols becoming visible on aged pages, dramatic lighting"
- Variation 2: "Medium shot of a scholar's hands carefully examining the pages, focusing on the symbols, scholarly atmosphere"
- Variation 3: "Extreme close-up of the hidden meanings being revealed, symbols glowing with mystical light, discovery moment"

Output ONLY a valid JSON array with ${count} strings, no other text:
["variation 1 prompt following narrative start", "variation 2 prompt following narrative progression", ...]`;
        
        const response = await generateWithFallback(ai, 'gemini-2.5-flash', {
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const text = response.text || '[]';
        try {
            // Clean JSON response (remove markdown code blocks if present)
            let cleanText = text.trim();
            if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
            }
            
            const variations = JSON.parse(cleanText);
            if (Array.isArray(variations) && variations.length > 0) {
                // Ensure we have the right count
                const validVariations = variations.filter(v => typeof v === 'string' && v.trim().length > 0);
                if (validVariations.length >= count) {
                    return validVariations.slice(0, count);
                }
                // If we got some but not enough, pad with narrative-progressed versions
                // Try to create narrative progression even in fallback
                while (validVariations.length < count) {
                    const lastVariation = validVariations[validVariations.length - 1];
                    // Create narrative progression: show different aspect or moment from the scene
                    const narrativeProgression = [
                        `${lastVariation}. Different moment in the narrative, showing progression of the story.`,
                        `${lastVariation}. Another aspect of the narrative, revealing new details from the scene text.`,
                        `${lastVariation}. Continuation of the story, different visual element from the narration.`
                    ];
                    const progressionIndex = (validVariations.length - 1) % narrativeProgression.length;
                    validVariations.push(narrativeProgression[progressionIndex]);
                }
                return validVariations.slice(0, count);
            }
            return Array(count).fill(basePrompt);
        } catch (e) {
            console.error("Failed to parse visual variations:", e, "Raw response:", text);
            return Array(count).fill(basePrompt);
        }
    }, checkCancelled);
};

// Viral Metadata (for MetadataTab)
export const generateViralMetadata = async (
    topic: string,
    context: string,
    checkCancelled?: () => boolean
): Promise<ViralMetadataResult> => {
    return withRetry(async (ai) => {
        const prompt = `Generate viral YouTube metadata for: "${topic}". Context: ${context}. Output JSON: { "titles": ["title1", "title2", "title3"], "description": "...", "tags": "tag1, tag2, tag3" }`;
        
        const response = await generateWithFallback(ai, 'gemini-2.5-flash', {
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const text = response.text || '{"titles":[],"description":"","tags":""}';
        try {
            return JSON.parse(text);
        } catch (e) {
            return { titles: [topic], description: `Video about ${topic}`, tags: topic };
        }
    }, checkCancelled);
};