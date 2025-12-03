import { GoogleGenAI, Modality } from "@google/genai";
import { VideoStyle, VideoPacing, VideoFormat, VideoMetadata, ImageProvider, Language, PollinationsModel, GeminiModel, GeneratedScriptItem } from "../types";
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
         if (allKeys.length === 1) await new Promise(resolve => setTimeout(resolve, 2000));
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

// Helper to robustly parse JSON from AI response
function robustJsonParse(text: string): any {
    let clean = text.replace(/```json\s*|```/g, '').trim();
    
    if (clean.includes('[') && clean.includes(']')) {
        const firstBracket = clean.indexOf('[');
        const lastBracket = clean.lastIndexOf(']');
        if (lastBracket > firstBracket) {
             const firstCurly = clean.indexOf('{');
             if (firstCurly === -1 || firstBracket < firstCurly) {
                 clean = clean.substring(firstBracket, lastBracket + 1);
             } else {
                 const lastCurly = clean.lastIndexOf('}');
                 if (lastCurly > firstCurly) {
                     clean = clean.substring(firstCurly, lastCurly + 1);
                 }
             }
        }
    } else {
        const firstCurly = clean.indexOf('{');
        const lastCurly = clean.lastIndexOf('}');
        if (firstCurly !== -1 && lastCurly !== -1) {
            clean = clean.substring(firstCurly, lastCurly + 1);
        }
    }

    try {
        return JSON.parse(clean);
    } catch (e) {
        console.error("JSON Parse Error. Raw text:", text);
        try {
            let fixed = clean.replace(/\n/g, "\\n");
            // Try to escape unescaped double quotes inside string values
            // This regex looks for " : "value with "quotes" inside",
            fixed = fixed.replace(/:\s*"([^"]*)"([^,}\]])/g, (match, p1, p2) => {
                return `: "${p1.replace(/"/g, '\\"')}"${p2}`;
            });
            return JSON.parse(fixed);
        } catch (e2) {
            console.warn("Failed to parse AI response even after fix attempt.");
            return null;
        }
    }
}

// --- GEMINI GENERATORS ---

