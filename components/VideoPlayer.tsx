
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Scene, VideoFormat, SubtitleStyle, UserTier, VideoFilter, LayerConfig, OverlayConfig, VideoTransition, ParticleEffect, CameraMovement, Keyframe, VFXConfig, SubtitleSettings, AudioLayer, LayerAnimation } from '../types';
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
  bgMusicUrl?: string; // Legacy fallback
  bgMusicPlaylist?: string[]; // New Playlist Prop
  bgMusicVolume: number;
  showSubtitles: boolean;
  subtitleStyle: SubtitleStyle;
  subtitleSettings?: SubtitleSettings;
  activeFilter?: VideoFilter;
  globalTransition?: VideoTransition;
  globalVfx?: VFXConfig;
  userTier: UserTier;
  onPlaybackComplete?: () => void;
  onProgress?: (progress: number) => void;
  channelLogo?: OverlayConfig;
  onUpdateChannelLogo?: (config: OverlayConfig) => void;
  onUpdateSceneOverlay?: (sceneId: string, config: OverlayConfig) => void;
  scrubProgress?: number; 
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
  bgMusicPlaylist = [],
  bgMusicVolume,
  showSubtitles,
  subtitleStyle,
  subtitleSettings,
  activeFilter = VideoFilter.NONE,
  globalTransition = VideoTransition.NONE,
  globalVfx,
  userTier,
  onPlaybackComplete,
  onProgress,
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
  
  // Music Playlist Refs
  const currentMusicIndexRef = useRef<number>(0);
  const effectivePlaylistRef = useRef<string[]>([]);
  
  const sfxSourcesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const sfxBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const sfxPlayedRef = useRef<Set<string>>(new Set());

  // --- PARTICLES & VFX REF ---
  const particlesRef = useRef<Particle[]>([]);
  const grainCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [renderScale, setRenderScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dynamic aspect ratio calculation based on format prop
  const aspectRatioClass = format === VideoFormat.PORTRAIT ? 'aspect-[9/16]' : 'aspect-video';
  
  // Dimensions
  const WIDTH = (format === VideoFormat.PORTRAIT ? 720 : 1280) * renderScale;
  const HEIGHT = (format === VideoFormat.PORTRAIT ? 1280 : 720) * renderScale;

  // Refs for Loop State to avoid re-triggering effect on every prop change
  const showSubtitlesRef = useRef(showSubtitles); 
  const subtitleStyleRef = useRef(subtitleStyle);
  const subtitleSettingsRef = useRef(subtitleSettings);
  const channelLogoRef = useRef(channelLogo);
  const activeFilterRef = useRef(activeFilter);
  const globalVfxRef = useRef(globalVfx);
  const scrubProgressRef = useRef(scrubProgress);
  const globalTransitionRef = useRef(globalTransition);
  
  // Media Caches
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const videoCacheRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);
  
  const recordingMimeTypeRef = useRef<string>('video/webm');

  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const audioDataArrayRef = useRef<Uint8Array>(new Uint8Array(0));
  
  const scenesRef = useRef<Scene[]>(scenes);

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
  useEffect(() => { scrubProgressRef.current = scrubProgress; }, [scrubProgress]);
  useEffect(() => { globalTransitionRef.current = globalTransition; }, [globalTransition]);

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

  // Construct Effective Playlist
  useEffect(() => {
      if (bgMusicPlaylist && bgMusicPlaylist.length > 0) {
          effectivePlaylistRef.current = bgMusicPlaylist;
      } else if (bgMusicUrl) {
          effectivePlaylistRef.current = [bgMusicUrl];
      } else {
          effectivePlaylistRef.current = [];
      }
  }, [bgMusicPlaylist, bgMusicUrl]);

  // Load All Music in Playlist
  useEffect(() => {
      const loadPlaylist = async () => {
          const playlist = effectivePlaylistRef.current;
          if (playlist.length === 0) {
              if (musicSourceRef.current) {
                  try { musicSourceRef.current.stop(); } catch(e){}
                  musicSourceRef.current = null;
              }
              return;
          }

          // Preload all
          for (const url of playlist) {
              if (!musicBufferCacheRef.current.has(url)) {
                  try {
                      const resp = await fetch(url);
                      const arrayBuffer = await resp.arrayBuffer();
                      const decoded = await getAudioContext().decodeAudioData(arrayBuffer);
                      if (decoded) {
                          musicBufferCacheRef.current.set(url, decoded);
                      }
                  } catch (e) { console.error(`Failed to load music ${url}`, e); }
              }
          }

          // If playing and nothing playing, start (but typically controlled by play/pause toggle)
      };
      loadPlaylist();
  }, [bgMusicPlaylist, bgMusicUrl]);

  // Load SFX for current Scene
  useEffect(() => {
      const scene = scenes[currentSceneIndex];
      if (scene && scene.audioLayers) {
          scene.audioLayers.forEach(async (layer) => {
              if (!sfxBuffersRef.current.has(layer.url)) {
                  try {
                      const resp = await fetch(layer.url);
                      const arrayBuffer = await resp.arrayBuffer();
                      const decoded = await getAudioContext().decodeAudioData(arrayBuffer);
                      sfxBuffersRef.current.set(layer.url, decoded);
                  } catch (e) { console.error("SFX load failed", e); }
              }
          });
      }
  }, [currentSceneIndex, scenes]);

  const playMusicSequence = (index: number) => {
      const playlist = effectivePlaylistRef.current;
      if (playlist.length === 0) return;

      const safeIndex = index % playlist.length;
      currentMusicIndexRef.current = safeIndex;
      const url = playlist[safeIndex];
      const buffer = musicBufferCacheRef.current.get(url);

      if (!buffer) return; // Not loaded yet

      const ctx = getAudioContext();
      if (musicSourceRef.current) {
           try { musicSourceRef.current.stop(); } catch(e){}
      }

      musicSourceRef.current = ctx.createBufferSource();
      musicSourceRef.current.buffer = buffer;
      
      // If only 1 track, loop it. If multiple, play next on ended.
      if (playlist.length === 1) {
          musicSourceRef.current.loop = true;
      } else {
          musicSourceRef.current.loop = false;
          musicSourceRef.current.onended = () => {
              if (isPlaying) {
                  playMusicSequence(currentMusicIndexRef.current + 1);
              }
          };
      }
      
      if (!musicGainRef.current) {
          musicGainRef.current = ctx.createGain();
          musicGainRef.current.connect(masterGainRef.current!);
      }
      
      musicSourceRef.current.connect(musicGainRef.current);
      musicSourceRef.current.start(0);
      musicGainRef.current.gain.value = bgMusicVolume;
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

  const playSFX = (layer: AudioLayer) => {
      const buffer = sfxBuffersRef.current.get(layer.url);
      if (!buffer) return;
      
      const ctx = getAudioContext();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      
      const gain = ctx.createGain();
      gain.gain.value = layer.volume;
      
      source.connect(gain);
      gain.connect(masterGainRef.current!);
      
      source.start(0);
      const key = `${layer.id}-${Date.now()}`;
      sfxSourcesRef.current.set(key, source);
      
      source.onended = () => {
          sfxSourcesRef.current.delete(key);
      };
  };

  const stopAllSFX = () => {
      sfxSourcesRef.current.forEach(src => {
          try { src.stop(); } catch(e){}
      });
      sfxSourcesRef.current.clear();
      sfxPlayedRef.current.clear();
  };

  useImperativeHandle(ref, () => ({
    startRecording: (highQuality = false) => {
        setIsExporting(true);
        setExportProgress(0);
        isRecordingRef.current = true;
        setCurrentSceneIndex(0);
        setRenderScale(highQuality ? 2 : 1); 
        startTimeRef.current = performance.now();
        
        // Reset music to start of playlist for export
        currentMusicIndexRef.current = 0;
        
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
        
        recordingMimeTypeRef.current = mimeType;

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
            const blob = new Blob(chunksRef.current, { type: recordingMimeTypeRef.current });
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
  const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);

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

  const drawFilmGrain = (ctx: CanvasRenderingContext2D, intensity: number, width: number, height: number) => {
    if (intensity <= 0) return;
    if (!grainCanvasRef.current || grainCanvasRef.current.width !== 256) {
        grainCanvasRef.current = document.createElement('canvas');
        grainCanvasRef.current.width = 256;
        grainCanvasRef.current.height = 256;
    }
    const gCtx = grainCanvasRef.current.getContext('2d');
    if (!gCtx) return;

    if (Math.random() > 0.5) {
        const idata = gCtx.createImageData(256, 256);
        const buffer = new Uint32Array(idata.data.buffer);
        for (let i = 0; i < buffer.length; i++) {
            if (Math.random() < 0.5) {
                buffer[i] = 0xff000000 | (Math.random() * 255); 
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

  const drawParticles = (ctx: CanvasRenderingContext2D, effect: ParticleEffect, width: number, height: number, isStatic: boolean) => {
    if (effect === ParticleEffect.NONE) return;

    if (particlesRef.current.length < 50 && !isStatic) {
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

    // DRAW PARTICLES
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        
        // UPDATE PHYSICS ONLY IF PLAYING
        if (!isStatic) {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
        }

        if (p.y > height + 20 || p.y < -20 || p.life <= 0) {
            if (!isStatic) particlesRef.current.splice(i, 1);
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

  // --- REFACTORED SUBTITLE RENDERER (Professional & Paginated) ---
  const drawSubtitles = (ctx: CanvasRenderingContext2D, text: string, style: SubtitleStyle, width: number, height: number, progress: number) => {
      if (!text || style === SubtitleStyle.NONE) return;

      const settings = subtitleSettingsRef.current || { fontSizeMultiplier: 1.0, yPosition: 0.85, fontFamily: 'Inter' };
      const fontSizeMultiplier = settings.fontSizeMultiplier;
      const userFontFamily = settings.fontFamily || 'Inter';
      
      // Calculate responsive font size
      const isPortrait = width < height;
      const baseFontSize = isPortrait ? width * 0.065 : width * 0.04;
      const fontSize = Math.max(24, Math.min(baseFontSize * fontSizeMultiplier, 120));
      
      // Font Definition
      const fontWeight = '800'; // Extra bold for pro look
      ctx.font = `${fontWeight} ${fontSize}px '${userFontFamily}', sans-serif`;
      
      // 1. Text Pagination Logic (Chunking)
      const allWords = text.trim().split(/\s+/);
      const totalWords = allWords.length;
      const currentWordIdx = Math.min(Math.floor(progress * totalWords), totalWords - 1);
      
      // Determine batch size (how many words per screen)
      // Portrait needs fewer words per screen to avoid tiny text
      const WORDS_PER_BATCH = isPortrait ? 5 : 9; 
      const batchIndex = Math.floor(currentWordIdx / WORDS_PER_BATCH);
      const startWord = batchIndex * WORDS_PER_BATCH;
      const endWord = Math.min((batchIndex + 1) * WORDS_PER_BATCH, totalWords);
      
      const visibleWords = allWords.slice(startWord, endWord);
      const visibleText = visibleWords.join(' ');
      
      // Highlight logic relative to current batch
      const highlightIndex = currentWordIdx - startWord;

      // 2. Line Wrapping Logic for the Current Batch
      const lines: string[] = [];
      const wordObjects: { text: string, line: number, x: number, width: number, isHighlighted: boolean }[] = [];
      
      const maxLineWidth = width * 0.85;
      let currentLine = "";
      
      // Preliminary wrap to determine lines
      const batchWords = visibleText.split(' ');
      let tempLine = batchWords[0];
      
      for (let i = 1; i < batchWords.length; i++) {
          const w = ctx.measureText(tempLine + " " + batchWords[i]).width;
          if (w < maxLineWidth) {
              tempLine += " " + batchWords[i];
          } else {
              lines.push(tempLine);
              tempLine = batchWords[i];
          }
      }
      lines.push(tempLine);

      // 3. Positioning
      const lineHeight = fontSize * 1.4;
      const totalBlockHeight = lines.length * lineHeight;
      const yBottomAnchor = height * settings.yPosition; 
      const startY = yBottomAnchor - totalBlockHeight;

      // 4. Render Styles
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      lines.forEach((line, lineIndex) => {
          const y = startY + (lineIndex * lineHeight);
          const x = width / 2;
          
          if (style === SubtitleStyle.WORD_BY_WORD) {
              // Special case: Single big word center screen
              const bigWord = allWords[currentWordIdx] || "";
              const bigFontSize = fontSize * 2.5;
              ctx.font = `900 ${bigFontSize}px '${userFontFamily}', sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // Shadow/Stroke
              ctx.shadowColor = 'rgba(0,0,0,0.8)';
              ctx.shadowBlur = 20;
              ctx.lineWidth = 8;
              ctx.strokeStyle = 'black';
              ctx.strokeText(bigWord, width/2, height/2);
              ctx.shadowBlur = 0;
              
              // Fill
              const gradient = ctx.createLinearGradient(0, height/2 - bigFontSize, 0, height/2 + bigFontSize);
              gradient.addColorStop(0, '#ffffff');
              gradient.addColorStop(1, '#facc15'); // Yellow tint
              ctx.fillStyle = gradient;
              ctx.fillText(bigWord, width/2, height/2);
              
              // Reset
              ctx.font = `${fontWeight} ${fontSize}px '${userFontFamily}', sans-serif`;
              return; 
          }

          if (style === SubtitleStyle.MODERN) {
              // Instagram/TikTok Style: Rounded background, white text
              const metrics = ctx.measureText(line);
              const bgPaddingX = 20;
              const bgPaddingY = 8;
              const bgW = metrics.width + (bgPaddingX * 2);
              const bgH = fontSize + (bgPaddingY * 2);
              
              ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'; // Semi-transparent dark
              
              // Draw rounded rect manually if roundRect not supported (safeguard), though typical modern browsers have it
              if (ctx.roundRect) {
                  ctx.beginPath();
                  ctx.roundRect(x - bgW/2, y - bgPaddingY, bgW, bgH, 12);
                  ctx.fill();
              } else {
                  ctx.fillRect(x - bgW/2, y - bgPaddingY, bgW, bgH);
              }

              ctx.shadowColor = 'rgba(0,0,0,0.5)';
              ctx.shadowBlur = 4;
              ctx.fillStyle = '#ffffff';
              ctx.fillText(line, x, y);
              ctx.shadowBlur = 0;
          } 
          else if (style === SubtitleStyle.CLASSIC) {
              // Netflix Style: White text, Drop Shadow + Thin Stroke
              ctx.shadowColor = 'rgba(0,0,0,0.9)';
              ctx.shadowBlur = 4;
              ctx.shadowOffsetX = 2;
              ctx.shadowOffsetY = 2;
              
              ctx.strokeStyle = 'black';
              ctx.lineWidth = fontSize * 0.1;
              ctx.strokeText(line, x, y);
              
              ctx.fillStyle = '#ffffff'; // White usually reads better for classic
              ctx.fillText(line, x, y);
              
              // Reset shadow
              ctx.shadowColor = 'transparent';
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
          }
          else if (style === SubtitleStyle.NEON) {
              // Multi-pass glow
              ctx.strokeStyle = '#00ffcc';
              ctx.lineWidth = 3;
              
              // Glow layers
              ctx.shadowColor = '#00ffcc';
              ctx.shadowBlur = 20;
              ctx.strokeText(line, x, y);
              
              ctx.shadowBlur = 10;
              ctx.strokeText(line, x, y);
              
              ctx.fillStyle = '#ffffff';
              ctx.fillText(line, x, y);
              
              ctx.shadowBlur = 0;
          }
          else if (style === SubtitleStyle.GLITCH) {
              // Chromatic Aberration
              const offset = Math.random() * 4;
              ctx.fillStyle = 'cyan';
              ctx.fillText(line, x - offset, y);
              ctx.fillStyle = 'magenta';
              ctx.fillText(line, x + offset, y);
              ctx.fillStyle = '#ffffff';
              ctx.fillText(line, x, y);
          }
          else if (style === SubtitleStyle.KARAOKE) {
              // Word-level rendering for highlighting
              // We need to re-measure words to place them correctly in the line
              const wordsInLine = line.split(' ');
              let totalLineWidth = 0;
              const wWidths = wordsInLine.map(w => {
                  const wm = ctx.measureText(w + " ").width;
                  totalLineWidth += wm;
                  return wm;
              });
              
              let currentX = x - (totalLineWidth / 2);
              
              // Find which global word index corresponds to the start of this line
              // This is tricky with wrapping. Simplified approximation:
              // We know 'highlightIndex' is relative to the BATCH.
              // We need to count how many words were in previous lines of this batch.
              let wordsPriorInBatch = 0;
              for(let k=0; k<lineIndex; k++) {
                  wordsPriorInBatch += lines[k].split(' ').length;
              }

              wordsInLine.forEach((w, wIdx) => {
                  const isPlayed = (wordsPriorInBatch + wIdx) <= highlightIndex;
                  
                  ctx.fillStyle = isPlayed ? '#facc15' : 'rgba(255, 255, 255, 0.7)';
                  ctx.strokeStyle = 'black';
                  ctx.lineWidth = fontSize * 0.15;
                  ctx.lineJoin = 'round';
                  
                  ctx.strokeText(w, currentX + (wWidths[wIdx]/2), y);
                  ctx.fillText(w, currentX + (wWidths[wIdx]/2), y);
                  
                  currentX += wWidths[wIdx];
              });
          }
          else if (style === SubtitleStyle.COMIC) {
              ctx.strokeStyle = 'black';
              ctx.lineWidth = fontSize * 0.15;
              ctx.lineJoin = 'round';
              ctx.strokeText(line, x, y);
              
              // Yellow fill with slight orange shadow
              ctx.fillStyle = '#fde047'; 
              ctx.fillText(line, x, y);
          }
      });
  };

  const drawScene = (ctx: CanvasRenderingContext2D, scene: Scene, scale: number, progress: number, isPlaying: boolean, elapsedTimeMs: number) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.filter = getCanvasFilter(activeFilterRef.current);

      ctx.save();
      const move = scene.cameraMovement || CameraMovement.STATIC;
      const t = progress; 
      
      let scaleFactor = 1;
      let transX = 0;
      let transY = 0;
      let rot = 0;

      ctx.translate(WIDTH/2, HEIGHT/2);

      // ONLY APPLY MOVEMENT IF PLAYING
      if (isPlaying) {
        if (move === CameraMovement.ZOOM_IN) {
            scaleFactor = 1.05 + (0.25 * t); 
        } 
        else if (move === CameraMovement.ZOOM_OUT) {
            scaleFactor = 1.3 - (0.25 * t); 
        } 
        else if (move === CameraMovement.PAN_LEFT) {
            scaleFactor = 1.2; 
            transX = (WIDTH * 0.08) - ((WIDTH * 0.16) * t); 
        } 
        else if (move === CameraMovement.PAN_RIGHT) {
            scaleFactor = 1.2;
            transX = -(WIDTH * 0.08) + ((WIDTH * 0.16) * t);
        } 
        else if (move === CameraMovement.ROTATE_CW) {
            scaleFactor = 1.3;
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
      } else {
         // Default scale for editing visibility
         if (move === CameraMovement.PAN_LEFT || move === CameraMovement.PAN_RIGHT) scaleFactor = 1.1;
      }

      ctx.scale(scaleFactor, scaleFactor);
      ctx.rotate(rot);
      ctx.translate(transX, transY);
      ctx.translate(-WIDTH/2, -HEIGHT/2);

      const mainAssetLayer: LayerConfig | null = (scene.mediaType === 'video' && scene.videoUrl) ? {
          id: 'main-bg-video', type: 'video', url: scene.videoUrl, name: 'Background', x:0.5, y:0.5, scale:1, rotation:0, opacity:1
      } : (scene.imageUrl) ? {
          id: 'main-bg-image', type: 'image', url: scene.imageUrl, name: 'Background', x:0.5, y:0.5, scale:1, rotation:0, opacity:1
      } : null;

      const userLayers = scene.layers || (scene.overlay ? [{ ...scene.overlay, id: 'legacy', type: 'image' as const, name: 'Legacy Overlay', rotation:0, opacity: scene.overlay.opacity ?? 1 }] : []);
      const allLayers = mainAssetLayer ? [mainAssetLayer, ...userLayers] : userLayers;

      allLayers.forEach((baseLayer, idx) => {
          const layerStart = baseLayer.startTime || 0;
          const layerEnd = baseLayer.endTime !== undefined ? baseLayer.endTime : (scene.durationEstimate || 5);
          const currentSec = elapsedTimeMs / 1000;
          
          if (currentSec < layerStart || currentSec > layerEnd) return;

          // Check if this layer should be treated as a background (Cover)
          const isMainBg = baseLayer.id === 'main-bg-video' || baseLayer.id === 'main-bg-image' || baseLayer.isBackground;
          
          const layer = getInterpolatedLayer(baseLayer, progress);
          
          // --- ANIMATION IN/OUT LOGIC ---
          // Use specific durations or default to 1.0s if undefined, for compatibility
          const entryDur = baseLayer.entryDuration !== undefined ? baseLayer.entryDuration : (baseLayer.animationDuration || 1.0);
          const exitDur = baseLayer.exitDuration !== undefined ? baseLayer.exitDuration : (baseLayer.animationDuration || 1.0);

          let animProgress = 1; // 1 = fully visible
          let isEntering = false;
          let isExiting = false;

          // Entry Logic
          if (baseLayer.entryEffect && baseLayer.entryEffect !== LayerAnimation.NONE) {
               if (currentSec < layerStart + entryDur) {
                   isEntering = true;
                   animProgress = easeOutCubic((currentSec - layerStart) / entryDur);
               }
          }
          
          // Exit Logic
          if (!isEntering && baseLayer.exitEffect && baseLayer.exitEffect !== LayerAnimation.NONE) {
              if (currentSec > layerEnd - exitDur) {
                  isExiting = true;
                  animProgress = easeOutCubic((layerEnd - currentSec) / exitDur); // 1 -> 0
              }
          }

          const activeEffect = isEntering ? baseLayer.entryEffect : (isExiting ? baseLayer.exitEffect : LayerAnimation.NONE);

          ctx.save();
          
          if (isMainBg) {
               if (layer.type === 'image' && layer.url) {
                   const img = imageCacheRef.current.get(layer.url);
                   if (!img && !imageCacheRef.current.has(layer.url)) {
                       const i = new Image(); i.crossOrigin = "anonymous"; i.src = layer.url; i.onload = () => imageCacheRef.current.set(layer.url!, i);
                   }
                   if (img && img.complete && img.naturalWidth > 0) {
                      const imgRatio = img.width / img.height;
                      const canvasRatio = WIDTH / HEIGHT;
                      let drawW = WIDTH, drawH = HEIGHT, offsetX = 0, offsetY = 0;
                      if (imgRatio > canvasRatio) { drawH = HEIGHT; drawW = HEIGHT * imgRatio; offsetX = (WIDTH - drawW) / 2; } 
                      else { drawW = WIDTH; drawH = WIDTH / imgRatio; offsetY = (HEIGHT - drawH) / 2; }
                      
                      // Background Animation logic (simple fade usually)
                      if (activeEffect === LayerAnimation.FADE) ctx.globalAlpha = layer.opacity * animProgress;
                      else ctx.globalAlpha = layer.opacity;

                      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
                   }
               } else if (layer.type === 'video' && layer.url) {
                   const v = getVideoElement(layer.url);
                   if (isPlaying && v.paused) v.play().catch(e => {});
                   else if (!isPlaying && !v.paused) v.pause();

                   if (v.readyState >= 2) { 
                       const vidRatio = v.videoWidth / v.videoHeight;
                       const canvasRatio = WIDTH / HEIGHT;
                       let drawW = WIDTH, drawH = HEIGHT, offsetX = 0, offsetY = 0;
                       if (vidRatio > canvasRatio) { drawH = HEIGHT; drawW = HEIGHT * vidRatio; offsetX = (WIDTH - drawW) / 2; } 
                       else { drawW = WIDTH; drawH = WIDTH / vidRatio; offsetY = (HEIGHT - drawH) / 2; }
                       
                       if (activeEffect === LayerAnimation.FADE) ctx.globalAlpha = layer.opacity * animProgress;
                       else ctx.globalAlpha = layer.opacity;

                       ctx.drawImage(v, offsetX, offsetY, drawW, drawH);
                   }
               }
          } else {
              const lx = layer.x * WIDTH;
              const ly = layer.y * HEIGHT;
              
              let offsetX = 0;
              let offsetY = 0;
              let scaleX = layer.scale;
              let scaleY = layer.scale;
              let alpha = layer.opacity;
              let typeWriterLimit = 1000; // Text chars

              if (activeEffect !== LayerAnimation.NONE) {
                  const p = animProgress; 
                  // Logic for transition effects
                  
                  switch (activeEffect) {
                      case LayerAnimation.FADE:
                          alpha *= p;
                          break;
                      case LayerAnimation.SCALE:
                          scaleX *= p;
                          scaleY *= p;
                          break;
                      case LayerAnimation.SLIDE_UP:
                           if (isEntering) offsetY += (1 - p) * 200; 
                           else offsetY -= (1 - p) * 200;
                           alpha *= p; // Also fade a bit
                          break;
                      case LayerAnimation.SLIDE_DOWN:
                           if (isEntering) offsetY -= (1 - p) * 200;
                           else offsetY += (1 - p) * 200;
                           alpha *= p;
                          break;
                      case LayerAnimation.SLIDE_LEFT:
                           if (isEntering) offsetX += (1 - p) * 200;
                           else offsetX -= (1 - p) * 200;
                           alpha *= p;
                          break;
                      case LayerAnimation.SLIDE_RIGHT:
                           if (isEntering) offsetX -= (1 - p) * 200;
                           else offsetX += (1 - p) * 200;
                           alpha *= p;
                          break;
                      case LayerAnimation.TYPEWRITER:
                           if (layer.type === 'text' && layer.text) {
                               typeWriterLimit = Math.floor(layer.text.length * p);
                           }
                           break;
                  }
              }

              ctx.translate(lx + offsetX, ly + offsetY);
              ctx.rotate((layer.rotation * Math.PI) / 180);
              ctx.scale(scaleX, scaleY);
              ctx.globalAlpha = alpha;
              ctx.globalCompositeOperation = layer.blendMode || 'source-over';

              if (layer.shadowColor && layer.type !== 'text') {
                  ctx.shadowColor = layer.shadowColor;
                  ctx.shadowBlur = layer.shadowBlur || 0;
                  ctx.shadowOffsetX = layer.shadowOffsetX || 0;
                  ctx.shadowOffsetY = layer.shadowOffsetY || 0;
              }

              if (layer.type === 'text' && layer.text) {
                  const displayText = activeEffect === LayerAnimation.TYPEWRITER ? layer.text.substring(0, typeWriterLimit) : layer.text;

                  ctx.font = `${layer.fontWeight || 'bold'} ${layer.fontSize || 50}px '${layer.fontFamily || 'Inter'}'`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  if (layer.textShadow) {
                       ctx.lineJoin = "round";
                       ctx.lineWidth = 4;
                       ctx.strokeStyle = "black";
                       ctx.strokeText(displayText, 0, 0);
                  }
                  ctx.fillStyle = layer.fontColor || '#ffffff';
                  ctx.fillText(displayText, 0, 0);
              } 
              else if (layer.type === 'image' && layer.url) {
                  const lImg = imageCacheRef.current.get(layer.url);
                  if (!lImg && !imageCacheRef.current.has(layer.url)) {
                      const i = new Image(); i.src = layer.url; i.onload = () => imageCacheRef.current.set(layer.url!, i);
                  }
                  if (lImg && lImg.complete && lImg.naturalWidth > 0) ctx.drawImage(lImg, -lImg.width/2, -lImg.height/2);
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
          }
          ctx.restore();
      });

      ctx.restore(); 

      ctx.filter = 'none';

      if (scene.particleEffect) {
          drawParticles(ctx, scene.particleEffect, WIDTH, HEIGHT, !isPlaying);
      }

      if (globalVfxRef.current) {
          if (globalVfxRef.current.vignetteIntensity > 0) drawVignette(ctx, globalVfxRef.current.vignetteIntensity, WIDTH, HEIGHT);
          if (globalVfxRef.current.filmGrain > 0) drawFilmGrain(ctx, globalVfxRef.current.filmGrain, WIDTH, HEIGHT);
      }

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

      if (showSubtitlesRef.current && scene.text) {
          drawSubtitles(ctx, scene.text, subtitleStyleRef.current, WIDTH, HEIGHT, progress);
      }
  };

  // --- STATIC RENDER EFFECT (REAL-TIME EDIT PREVIEW) ---
  useEffect(() => {
      if (isPlaying) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Ensure dimensions match
      if (canvas.width !== WIDTH || canvas.height !== HEIGHT) {
          canvas.width = WIDTH;
          canvas.height = HEIGHT;
      }

      const activeProgress = scrubProgressRef.current || 0;
      const scene = scenes[currentSceneIndex];

      if (scene) {
          const durationMs = (scene.durationEstimate || 5) * 1000;
          const simulatedElapsed = activeProgress * durationMs;
          
          ctx.clearRect(0, 0, WIDTH, HEIGHT);
          drawScene(ctx, scene, renderScale, activeProgress, false, simulatedElapsed);
      }
  }, [
      isPlaying,
      scenes, // Triggers redraw when any layer property changes in EditSceneModal
      currentSceneIndex,
      scrubProgress,
      renderScale,
      activeFilter,
      globalVfx,
      channelLogo,
      showSubtitles,
      format
  ]);

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
      stopAllSFX();

      if (isPlaying) {
          // If using playlist, playMusicSequence will be called via useEffect dependency or manually
          // If only bgMusicUrl is present, useEffect handles it as a playlist of 1
          playMusicSequence(currentMusicIndexRef.current);
          
          sceneStartTime = performance.now();
          startTimeRef.current = sceneStartTime;
      } else {
          if (speechSourceRef.current) { try{speechSourceRef.current.stop();}catch(e){} speechSourceRef.current = null; }
          if (musicSourceRef.current) { try{musicSourceRef.current.stop();}catch(e){} musicSourceRef.current = null; }
          stopAllSFX();
          hasStartedAudio = false;
          videoCacheRef.current.forEach(v => v.pause());
      }

      // ANIMATION LOOP - ONLY RUNS IF PLAYING
      const render = (time: number) => {
          if (!isPlaying) return; // Exit loop if stopped

          if (analyserRef.current) analyserRef.current.getByteFrequencyData(audioDataArrayRef.current as any);

          ctx.setTransform(1, 0, 0, 1, 0, 0); 
          ctx.filter = 'none';
          ctx.globalAlpha = 1;
          ctx.clearRect(0, 0, WIDTH, HEIGHT);

          const scene = scenesRef.current[currentIdx];
          if (!scene) {
                setIsPlaying(false);
                setIsExporting(false);
                return;
          }

          const audioDur = scene.audioBuffer?.duration;
          const targetDurationSec = scene.durationEstimate > 0 ? scene.durationEstimate : (audioDur || 5);
          
          const durationMs = targetDurationSec * 1000;
          const elapsed = time - sceneStartTime;
          const progress = Math.min(elapsed / durationMs, 1.0);
          const elapsedSec = elapsed / 1000;

          if (onProgress) onProgress(progress);

          if (!hasStartedAudio && scene.audioBuffer) {
                if (scene.audioBuffer instanceof AudioBuffer) {
                    playSpeech(scene.audioBuffer);
                    hasStartedAudio = true;
                }
          }

          if (scene.audioLayers) {
                scene.audioLayers.forEach(layer => {
                    const key = `${layer.id}-${currentIdx}`; 
                    if (!sfxPlayedRef.current.has(key) && elapsedSec >= layer.startTime) {
                        playSFX(layer);
                        sfxPlayedRef.current.add(key);
                    }
                });
          }

          const TRANSITION_DURATION = 1000; 
          const timeRemaining = durationMs - elapsed;
          const nextScene = scenesRef.current[currentIdx + 1];
          
          const activeTransition = scene.transition || globalTransitionRef.current || VideoTransition.NONE; 
          const inTransitionZone = timeRemaining < TRANSITION_DURATION && nextScene && activeTransition !== VideoTransition.NONE;

          if (inTransitionZone) {
                drawScene(ctx, scene, 1, progress, true, elapsed);
                const t = 1 - (timeRemaining / TRANSITION_DURATION); 
                ctx.save();
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
                        ctx.beginPath();
                        ctx.rect(0, 0, WIDTH * t, HEIGHT);
                        ctx.clip();
                }

                drawScene(ctx, nextScene, 1, 0, false, 0);
                ctx.restore();

          } else {
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
                    stopAllSFX(); 
                    particlesRef.current = [];
                } else {
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
      };

      if (isPlaying) {
         rafRef.current = requestAnimationFrame(render);
      }

      return () => {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
      
  }, [isPlaying, currentSceneIndex, renderScale, bgMusicUrl, format, bgMusicPlaylist]); 

  return (
    <div 
        ref={containerRef} 
        onClick={togglePlay}
        className={`relative w-full ${aspectRatioClass} bg-black overflow-hidden group border border-zinc-800 rounded-lg shadow-2xl cursor-pointer`}
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
