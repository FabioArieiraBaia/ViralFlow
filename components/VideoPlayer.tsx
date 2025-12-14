import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Scene, VideoFormat, SubtitleStyle, UserTier, VideoFilter, LayerConfig, OverlayConfig, VideoTransition, ParticleEffect, CameraMovement, Keyframe, VFXConfig, SubtitleSettings, AudioLayer, LayerAnimation, SpeakerTagStyle } from '../types';
import { Play, Pause, Maximize2, Minimize2 } from 'lucide-react';
import { getAudioContext, base64ToBlobUrl } from '../services/audioUtils';
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
  showSpeakerTags?: boolean;
  speakerTagStyle?: SpeakerTagStyle;
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
  scrubProgress = 0,
  showSpeakerTags = false,
  speakerTagStyle = SpeakerTagStyle.CINEMATIC
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
  const isMusicPlayingRef = useRef<boolean>(false);
  
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

  // Refs for Loop State
  const showSubtitlesRef = useRef(showSubtitles); 
  const subtitleStyleRef = useRef(subtitleStyle);
  const subtitleSettingsRef = useRef(subtitleSettings);
  const channelLogoRef = useRef(channelLogo);
  const activeFilterRef = useRef(activeFilter);
  const globalVfxRef = useRef(globalVfx);
  const globalTransitionRef = useRef(globalTransition);
  const showSpeakerTagsRef = useRef(showSpeakerTags);
  const speakerTagStyleRef = useRef(speakerTagStyle);
  const bgMusicVolumeRef = useRef(bgMusicVolume);
  
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
  useEffect(() => { globalTransitionRef.current = globalTransition; }, [globalTransition]);
  useEffect(() => { showSpeakerTagsRef.current = showSpeakerTags; }, [showSpeakerTags]);
  useEffect(() => { speakerTagStyleRef.current = speakerTagStyle; }, [speakerTagStyle]);
  useEffect(() => { bgMusicVolumeRef.current = bgMusicVolume; }, [bgMusicVolume]);

  // Handle Music Volume Realtime
  useEffect(() => {
      if (musicGainRef.current) {
          const ctx = getAudioContext();
          musicGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
          musicGainRef.current.gain.setTargetAtTime(bgMusicVolume, ctx.currentTime, 0.1);
      }
  }, [bgMusicVolume]);

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
      };
      loadPlaylist();
  }, [bgMusicPlaylist, bgMusicUrl]);

  // Stop Music Helper
  const stopMusic = (fadeOutDuration = 0.5) => {
      const ctx = getAudioContext();
      if (musicGainRef.current) {
          musicGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
          musicGainRef.current.gain.setValueAtTime(musicGainRef.current.gain.value, ctx.currentTime);
          musicGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeOutDuration);
      }
      setTimeout(() => {
          if (musicSourceRef.current) {
              try { musicSourceRef.current.stop(); } catch(e){}
              musicSourceRef.current = null;
          }
          isMusicPlayingRef.current = false;
      }, fadeOutDuration * 1000);
  };

  const playMusicSequence = (index: number) => {
      const playlist = effectivePlaylistRef.current;
      if (playlist.length === 0) return;

      const safeIndex = index % playlist.length;
      currentMusicIndexRef.current = safeIndex;
      const url = playlist[safeIndex];
      const buffer = musicBufferCacheRef.current.get(url);

      if (!buffer) return;

      const ctx = getAudioContext();
      
      // Stop previous if exists (hard stop if switching tracks quickly)
      if (musicSourceRef.current) {
           try { musicSourceRef.current.stop(); } catch(e){}
      }

      musicSourceRef.current = ctx.createBufferSource();
      musicSourceRef.current.buffer = buffer;
      
      // Setup loop or sequence
      if (playlist.length === 1) {
          musicSourceRef.current.loop = true;
      } else {
          musicSourceRef.current.loop = false;
          musicSourceRef.current.onended = () => {
              if (isMusicPlayingRef.current) {
                  playMusicSequence(currentMusicIndexRef.current + 1);
              }
          };
      }
      
      // Create Gain if not exists
      if (!musicGainRef.current) {
          musicGainRef.current = ctx.createGain();
          musicGainRef.current.connect(masterGainRef.current!);
      }
      
      musicSourceRef.current.connect(musicGainRef.current);
      
      // Smooth fade in
      musicGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
      musicGainRef.current.gain.setValueAtTime(0, ctx.currentTime);
      musicGainRef.current.gain.linearRampToValueAtTime(bgMusicVolumeRef.current, ctx.currentTime + 1.0);
      
      musicSourceRef.current.start(0);
      isMusicPlayingRef.current = true;
  };

  const playSpeech = (buffer: AudioBuffer) => {
      if (!buffer || !(buffer instanceof AudioBuffer)) return;
      const ctx = getAudioContext();
      if (speechSourceRef.current) {
           try { speechSourceRef.current.stop(); } catch(e){}
      }
      speechSourceRef.current = ctx.createBufferSource();
      speechSourceRef.current.buffer = buffer;
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
      source.onended = () => { sfxSourcesRef.current.delete(key); };
  };

  const stopAllSFX = () => {
      sfxSourcesRef.current.forEach(src => { try { src.stop(); } catch(e){} });
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
        
        // Restart music from beginning
        stopMusic(0);
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
             if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
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
            const blob = new Blob(chunksRef.current, { type: recordingMimeTypeRef.current });
            triggerBrowserDownload(blob, `viralflow_video_${Date.now()}.webm`);
            setIsExporting(false);
            setRenderScale(1);
            isRecordingRef.current = false;
            stopMusic(1.0); // Fade out music
        };

        mediaRecorderRef.current.start();
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

  const drawSpeakerTag = (ctx: CanvasRenderingContext2D, text: string, style: SpeakerTagStyle, width: number, height: number) => {
      if (!text) return;
      const isPortrait = width < height;
      const baseFontSize = isPortrait ? width * 0.045 : width * 0.025;
      const paddingX = baseFontSize * 1.5;
      const paddingY = baseFontSize * 0.8;
      const margin = width * 0.05;
      const xRight = width - margin;
      const yTop = margin;

      ctx.font = `bold ${baseFontSize}px 'Inter', sans-serif`;
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      const boxWidth = textWidth + (paddingX * 2);
      const boxHeight = baseFontSize + (paddingY * 2);
      const x = xRight - boxWidth;
      const y = yTop;

      ctx.save();
      switch(style) {
          case SpeakerTagStyle.CINEMATIC:
              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
              ctx.fillRect(x, y, boxWidth, boxHeight);
              ctx.fillStyle = '#facc15'; 
              ctx.fillRect(x, y, 4, boxHeight);
              ctx.fillStyle = 'white';
              ctx.textBaseline = 'middle';
              ctx.textAlign = 'center';
              ctx.font = `bold ${baseFontSize}px 'Oswald', sans-serif`;
              ctx.fillText(text.toUpperCase(), x + (boxWidth / 2), y + (boxHeight / 2));
              break;
          case SpeakerTagStyle.BOXED:
              ctx.fillStyle = '#4f46e5'; 
              if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, boxWidth, boxHeight, 8); ctx.fill(); } else { ctx.fillRect(x, y, boxWidth, boxHeight); }
              ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 10;
              ctx.fillStyle = 'white';
              ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
              ctx.fillText(text, x + (boxWidth / 2), y + (boxHeight / 2));
              break;
          case SpeakerTagStyle.NEON:
              ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 15; ctx.strokeStyle = '#00ffcc'; ctx.lineWidth = 2;
              ctx.strokeRect(x, y, boxWidth, boxHeight);
              ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.shadowBlur = 0;
              ctx.fillRect(x, y, boxWidth, boxHeight);
              ctx.fillStyle = '#00ffcc'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
              ctx.fillText(text, x + (boxWidth / 2), y + (boxHeight / 2));
              break;
          case SpeakerTagStyle.BUBBLE:
              ctx.fillStyle = 'white';
              if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, boxWidth, boxHeight, 20); ctx.fill(); } else { ctx.fillRect(x, y, boxWidth, boxHeight); }
              ctx.beginPath(); ctx.moveTo(x + 20, y + boxHeight); ctx.lineTo(x + 10, y + boxHeight + 10); ctx.lineTo(x + 35, y + boxHeight); ctx.fill();
              ctx.fillStyle = 'black'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
              ctx.font = `bold ${baseFontSize}px 'Comic Neue', sans-serif`;
              ctx.fillText(text, x + (boxWidth / 2), y + (boxHeight / 2));
              break;
          case SpeakerTagStyle.TV_NEWS:
              const barHeight = boxHeight * 0.8;
              ctx.fillStyle = '#18181b'; ctx.transform(1, 0, -0.2, 1, 0, 0); ctx.fillRect(x, y, boxWidth, barHeight);
              ctx.fillStyle = '#ef4444'; ctx.fillRect(x, y + barHeight, boxWidth, 4);
              ctx.transform(1, 0, 0.2, 1, 0, 0); 
              ctx.fillStyle = 'white'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
              ctx.fillText(text.toUpperCase(), x + (boxWidth / 2) - (boxWidth * 0.05), y + (barHeight / 2));
              break;
      }
      ctx.restore();
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
            if (Math.random() < 0.5) buffer[i] = 0xff000000 | (Math.random() * 255); else buffer[i] = 0x00000000;
        }
        gCtx.putImageData(idata, 0, 0);
    }
    ctx.save(); ctx.globalAlpha = intensity; ctx.globalCompositeOperation = 'overlay';
    const pattern = ctx.createPattern(grainCanvasRef.current, 'repeat');
    if (pattern) { ctx.fillStyle = pattern; ctx.fillRect(0, 0, width, height); }
    ctx.restore();
  };

  const drawVignette = (ctx: CanvasRenderingContext2D, intensity: number, width: number, height: number) => {
      if (intensity <= 0) return;
      ctx.save();
      const gradient = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.8);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, `rgba(0,0,0,${Math.min(intensity, 0.9)})`);
      ctx.fillStyle = gradient; ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(0, 0, width, height); ctx.restore();
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
            x: Math.random() * width, y: typeObj.speed > 0 ? -10 : height + 10,
            vx: (Math.random() - 0.5) * 2, vy: typeObj.speed * (Math.random() * 0.5 + 0.8),
            size: typeObj.size * (Math.random() * 0.5 + 0.5), color: typeObj.color,
            alpha: 1, life: 100, decay: 0.5, type: effect, emoji: typeObj.emoji
        });
    }
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        if (!isStatic) { p.x += p.vx; p.y += p.vy; p.life -= p.decay; }
        if (p.y > height + 20 || p.y < -20 || p.life <= 0) { if (!isStatic) particlesRef.current.splice(i, 1); continue; }
        ctx.globalAlpha = p.alpha * (p.life / 100);
        if (p.emoji) { ctx.font = `${p.size}px Arial`; ctx.fillText(p.emoji, p.x, p.y); } 
        else if (p.type === ParticleEffect.RAIN) { ctx.strokeStyle = p.color; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx, p.y + p.vy * 4); ctx.stroke(); } 
        else { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  };

  const drawSubtitles = (ctx: CanvasRenderingContext2D, text: string, style: SubtitleStyle, width: number, height: number, progress: number) => {
      if (!text || style === SubtitleStyle.NONE) return;
      const settings = subtitleSettingsRef.current || { fontSizeMultiplier: 1.0, yPosition: 0.85, fontFamily: 'Inter' };
      const fontSizeMultiplier = settings.fontSizeMultiplier;
      const userFontFamily = settings.fontFamily || 'Inter';
      const isPortrait = width < height;
      const baseFontSize = isPortrait ? width * 0.065 : width * 0.04;
      const fontSize = Math.max(24, Math.min(baseFontSize * fontSizeMultiplier, 120));
      const fontWeight = '800'; 
      ctx.font = `${fontWeight} ${fontSize}px '${userFontFamily}', sans-serif`;
      
      const allWords = text.trim().split(/\s+/);
      const totalWords = allWords.length;
      const currentWordIdx = Math.min(Math.floor(progress * totalWords), totalWords - 1);
      const WORDS_PER_BATCH = isPortrait ? 5 : 9; 
      const batchIndex = Math.floor(currentWordIdx / WORDS_PER_BATCH);
      const startWord = batchIndex * WORDS_PER_BATCH;
      const endWord = Math.min((batchIndex + 1) * WORDS_PER_BATCH, totalWords);
      const visibleWords = allWords.slice(startWord, endWord);
      const visibleText = visibleWords.join(' ');
      const highlightIndex = currentWordIdx - startWord;

      const lines: string[] = [];
      const maxLineWidth = width * 0.85;
      const batchWords = visibleText.split(' ');
      let tempLine = batchWords[0];
      for (let i = 1; i < batchWords.length; i++) {
          const w = ctx.measureText(tempLine + " " + batchWords[i]).width;
          if (w < maxLineWidth) { tempLine += " " + batchWords[i]; } else { lines.push(tempLine); tempLine = batchWords[i]; }
      }
      lines.push(tempLine);

      const lineHeight = fontSize * 1.4;
      const totalBlockHeight = lines.length * lineHeight;
      const yBottomAnchor = height * settings.yPosition; 
      const startY = yBottomAnchor - totalBlockHeight;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';

      lines.forEach((line, lineIndex) => {
          const y = startY + (lineIndex * lineHeight);
          const x = width / 2;
          if (style === SubtitleStyle.WORD_BY_WORD) {
              const bigWord = allWords[currentWordIdx] || "";
              const bigFontSize = fontSize * 2.5;
              ctx.font = `900 ${bigFontSize}px '${userFontFamily}', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
              ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 20; ctx.lineWidth = 8; ctx.strokeStyle = 'black'; ctx.strokeText(bigWord, width/2, height/2); ctx.shadowBlur = 0;
              const gradient = ctx.createLinearGradient(0, height/2 - bigFontSize, 0, height/2 + bigFontSize);
              gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(1, '#facc15'); ctx.fillStyle = gradient; ctx.fillText(bigWord, width/2, height/2);
              ctx.font = `${fontWeight} ${fontSize}px '${userFontFamily}', sans-serif`; return; 
          }
          if (style === SubtitleStyle.MODERN) {
              const metrics = ctx.measureText(line); const bgW = metrics.width + 40; const bgH = fontSize + 16;
              ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'; if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x - bgW/2, y - 8, bgW, bgH, 12); ctx.fill(); } else { ctx.fillRect(x - bgW/2, y - 8, bgW, bgH); }
              ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4; ctx.fillStyle = '#ffffff'; ctx.fillText(line, x, y); ctx.shadowBlur = 0;
          } 
          else if (style === SubtitleStyle.CLASSIC) {
              ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 4; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
              ctx.strokeStyle = 'black'; ctx.lineWidth = fontSize * 0.1; ctx.strokeText(line, x, y);
              ctx.fillStyle = '#ffffff'; ctx.fillText(line, x, y); ctx.shadowColor = 'transparent'; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
          }
          else if (style === SubtitleStyle.NEON) {
              ctx.strokeStyle = '#00ffcc'; ctx.lineWidth = 3; ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 20; ctx.strokeText(line, x, y); ctx.shadowBlur = 10; ctx.strokeText(line, x, y); ctx.fillStyle = '#ffffff'; ctx.fillText(line, x, y); ctx.shadowBlur = 0;
          }
          else if (style === SubtitleStyle.GLITCH) {
              const offset = Math.random() * 4; ctx.fillStyle = 'cyan'; ctx.fillText(line, x - offset, y); ctx.fillStyle = 'magenta'; ctx.fillText(line, x + offset, y); ctx.fillStyle = '#ffffff'; ctx.fillText(line, x, y);
          }
          else if (style === SubtitleStyle.KARAOKE) {
              const wordsInLine = line.split(' '); let totalLineWidth = 0;
              const wWidths = wordsInLine.map(w => { const wm = ctx.measureText(w + " ").width; totalLineWidth += wm; return wm; });
              let currentX = x - (totalLineWidth / 2);
              let wordsPriorInBatch = 0; for(let k=0; k<lineIndex; k++) { wordsPriorInBatch += lines[k].split(' ').length; }
              wordsInLine.forEach((w, wIdx) => {
                  const isPlayed = (wordsPriorInBatch + wIdx) <= highlightIndex;
                  ctx.fillStyle = isPlayed ? '#facc15' : 'rgba(255, 255, 255, 0.7)'; ctx.strokeStyle = 'black'; ctx.lineWidth = fontSize * 0.15; ctx.lineJoin = 'round';
                  ctx.strokeText(w, currentX + (wWidths[wIdx]/2), y); ctx.fillText(w, currentX + (wWidths[wIdx]/2), y);
                  currentX += wWidths[wIdx];
              });
          }
          else if (style === SubtitleStyle.COMIC) {
              ctx.strokeStyle = 'black'; ctx.lineWidth = fontSize * 0.15; ctx.lineJoin = 'round'; ctx.strokeText(line, x, y); ctx.fillStyle = '#fde047'; ctx.fillText(line, x, y);
          }
      });
  };

  const drawScene = useCallback((
      ctx: CanvasRenderingContext2D, 
      scene: Scene, 
      scale: number, 
      progress: number, 
      isTransitioning: boolean, 
      elapsedTimeMs: number
  ) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      
      // Clear
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);

      // 1. Determine Background Source (Main Scene Asset OR Temporal Layer)
      // Checks if there's an active layer marked as 'isBackground' for the current time
      let bgUrl: string | undefined = scene.imageUrl || scene.videoUrl;
      let bgType = scene.mediaType;
      let bgIsVideo = scene.mediaType === 'video';
      
      // Try to get URL from base64 if URL is missing
      if (!bgUrl) {
          if (scene.imageBase64) {
              const mimeType = scene.imageBase64.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
              bgUrl = base64ToBlobUrl(scene.imageBase64, mimeType);
              bgType = 'image';
              bgIsVideo = false;
          } else if (scene.videoBase64) {
              bgUrl = base64ToBlobUrl(scene.videoBase64, 'video/mp4');
              bgType = 'video';
              bgIsVideo = true;
          }
      }
      
      // Check for active layer in timeline
      // CRITICAL FIX: Sort background layers by startTime and find the one that should be active
      if (scene.layers && scene.layers.length > 0) {
          const currentSec = elapsedTimeMs / 1000;
          
          // Get all background layers sorted by startTime
          const bgLayers = scene.layers
              .filter(l => l.isBackground)
              .sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0));
          
          if (bgLayers.length > 0) {
              // Find the active layer: the last one whose startTime <= currentSec
              // This ensures we show the correct image based on timeline position
              let activeLayer = bgLayers[0]; // Default to first
              
              for (let i = bgLayers.length - 1; i >= 0; i--) {
                  const layer = bgLayers[i];
                  const layerStart = layer.startTime ?? 0;
                  if (layerStart <= currentSec) {
                      activeLayer = layer;
                      break;
                  }
              }
              
              if (activeLayer) {
                  // Use URL if available, otherwise use base64
                  if (activeLayer.url) {
                      bgUrl = activeLayer.url;
                  } else if (activeLayer.base64) {
                      // Convert base64 to blob URL for rendering
                      const mimeType = activeLayer.type === 'video' ? 'video/mp4' : 
                                       (activeLayer.base64.startsWith('/9j/') ? 'image/jpeg' : 'image/png');
                      bgUrl = base64ToBlobUrl(activeLayer.base64, mimeType);
                  }
                  if (bgUrl) {
                      bgType = activeLayer.type as 'image' | 'video';
                      bgIsVideo = activeLayer.type === 'video';
                  }
              }
          }
      }

      // Draw Background
      let mediaDrawn = false;
      
      // Video (Main or Layer)
      if (bgIsVideo && bgUrl) {
          const vid = getVideoElement(bgUrl);
          if (vid && vid.readyState >= 2) {
              if (vid.paused && isPlaying) vid.play().catch(() => {});
              
              // Draw video with object-cover logic
              const vRatio = vid.videoWidth / vid.videoHeight;
              const cRatio = width / height;
              let sWidth, sHeight, sx, sy;
              
              if (vRatio > cRatio) {
                  sHeight = vid.videoHeight;
                  sWidth = sHeight * cRatio;
                  sy = 0;
                  sx = (vid.videoWidth - sWidth) / 2;
              } else {
                  sWidth = vid.videoWidth;
                  sHeight = sWidth / cRatio;
                  sx = 0;
                  sy = (vid.videoHeight - sHeight) / 2;
              }
              
              ctx.drawImage(vid, sx, sy, sWidth, sHeight, 0, 0, width, height);
              mediaDrawn = true;
          }
      } 
      // Image (Main or Layer)
      else if (bgUrl) {
           let img = imageCacheRef.current.get(bgUrl);
           if (!img) {
               img = new Image();
               img.src = bgUrl;
               img.crossOrigin = "anonymous";
               imageCacheRef.current.set(bgUrl, img);
           }
           
           if (img.complete && img.naturalWidth > 0) {
               ctx.save();
               
               // Camera Movement (Ken Burns)
               const moveType = scene.cameraMovement || CameraMovement.STATIC;
               let scaleFactor = 1.0;
               let translateX = 0;
               let translateY = 0;
               
               // Easing for smooth movement
               const t = progress; 
               
               if (moveType === CameraMovement.ZOOM_IN) {
                   scaleFactor = 1.0 + (0.15 * t);
               } else if (moveType === CameraMovement.ZOOM_OUT) {
                   scaleFactor = 1.15 - (0.15 * t);
               } else if (moveType === CameraMovement.PAN_LEFT) {
                   scaleFactor = 1.1;
                   translateX = - (width * 0.05 * t);
               } else if (moveType === CameraMovement.PAN_RIGHT) {
                   scaleFactor = 1.1;
                   translateX = (width * 0.05 * t);
               } else if (moveType === CameraMovement.ROTATE_CW) {
                    scaleFactor = 1.1;
                    ctx.rotate((0.5 * t * Math.PI) / 180);
               } else if (moveType === CameraMovement.HANDHELD) {
                    scaleFactor = 1.05;
                    const shakeX = Math.sin(t * 10) * 5;
                    const shakeY = Math.cos(t * 12) * 5;
                    translateX = shakeX;
                    translateY = shakeY;
               }

               ctx.translate(width/2, height/2);
               ctx.scale(scaleFactor, scaleFactor);
               ctx.translate(-width/2 + translateX, -height/2 + translateY);

               // Draw Image Cover
               const iRatio = img.naturalWidth / img.naturalHeight;
               const cRatio = width / height;
               let dWidth, dHeight;
               if (iRatio > cRatio) {
                   dHeight = height;
                   dWidth = height * iRatio;
               } else {
                   dWidth = width;
                   dHeight = width / iRatio;
               }
               
               const dx = (width - dWidth)/2;
               const dy = (height - dHeight)/2;
               
               ctx.drawImage(img, dx, dy, dWidth, dHeight);
               ctx.restore();
               mediaDrawn = true;
           }
      }

      // Filter
      const activeFilter = activeFilterRef.current || VideoFilter.NONE;
      if (activeFilter !== VideoFilter.NONE) {
          const filterStr = getCanvasFilter(activeFilter);
          ctx.save();
          ctx.filter = filterStr;
          ctx.globalCompositeOperation = 'copy';
          ctx.drawImage(ctx.canvas, 0, 0);
          ctx.restore();
      }

      // Layers (Interpolated)
      if (scene.layers) {
          scene.layers.forEach(layer => {
              if (layer.isBackground) return; // Skip bg layers as they are handled above
              
              const layerStart = layer.startTime || 0;
              const layerEnd = layer.endTime || 9999;
              const currentSec = elapsedTimeMs / 1000;
              
              if (currentSec >= layerStart && currentSec <= layerEnd) {
                  ctx.save();
                  const l = getInterpolatedLayer(layer, progress);
                  
                  ctx.globalAlpha = l.opacity;
                  const lx = l.x * width;
                  const ly = l.y * height;
                  
                  ctx.translate(lx, ly);
                  ctx.rotate((l.rotation * Math.PI) / 180);
                  ctx.scale(l.scale, l.scale);
                  
                  if (l.type === 'text' && l.text) {
                      ctx.font = `${l.fontWeight || 'bold'} ${l.fontSize}px ${l.fontFamily || 'Inter'}`;
                      ctx.fillStyle = l.fontColor || 'white';
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      if (l.textShadow) {
                          ctx.shadowColor = 'black';
                          ctx.shadowBlur = 4;
                          ctx.lineWidth = 3;
                          ctx.strokeText(l.text, 0, 0);
                      }
                      ctx.fillText(l.text, 0, 0);
                  } else if (l.url || l.base64) {
                       // CRITICAL FIX: Use base64 if URL is not available or expired
                       let layerUrl = l.url;
                       if (!layerUrl && l.base64) {
                           const mimeType = l.type === 'video' ? 'video/mp4' : 'image/png';
                           layerUrl = base64ToBlobUrl(l.base64, mimeType);
                       }
                       
                       if (layerUrl) {
                           let layImg = imageCacheRef.current.get(layerUrl);
                           if (!layImg && l.type === 'image') {
                               layImg = new Image();
                               layImg.src = layerUrl;
                               imageCacheRef.current.set(layerUrl, layImg);
                           }
                           
                           if (l.type === 'video') {
                               const v = getVideoElement(layerUrl);
                               if (v.readyState >= 2) {
                                   if (v.paused && isPlaying) v.play();
                                   const asp = v.videoWidth / v.videoHeight;
                                   const baseW = width * 0.3; // arbitrary base size
                                   const baseH = baseW / asp;
                                   ctx.drawImage(v, -baseW/2, -baseH/2, baseW, baseH);
                               }
                           } else if (layImg && layImg.complete) {
                               const asp = layImg.naturalWidth / layImg.naturalHeight;
                               const baseW = width * 0.3; 
                               const baseH = baseW / asp;
                               ctx.drawImage(layImg, -baseW/2, -baseH/2, baseW, baseH);
                           }
                       }
                  }
                  ctx.restore();
              }
          });
      }

      // Global VFX
      const gVfx = globalVfxRef.current;
      if (gVfx) {
          if (gVfx.filmGrain > 0) drawFilmGrain(ctx, gVfx.filmGrain, width, height);
          if (gVfx.vignetteIntensity > 0) drawVignette(ctx, gVfx.vignetteIntensity, width, height);
      }
      
      // Particles
      if (scene.particleEffect) {
          drawParticles(ctx, scene.particleEffect, width, height, !isPlaying);
      }

      // Speaker Tag
      if (showSpeakerTagsRef.current && scene.speaker) {
           drawSpeakerTag(ctx, scene.speaker, speakerTagStyleRef.current || SpeakerTagStyle.CINEMATIC, width, height);
      }

      // Subtitles
      if (showSubtitlesRef.current) {
          drawSubtitles(ctx, scene.text, subtitleStyleRef.current || SubtitleStyle.MODERN, width, height, progress);
      }

      // Channel Logo
      const logo = channelLogoRef.current;
      if (logo && logo.url) {
          ctx.save();
          let lImg = imageCacheRef.current.get(logo.url);
          if (!lImg) {
              lImg = new Image();
              lImg.src = logo.url;
              imageCacheRef.current.set(logo.url, lImg);
          }
          if (lImg.complete) {
              const lx = logo.x * width;
              const ly = logo.y * height;
              const ls = logo.scale * (width * 0.15); 
              const asp = lImg.naturalWidth / lImg.naturalHeight;
              
              ctx.globalAlpha = logo.opacity ?? 1;
              ctx.translate(lx, ly);
              ctx.drawImage(lImg, -ls/2, -ls/ (2*asp), ls, ls/asp);
          }
          ctx.restore();
      }

  }, [isPlaying]);

  // --- MAIN RENDER LOOP ---
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = WIDTH;
      canvas.height = HEIGHT;

      // Reset state for new playback
      let sceneStartTime = performance.now();
      let currentIdx = currentSceneIndex;
      let hasStartedAudio = false; 
      // Track the ID of the scene we've started audio for, to prevent repeats if index jumps around
      let lastAudioSceneId: string | null = null; 

      particlesRef.current = [];
      stopAllSFX();

      if (isPlaying) {
          if (!isMusicPlayingRef.current) playMusicSequence(currentMusicIndexRef.current);
          sceneStartTime = performance.now();
          startTimeRef.current = sceneStartTime;
      } else {
          stopMusic(0.1);
          if (speechSourceRef.current) { try{speechSourceRef.current.stop();}catch(e){} speechSourceRef.current = null; }
          stopAllSFX();
          hasStartedAudio = false;
          videoCacheRef.current.forEach(v => v.pause());
          // Render a static frame of current scene
          const scene = scenesRef.current[currentSceneIndex];
          if (scene) {
             const durationMs = (scene.durationEstimate || 5) * 1000;
             const scrubTime = (scrubProgress || 0) * durationMs;
             drawScene(ctx, scene, renderScale, scrubProgress || 0, false, scrubTime);
          }
          return;
      }

      const render = (time: number) => {
          if (!isPlaying) return;

          if (analyserRef.current) analyserRef.current.getByteFrequencyData(audioDataArrayRef.current as any);

          ctx.setTransform(1, 0, 0, 1, 0, 0); 
          ctx.filter = 'none';
          ctx.globalAlpha = 1;
          ctx.clearRect(0, 0, WIDTH, HEIGHT);

          const scene = scenesRef.current[currentIdx];
          
          if (!scene) {
                // End of video
                if (isRecordingRef.current && mediaRecorderRef.current?.state === 'recording') {
                    mediaRecorderRef.current.stop();
                }
                setIsPlaying(false);
                if (onPlaybackComplete) onPlaybackComplete();
                return;
          }

          // DURATION CALCULATION: Priority to audio buffer
          const audioDur = scene.audioBuffer?.duration;
          // IMPORTANT: If audio exists, use its duration exactly. If not, use estimate.
          // Add small padding (0.1s) just to avoid cutting the very last millisecond of audio reverb.
          const targetDurationSec = audioDur ? audioDur : (scene.durationEstimate || 5);
          
          const durationMs = targetDurationSec * 1000;
          const elapsed = time - sceneStartTime;
          
          // Clamp progress to 1.0 to prevent overshooting visual
          const progress = Math.min(elapsed / durationMs, 1.0);
          const elapsedSec = elapsed / 1000;

          if (onProgress) onProgress(progress);

          // Audio Trigger Logic
          if (scene.id !== lastAudioSceneId && scene.audioBuffer) {
                if (scene.audioBuffer instanceof AudioBuffer) {
                    playSpeech(scene.audioBuffer);
                    lastAudioSceneId = scene.id;
                }
          }

          // SFX Trigger Logic
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
                // Transition Drawing Logic...
                if (activeTransition === VideoTransition.FADE) { ctx.globalAlpha = t; } 
                else if (activeTransition === VideoTransition.SLIDE) { const offset = WIDTH * (1 - t); ctx.translate(offset, 0); } 
                else if (activeTransition === VideoTransition.ZOOM) { const scale = 0.5 + (0.5 * t); ctx.translate(WIDTH/2, HEIGHT/2); ctx.scale(scale, scale); ctx.translate(-WIDTH/2, -HEIGHT/2); ctx.globalAlpha = t; } 
                else if (activeTransition === VideoTransition.WIPE) { ctx.beginPath(); ctx.rect(0, 0, WIDTH * t, HEIGHT); ctx.clip(); }

                drawScene(ctx, nextScene, 1, 0, false, 0);
                ctx.restore();
          } else {
                drawScene(ctx, scene, 1, progress, true, elapsed);
          }

          if (isRecordingRef.current) {
                const totalProgress = ((currentIdx + progress) / scenesRef.current.length) * 100;
                setExportProgress(Math.min(Math.round(totalProgress), 99));
          }

          // SCENE SWITCH LOGIC
          if (elapsed >= durationMs) {
                if (currentIdx < scenesRef.current.length - 1) {
                    currentIdx++;
                    setCurrentSceneIndex(currentIdx);
                    // Reset time base for next scene
                    sceneStartTime = time; 
                    stopAllSFX(); 
                    particlesRef.current = [];
                    // Ensure the audio trigger resets for the new scene ID
                    // lastAudioSceneId will be updated in next frame
                } else {
                    // Fully complete
                    if (isRecordingRef.current && mediaRecorderRef.current?.state === 'recording') {
                        mediaRecorderRef.current.stop();
                    }
                    setIsPlaying(false);
                    if (onPlaybackComplete) onPlaybackComplete();
                    return; // Stop RAF
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
      
  }, [isPlaying, currentSceneIndex, renderScale, bgMusicUrl, format, bgMusicPlaylist, scenes, scrubProgress]); 

  // --- RENDER COMPONENT ---
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