// PRO FEATURE: MOVIE PIPELINE OUTLINE
export const generateMovieOutline = async (
    topic: string, 
    channelName: string, 
    language: Language,
    checkCancelled?: () => boolean
): Promise<{ title: string, chapters: string[] }> => {
    return withRetry(async (ai) => {
        const targetLanguage = language === 'pt' ? 'PORTUGUESE' : language === 'es' ? 'SPANISH' : 'ENGLISH';
        const prompt = `Create a MASSIVE DOCUMENTARY OUTLINE about: "${topic}".
        Format: Feature Film / Long Documentary / Deep Dive.
        Channel: "${channelName}".
        
        Task: Break the story down into 12 to 15 distinct, detailed Chapters (Acts).
        Make sure the coverage is exhaustive and detailed.
        
        Output strictly JSON: { "title": "Movie Title", "chapters": ["Chapter 1 Name: Context", "Chapter 2 Name: Context", ...] }
        Language: ${targetLanguage}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        if (!response.text) throw new Error("No outline generated");
        const parsed = robustJsonParse(response.text);
        
        if (!parsed || !parsed.chapters || !Array.isArray(parsed.chapters)) {
            console.warn("Outline malformed, using fallback structure.");
            return {
                title: topic,
                chapters: [
                    "Introduction: The Mystery Begins",
                    "The Context: Historical Background",
                    "Key Players: Who is involved?",
                    "The Conflict: Challenges arise",
                    "Turning Point: A major discovery",
                    "Deep Dive: Analyzing the evidence",
                    "Perspectives: Expert opinions",
                    "Global Impact: How it changed the world",
                    "Conclusion: Final thoughts",
                    "Outro: Thanks for watching"
                ]
            };
        }
        
        return parsed;
    }, checkCancelled);
};

// Removed Reviewer Agent to simplify flow and avoid JSON errors.

export const generateVideoScript = async (
  topic: string, 
  style: VideoStyle, 
  durationMinutes: number,
  pacing: VideoPacing,
  channelName: string,
  language: Language,
  checkCancelled?: () => boolean,
  chapterContext?: { 
      currentChapter: string, 
      prevChapter?: string,
      chapterIndex: number,
      totalChapters: number
  } 
): Promise<GeneratedScriptItem[]> => {
  
  return withRetry(async (ai) => {
    const totalWords = Math.ceil(durationMinutes * 150);
    const targetLanguage = language === 'pt' ? 'PORTUGUESE (BRAZIL)' : language === 'es' ? 'SPANISH' : 'ENGLISH (US)';
    
    let durationRule = "Break the script into scenes of 4-7 seconds.";
    let cutInstruction = "Standard narrative pacing.";
    
    if (pacing === VideoPacing.HYPER) {
        durationRule = "EXTREMELY IMPORTANT: Break the script into very short scenes of 1-2 seconds max. Short sentences. Rapid cuts.";
        cutInstruction = "Fast-paced, TikTok style, constant visual changes.";
    } else if (pacing === VideoPacing.FAST) {
        durationRule = "Break the script into short scenes of 2-4 seconds.";
        cutInstruction = "Dynamic YouTuber style, frequent cuts.";
    } else if (pacing === VideoPacing.SLOW) {
        durationRule = "Break the script into long, contemplative scenes of 8-15 seconds.";
        cutInstruction = "Slow documentary style, let the visuals breathe.";
    }

    let extraStyleInstructions = "";
    if (style === VideoStyle.KIDS_STORY) {
        extraStyleInstructions = "Create a multi-character FABLE or STORY. You MUST use specific character names for the 'speaker' field (e.g., 'Wolf', 'Little Red', 'Bear', 'Fairy', 'Narrator'). Create dialogue between them. Keep language simple, fun, and engaging for kids. Visuals should be colorful 3D animation style.";
    } else if (style === VideoStyle.NEWS) {
        extraStyleInstructions = "Create a TV News segment. Use speakers like 'Anchor', 'Reporter', 'Witness', 'Expert'. Visuals should look like a TV broadcast, including 'Breaking News' lower thirds descriptions in visual prompts.";
    } else if (style === VideoStyle.PROFESSOR) {
        extraStyleInstructions = "Create an educational lecture. Speaker should be 'Professor'. Visuals should be diagrams, whiteboards, or historical footage explaining the concept clearly.";
    } else if (style === VideoStyle.DEBATE) {
        extraStyleInstructions = "Create a DEBATE. Use speakers: 'Host', 'Proponent' (For), 'Opponent' (Against). The Host introduces, and the others argue their points. Ensure conflict and back-and-forth dialogue.";
    }

    let systemInstruction = `You are a World-Class Video Director and Scriptwriter. Channel: "${channelName}". Style: ${style}. Pacing: ${pacing}.
    
    YOUR MISSION: Create a script that visually tells a story.
    
    MANDATORY VISUAL RULES (FOLLOW STRICTLY):
    1. NO REPETITION: Every scene MUST have a different "visual_prompt". Never use the same setting twice in a row.
    2. CAMERA ANGLES: You MUST start every 'visual_prompt' with a specific camera angle. Rotate through: [Extreme Close-up], [Wide Drone Shot], [Low Angle], [Over-the-shoulder], [Macro Shot], [GoPro POV], [Security Camera View].
    3. SHOW, DON'T TELL: If the text says "He was rich", the visual must be "Close-up of a gold diamond ring on a finger", not "A rich man".
    4. NO TEXT IN IMAGE: The visual prompt must explicitly say "no text, no logos, photorealistic".
    5. JSON ESCAPING: You MUST escape all double quotes inside the text fields. Example: "text": "He said \\"Hello\\"".
    6. KEYWORDS: Include 2-3 specific keywords at the end of visual_prompt for search engines.
    
    SPECIAL STYLE INSTRUCTIONS:
    ${extraStyleInstructions}

    Output ONLY valid JSON array: [{ "speaker": "Name", "text": "Dialogue", "visual_prompt": "CAMERA_ANGLE + Action description" }]
    Language: ${targetLanguage}.`;

    let prompt = `Create a script about: "${topic}".
    Target Duration: ${durationMinutes} minutes (approx ${totalWords} words).
    PACING CONSTRAINT: ${cutInstruction}
    SCENE DURATION: ${durationRule}
    
    MANDATORY OUTRO RULE: The FINAL scene MUST be a Call-to-Action (CTA). The narrator explicitly thanks the viewer in the name of the channel "${channelName || 'Narrator'}" and asks for Likes, Comments, and Subscription.`;

    // MOVIE MODE OVERRIDE
    if (chapterContext) {
        const { currentChapter, prevChapter, chapterIndex, totalChapters } = chapterContext;
        const isFirst = chapterIndex === 0;
        const isLast = chapterIndex === totalChapters - 1;

        systemInstruction += "\n\nMODE: LONG FEATURE FILM / DEEP DIVE DOCUMENTARY. DO NOT SUMMARIZE. EXPAND ON DETAILS.";
        
        let narrativeInstruction = "";
        if (isFirst) {
            narrativeInstruction = "This is the OPENING chapter. Hook the viewer immediately. Introduce the core mystery/topic. DO NOT conclude the video. DO NOT say goodbye. DO NOT ask for likes yet.";
        } else if (isLast) {
            narrativeInstruction = `This is the FINAL chapter. Summarize the journey and provide a powerful conclusion. END with the Channel Outro/CTA for channel "${channelName}". THIS IS THE ONLY PLACE YOU SHOULD SAY GOODBYE.`;
        } else {
            // AGGRESSIVE NEGATIVE CONSTRAINTS FOR MIDDLE CHAPTERS
            narrativeInstruction = `
            This is a MIDDLE chapter (Chapter ${chapterIndex + 1} of ${totalChapters}). 
            Dive deep into this specific sub-topic. Maintain narrative flow. 
            
            STRICTLY FORBIDDEN IN THIS CHAPTER:
            - DO NOT INTRODUCE THE CHANNEL.
            - DO NOT SAY 'WELCOME BACK'.
            - DO NOT SAY GOODBYE.
            - DO NOT ASK FOR SUBSCRIPTIONS.
            - DO NOT SAY "In this video" or "Today we will see".
            - DO NOT SUMMARIZE what was just said.
            
            Treat it as a continuous scene from a movie. Just tell the story.`;
        }

        prompt = `Write the script for the CHAPTER: "${currentChapter}".
        Context from previous chapter: "${prevChapter || 'Opening of the movie'}".
        
        NARRATIVE RULE: ${narrativeInstruction}
        
        TARGET LENGTH: This specific chapter MUST be approximately 4 to 6 minutes long. Write approximately 500-600 words for this chapter.
        INSTRUCTION: Dive deep into the details. Use dialogue, examples, and slow-paced storytelling. Do not rush.
        Visuals: Use slow, cinematic, detailed camera movements in prompts.
        
        REMEMBER: ESCAPE ALL DOUBLE QUOTES INSIDE STRINGS.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      }
    });

    if (!response.text) throw new Error("No text generated");
    
    const rawData: any = robustJsonParse(response.text);
    let items: any[] = [];

    if (Array.isArray(rawData)) {
        items = rawData;
    } else if (rawData && typeof rawData === 'object') {
        if (Array.isArray(rawData.scenes)) items = rawData.scenes;
        else if (Array.isArray(rawData.script)) items = rawData.script;
        else if (Array.isArray(rawData.items)) items = rawData.items;
        else if (rawData.speaker && rawData.text) items = [rawData];
    }

    if (items.length === 0) {
        throw new Error("Failed to parse script items from AI response");
    }

    return items.map((item: any) => ({
       speaker: item.speaker || "Narrator",
       text: item.text || item.dialogue || item.script || "",
       visual_prompt: item.visual_prompt || item.visualPrompt || item.image_prompt || item.imageDescription || `Cinematic scene about ${topic}`
    }));
  }, checkCancelled);
};

