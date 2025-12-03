import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Scene, VideoFormat, SubtitleStyle, UserTier, VideoFilter, ParticleEffect, MusicAction, OverlayConfig, VideoTransition } from '../types';
import { Play, Pause, SkipBack, SkipForward, Circle, Loader2 } from 'lucide-react';
import { getAudioContext } from '../services/audioUtils';
import { triggerBrowserDownload } from '../services/fileSystem';

interface VideoPlayerProps {
  scenes: Scene[];
  currentSceneIndex: number;
  setCurrentSceneIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  format: VideoFormat;
  bgMusicUrl?: string;
  bgMusicVolume: number;
  showSubtitles: boolean;
  subtitleStyle: SubtitleStyle;
  activeFilter?: VideoFilter;
  globalTransition?: VideoTransition;
  userTier: UserTier;
  onPlaybackComplete?: () => void;
  channelLogo?: OverlayConfig;
  onUpdateChannelLogo?: (config: OverlayConfig) => void;
  onUpdateSceneOverlay?: (sceneId: string, config: OverlayConfig) => void;
}

export interface VideoPlayerRef {
  startRecording: (highQuality?: boolean) => void;
  stopRecording: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({
  scenes,
  currentSceneIndex,
  setCurrentSceneIndex,
  isPlaying,
  setIsPlaying,
  format,
  bgMusicUrl,
  bgMusicVolume,
  showSubtitles,
  subtitleStyle,
  activeFilter = VideoFilter.NONE,
  globalTransition = VideoTransition.NONE,
  userTier,
  onPlaybackComplete,
  channelLogo,
  onUpdateChannelLogo,
  onUpdateSceneOverlay
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // --- AUDIO GRAPH REFS ---
  const masterGainRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null); 
  const destNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  
  const speechSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const musicBufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const currentMusicUrlRef = useRef<string | null>(null); // NEW: Tracks currently playing music
  
  const [renderScale, setRenderScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Dimensions
  const WIDTH = (format === VideoFormat.PORTRAIT ? 720 : 1280) * renderScale;
  const HEIGHT = (format === VideoFormat.PORTRAIT ? 1280 : 720) * renderScale;

  // Refs for Loop State
  const scenesRef = useRef<Scene[]>(scenes);
  const showSubtitlesRef = useRef(showSubtitles); 
  const subtitleStyleRef = useRef(subtitleStyle);
  const activeFilterRef = useRef(activeFilter);
  const globalTransitionRef = useRef(globalTransition);
  
  // Media Caches
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const videoCacheRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  const particlesRef = useRef<Particle[]>([]);
  const channelLogoRef = useRef(channelLogo);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);
  
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  
  // Audio Analysis Data
  const audioDataArrayRef = useRef<Uint8Array>(new Uint8Array(0));

  // Init Audio Context once
  useEffect(() => {
      const ctx = getAudioContext();
      if (!masterGainRef.current) {
          masterGainRef.current = ctx.createGain();
          masterGainRef.current.gain.value = 1.0;
          
          compressorRef.current = ctx.createDynamicsCompressor();
          compressorRef.current.threshold.value = -24;
          compressorRef.current.knee.value = 30;
          compressorRef.current.ratio.value = 12;
          compressorRef.current.attack.value = 0.003;
          compressorRef.current.release.value = 0.25;

          analyserRef.current = ctx.createAnalyser();
          analyserRef.current.fftSize = 256;
          audioDataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

          destNodeRef.current = ctx.createMediaStreamDestination();

          masterGainRef.current.connect(compressorRef.current);
          compressorRef.current.connect(analyserRef.current); 
          analyserRef.current.connect(ctx.destination);
          analyserRef.current.connect(destNodeRef.current);
      }
      
      // Cleanup video elements on unmount
      return () => {
          videoCacheRef.current.forEach(v => {
              v.pause();
              v.src = "";
              v.remove();
          });
          videoCacheRef.current.clear();
      };
  }, []);

  // Update Refs
  useEffect(() => { scenesRef.current = scenes; }, [scenes]);
  useEffect(() => { showSubtitlesRef.current = showSubtitles; }, [showSubtitles]);
  useEffect(() => { subtitleStyleRef.current = subtitleStyle; }, [subtitleStyle]);
  useEffect(() => { activeFilterRef.current = activeFilter; }, [activeFilter]);
  useEffect(() => { globalTransitionRef.current = globalTransition; }, [globalTransition]);
  useEffect(() => { channelLogoRef.current = channelLogo; }, [channelLogo]);

  // Handle Music Volume
  useEffect(() => {
      if (musicGainRef.current) {
          musicGainRef.current.gain.setTargetAtTime(bgMusicVolume, getAudioContext().currentTime, 0.1);
      }
  }, [bgMusicVolume]);

  // Load Music
  useEffect(() => {
      const loadMusic = async () => {
          if (!bgMusicUrl) {
              if (musicSourceRef.current) {
                  try { musicSourceRef.current.stop(); } catch(e){}
                  musicSourceRef.current = null;
                  currentMusicUrlRef.current = null;
              }
              return;
          }
          
          // Don't reload if it's the same URL playing
          if (currentMusicUrlRef.current === bgMusicUrl && isPlaying) return;

          let buffer = musicBufferCacheRef.current.get(bgMusicUrl);
          if (!buffer) {
              try {
                  const resp = await fetch(bgMusicUrl);
                  const arrayBuffer = await resp.arrayBuffer();
                  buffer = await getAudioContext().decodeAudioData(arrayBuffer);
                  musicBufferCacheRef.current.set(bgMusicUrl, buffer);
              } catch (e) {
                  console.error("Failed to load music", e);
                  return;
              }
          }
          
          if (isPlaying) playMusic(buffer, bgMusicUrl);
      };
      loadMusic();
  }, [bgMusicUrl, isPlaying]);

  const playMusic = (buffer: AudioBuffer, url: string) => {
      const ctx = getAudioContext();
      
      // CHECK: If same URL is already playing, do nothing
      if (currentMusicUrlRef.current === url && musicSourceRef.current) {
          // Already playing this track
          return;
      }

      if (musicSourceRef.current) {
           try { musicSourceRef.current.stop(); } catch(e){}
      }

      musicSourceRef.current = ctx.createBufferSource();
      musicSourceRef.current.buffer = buffer;
      musicSourceRef.current.loop = true;
      
      if (!musicGainRef.current) {
          musicGainRef.current = ctx.createGain();
          musicGainRef.current.connect(masterGainRef.current!);
      }
      
      musicSourceRef.current.connect(musicGainRef.current);
      musicSourceRef.current.start(0);
      musicGainRef.current.gain.value = bgMusicVolume;
      currentMusicUrlRef.current = url;
  };

  const playSpeech = (buffer: AudioBuffer) => {
      const ctx = getAudioContext();
      if (speechSourceRef.current) {
           try { speechSourceRef.current.stop(); } catch(e){}
      }
      speechSourceRef.current = ctx.createBufferSource();
      speechSourceRef.current.buffer = buffer;
      speechSourceRef.current.connect(masterGainRef.current!);
      speechSourceRef.current.start(0);
  };

  // --- RENDERING ENGINE ---
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Handle Resize
      canvas.width = WIDTH;
      canvas.height = HEIGHT;

      // Start Loop
      let sceneStartTime = performance.now();
      let currentIdx = currentSceneIndex;
      let hasStartedAudio = false;

      // Reset audio if we just started playing
      if (isPlaying) {
          const buffer = bgMusicUrl ? musicBufferCacheRef.current.get(bgMusicUrl) : null;
          if (buffer && bgMusicUrl) playMusic(buffer, bgMusicUrl);
          sceneStartTime = performance.now();
          startTimeRef.current = sceneStartTime;
      } else {
          // Stop speech if paused, but keep music state if we want resume? No, requirement says stop.
          if (speechSourceRef.current) { try{speechSourceRef.current.stop();}catch(e){} speechSourceRef.current = null; }
          
          // PAUSE LOGIC: We stop music here for simplicity as per original requirement, 
          // but user asked for global music to continue. 
          // If we stop here, it restarts on play. Ideally we'd use suspend/resume on context or track offset.
          // For now, ensuring playMusic checks currentUrl prevents restart on scene change, which was the main bug.
          if (musicSourceRef.current) { 
             try{musicSourceRef.current.stop();}catch(e){} 
             musicSourceRef.current = null; 
             currentMusicUrlRef.current = null;
          }
          hasStartedAudio = false;
          
          // Pause all videos
          videoCacheRef.current.forEach(v => v.pause());
      }

      const render = (time: number) => {
          // Get Audio Data for Reactivity
          if (analyserRef.current) {
              // Cast to any to avoid "Uint8Array<ArrayBufferLike> vs Uint8Array<ArrayBuffer>" mismatch
              analyserRef.current.getByteFrequencyData(audioDataArrayRef.current as any);
          }
          // Calculate average volume (0-255)
          const avgVolume = audioDataArrayRef.current.reduce((a, b) => a + b, 0) / audioDataArrayRef.current.length;
          const bassVolume = audioDataArrayRef.current.slice(0, 10).reduce((a,b) => a+b, 0) / 10;

          // FORCE RESET TRANSFORM AT START OF FRAME
          ctx.setTransform(1, 0, 0, 1, 0, 0); 
          ctx.filter = 'none'; // Reset filter
          ctx.globalAlpha = 1;
          ctx.clearRect(0, 0, WIDTH, HEIGHT);

          // Render Logic
          if (!isPlaying && !isRecordingRef.current) {
              // STATIC RENDER (EDIT MODE) - Sem movimentos
              if (scenesRef.current[currentSceneIndex]) {
                 drawScene(ctx, scenesRef.current[currentSceneIndex], 1, 0, false, 0); 
              }
          } else {
              // PLAYBACK RENDER
              const scene = scenesRef.current[currentIdx];
              if (!scene) {
                   setIsPlaying(false);
                   setIsExporting(false);
                   return;
              }

              // Duration Logic
              const durationMs = (scene.audioBuffer?.duration || scene.durationEstimate) * 1000;
              const elapsed = time - sceneStartTime;
              const progress = Math.min(elapsed / durationMs, 1.0);

              // Update Export Progress
              if (isRecordingRef.current) {
                  const totalProgress = ((currentIdx + progress) / scenesRef.current.length) * 100;
                  setExportProgress(Math.min(Math.round(totalProgress), 99));
              }

              // Audio Trigger
              if (!hasStartedAudio && scene.audioBuffer) {
                   playSpeech(scene.audioBuffer);
                   hasStartedAudio = true;
              }

              // Draw Current Scene with Ken Burns
              drawScene(ctx, scene, 1, progress, true, bassVolume);

              // Transitions
              const timeLeft = durationMs - elapsed;
              const transitionDuration = 800; // ms
              
              if (timeLeft < transitionDuration && scenesRef.current[currentIdx + 1]) {
                   // Draw Next Scene underneath/over based on effect
                   const nextScene = scenesRef.current[currentIdx + 1];
                   const transProgress = 1 - (timeLeft / transitionDuration);
                   const type = scene.transition || globalTransitionRef.current;
                   
                   drawTransition(ctx, type, nextScene, transProgress, bassVolume);
              }

              // Scene Advance
              if (elapsed >= durationMs) {
                  if (currentIdx < scenesRef.current.length - 1) {
                      currentIdx++;
                      setCurrentSceneIndex(currentIdx);
                      sceneStartTime = time;
                      hasStartedAudio = false;
                  } else {
                      setIsPlaying(false);
                      setIsExporting(false);
                      setExportProgress(100);
                      
                      // AUTO STOP RECORDING IF ACTIVE
                      if (isRecordingRef.current && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                          mediaRecorderRef.current.stop();
                      }

                      if (onPlaybackComplete) onPlaybackComplete();
                  }
              }
          }

          // Draw Overlays (Logo, etc) - Always Draw
          drawOverlays(ctx, currentIdx);

          if (isPlaying || isRecordingRef.current) {
              rafRef.current = requestAnimationFrame(render);
          }
      };

      rafRef.current = requestAnimationFrame(render);

      return () => {
          cancelAnimationFrame(rafRef.current);
      };
  }, [isPlaying, currentSceneIndex, scenes, renderScale, format, isExporting]); 

  // --- DRAWING HELPERS ---

  const getFilterStyle = (filter: VideoFilter) => {
      switch (filter) {
          case VideoFilter.NOIR: return 'grayscale(100%) contrast(120%)';
          case VideoFilter.VINTAGE: return 'sepia(50%) contrast(110%) brightness(90%)';
          case VideoFilter.VHS: return 'contrast(120%) saturate(120%)';
          case VideoFilter.CYBERPUNK: return 'saturate(150%) contrast(110%) hue-rotate(-10deg)';
          case VideoFilter.DREAMY: return 'blur(0.5px) brightness(110%) saturate(110%)';
          case VideoFilter.SEPIA: return 'sepia(100%)';
          case VideoFilter.HIGH_CONTRAST: return 'contrast(150%)';
          case VideoFilter.COLD: return 'saturate(80%) hue-rotate(180deg)';
          case VideoFilter.WARM: return 'saturate(120%)'; 
          default: return 'none';
      }
  };

  const drawScene = (ctx: CanvasRenderingContext2D, scene: Scene, opacity: number, progress: number, animate: boolean, audioIntensity: number) => {
      ctx.save();
      ctx.globalAlpha = opacity;

      // GET MEDIA (Video or Image)
      let mediaElement: HTMLImageElement | HTMLVideoElement | null = null;
      
      // Force 'video' check
      if (scene.mediaType === 'video' && scene.videoUrl) {
           mediaElement = getVideo(scene.videoUrl);
           // If it's a video and we are animating (playing), ensure it's playing
           if (mediaElement instanceof HTMLVideoElement) {
               if (animate && mediaElement.paused) {
                   mediaElement.play().catch(() => {}); 
               } else if (!animate) {
                   mediaElement.pause(); // Pause in edit mode
               }
           }
      } else {
           mediaElement = getImage(scene.imageUrl);
      }

      // 1. APPLY CANVAS FILTERS BEFORE DRAWING
      if (activeFilterRef.current !== VideoFilter.NONE && activeFilterRef.current !== VideoFilter.NEURAL_CINEMATIC) {
          ctx.filter = getFilterStyle(activeFilterRef.current);
      }

      if (mediaElement) {
          // Ken Burns Effect (Apply to Videos too, but maybe subtler)
          let scale = 1;
          let tx = 0;
          let ty = 0;

          if (animate) {
              // Deterministic movement based on scene ID hash
              const seed = scene.id.charCodeAt(scene.id.length - 1) % 4; 
              const moveAmount = 0.05 * progress; // 5% movement
              scale = 1.1 + (0.1 * progress); // Slight zoom in
              
              if (seed === 0) { tx = -moveAmount * WIDTH; ty = -moveAmount * HEIGHT; }
              if (seed === 1) { tx = moveAmount * WIDTH; ty = -moveAmount * HEIGHT; }
              if (seed === 2) { scale = 1.2 - (0.1 * progress); } // Zoom out
              
              // Audio Reactivity (Subtle bump on beat)
              if (activeFilterRef.current === VideoFilter.NEURAL_CINEMATIC && audioIntensity > 150) {
                   const bump = (audioIntensity - 150) / 1000;
                   scale += bump;
              }
          }

          // Draw Image/Video Cover
          drawImageCover(ctx, mediaElement, 0, 0, WIDTH, HEIGHT, scale, tx, ty);
      } else {
          ctx.fillStyle = "#111";
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
          
          if (scene.isGeneratingImage) {
               ctx.fillStyle = "#333";
               ctx.font = `bold ${WIDTH * 0.04}px Arial`;
               ctx.textAlign = "center";
               ctx.fillText("Carregando mídia...", WIDTH/2, HEIGHT/2);
          }
      }

      // RESET FILTER for other elements
      ctx.filter = 'none';

      // 2. APPLY POST-PROCESS OVERLAYS (Texture, Noise, Tint)
      if (activeFilterRef.current === VideoFilter.NEURAL_CINEMATIC) {
          drawNeuralCinematicEffect(ctx, audioIntensity);
      } else if (activeFilterRef.current !== VideoFilter.NONE) {
          applyOverlayEffects(ctx, activeFilterRef.current);
      }

      // 3. Subtitles
      if (showSubtitlesRef.current && scene.text) {
          drawSubtitles(ctx, scene.text, subtitleStyleRef.current, progress);
      }
      
      // 4. Scene Overlay (Image)
      if (scene.overlay) {
          drawOverlayImage(ctx, scene.overlay);
      }

      ctx.restore();
  };

  const drawNeuralCinematicEffect = (ctx: CanvasRenderingContext2D, audioIntensity: number) => {
      const time = performance.now();
      
      // 1. ANAMORPHIC FLARES (Audio Reactive)
      const flareIntensity = Math.max(0, (audioIntensity - 100) / 255); // 0.0 to 0.6
      if (flareIntensity > 0.1) {
          ctx.globalCompositeOperation = 'screen';
          const gradient = ctx.createLinearGradient(0, 0, WIDTH, 0);
          gradient.addColorStop(0, 'rgba(0, 100, 255, 0)');
          gradient.addColorStop(0.5, `rgba(100, 200, 255, ${flareIntensity * 0.5})`);
          gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
          
          const flareY = HEIGHT * 0.3 + Math.sin(time * 0.001) * 100;
          const flareH = HEIGHT * (0.02 + flareIntensity * 0.1);
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0, flareY, WIDTH, flareH);
      }

      // 2. FILM GRAIN
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = `rgba(0,0,0, ${0.1 + (Math.random() * 0.1)})`;
      
      // 3. CHROMATIC ABERRATION SIMULATION (Edge tint)
      if (audioIntensity > 50) {
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = `rgba(255, 0, 0, 0.05)`;
          ctx.fillRect(-2, 0, WIDTH, HEIGHT);
          ctx.fillStyle = `rgba(0, 255, 255, 0.05)`;
          ctx.fillRect(2, 0, WIDTH, HEIGHT);
      }

      // 4. LETTERBOX
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'black';
      const letterboxHeight = HEIGHT * 0.12; 
      ctx.fillRect(0, 0, WIDTH, letterboxHeight);
      ctx.fillRect(0, HEIGHT - letterboxHeight, WIDTH, letterboxHeight);
  };

  const applyOverlayEffects = (ctx: CanvasRenderingContext2D, filter: VideoFilter) => {
      ctx.save();
      
      if (filter === VideoFilter.VHS) {
          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          for(let y=0; y<HEIGHT; y+=4) ctx.fillRect(0, y, WIDTH, 1);
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = 'rgba(0, 50, 255, 0.1)';
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
      } 
      else if (filter === VideoFilter.VINTAGE) {
           if (Math.random() > 0.9) {
              ctx.fillStyle = 'rgba(255,255,255,0.3)';
              const x = Math.random() * WIDTH;
              const y = Math.random() * HEIGHT;
              ctx.fillRect(x, y, 2 * renderScale, 2 * renderScale);
           }
           const grad = ctx.createRadialGradient(WIDTH/2, HEIGHT/2, WIDTH/3, WIDTH/2, HEIGHT/2, WIDTH);
           grad.addColorStop(0, 'rgba(0,0,0,0)');
           grad.addColorStop(1, 'rgba(60,30,0,0.3)');
           ctx.fillStyle = grad;
           ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
      else if (filter === VideoFilter.CYBERPUNK) {
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = 'rgba(0, 255, 255, 0.05)';
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
      else if (filter === VideoFilter.COLD) {
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = 'rgba(0, 100, 255, 0.2)';
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
      else if (filter === VideoFilter.WARM) {
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = 'rgba(255, 150, 0, 0.15)';
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
      else if (filter === VideoFilter.NOIR) {
          const grad = ctx.createRadialGradient(WIDTH/2, HEIGHT/2, WIDTH/3, WIDTH/2, HEIGHT/2, WIDTH);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(1, 'rgba(0,0,0,0.6)');
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }

      ctx.restore();
  };

  const drawTransition = (ctx: CanvasRenderingContext2D, type: VideoTransition, nextScene: Scene, progress: number, audioIntensity: number) => {
      // Draw next scene on top with effect
      ctx.save();
      
      if (type === VideoTransition.FADE || type === VideoTransition.AUTO) {
          ctx.globalAlpha = progress;
          drawScene(ctx, nextScene, 1, 0, true, audioIntensity); // Start next scene animation
      } else if (type === VideoTransition.SLIDE) {
          const xOffset = WIDTH * (1 - progress);
          ctx.translate(xOffset, 0);
          drawScene(ctx, nextScene, 1, 0, true, audioIntensity);
      } else if (type === VideoTransition.WIPE) {
          ctx.beginPath();
          ctx.rect(0, 0, WIDTH * progress, HEIGHT);
          ctx.clip();
          drawScene(ctx, nextScene, 1, 0, true, audioIntensity);
      } else if (type === VideoTransition.ZOOM) {
          const scale = 0.5 + (0.5 * progress);
          ctx.translate(WIDTH/2, HEIGHT/2);
          ctx.scale(scale, scale);
          ctx.translate(-WIDTH/2, -HEIGHT/2);
          ctx.globalAlpha = progress;
          drawScene(ctx, nextScene, 1, 0, true, audioIntensity);
      }

      ctx.restore();
  };

  const drawImageCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement | HTMLVideoElement, x: number, y: number, w: number, h: number, scale: number = 1, tx: number = 0, ty: number = 0) => {
      const imgWidth = img instanceof HTMLVideoElement ? img.videoWidth : img.width;
      const imgHeight = img instanceof HTMLVideoElement ? img.videoHeight : img.height;
      
      // Safety check for empty video elements
      if (imgWidth === 0 || imgHeight === 0) return;

      const imgRatio = imgWidth / imgHeight;
      const winRatio = w / h;
      
      let nw = w;
      let nh = h;
      let nx = 0;
      let ny = 0;

      if (imgRatio > winRatio) {
          nh = h;
          nw = h * imgRatio;
          nx = (w - nw) / 2;
      } else {
          nw = w;
          nh = w / imgRatio;
          ny = (h - nh) / 2;
      }

      // Apply Ken Burns transform to the rect
      ctx.save();
      ctx.translate(w/2, h/2);
      ctx.scale(scale, scale);
      ctx.translate(tx, ty);
      ctx.translate(-w/2, -h/2);
      
      ctx.drawImage(img, nx, ny, nw, nh);
      ctx.restore();
  };

  const drawSubtitles = (ctx: CanvasRenderingContext2D, text: string, style: SubtitleStyle, progress: number) => {
       const fontSize = WIDTH * 0.05;
       ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
       ctx.textAlign = 'center';
       ctx.textBaseline = 'middle';
       
       const x = WIDTH / 2;
       const y = HEIGHT * 0.85;
       const padding = fontSize * 0.5;

       // --- WORD BY WORD MODE ---
       if (style === SubtitleStyle.WORD_BY_WORD) {
           const words = text.split(' ');
           const wordIdx = Math.floor(progress * words.length);
           const currentWord = words[Math.min(wordIdx, words.length - 1)] || "";
           
           ctx.shadowColor = 'rgba(0,0,0,0.8)';
           ctx.shadowBlur = 4;
           ctx.fillStyle = '#fbbf24'; // Amber
           ctx.strokeStyle = '#000';
           ctx.lineWidth = 4;
           ctx.strokeText(currentWord, x, y);
           ctx.fillText(currentWord, x, y);
           ctx.shadowBlur = 0;
           return;
       }
       
       // --- TEXT WRAPPING ---
       const words = text.split(' ');
       let line = "";
       const lines = [];
       for(let w of words) {
           if ((line + w).length > 30) { lines.push(line.trim()); line = w + " "; }
           else { line += w + " "; }
       }
       lines.push(line.trim());

       lines.forEach((l, i) => {
           const ly = y + (i * fontSize * 1.2);
           const metrics = ctx.measureText(l);
           const textW = metrics.width;
           const bgW = textW + padding * 2;
           const bgH = fontSize + padding;

           // --- STYLES IMPLEMENTATION ---
           if (style === SubtitleStyle.MODERN) {
               ctx.fillStyle = 'rgba(0,0,0,0.8)';
               ctx.beginPath();
               ctx.roundRect(x - bgW/2, ly - bgH/2, bgW, bgH, 8);
               ctx.fill();
               ctx.fillStyle = '#fff';
               ctx.fillText(l, x, ly);
           
           } else if (style === SubtitleStyle.CLASSIC) {
               ctx.fillStyle = 'rgba(0,0,0,0.5)';
               ctx.fillRect(x - bgW/2, ly - bgH/2, bgW, bgH);
               ctx.strokeStyle = '#000';
               ctx.lineWidth = fontSize * 0.08;
               ctx.strokeText(l, x, ly);
               ctx.fillStyle = '#fbbf24';
               ctx.fillText(l, x, ly);

           } else if (style === SubtitleStyle.NEON) {
               ctx.shadowColor = '#00ffff';
               ctx.shadowBlur = 20;
               ctx.strokeStyle = '#00ffff';
               ctx.lineWidth = 2;
               ctx.strokeText(l, x, ly);
               ctx.shadowBlur = 0;
               ctx.fillStyle = '#fff';
               ctx.fillText(l, x, ly);

           } else if (style === SubtitleStyle.COMIC) {
               ctx.fillStyle = '#000';
               ctx.fillText(l, x + 3, ly + 3);
               ctx.strokeStyle = '#000';
               ctx.lineWidth = 6;
               ctx.strokeText(l, x, ly);
               ctx.fillStyle = '#fbbf24';
               ctx.fillText(l, x, ly);

           } else if (style === SubtitleStyle.GLITCH) {
               const offsetX = (Math.random() - 0.5) * 4;
               const offsetY = (Math.random() - 0.5) * 4;
               ctx.globalCompositeOperation = 'lighten';
               ctx.fillStyle = '#f0f';
               ctx.fillText(l, x + offsetX, ly + offsetY);
               ctx.fillStyle = '#0ff';
               ctx.fillText(l, x - offsetX, ly - offsetY);
               ctx.globalCompositeOperation = 'source-over';
               ctx.fillStyle = '#fff';
               ctx.fillText(l, x, ly);

           } else if (style === SubtitleStyle.KARAOKE) {
               ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
               ctx.fillText(l, x, ly);
               const totalLines = lines.length;
               const lineDuration = 1 / totalLines;
               const startProgress = i * lineDuration;
               const endProgress = (i + 1) * lineDuration;
               let lineProgress = 0;
               if (progress >= endProgress) lineProgress = 1;
               else if (progress <= startProgress) lineProgress = 0;
               else lineProgress = (progress - startProgress) / lineDuration;

               if (lineProgress > 0) {
                   ctx.save();
                   const startX = x - textW/2;
                   const fillW = textW * lineProgress;
                   ctx.beginPath();
                   ctx.rect(startX, ly - fontSize, fillW, fontSize * 2);
                   ctx.clip();
                   ctx.shadowColor = '#6366f1';
                   ctx.shadowBlur = 10;
                   ctx.fillStyle = '#fff';
                   ctx.fillText(l, x, ly);
                   ctx.shadowBlur = 0;
                   ctx.restore();
               }
           } else {
               ctx.shadowColor = 'black';
               ctx.shadowBlur = 4;
               ctx.fillStyle = '#fff';
               ctx.fillText(l, x, ly);
               ctx.shadowBlur = 0;
           }
       });
  };

  const getImage = (url?: string) => {
      if (!url) return null;
      if (imageCacheRef.current.has(url)) return imageCacheRef.current.get(url)!;
      const img = new Image();
      img.src = url;
      img.crossOrigin = "anonymous";
      imageCacheRef.current.set(url, img);
      return img;
  };

  const getVideo = (url: string) => {
      if (videoCacheRef.current.has(url)) return videoCacheRef.current.get(url)!;
      const vid = document.createElement('video');
      vid.src = url;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.crossOrigin = "anonymous";
      // Auto start, but render loop controls playback too
      vid.play().catch(e => console.warn("Video play interrupted", e)); 
      videoCacheRef.current.set(url, vid);
      return vid;
  };
  
  const drawOverlayImage = (ctx: CanvasRenderingContext2D, config: OverlayConfig) => {
      const img = getImage(config.url);
      if(!img) return;

      const baseSize = WIDTH * 0.2;
      const aspect = img.width / img.height;
      let drawW, drawH;
      if(aspect > 1) { drawW = baseSize * config.scale; drawH = (baseSize / aspect) * config.scale; }
      else { drawH = baseSize * config.scale; drawW = (baseSize * aspect) * config.scale; }

      const x = config.x * WIDTH;
      const y = config.y * HEIGHT;
      ctx.drawImage(img, x - drawW/2, y - drawH/2, drawW, drawH);
  };

  const drawOverlays = (ctx: CanvasRenderingContext2D, frameIdx: number) => {
     if (channelLogoRef.current) {
         drawOverlayImage(ctx, channelLogoRef.current);
     }
  };

  useImperativeHandle(ref, () => ({
      startRecording: (hq) => {
          if (isRecordingRef.current) return;
          console.log("Iniciando gravação...");
          
          setIsExporting(true); // UI Feedback
          setExportProgress(0);
          
          // 1. Configurar
          setCurrentSceneIndex(0);
          setIsPlaying(true);
          setRenderScale(hq ? 2 : 1);
          
          // 2. Aguardar Canvas e Estado
          setTimeout(() => {
              if (!canvasRef.current || !destNodeRef.current) return;
              
              const canvasStream = canvasRef.current.captureStream(30);
              const audioStream = destNodeRef.current.stream;
              
              // Combinar Tracks
              const combinedStream = new MediaStream([
                  ...canvasStream.getVideoTracks(),
                  ...audioStream.getAudioTracks()
              ]);
              
              // Selecionar Codec
              let mimeType = 'video/webm;codecs=vp9';
              if (!MediaRecorder.isTypeSupported(mimeType)) {
                  mimeType = 'video/webm;codecs=vp8';
                  if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
              }
              
              chunksRef.current = [];
              const recorder = new MediaRecorder(combinedStream, {
                  mimeType,
                  videoBitsPerSecond: hq ? 8000000 : 2500000
              });
              
              recorder.ondataavailable = (e) => {
                  if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
              };
              
              recorder.onstop = () => {
                  const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                  triggerBrowserDownload(blob, `viralflow_export_${Date.now()}.webm`);
                  isRecordingRef.current = false;
                  setIsExporting(false); // Hide UI
                  setRenderScale(1); // Reset
              };
              
              recorder.start();
              mediaRecorderRef.current = recorder;
              isRecordingRef.current = true;
          }, 500);
      },
      stopRecording: () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
          }
      }
  }));

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl group border border-zinc-800">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full object-contain"
      />
      
      {/* EXPORT OVERLAY */}
      {isExporting && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
              <h3 className="text-xl font-bold text-white">Renderizando Vídeo...</h3>
              <p className="text-zinc-400 font-mono text-sm mt-2">{exportProgress}% Concluído</p>
              <div className="w-64 h-2 bg-zinc-800 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${exportProgress}%` }}></div>
              </div>
          </div>
      )}
      
      {/* Controls Overlay */}
      {!isExporting && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 pointer-events-none">
             <div className="pointer-events-auto flex items-center justify-center gap-6">
                <button onClick={() => {
                    if(currentSceneIndex > 0) setCurrentSceneIndex(currentSceneIndex - 1);
                }} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all"><SkipBack className="w-6 h-6" /></button>
                
                <button onClick={() => setIsPlaying(!isPlaying)} className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 transition-all scale-100 hover:scale-110 active:scale-95">
                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </button>

                <button onClick={() => {
                    if(currentSceneIndex < scenes.length - 1) setCurrentSceneIndex(currentSceneIndex + 1);
                }} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all"><SkipForward className="w-6 h-6" /></button>
             </div>
             <div className="text-center mt-4 text-xs font-mono text-zinc-400">
                CENA {currentSceneIndex + 1} / {scenes.length}
             </div>
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;