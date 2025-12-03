import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Scene, VideoFormat, SubtitleStyle, UserTier, VideoFilter, LayerConfig, OverlayConfig, VideoTransition, ParticleEffect, CameraMovement, Keyframe, VFXConfig, SubtitleSettings } from '../types';
import { Play, Pause, Maximize2, Minimize2 } from 'lucide-react';
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
  subtitleSettings?: SubtitleSettings;
  activeFilter?: VideoFilter;
  globalTransition?: VideoTransition;
  globalVfx?: VFXConfig;
  userTier: UserTier;
  onPlaybackComplete?: () => void;
  channelLogo?: OverlayConfig;
  onUpdateChannelLogo?: (config: OverlayConfig) => void;
  onUpdateSceneOverlay?: (sceneId: string, config: OverlayConfig) => void;
  scrubProgress?: number; // 0.0 to 1.0 for manual seeking in editor
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
  alpha: number;
  life: number;
  decay: number;
  type: ParticleEffect;
  rotation?: number;
  rotationSpeed?: number;
  emoji?: string;
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
  subtitleSettings,
  activeFilter = VideoFilter.NONE,
  globalTransition = VideoTransition.NONE,
  globalVfx,
  userTier,
  onPlaybackComplete,
  channelLogo,
  onUpdateChannelLogo,
  onUpdateSceneOverlay,
  scrubProgress = 0
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
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
  const currentMusicUrlRef = useRef<string | null>(null); 
  
  // --- PARTICLES & VFX REF ---
  const particlesRef = useRef<Particle[]>([]);
  const grainCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [renderScale, setRenderScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dimensions
  const WIDTH = (format === VideoFormat.PORTRAIT ? 720 : 1280) * renderScale;
  const HEIGHT = (format === VideoFormat.PORTRAIT ? 1280 : 720) * renderScale;

  // Refs for Loop State
  const scenesRef = useRef<Scene[]>(scenes);
  const showSubtitlesRef = useRef(showSubtitles); 
  const subtitleStyleRef = useRef(subtitleStyle);
  const subtitleSettingsRef = useRef(subtitleSettings);
  const channelLogoRef = useRef(channelLogo);
  const activeFilterRef = useRef(activeFilter);
  const globalVfxRef = useRef(globalVfx);
  
  // Media Caches
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const videoCacheRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);
  
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
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
      
      return () => {
          videoCacheRef.current.forEach(v => {
              v.pause();
              v.src = "";
              v.remove();
          });
          videoCacheRef.current.clear();
      };
  }, []);

  // Sync Refs
  useEffect(() => { scenesRef.current = scenes; }, [scenes]);
  useEffect(() => { showSubtitlesRef.current = showSubtitles; }, [showSubtitles]);
  useEffect(() => { subtitleStyleRef.current = subtitleStyle; }, [subtitleStyle]);
  useEffect(() => { subtitleSettingsRef.current = subtitleSettings; }, [subtitleSettings]);
  useEffect(() => { channelLogoRef.current = channelLogo; }, [channelLogo]);
  useEffect(() => { activeFilterRef.current = activeFilter; }, [activeFilter]);
  useEffect(() => { globalVfxRef.current = globalVfx; }, [globalVfx]);

  // Handle Fullscreen
  useEffect(() => {
      const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', handleFsChange);
      return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!containerRef.current) return;
      if (!document.fullscreenElement) {
          containerRef.current.requestFullscreen().catch(console.error);
      } else {
          document.exitFullscreen().catch(console.error);
      }
  };

  const togglePlay = (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (isExporting) return;
      setIsPlaying(!isPlaying);
  };

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
          if (currentMusicUrlRef.current === bgMusicUrl && isPlaying) return;

          let buffer = musicBufferCacheRef.current.get(bgMusicUrl);
          if (!buffer) {
              try {
                  const resp = await fetch(bgMusicUrl);
                  const arrayBuffer = await resp.arrayBuffer();
                  const decoded = await getAudioContext().decodeAudioData(arrayBuffer);
                  if (decoded) {
                    buffer = decoded;
                    musicBufferCacheRef.current.set(bgMusicUrl, buffer);
                  }
              } catch (e) {
                  console.error("Failed to load music", e);
                  return;
              }
          }
          if (isPlaying && buffer && buffer instanceof AudioBuffer) playMusic(buffer, bgMusicUrl);
      };
      loadMusic();
  }, [bgMusicUrl, isPlaying]);

  const playMusic = (buffer: AudioBuffer, url: string) => {
      if (!buffer || !(buffer instanceof AudioBuffer)) return;

      const ctx = getAudioContext();
      if (currentMusicUrlRef.current === url && musicSourceRef.current) return;

      if (musicSourceRef.current) {
           try { musicSourceRef.current.stop(); } catch(e){}
      }

      musicSourceRef.current = ctx.createBufferSource();
      try {
        musicSourceRef.current.buffer = buffer;
      } catch (err) {
        return;
      }
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
      if (!buffer || !(buffer instanceof AudioBuffer)) return;

      const ctx = getAudioContext();
      if (speechSourceRef.current) {
           try { speechSourceRef.current.stop(); } catch(e){}
      }
      speechSourceRef.current = ctx.createBufferSource();
      try {
        speechSourceRef.current.buffer = buffer;
      } catch (err) {
        return;
      }
      speechSourceRef.current.connect(masterGainRef.current!);
      speechSourceRef.current.start(0);
  };

  // --- RECORDING IMPLEMENTATION ---
  useImperativeHandle(ref, () => ({
    startRecording: (highQuality = false) => {
        setIsExporting(true);
        setExportProgress(0);
        isRecordingRef.current = true;
        setCurrentSceneIndex(0);
        setRenderScale(highQuality ? 2 : 1); 
        startTimeRef.current = performance.now();
        setIsPlaying(true);

        const canvas = canvasRef.current;
        const dest = destNodeRef.current;
        if(!canvas || !dest) return;

        const stream = canvas.captureStream(30); 
        const audioTrack = dest.stream.getAudioTracks()[0];
        if(audioTrack) stream.addTrack(audioTrack);

        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
             mimeType = 'video/webm;codecs=vp8';
             if (!MediaRecorder.isTypeSupported(mimeType)) {
                 mimeType = 'video/webm';
             }
        }

        mediaRecorderRef.current = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: highQuality ? 8000000 : 2500000 
        });

        chunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (e) => {
            if(e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = () => {
            console.log("Recorder Stopped. Exporting Blob...");
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            triggerBrowserDownload(blob, `viralflow_video_${Date.now()}.webm`);
            setIsExporting(false);
            setRenderScale(1);
            isRecordingRef.current = false;
        };

        mediaRecorderRef.current.start();
        console.log("Recording started...");
    },
    stopRecording: () => {
        if(mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }
  }));

  const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

  const getVideoElement = (url: string): HTMLVideoElement => {
      let v = videoCacheRef.current.get(url);
      if (!v) {
          v = document.createElement('video');
          v.src = url;
          v.muted = true;
          v.playsInline = true;
          v.loop = true;
          v.crossOrigin = "anonymous";
          videoCacheRef.current.set(url, v);
          v.load();
      }
      if (v.readyState === 0) v.load();
      return v;
  };

  const getInterpolatedLayer = (layer: LayerConfig, progress: number): LayerConfig => {
      if (!layer.keyframes || layer.keyframes.length === 0) return layer;
      const sortedKeys = [...layer.keyframes].sort((a, b) => a.time - b.time);
      
      let prevKey: Keyframe = { id: 'start', time: 0, x: layer.x, y: layer.y, scale: layer.scale, rotation: layer.rotation, opacity: layer.opacity };
      let nextKey: Keyframe | null = null;

      for (let i = 0; i < sortedKeys.length; i++) {
          if (sortedKeys[i].time >= progress) {
              nextKey = sortedKeys[i];
              if (i > 0) prevKey = sortedKeys[i - 1];
              else if (sortedKeys[i].time > 0) {
                 prevKey = { id: 'base', time: 0, x: layer.x, y: layer.y, scale: layer.scale, rotation: layer.rotation, opacity: layer.opacity };
              }
              break;
          }
          prevKey = sortedKeys[i];
      }

      if (!nextKey) {
          const lastKey = sortedKeys[sortedKeys.length - 1];
          return { ...layer, x: lastKey.x, y: lastKey.y, scale: lastKey.scale, rotation: lastKey.rotation, opacity: lastKey.opacity };
      }

      const duration = nextKey.time - prevKey.time;
      if (duration <= 0.0001) return { ...layer, x: nextKey.x, y: nextKey.y, scale: nextKey.scale, rotation: nextKey.rotation, opacity: nextKey.opacity };
      
      const t = (progress - prevKey.time) / duration;
      const easedT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      return {
          ...layer,
          x: lerp(prevKey.x, nextKey.x, easedT),
          y: lerp(prevKey.y, nextKey.y, easedT),
          scale: lerp(prevKey.scale, nextKey.scale, easedT),
          rotation: lerp(prevKey.rotation, nextKey.rotation, easedT),
          opacity: lerp(prevKey.opacity, nextKey.opacity, easedT)
      };
  };

  const getCanvasFilter = (filter: VideoFilter): string => {
      switch (filter) {
          case VideoFilter.NOIR: return 'grayscale(100%) contrast(1.2)';
          case VideoFilter.SEPIA: return 'sepia(100%) contrast(0.9)';
          case VideoFilter.CYBERPUNK: return 'contrast(1.2) saturate(1.5) hue-rotate(190deg)';
          case VideoFilter.VINTAGE: return 'sepia(50%) contrast(0.9) brightness(0.9)';
          case VideoFilter.VHS: return 'contrast(1.2) saturate(1.2) sepia(20%)';
          case VideoFilter.DREAMY: return 'contrast(0.9) brightness(1.1) saturate(1.1)';
          case VideoFilter.COLD: return 'hue-rotate(180deg) saturate(0.5)';
          case VideoFilter.WARM: return 'sepia(30%) saturate(1.2)';
          case VideoFilter.HIGH_CONTRAST: return 'contrast(1.5)';
          case VideoFilter.NEURAL_CINEMATIC: return 'contrast(1.1) saturate(1.2)';
          default: return 'none';
      }
  };

  // --- GLOBAL VFX HELPERS ---
  const drawFilmGrain = (ctx: CanvasRenderingContext2D, intensity: number, width: number, height: number) => {
    if (intensity <= 0) return;
    
    // Performance optimization: Generate grain only once per resize or reuse small pattern
    if (!grainCanvasRef.current || grainCanvasRef.current.width !== 256) {
        grainCanvasRef.current = document.createElement('canvas');
        grainCanvasRef.current.width = 256;
        grainCanvasRef.current.height = 256;
    }
    
    const gCtx = grainCanvasRef.current.getContext('2d');
    if (!gCtx) return;

    // Refresh noise every few frames to look dynamic (check is simpler here)
    if (Math.random() > 0.5) {
        const idata = gCtx.createImageData(256, 256);
        const buffer = new Uint32Array(idata.data.buffer);
        for (let i = 0; i < buffer.length; i++) {
            if (Math.random() < 0.5) {
                buffer[i] = 0xff000000 | (Math.random() * 255); // Alpha noise is tricky, using gray
            } else {
                 buffer[i] = 0x00000000;
            }
        }
        gCtx.putImageData(idata, 0, 0);
    }

    ctx.save();
    ctx.globalAlpha = intensity;
    ctx.globalCompositeOperation = 'overlay';
    const pattern = ctx.createPattern(grainCanvasRef.current, 'repeat');
    if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  };

  const drawVignette = (ctx: CanvasRenderingContext2D, intensity: number, width: number, height: number) => {
      if (intensity <= 0) return;
      ctx.save();
      const gradient = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.8);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, `rgba(0,0,0,${Math.min(intensity, 0.9)})`);
      ctx.fillStyle = gradient;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, effect: ParticleEffect, width: number, height: number) => {
    if (effect === ParticleEffect.NONE) return;

    if (particlesRef.current.length < 50) {
        let typeObj = { color: 'white', size: 2, speed: 1, emoji: '' };
        switch (effect) {
            case ParticleEffect.SNOW: typeObj = { color: 'white', size: 3, speed: 2, emoji: '' }; break;
            case ParticleEffect.RAIN: typeObj = { color: '#a5d8ff', size: 2, speed: 15, emoji: '' }; break;
            case ParticleEffect.EMBERS: typeObj = { color: '#ff6b6b', size: 4, speed: -2, emoji: '' }; break;
            case ParticleEffect.FLOATING_HEARTS: typeObj = { color: '', size: 30, speed: -1, emoji: '❤️' }; break;
            case ParticleEffect.FLOATING_LIKES: typeObj = { color: '', size: 30, speed: -1, emoji: '👍' }; break;
            case ParticleEffect.FLOATING_MONEY: typeObj = { color: '', size: 30, speed: -1, emoji: '💸' }; break;
            case ParticleEffect.FLOATING_STARS: typeObj = { color: '', size: 30, speed: -1, emoji: '⭐' }; break;
            case ParticleEffect.FLOATING_MUSIC: typeObj = { color: '', size: 30, speed: -1, emoji: '🎵' }; break;
        }

        particlesRef.current.push({
            x: Math.random() * width,
            y: typeObj.speed > 0 ? -10 : height + 10,
            vx: (Math.random() - 0.5) * 2,
            vy: typeObj.speed * (Math.random() * 0.5 + 0.8),
            size: typeObj.size * (Math.random() * 0.5 + 0.5),
            color: typeObj.color,
            alpha: 1,
            life: 100,
            decay: 0.5,
            type: effect,
            emoji: typeObj.emoji
        });
    }

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.y > height + 20 || p.y < -20 || p.life <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
        }

        ctx.globalAlpha = p.alpha * (p.life / 100);
        if (p.emoji) {
             ctx.font = `${p.size}px Arial`;
             ctx.fillText(p.emoji, p.x, p.y);
        } else if (p.type === ParticleEffect.RAIN) {
             ctx.strokeStyle = p.color;
             ctx.lineWidth = 1;
             ctx.beginPath();
             ctx.moveTo(p.x, p.y);
             ctx.lineTo(p.x + p.vx, p.y + p.vy * 4);
             ctx.stroke();
        } else {
             ctx.fillStyle = p.color;
             ctx.beginPath();
             ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
             ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
  };

  const drawSubtitles = (ctx: CanvasRenderingContext2D, text: string, style: SubtitleStyle, width: number, height: number, progress: number) => {
      if (!text || style === SubtitleStyle.NONE) return;

      // Get Settings
      const settings = subtitleSettingsRef.current || { fontSizeMultiplier: 1.0, yPosition: 0.9, fontFamily: 'Inter' };
      const fontSizeMultiplier = settings.fontSizeMultiplier;
      const yPosFactor = settings.yPosition;
      // Use user-defined font family or fallback to Inter
      const userFontFamily = settings.fontFamily || 'Inter';

      // --- 1. SPECIAL MODE: WORD BY WORD (SPEED READING) ---
      if (style === SubtitleStyle.WORD_BY_WORD) {
          const allWords = text.split(/\s+/);
          const totalWords = allWords.length;
          // Calculate which word to show based on scene progress
          const currentWordIdx = Math.min(Math.floor(progress * totalWords), totalWords - 1);
          const word = allWords[currentWordIdx] || "";
          
          if (!word) return;

          const baseFontSize = width * 0.1;
          const fontSize = Math.min(baseFontSize * fontSizeMultiplier, 200);

          // Force bold for readability in speed reading
          ctx.font = `900 ${fontSize}px '${userFontFamily}', sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const x = width / 2;
          const y = height * (yPosFactor > 0.8 ? 0.5 : yPosFactor); // Center by default if user hasn't moved it up significantly, else follow custom Y

          // Background box
          const measure = ctx.measureText(word);
          const padding = 20 * fontSizeMultiplier;
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.roundRect(x - measure.width/2 - padding, y - fontSize/2 - padding, measure.width + padding*2, fontSize + padding*2, 10);
          ctx.fill();

          // Highlight text
          ctx.fillStyle = '#facc15'; // Yellow-400
          ctx.fillText(word, x, y);
          return;
      }

      // --- 2. REGULAR MODES (LINE BASED) ---
      let baseSize = width * 0.05;
      let fontSize = Math.min(baseSize, 48) * fontSizeMultiplier;
      
      let fontFamily = `'${userFontFamily}', sans-serif`;
      let color = 'white';
      
      // Style specific defaults (only if user hasn't selected a custom font, but here we prioritize user selection)
      // We keep color/size tweaks based on style though
      if (style === SubtitleStyle.COMIC) {
          fontSize = fontSize * 1.1;
          color = '#fef08a'; // Yellow-200
      } else if (style === SubtitleStyle.GLITCH) {
          color = '#ffffff';
      }

      ctx.font = `900 ${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom'; 
      
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = words[0];
      
      for (let i = 1; i < words.length; i++) {
          const w = ctx.measureText(currentLine + " " + words[i]).width;
          if (w < width * 0.8) {
              currentLine += " " + words[i];
          } else {
              lines.push(currentLine);
              currentLine = words[i];
          }
      }
      lines.push(currentLine);

      const lineHeight = fontSize * 1.3;
      const totalTextHeight = lines.length * lineHeight;
      
      // Calculate start Y based on bottom baseline, respecting user setting
      // User setting 1.0 = Bottom of screen. 0.0 = Top.
      // Default yPosFactor is 0.9 (near bottom)
      const startY = (height * yPosFactor) - totalTextHeight + lineHeight; // Adjust so the text block ends at yPosition

      // Karaoke Global Logic
      const allWords = text.split(/\s+/);
      const activeWordCount = Math.floor(progress * allWords.length);
      let wordCounter = 0;

      lines.forEach((line, index) => {
          const y = startY + (index * lineHeight);
          const x = width / 2;
          
          if (style === SubtitleStyle.MODERN) {
              const bgWidth = ctx.measureText(line).width + (40 * fontSizeMultiplier);
              ctx.fillStyle = 'rgba(0,0,0,0.7)';
              ctx.roundRect(x - bgWidth/2, y - fontSize, bgWidth, fontSize + (10 * fontSizeMultiplier), 10);
              ctx.fill();
              ctx.fillStyle = 'white';
              ctx.fillText(line, x, y);
          } 
          else if (style === SubtitleStyle.NEON) {
              ctx.shadowColor = '#00ffcc';
              ctx.shadowBlur = 15;
              ctx.strokeStyle = '#00ffcc';
              ctx.lineWidth = 2;
              ctx.strokeText(line, x, y);
              ctx.fillStyle = 'white';
              ctx.fillText(line, x, y);
              ctx.shadowBlur = 0;
          } 
          else if (style === SubtitleStyle.COMIC) {
              ctx.strokeStyle = 'black';
              ctx.lineWidth = 6 * fontSizeMultiplier;
              ctx.lineJoin = 'round';
              ctx.strokeText(line, x, y);
              ctx.fillStyle = '#fde047'; // Yellow
              ctx.fillText(line, x, y);
          }
          else if (style === SubtitleStyle.GLITCH) {
              const offsetX = (Math.random() - 0.5) * 5;
              const offsetY = (Math.random() - 0.5) * 2;
              
              // Cyan Channel
              ctx.fillStyle = 'cyan';
              ctx.fillText(line, x - 3 + offsetX, y + offsetY);
              // Magenta Channel
              ctx.fillStyle = 'magenta';
              ctx.fillText(line, x + 3 - offsetX, y - offsetY);
              // White Channel
              ctx.fillStyle = 'white';
              ctx.fillText(line, x, y);
          }
          else if (style === SubtitleStyle.KARAOKE) {
              // Classic Stroke Background
              ctx.strokeStyle = 'black';
              ctx.lineWidth = 6 * fontSizeMultiplier;
              ctx.lineJoin = 'round';
              ctx.strokeText(line, x, y);
              
              // Draw "Inactive" Color first (White)
              ctx.fillStyle = 'white';
              ctx.fillText(line, x, y);

              // We just increment word counter here for the overlay pass below
              const lineWords = line.split(' ');
              wordCounter += lineWords.length;
          }
          else {
               // CLASSIC DEFAULT
               ctx.strokeStyle = 'black';
               ctx.lineWidth = 5 * fontSizeMultiplier;
               ctx.lineJoin = 'round';
               ctx.strokeText(line, x, y);
               ctx.fillStyle = 'white';
               ctx.fillText(line, x, y);
          }
      });

      // Redrawing Karaoke Properly (Overlay method)
      if (style === SubtitleStyle.KARAOKE) {
           let kWordCounter = 0;
           lines.forEach((line, index) => {
               const y = startY + (index * lineHeight);
               const lineWords = line.split(' ');
               
               // Calculate total line width to find start X
               let totalW = 0;
               const wordWidths = lineWords.map(w => {
                   const width = ctx.measureText(w + " ").width;
                   totalW += width;
                   return width;
               });
               
               let startX = (width / 2) - (totalW / 2);
               
               lineWords.forEach((w, wIdx) => {
                    // Only redraw if active
                    if (kWordCounter < activeWordCount) {
                        ctx.fillStyle = '#facc15';
                        ctx.textAlign = 'left'; // Temp switch to left align for precise word placement
                        ctx.fillText(w, startX, y);
                    }
                    startX += wordWidths[wIdx];
                    kWordCounter++;
               });
               // Restore align
               ctx.textAlign = 'center';
           });
      }
  };

  const drawScene = (ctx: CanvasRenderingContext2D, scene: Scene, scale: number, progress: number, isPlaying: boolean, elapsedTimeMs: number) => {
      // 1. Background Fill
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Apply Global Filter HERE
      ctx.filter = getCanvasFilter(activeFilterRef.current);

      // 2. Camera Transform (Ken Burns Effect)
      ctx.save();
      const move = scene.cameraMovement || CameraMovement.STATIC;
      const t = progress; 
      
      let scaleFactor = 1;
      let transX = 0;
      let transY = 0;
      let rot = 0;

      // Ensure we are centering the transformations
      ctx.translate(WIDTH/2, HEIGHT/2);

      if (move === CameraMovement.ZOOM_IN) {
          scaleFactor = 1.05 + (0.25 * t); // Start slightly zoomed in (1.05) to allow edges, end at 1.3
      } 
      else if (move === CameraMovement.ZOOM_OUT) {
          scaleFactor = 1.3 - (0.25 * t); // Start at 1.3, end at 1.05
      } 
      else if (move === CameraMovement.PAN_LEFT) {
          scaleFactor = 1.2; // Scale up to pan without black bars
          // Move from right to left
          transX = (WIDTH * 0.08) - ((WIDTH * 0.16) * t); 
      } 
      else if (move === CameraMovement.PAN_RIGHT) {
          scaleFactor = 1.2;
          // Move from left to right
          transX = -(WIDTH * 0.08) + ((WIDTH * 0.16) * t);
      } 
      else if (move === CameraMovement.ROTATE_CW) {
          scaleFactor = 1.3; // Scale to cover corners during rotation
          rot = (2 * Math.PI / 180) * t * 3;
      } 
      else if (move === CameraMovement.ROTATE_CCW) {
          scaleFactor = 1.3;
          rot = -(2 * Math.PI / 180) * t * 3;
      }
      else if (move === CameraMovement.HANDHELD) {
          scaleFactor = 1.1;
          const shake = globalVfxRef.current?.shakeIntensity || 0;
          const baseShake = 0.01 + (shake * 0.01); 
          transX = Math.sin(elapsedTimeMs * 0.002) * (WIDTH * baseShake);
          transY = Math.cos(elapsedTimeMs * 0.003) * (HEIGHT * baseShake);
          rot = Math.sin(elapsedTimeMs * 0.001) * 0.005;
      }

      ctx.scale(scaleFactor, scaleFactor);
      ctx.rotate(rot);
      ctx.translate(transX, transY);
      
      // Move back to top-left for drawing
      ctx.translate(-WIDTH/2, -HEIGHT/2);

      // 3. Draw Background (Video or Image)
      if (scene.mediaType === 'video' && scene.videoUrl) {
           const v = getVideoElement(scene.videoUrl);
           
           if (isPlaying && v.paused) {
                v.play().catch(e => console.warn("BG Play fail", e));
           } else if (!isPlaying && !v.paused) {
                v.pause();
           }

           if (v.readyState >= 2) { 
               const vidRatio = v.videoWidth / v.videoHeight;
               const canvasRatio = WIDTH / HEIGHT;
               let drawW = WIDTH, drawH = HEIGHT, offsetX = 0, offsetY = 0;

               if (vidRatio > canvasRatio) {
                   drawH = HEIGHT;
                   drawW = HEIGHT * vidRatio;
                   offsetX = (WIDTH - drawW) / 2;
               } else {
                   drawW = WIDTH;
                   drawH = WIDTH / vidRatio;
                   offsetY = (HEIGHT - drawH) / 2;
               }
               ctx.drawImage(v, offsetX, offsetY, drawW, drawH);
           }
      } else {
           const img = scene.imageUrl ? imageCacheRef.current.get(scene.imageUrl) : null;
           if (!img && scene.imageUrl && !imageCacheRef.current.has(scene.imageUrl)) {
               const i = new Image(); i.crossOrigin = "anonymous"; i.src = scene.imageUrl; i.onload = () => imageCacheRef.current.set(scene.imageUrl!, i);
           }
           if (img) {
              const imgRatio = img.width / img.height;
              const canvasRatio = WIDTH / HEIGHT;
              let drawW = WIDTH, drawH = HEIGHT, offsetX = 0, offsetY = 0;
              if (imgRatio > canvasRatio) { drawH = HEIGHT; drawW = HEIGHT * imgRatio; offsetX = (WIDTH - drawW) / 2; } 
              else { drawW = WIDTH; drawH = WIDTH / imgRatio; offsetY = (HEIGHT - drawH) / 2; }
              ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
           }
      }

      // 4. Draw Layers
      const layers = scene.layers || [];
      const legacyOverlay = scene.overlay ? { 
          ...scene.overlay, 
          id: 'legacy', 
          type: 'image' as const, 
          name: 'Overlay', 
          rotation: 0,
          opacity: scene.overlay.opacity ?? 1
      } : null;
      const allLayers = legacyOverlay && layers.length === 0 ? [legacyOverlay] : layers;

      allLayers.forEach(baseLayer => {
          const layer = getInterpolatedLayer(baseLayer, progress);
          
          ctx.save();
          const lx = layer.x * WIDTH;
          const ly = layer.y * HEIGHT;
          
          ctx.translate(lx, ly);
          ctx.rotate((layer.rotation * Math.PI) / 180);
          ctx.scale(layer.scale, layer.scale);
          ctx.globalAlpha = layer.opacity;
          ctx.globalCompositeOperation = layer.blendMode || 'source-over';

          if (layer.shadowColor && layer.type !== 'text') {
              ctx.shadowColor = layer.shadowColor;
              ctx.shadowBlur = layer.shadowBlur || 0;
              ctx.shadowOffsetX = layer.shadowOffsetX || 0;
              ctx.shadowOffsetY = layer.shadowOffsetY || 0;
          }

          if (layer.type === 'text' && layer.text) {
              ctx.font = `${layer.fontWeight || 'bold'} ${layer.fontSize || 50}px '${layer.fontFamily || 'Inter'}'`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              if (layer.textShadow) {
                   ctx.lineJoin = "round";
                   ctx.lineWidth = 4;
                   ctx.strokeStyle = "black";
                   ctx.strokeText(layer.text, 0, 0);
              }
              ctx.fillStyle = layer.fontColor || '#ffffff';
              ctx.fillText(layer.text, 0, 0);
          } 
          else if (layer.type === 'image' && layer.url) {
              const lImg = imageCacheRef.current.get(layer.url);
              if (!lImg && !imageCacheRef.current.has(layer.url)) {
                  const i = new Image(); i.src = layer.url; i.onload = () => imageCacheRef.current.set(layer.url!, i);
              }
              if (lImg) ctx.drawImage(lImg, -lImg.width/2, -lImg.height/2);
          }
          else if (layer.type === 'video' && layer.url) {
               const v = getVideoElement(layer.url);
               if (v.readyState >= 2) {
                   const trimStart = layer.trimStart || 0;
                   const trimEnd = layer.trimEnd || v.duration;
                   const loopDuration = trimEnd - trimStart;

                   if (loopDuration > 0) {
                       const expectedTime = trimStart + (elapsedTimeMs / 1000) % loopDuration;
                       if (Math.abs(v.currentTime - expectedTime) > 0.3) {
                           v.currentTime = expectedTime;
                       }
                   }

                   if (isPlaying && v.paused) v.play().catch(e=>{});
                   else if (!isPlaying && !v.paused) v.pause();

                   const aspect = v.videoWidth / v.videoHeight;
                   const baseW = 400;
                   const baseH = 400 / aspect;
                   ctx.drawImage(v, -baseW/2, -baseH/2, baseW, baseH);
               }
          }
          ctx.restore();
      });

      ctx.restore(); // Restore Camera Transform

      // Reset Filter so it doesn't affect Particles/UI
      ctx.filter = 'none';

      // 7. Particles
      if (scene.particleEffect) {
          drawParticles(ctx, scene.particleEffect, WIDTH, HEIGHT);
      }

      // 7.5 Global VFX Overlays
      if (globalVfxRef.current) {
          if (globalVfxRef.current.vignetteIntensity > 0) drawVignette(ctx, globalVfxRef.current.vignetteIntensity, WIDTH, HEIGHT);
          if (globalVfxRef.current.filmGrain > 0) drawFilmGrain(ctx, globalVfxRef.current.filmGrain, WIDTH, HEIGHT);
      }

      // 8. Global Channel Logo
      if (channelLogoRef.current) {
          const logo = channelLogoRef.current;
          const lImg = imageCacheRef.current.get(logo.url);
          if (!lImg && !imageCacheRef.current.has(logo.url)) {
                const i = new Image(); i.src = logo.url; i.onload = () => imageCacheRef.current.set(logo.url, i);
          }
          if (lImg) {
              ctx.save();
              ctx.globalAlpha = logo.opacity ?? 1;
              const w = lImg.width * (logo.scale || 0.2);
              const h = lImg.height * (logo.scale || 0.2);
              ctx.drawImage(lImg, logo.x * WIDTH, logo.y * HEIGHT, w, h);
              ctx.restore();
          }
      }

      // 9. Subtitles
      if (showSubtitlesRef.current && scene.text) {
          drawSubtitles(ctx, scene.text, subtitleStyleRef.current, WIDTH, HEIGHT, progress);
      }
  };

  // --- MAIN RENDER LOOP ---
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = WIDTH;
      canvas.height = HEIGHT;

      let sceneStartTime = performance.now();
      let currentIdx = currentSceneIndex;
      let hasStartedAudio = false;

      particlesRef.current = [];

      if (isPlaying) {
          const buffer = bgMusicUrl ? musicBufferCacheRef.current.get(bgMusicUrl) : null;
          if (buffer && buffer instanceof AudioBuffer && bgMusicUrl) playMusic(buffer, bgMusicUrl);
          sceneStartTime = performance.now();
          startTimeRef.current = sceneStartTime;
      } else {
          // Pause logic
          if (speechSourceRef.current) { try{speechSourceRef.current.stop();}catch(e){} speechSourceRef.current = null; }
          if (musicSourceRef.current) { try{musicSourceRef.current.stop();}catch(e){} musicSourceRef.current = null; currentMusicUrlRef.current = null; }
          hasStartedAudio = false;
          videoCacheRef.current.forEach(v => v.pause());
      }

      const render = (time: number) => {
          if (analyserRef.current) analyserRef.current.getByteFrequencyData(audioDataArrayRef.current as any);

          ctx.setTransform(1, 0, 0, 1, 0, 0); 
          ctx.filter = 'none';
          ctx.globalAlpha = 1;
          ctx.clearRect(0, 0, WIDTH, HEIGHT);

          if (!isPlaying && !isRecordingRef.current) {
              // EDITOR PREVIEW
              if (scenesRef.current[currentSceneIndex]) {
                 const scene = scenesRef.current[currentSceneIndex];
                 const durationMs = (scene.durationEstimate || 5) * 1000;
                 const simulatedElapsed = scrubProgress * durationMs;
                 drawScene(ctx, scene, 1, scrubProgress, false, simulatedElapsed); 
              }
          } else {
              // PLAYBACK WITH TRANSITIONS
              const scene = scenesRef.current[currentIdx];
              if (!scene) {
                   setIsPlaying(false);
                   setIsExporting(false);
                   return;
              }

              // Audio Duration Override (Critical Fix)
              const audioDur = scene.audioBuffer?.duration;
              const targetDurationSec = scene.durationEstimate > 0 ? scene.durationEstimate : (audioDur || 5);
              
              const durationMs = targetDurationSec * 1000;
              const elapsed = time - sceneStartTime;
              const progress = Math.min(elapsed / durationMs, 1.0);

              // 1. Trigger Audio
              if (!hasStartedAudio && scene.audioBuffer) {
                   if (scene.audioBuffer instanceof AudioBuffer) {
                       playSpeech(scene.audioBuffer);
                       hasStartedAudio = true;
                   }
              }

              // 2. Handle Transitions
              const TRANSITION_DURATION = 1000; // 1 second transition
              const timeRemaining = durationMs - elapsed;
              const nextScene = scenesRef.current[currentIdx + 1];
              
              // Only draw transitions if we are near the end, have a next scene, and transition is not NONE
              const activeTransition = scene.transition || globalTransition;
              const inTransitionZone = timeRemaining < TRANSITION_DURATION && nextScene && activeTransition !== VideoTransition.NONE;

              if (inTransitionZone) {
                  // Draw Current Scene (Bottom Layer)
                  drawScene(ctx, scene, 1, progress, true, elapsed);
                  
                  // Calculate Transition Progress (0.0 to 1.0)
                  const t = 1 - (timeRemaining / TRANSITION_DURATION); // 0 start, 1 end
                  
                  ctx.save();
                  // Apply Transition Effect to Next Scene
                  if (activeTransition === VideoTransition.FADE) {
                      ctx.globalAlpha = t;
                  } else if (activeTransition === VideoTransition.SLIDE) {
                      const offset = WIDTH * (1 - t);
                      ctx.translate(offset, 0);
                  } else if (activeTransition === VideoTransition.ZOOM) {
                      const scale = 0.5 + (0.5 * t);
                      ctx.translate(WIDTH/2, HEIGHT/2);
                      ctx.scale(scale, scale);
                      ctx.translate(-WIDTH/2, -HEIGHT/2);
                      ctx.globalAlpha = t;
                  } else if (activeTransition === VideoTransition.WIPE) {
                       // Simple clip wipe
                       ctx.beginPath();
                       ctx.rect(0, 0, WIDTH * t, HEIGHT);
                       ctx.clip();
                  }

                  // Draw Next Scene (Top Layer) - frozen at start
                  drawScene(ctx, nextScene, 1, 0, false, 0);
                  ctx.restore();

              } else {
                  // Normal Drawing
                  drawScene(ctx, scene, 1, progress, true, elapsed);
              }

              if (isRecordingRef.current) {
                  const totalProgress = ((currentIdx + progress) / scenesRef.current.length) * 100;
                  setExportProgress(Math.min(Math.round(totalProgress), 99));
              }

              if (elapsed >= durationMs) {
                  if (currentIdx < scenesRef.current.length - 1) {
                      currentIdx++;
                      setCurrentSceneIndex(currentIdx);
                      sceneStartTime = time;
                      hasStartedAudio = false;
                      particlesRef.current = [];
                  } else {
                      // STOP RECORDING AT END
                      if (isRecordingRef.current) {
                          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                              mediaRecorderRef.current.stop();
                          }
                      }
                      setIsPlaying(false);
                      if (onPlaybackComplete) onPlaybackComplete();
                  }
              }
              rafRef.current = requestAnimationFrame(render);
          }
      };

      rafRef.current = requestAnimationFrame(render);

      return () => {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
  }, [isPlaying, currentSceneIndex, renderScale, bgMusicUrl, format, activeFilter, globalTransition, globalVfx, showSubtitles, subtitleStyle, subtitleSettings, channelLogo, userTier, scrubProgress, scenes]);

  return (
    <div 
        ref={containerRef} 
        onClick={togglePlay}
        className="relative w-full aspect-video bg-black overflow-hidden group border border-zinc-800 rounded-lg shadow-2xl cursor-pointer"
    >
        <canvas ref={canvasRef} className="w-full h-full object-contain pointer-events-none" />
        
        {isExporting && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="text-white font-bold text-xl animate-pulse">Renderizando...</h3>
                <p className="text-zinc-400 text-sm mt-2">{exportProgress}%</p>
                {exportProgress >= 99 && <p className="text-amber-500 text-xs mt-1 animate-pulse">Finalizando arquivo (pode demorar alguns segundos)...</p>}
            </div>
        )}

        {!isPlaying && !isExporting && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                 <div className="bg-black/50 p-4 rounded-full backdrop-blur-sm shadow-xl transform group-hover:scale-110 transition-transform">
                     <Play className="w-10 h-10 text-white fill-white" />
                 </div>
             </div>
        )}

        <button onClick={toggleFullscreen} className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-40">
            {isFullscreen ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
        </button>
    </div>
  );
});

export default VideoPlayer;