// ... (rest of the file including generateSpeech, generateSceneImage, etc. remains the same)

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
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64 = reader.result as string;
        // remove prefix "data:image/png;base64,"
        resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const generatePollinationsImage = async (prompt: string, width: number, height: number, model: PollinationsModel = 'turbo', checkCancelled?: () => boolean): Promise<string> => {
  if (checkCancelled && checkCancelled()) throw new Error("CANCELLED_BY_USER");

  const encodedPrompt = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 1000000);
  const isDev = (import.meta as any).env?.DEV;

  // Helper to fetch and convert to base64
  const fetchAndConvert = async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.startsWith("image")) {
         throw new Error(`Invalid content-type: ${contentType}`);
      }
      const blob = await response.blob();
      return await blobToBase64(blob);
  };

  const strategies: string[] = [];

  // 1. DEV MODE: Use Vite Proxy directly (Most reliable for local dev)
  if (isDev) {
      strategies.push(`/pollinations_proxy/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=${model}`);
  }
  
  // 2. PROD MODE: Try PHP Proxy first (if available on server)
  if (!isDev) {
      strategies.push(`./proxy.php?prompt=${encodedPrompt}&width=${width}&height=${height}&seed=${seed}&model=${model}`);
  }

  // 3. FINAL FALLBACK: Direct URL (Last resort, might block)
  strategies.push(`https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=${model}`);

  let lastError;
  for (const url of strategies) {
     if (checkCancelled && checkCancelled()) throw new Error("CANCELLED_BY_USER");
     try {
         return await fetchAndConvert(url);
     } catch (e) {
         console.warn(`Polling Strategy failed: ${url}`, e);
         lastError = e;
     }
  }
  
  throw lastError || new Error("All Pollinations strategies failed");
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
    pollinationsModel: PollinationsModel = 'turbo', 
    geminiModel: GeminiModel = 'gemini-2.5-flash-image', 
    checkCancelled?: () => boolean
): Promise<{ imageUrl: string, videoUrl?: string, mediaType: 'image' | 'video' }> => {
  
  if (checkCancelled && checkCancelled()) throw new Error("CANCELLED_BY_USER");

  // 0. NONE PATH (SCRIPT ONLY)
  if (provider === ImageProvider.NONE) {
      return processBase64Result(PLACEHOLDER_IMAGE, 'image/png', 'png', projectTopic, sceneIndex);
  }

  const isPortrait = format === VideoFormat.PORTRAIT;
  const aspectRatio = isPortrait ? "9:16" : "16:9";
  const width = isPortrait ? 720 : 1280;
  const height = isPortrait ? 1280 : 720;

  const safeVisualPrompt = sanitizePrompt((visualPrompt || "Cinematic scene").substring(0, 400));
  const negativePrompt = "text, watermark, logo, writing, letters, signature, bad anatomy, blurry, netflix logo, company logo";
  const cleanStyle = style === VideoStyle.DOCUMENTARY ? 'National Geographic Style, 4k, hyperrealistic' : style;
  
  const fullPromptGemini = `${safeVisualPrompt}. Style: ${cleanStyle}. High quality, 8k, photorealistic, cinematic lighting. \nNEGATIVE PROMPT: ${negativePrompt}`;
  const fullPromptPollinations = `(masterpiece, best quality, absolute realism), ${safeVisualPrompt}, ${cleanStyle}, detailed lighting. (no text:1.5), (no watermark:1.5), (no logo:1.5), (no netflix:1.5).`;

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
          const base64 = await generatePollinationsImage(fullPromptPollinations, width, height, pollinationsModel, checkCancelled);
          return processBase64Result(base64, 'image/jpeg', 'jpg', projectTopic, sceneIndex);
      }

      // 3. GEMINI PATH
      if (provider === ImageProvider.GEMINI) {
          const base64 = await withRetry(async (ai) => {
              let imgData = "";
              
              if (geminiModel === 'imagen-3.0-generate-001') {
                  // IMAGEN 3.0 USES generateImages
                  const response = await ai.models.generateImages({
                      model: 'imagen-3.0-generate-001',
                      prompt: fullPromptGemini,
                      config: {
                          numberOfImages: 1,
                          aspectRatio: aspectRatio,
                          outputMimeType: 'image/png'
                      }
                  });
                  
                  if (response.generatedImages && response.generatedImages.length > 0) {
                      imgData = response.generatedImages[0]?.image?.imageBytes ?? "";
                  }
              } else {
                  // GEMINI FLASH USES generateContent
                  const response = await ai.models.generateContent({
                      model: 'gemini-2.5-flash-image',
                      contents: { parts: [{ text: fullPromptGemini }] },
                      config: { imageConfig: { aspectRatio: aspectRatio } }
                  });
                  
                  if (response.candidates?.[0]?.content?.parts) {
                     for(const p of response.candidates[0].content.parts) {
                         if(p.inlineData) { imgData = p.inlineData.data || ""; break; }
                     }
                  }
              }
              
              if(!imgData) throw new Error(`No image data from ${geminiModel}`);
              return imgData;
          }, checkCancelled, 5); // More retries for manual generation to exhaust keys if needed

          return processBase64Result(base64, 'image/png', 'png', projectTopic, sceneIndex);
      }

      throw new Error("Provider not handled");

  } catch (error: any) {
      if (error.message === "CANCELLED_BY_USER") throw error;

      console.error(`❌ Asset Generation Failed [Provider: ${provider}]:`, error);

      // --- FINAL FALLBACK: Pollinations via Proxy ---
      if (provider === ImageProvider.GEMINI || provider === ImageProvider.STOCK_VIDEO) {
          try {
              console.log("🔄 Final Fallback to Pollinations (Turbo)...");
              // Fallback uses 'turbo' explicitly to be safe
              const base64 = await generatePollinationsImage(fullPromptPollinations, width, height, 'turbo', checkCancelled);
              return processBase64Result(base64, 'image/jpeg', 'jpg', projectTopic, sceneIndex);
          } catch (fallbackError) {
              console.error("❌ Fallback also failed.", fallbackError);
          }
      }

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
          // Thumbnails typically use Flash for speed, but fallback to turbo (not flux) if needed
          const result = await generateSceneImage(prompt, VideoFormat.LANDSCAPE, 999, topic, provider, style, 'turbo', 'gemini-2.5-flash-image', checkCancelled);
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
        const prompt = `Generate YouTube SEO metadata for "${topic}".
        Context: ${scriptContext.substring(0, 1000)}...
        Output JSON: { "title": "", "description": "", "tags": [] }`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        const parsed = robustJsonParse(response.text || "{}");
        if (!parsed || !parsed.title) return { title: topic, description: "Video about " + topic, tags: [] };
        return parsed;
    }, checkCancelled);
};