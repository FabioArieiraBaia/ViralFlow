import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Scene, VideoFormat, SubtitleStyle, UserTier, VideoFilter, LayerConfig, OverlayConfig, VideoTransition, ParticleEffect, CameraMovement, Keyframe } from '../types';
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
  activeFilter?: VideoFilter;
  globalTransition?: VideoTransition;
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
  activeFilter = VideoFilter.NONE,
  globalTransition = VideoTransition.NONE,
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
  
  // --- PARTICLES REF ---
  const particlesRef = useRef<Particle[]>([]);

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
  const channelLogoRef = useRef(channelLogo);
  
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
  useEffect(() => { channelLogoRef.current = channelLogo; }, [channelLogo]);

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
                  // Fix: Safely await decodeAudioData to handle browser compatibility issues
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
          // Fix: Ensure buffer is a valid AudioBuffer instance before playing
          if (isPlaying && buffer && buffer instanceof AudioBuffer) playMusic(buffer, bgMusicUrl);
      };
      loadMusic();
  }, [bgMusicUrl, isPlaying]);

  const playMusic = (buffer: AudioBuffer, url: string) => {
      // Fix: Defensive check
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
        console.error("Failed to set music buffer", err);
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
      // Fix: Defensive check
      if (!buffer || !(buffer instanceof AudioBuffer)) return;

      const ctx = getAudioContext();
      if (speechSourceRef.current) {
           try { speechSourceRef.current.stop(); } catch(e){}
      }
      speechSourceRef.current = ctx.createBufferSource();
      
      try {
        speechSourceRef.current.buffer = buffer;
      } catch (err) {
        console.error("Failed to set speech buffer", err);
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

        mediaRecorderRef.current = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: highQuality ? 8000000 : 2500000 
        });

        chunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (e) => {
            if(e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            triggerBrowserDownload(blob, `viralflow_video_${Date.now()}.webm`);
            setIsExporting(false);
            setRenderScale(1);
            isRecordingRef.current = false;
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

  const getVideoElement = (url: string): HTMLVideoElement => {
      let v = videoCacheRef.current.get(url);
      if (!v) {
          console.log('[VideoPlayer] Init video element:', url);
          v = document.createElement('video');
          v.src = url;
          v.muted = true;
          v.playsInline = true;
          v.loop = true;
          v.crossOrigin = "anonymous";
          videoCacheRef.current.set(url, v);
          v.load();
      }
      // Ensure it's ready to be drawn
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

      const fontSize = Math.min(width * 0.05, 48);
      ctx.font = `900 ${fontSize}px 'Inter', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom'; // Draw from bottom up to avoid cut off
      
      const words = text.split(' ');
      const lines = [];
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
      // Safe area from bottom (10% of height)
      const startY = height - (height * 0.1) - totalTextHeight;

      lines.forEach((line, index) => {
          const y = startY + (index * lineHeight);
          const x = width / 2;
          
          if (style === SubtitleStyle.MODERN) {
              const bgWidth = ctx.measureText(line).width + 40;
              ctx.fillStyle = 'rgba(0,0,0,0.7)';
              ctx.roundRect(x - bgWidth/2, y - fontSize, bgWidth, fontSize + 10, 10);
              ctx.fill();
              ctx.fillStyle = 'white';
              ctx.fillText(line, x, y);
          } else if (style === SubtitleStyle.NEON) {
              ctx.shadowColor = '#00ffcc';
              ctx.shadowBlur = 10;
              ctx.strokeStyle = 'black';
              ctx.lineWidth = 4;
              ctx.strokeText(line, x, y);
              ctx.fillStyle = 'white';
              ctx.fillText(line, x, y);
              ctx.shadowBlur = 0;
          } else {
               ctx.strokeStyle = 'black';
               ctx.lineWidth = 4;
               ctx.strokeText(line, x, y);
               ctx.fillStyle = 'yellow';
               ctx.fillText(line, x, y);
          }
      });
  };

  const drawScene = (ctx: CanvasRenderingContext2D, scene: Scene, scale: number, progress: number, isPlaying: boolean, elapsedTimeMs: number) => {
      // 1. Background Fill
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // 2. Camera Transform
      ctx.save();
      const move = scene.cameraMovement || CameraMovement.STATIC;
      const t = progress; 
      let scaleFactor = 1;
      let transX = 0;
      let transY = 0;
      let rot = 0;

      if (move === CameraMovement.ZOOM_IN) scaleFactor = 1 + (0.3 * t);
      else if (move === CameraMovement.ZOOM_OUT) scaleFactor = 1.3 - (0.3 * t);
      else if (move === CameraMovement.PAN_LEFT) transX = -50 * t;
      else if (move === CameraMovement.PAN_RIGHT) transX = 50 * t;
      else if (move === CameraMovement.ROTATE_CW) rot = (2 * Math.PI / 180) * t * 5;
      else if (move === CameraMovement.ROTATE_CCW) rot = -(2 * Math.PI / 180) * t * 5;
      else if (move === CameraMovement.HANDHELD) {
          transX = Math.sin(elapsedTimeMs * 0.002) * 5;
          transY = Math.cos(elapsedTimeMs * 0.003) * 5;
          rot = Math.sin(elapsedTimeMs * 0.001) * 0.005;
          scaleFactor = 1.05;
      }

      ctx.translate(WIDTH/2, HEIGHT/2);
      ctx.scale(scaleFactor, scaleFactor);
      ctx.rotate(rot);
      ctx.translate(transX, transY);
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
               // Background Trimming / Looping logic
               // If user wants specific cut for background, assume full length or define logic
               // For now, background just loops naturally.
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
                   // --- TRIMMING LOGIC ---
                   const trimStart = layer.trimStart || 0;
                   const trimEnd = layer.trimEnd || v.duration;
                   const loopDuration = trimEnd - trimStart;

                   if (loopDuration > 0) {
                       // Calculate expected time based on global accumulated time
                       const expectedTime = trimStart + (elapsedTimeMs / 1000) % loopDuration;
                       
                       // Only seek if drift is significant to avoid stutter (0.3s tolerance)
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

      ctx.restore(); // Restore Camera

      // 7. Particles
      if (scene.particleEffect) {
          drawParticles(ctx, scene.particleEffect, WIDTH, HEIGHT);
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
          // Fix: ensure buffer is instance of AudioBuffer
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
              // PLAYBACK
              const scene = scenesRef.current[currentIdx];
              if (!scene) {
                   setIsPlaying(false);
                   setIsExporting(false);
                   return;
              }

              const targetDurationSec = scene.durationEstimate > 0 ? scene.durationEstimate : 5;
              const durationMs = targetDurationSec * 1000;
              const elapsed = time - sceneStartTime;
              const progress = Math.min(elapsed / durationMs, 1.0);

              if (isRecordingRef.current) {
                  const totalProgress = ((currentIdx + progress) / scenesRef.current.length) * 100;
                  setExportProgress(Math.min(Math.round(totalProgress), 99));
              }

              if (!hasStartedAudio && scene.audioBuffer) {
                   // Fix: Defensive check to ensure valid AudioBuffer
                   if (scene.audioBuffer instanceof AudioBuffer) {
                       playSpeech(scene.audioBuffer);
                       hasStartedAudio = true;
                   }
              }

              drawScene(ctx, scene, 1, progress, true, elapsed);

              if (elapsed >= durationMs) {
                  if (currentIdx < scenesRef.current.length - 1) {
                      currentIdx++;
                      setCurrentSceneIndex(currentIdx);
                      sceneStartTime = time;
                      hasStartedAudio = false;
                      particlesRef.current = [];
                  } else {
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
  }, [isPlaying, currentSceneIndex, renderScale, bgMusicUrl, format, activeFilter, globalTransition, showSubtitles, subtitleStyle, channelLogo, userTier, scrubProgress, scenes]);

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