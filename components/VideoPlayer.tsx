
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Scene, VideoFormat, SubtitleStyle, UserTier, VideoFilter, ParticleEffect, MusicAction } from '../types';
import { Play, Pause, SkipBack, SkipForward, Circle } from 'lucide-react';
import { getAudioContext } from '../services/audioUtils';
import { triggerBrowserDownload } from '../services/fileSystem';

interface VideoPlayerProps {
  scenes: Scene[];
  currentSceneIndex: number;
  setCurrentSceneIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  format: VideoFormat;
  bgMusicUrl?: string; // Global fallback
  bgMusicVolume: number;
  showSubtitles: boolean;
  subtitleStyle: SubtitleStyle;
  activeFilter?: VideoFilter;
  userTier: UserTier;
  onPlaybackComplete?: () => void;
}

export interface VideoPlayerRef {
  startRecording: () => void;
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
  userTier,
  onPlaybackComplete
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Hidden video element for Pexels playback
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // --- AUDIO GRAPH REFS ---
  const masterGainRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const destNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  
  const speechSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  // Music System
  const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const currentMusicUrlRef = useRef<string | null>(null);
  const musicBufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map()); // Cache loaded tracks
  
  // Data Refs
  const musicBufferRef = useRef<AudioBuffer | null>(null);
  
  // Dimensions
  const WIDTH = format === VideoFormat.PORTRAIT ? 720 : 1280;
  const HEIGHT = format === VideoFormat.PORTRAIT ? 1280 : 720;

  // Refs for Loop State (Avoids Stale Closures)
  const scenesRef = useRef<Scene[]>(scenes);
  const showSubtitlesRef = useRef(showSubtitles); 
  const subtitleStyleRef = useRef(subtitleStyle);
  const activeFilterRef = useRef(activeFilter);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const noisePatternRef = useRef<HTMLCanvasElement | null>(null); // Cache for noise
  const particlesRef = useRef<Particle[]>([]); // Particle System State
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const moveParamsRef = useRef<{x: number, y: number, scale: number, direction: number}[]>([]);

  // --- PARTICLE SYSTEM UTILS ---
  const initParticles = (effect: ParticleEffect, width: number, height: number) => {
      const particles: Particle[] = [];
      let count = 0;
      
      if (effect === ParticleEffect.SNOW) count = 100;
      if (effect === ParticleEffect.RAIN) count = 150;
      if (effect === ParticleEffect.EMBERS) count = 60;
      if (effect === ParticleEffect.CONFETTI) count = 50;
      if (effect === ParticleEffect.DUST) count = 80;

      for (let i = 0; i < count; i++) {
          particles.push(createParticle(effect, width, height, true));
      }
      particlesRef.current = particles;
  };

  const createParticle = (effect: ParticleEffect, width: number, height: number, randomY: boolean = false): Particle => {
      const x = Math.random() * width;
      const y = randomY ? Math.random() * height : (effect === ParticleEffect.EMBERS ? height + 10 : -10);
      
      let vx = 0, vy = 0, size = 0, color = '', life = 100, maxLife = 100;

      if (effect === ParticleEffect.SNOW) {
          vx = (Math.random() - 0.5) * 1;
          vy = 1 + Math.random() * 2;
          size = 2 + Math.random() * 3;
          color = 'rgba(255, 255, 255, 0.8)';
      } else if (effect === ParticleEffect.RAIN) {
          vx = (Math.random() - 0.5) * 0.5;
          vy = 15 + Math.random() * 10;
          size = 1; // Thickness
          color = 'rgba(150, 180, 255, 0.6)';
      } else if (effect === ParticleEffect.EMBERS) {
          vx = (Math.random() - 0.5) * 2;
          vy = -1 - Math.random() * 3;
          size = 2 + Math.random() * 4;
          color = `rgba(255, ${Math.floor(Math.random() * 100)}, 0, ${0.5 + Math.random()*0.5})`;
          life = 60 + Math.random() * 60;
          maxLife = life;
      } else if (effect === ParticleEffect.CONFETTI) {
          vx = (Math.random() - 0.5) * 4;
          vy = 2 + Math.random() * 4;
          size = 5 + Math.random() * 5;
          const colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f'];
          color = colors[Math.floor(Math.random() * colors.length)];
      } else if (effect === ParticleEffect.DUST) {
          vx = (Math.random() - 0.5) * 0.5;
          vy = (Math.random() - 0.5) * 0.5;
          size = 1 + Math.random() * 2;
          color = 'rgba(255, 255, 255, 0.3)';
      }

      return { x, y, vx, vy, size, color, life, maxLife };
  };

  const updateAndDrawParticles = (ctx: CanvasRenderingContext2D, width: number, height: number, effect: ParticleEffect) => {
      if (effect === ParticleEffect.NONE) return;

      if (particlesRef.current.length === 0) initParticles(effect, width, height);

      particlesRef.current.forEach((p, index) => {
          // Update
          p.x += p.vx;
          p.y += p.vy;
          
          if (effect === ParticleEffect.EMBERS || effect === ParticleEffect.SNOW || effect === ParticleEffect.DUST) {
              p.x += Math.sin(p.y * 0.01) * 0.5; // Wiggle
          }

          p.life--;

          // Reset if OOB or Dead
          const isDead = p.life <= 0;
          const isOOB = (p.y > height + 20 && p.vy > 0) || (p.y < -20 && p.vy < 0);

          if (isDead || isOOB) {
              particlesRef.current[index] = createParticle(effect, width, height);
          }

          // Draw
          ctx.fillStyle = p.color;
          ctx.beginPath();
          
          if (effect === ParticleEffect.RAIN) {
              ctx.rect(p.x, p.y, 2, p.vy);
          } else if (effect === ParticleEffect.CONFETTI) {
              ctx.translate(p.x, p.y);
              ctx.rotate(p.y * 0.1);
              ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
              ctx.setTransform(1,0,0,1,0,0);
          } else {
             ctx.globalAlpha = (p.life / p.maxLife);
             ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
             ctx.globalAlpha = 1.0;
          }
          ctx.fill();
      });
  };


  // --- PRE-GENERATE NOISE TEXTURE (Performance) ---
  useEffect(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          const idata = ctx.createImageData(256, 256);
          const buffer32 = new Uint32Array(idata.data.buffer);
          for (let i = 0; i < buffer32.length; i++) {
              if (Math.random() < 0.5) buffer32[i] = 0xff000000; // Black dots
          }
          ctx.putImageData(idata, 0, 0);
          noisePatternRef.current = canvas;
      }
  }, []);

  // --- INIT AUDIO GRAPH (MASTERING CHAIN) ---
  useEffect(() => {
      const ctx = getAudioContext();
      
      // 1. Create Nodes if not exist
      if (!masterGainRef.current) {
          masterGainRef.current = ctx.createGain();
          masterGainRef.current.gain.value = 1.0; // Master Volume
      }
      
      if (!compressorRef.current) {
          // "Stereo Treatment" - Glue Compressor
          const comp = ctx.createDynamicsCompressor();
          comp.threshold.value = -24;
          comp.knee.value = 30;
          comp.ratio.value = 12;
          comp.attack.value = 0.003;
          comp.release.value = 0.25;
          compressorRef.current = comp;
      }

      if (!destNodeRef.current) {
          destNodeRef.current = ctx.createMediaStreamDestination();
      }

      // 2. Connect Graph: MasterGain -> Compressor -> Speakers & Recorder
      masterGainRef.current.disconnect();
      compressorRef.current.disconnect();

      masterGainRef.current.connect(compressorRef.current);
      
      // Connect to Physical Speakers
      compressorRef.current.connect(ctx.destination);
      
      // Connect to Recording Stream
      compressorRef.current.connect(destNodeRef.current);

  }, []);

  // --- INIT HIDDEN VIDEO ELEMENT ---
  useEffect(() => {
    if (!videoRef.current) {
        const vid = document.createElement('video');
        vid.crossOrigin = "anonymous"; // Important for Pexels
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.style.display = 'none';
        document.body.appendChild(vid);
        videoRef.current = vid;
    }
    return () => {
        if (videoRef.current) {
            document.body.removeChild(videoRef.current);
            videoRef.current = null;
        }
    };
  }, []);

  // --- ADVANCED MUSIC LOGIC (CROSSFADING) ---
  const loadAudioBuffer = async (url: string): Promise<AudioBuffer | null> => {
      if (musicBufferCacheRef.current.has(url)) {
          return musicBufferCacheRef.current.get(url)!;
      }
      try {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const ctx = getAudioContext();
          const decoded = await ctx.decodeAudioData(arrayBuffer);
          musicBufferCacheRef.current.set(url, decoded);
          return decoded;
      } catch (e) {
          console.error("Failed to load music:", url, e);
          return null;
      }
  };

  const fadeOutAndStop = (source: AudioBufferSourceNode, gain: GainNode, duration: number = 1.0) => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + duration);
      source.stop(now + duration);
      setTimeout(() => source.disconnect(), duration * 1000 + 100);
  };

  const handleSceneMusic = async (sceneIndex: number, isPlaying: boolean) => {
      const ctx = getAudioContext();
      const scene = scenesRef.current[sceneIndex];
      if (!scene || !isPlaying) return;

      // Determine Desired State
      let desiredUrl = bgMusicUrl; // Global Fallback
      let desiredVolume = bgMusicVolume;
      let action = MusicAction.CONTINUE; // Default for first scene if not set

      if (scene.musicConfig) {
          if (scene.musicConfig.action === MusicAction.STOP) {
             // Just stop
             if (musicSourceRef.current && musicGainRef.current) {
                 fadeOutAndStop(musicSourceRef.current, musicGainRef.current, 2);
                 musicSourceRef.current = null;
                 currentMusicUrlRef.current = null;
             }
             return;
          }

          if (scene.musicConfig.action === MusicAction.START_NEW) {
              desiredUrl = scene.musicConfig.customUrl || (scene.musicConfig.trackId && scene.musicConfig.trackId !== 'none' ? undefined : "") || bgMusicUrl;
              // If trackId is 'custom' or specific, finding URL is tricky here without the library list. 
              // We assume customUrl is populated if it's custom, or we rely on App to pass fully resolved URL.
              // NOTE: For simplicity, we expect `customUrl` to be populated by App logic if it's from library
              if (scene.musicConfig.customUrl) desiredUrl = scene.musicConfig.customUrl;
              
              action = MusicAction.START_NEW;
              desiredVolume = scene.musicConfig.volume;
          } else {
              // CONTINUE
              action = MusicAction.CONTINUE;
              desiredVolume = scene.musicConfig.volume;
          }
      } else {
          // No config = Global Fallback behaviour
          if (sceneIndex === 0) {
              action = MusicAction.START_NEW;
          } else {
              action = MusicAction.CONTINUE; // Default behavior implies simple background music
          }
      }

      // Logic Execution
      if (action === MusicAction.START_NEW) {
          // 1. If something playing, fade it out
          if (musicSourceRef.current && musicGainRef.current) {
               // Optimisation: If URL is same, just adjust volume? 
               // For START_NEW, we force restart.
               fadeOutAndStop(musicSourceRef.current, musicGainRef.current, 2);
               musicSourceRef.current = null;
          }

          // 2. Start new track
          if (desiredUrl) {
              const buffer = await loadAudioBuffer(desiredUrl);
              if (buffer && masterGainRef.current) {
                  const source = ctx.createBufferSource();
                  source.buffer = buffer;
                  source.loop = true;
                  
                  const gain = ctx.createGain();
                  gain.gain.value = 0; // Start silent
                  
                  source.connect(gain);
                  gain.connect(masterGainRef.current);
                  source.start(0);
                  
                  // Fade In
                  gain.gain.linearRampToValueAtTime(desiredVolume, ctx.currentTime + 2);

                  musicSourceRef.current = source;
                  musicGainRef.current = gain;
                  currentMusicUrlRef.current = desiredUrl;
              }
          }
      } else if (action === MusicAction.CONTINUE) {
          // Just adjust volume if track is playing
          if (musicGainRef.current) {
              musicGainRef.current.gain.setTargetAtTime(desiredVolume, ctx.currentTime, 1.0);
          } else if (!musicSourceRef.current && desiredUrl) {
               // Nothing was playing (maybe first scene fallback), start it
               // Similar to START_NEW
                const buffer = await loadAudioBuffer(desiredUrl);
                if (buffer && masterGainRef.current) {
                    const source = ctx.createBufferSource();
                    source.buffer = buffer;
                    source.loop = true;
                    const gain = ctx.createGain();
                    gain.gain.value = 0; 
                    source.connect(gain);
                    gain.connect(masterGainRef.current);
                    source.start(0);
                    gain.gain.linearRampToValueAtTime(desiredVolume, ctx.currentTime + 2);
                    musicSourceRef.current = source;
                    musicGainRef.current = gain;
                    currentMusicUrlRef.current = desiredUrl;
                }
          }
      }
  };
  
  // --- UPDATE MUSIC VOLUME LIVE (ONLY IF GLOBAL) ---
  // If using specific scene volume, the scene change logic handles it.
  // This effect is mostly for when the user drags the slider in real-time
  useEffect(() => {
    const scene = scenesRef.current[currentSceneIndex];
    // Only update live if no specific config overrides it, or if we are in "Global" mode
    if (!scene?.musicConfig && musicGainRef.current) {
        musicGainRef.current.gain.setTargetAtTime(bgMusicVolume, getAudioContext().currentTime, 0.1);
    }
  }, [bgMusicVolume]);

  // Sync Prop to Ref & Preload
  useEffect(() => {
    scenesRef.current = scenes;
    scenes.forEach(scene => {
      if (scene.mediaType === 'image' && scene.imageUrl) {
        const cachedImg = imageCacheRef.current.get(scene.id);
        if (!cachedImg || cachedImg.src !== scene.imageUrl) {
          const img = new Image();
          img.src = scene.imageUrl;
          imageCacheRef.current.set(scene.id, img);
        }
      }
    });
    
    if (moveParamsRef.current.length < scenes.length) {
       const newParams = scenes.slice(moveParamsRef.current.length).map(() => ({
          x: Math.random(),
          y: Math.random(),
          scale: 1.15 + Math.random() * 0.15, 
          direction: Math.random() > 0.5 ? 1 : -1 
       }));
       moveParamsRef.current = [...moveParamsRef.current, ...newParams];
    }
  }, [scenes]);

  // Sync Refs
  useEffect(() => {
      showSubtitlesRef.current = showSubtitles;
      subtitleStyleRef.current = subtitleStyle;
      activeFilterRef.current = activeFilter;
  }, [showSubtitles, subtitleStyle, activeFilter]);

  useImperativeHandle(ref, () => ({
    startRecording: () => {
      if (!canvasRef.current || !destNodeRef.current) return;
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();
      
      setIsRecording(true);
      chunksRef.current = [];
      
      // 30 FPS capture from Canvas
      const canvasStream = canvasRef.current.captureStream(30);
      
      // Combine Canvas Video + The Master Audio Stream
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...destNodeRef.current.stream.getAudioTracks()
      ]);

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000 
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const filename = `viral_flow_${format === VideoFormat.PORTRAIT ? 'SHORTS' : 'VIDEO'}_${Date.now()}.webm`;
        triggerBrowserDownload(blob, filename);
        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      
      setCurrentSceneIndex(0);
      setIsPlaying(true);
    },
    stopRecording: () => {
       if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
         mediaRecorderRef.current.stop();
       }
    }
  }));

  const draw = (timestamp: number) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = (timestamp - startTimeRef.current) / 1000; 

    const canvas = canvasRef.current;
    const scenesList = scenesRef.current;
    const currentScene = scenesList[currentSceneIndex];
    const ctx = canvas?.getContext('2d', { alpha: false }); 
    const moveParams = moveParamsRef.current[currentSceneIndex] || {x:0.5, y:0.5, scale: 1.15, direction: 1};
    const currentFilter = activeFilterRef.current;

    if (canvas && ctx && currentScene) {
      ctx.save(); // Save state before applying global filters

      // --- 1. APPLY VIDEO FILTERS (POST-PROCESSING) ---
      let filterString = 'none';
      if (currentFilter === VideoFilter.NOIR) filterString = 'grayscale(100%) contrast(110%)';
      if (currentFilter === VideoFilter.VINTAGE) filterString = 'sepia(60%) contrast(90%) brightness(90%)';
      if (currentFilter === VideoFilter.DREAMY) filterString = 'blur(0.5px) brightness(110%) saturate(120%)';
      if (currentFilter === VideoFilter.VHS) filterString = 'contrast(120%) saturate(130%)';
      if (currentFilter === VideoFilter.CYBERPUNK) filterString = 'contrast(110%) saturate(150%) hue-rotate(-10deg)';
      
      ctx.filter = filterString;

      // --- 2. BACKGROUND ---
      const hue = (currentSceneIndex * 137.5) % 360;
      ctx.fillStyle = `hsl(${hue}, 20%, 10%)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // --- 3. RENDER MEDIA ---
      if (currentScene.mediaType === 'video' && videoRef.current && currentScene.videoUrl) {
          try {
              const vid = videoRef.current;
              if (vid.readyState >= 2) { 
                  const scale = Math.max(canvas.width / vid.videoWidth, canvas.height / vid.videoHeight);
                  const w = vid.videoWidth * scale;
                  const h = vid.videoHeight * scale;
                  const x = (canvas.width - w) / 2;
                  const y = (canvas.height - h) / 2;
                  ctx.drawImage(vid, x, y, w, h);
              }
          } catch (e) {}
      } else {
          const cachedImg = imageCacheRef.current.get(currentScene.id);
          if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
                let duration = currentScene.durationEstimate || 5;
                if (currentScene.audioBuffer) duration = currentScene.audioBuffer.duration;
                const progress = Math.min(elapsed / duration, 1);
                
                let zoom;
                if (moveParams.direction > 0) {
                   zoom = 1.0 + (progress * (moveParams.scale - 1.0));
                } else {
                   zoom = moveParams.scale - (progress * (moveParams.scale - 1.0));
                }
                
                const scaleFactor = Math.max(canvas.width / cachedImg.width, canvas.height / cachedImg.height);
                const drawnWidth = cachedImg.width * scaleFactor * zoom;
                const drawnHeight = cachedImg.height * scaleFactor * zoom;
                
                const maxOffsetX = drawnWidth - canvas.width;
                const maxOffsetY = drawnHeight - canvas.height;
                
                const originX = moveParams.x * maxOffsetX;
                const originY = moveParams.y * maxOffsetY;
                
                const x = (canvas.width - drawnWidth) / 2 - (originX - maxOffsetX/2) * progress;
                const y = (canvas.height - drawnHeight) / 2 - (originY - maxOffsetY/2) * progress;

                ctx.drawImage(cachedImg, x, y, drawnWidth, drawnHeight);
          } else {
            // Placeholder
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, `hsl(${hue}, 40%, 20%)`);
            gradient.addColorStop(1, `hsl(${(hue + 40) % 360}, 30%, 10%)`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
      }
      
      ctx.filter = 'none'; // Reset filter for overlays
      ctx.restore(); // Restore to avoid stacking filters incorrectly

      // --- 4. PARTICLE EFFECTS (VFX) ---
      if (currentScene.particleEffect && currentScene.particleEffect !== ParticleEffect.NONE) {
         // Re-initialize particles if effect changed (simple check via ref logic or manual trigger)
         // For this demo, we check if the current particles match the type, if not, reset
         // But to keep it simple, we just update existing.
         updateAndDrawParticles(ctx, canvas.width, canvas.height, currentScene.particleEffect);
      } else {
         particlesRef.current = [];
      }

      // --- 5. OVERLAY EFFECTS (SCANLINES / NOISE) ---
      if (currentFilter === VideoFilter.VHS) {
          // Scanlines
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          for (let i = 0; i < canvas.height; i += 4) {
              ctx.fillRect(0, i, canvas.width, 2);
          }
          // Noise
          if (noisePatternRef.current) {
              ctx.save();
              ctx.globalAlpha = 0.1;
              ctx.globalCompositeOperation = 'overlay';
              const noiseX = Math.random() * -128;
              const noiseY = Math.random() * -128;
              const ptrn = ctx.createPattern(noisePatternRef.current, 'repeat');
              if (ptrn) {
                  ctx.fillStyle = ptrn;
                  ctx.translate(noiseX, noiseY);
                  ctx.fillRect(0, 0, canvas.width + 128, canvas.height + 128);
              }
              ctx.restore();
          }
          // Date Overlay
          ctx.font = '30px monospace';
          ctx.fillStyle = '#00ff00';
          ctx.shadowBlur = 5;
          ctx.shadowColor = '#00ff00';
          ctx.fillText("PLAY ▶", 40, 60);
      }

      if (currentFilter === VideoFilter.CYBERPUNK) {
          const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          grad.addColorStop(0, 'rgba(255, 0, 255, 0.2)');
          grad.addColorStop(1, 'rgba(0, 255, 255, 0.2)');
          ctx.save();
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
      }

      if (currentFilter === VideoFilter.VINTAGE) {
          // Vignette Stronger
          const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.height/3, canvas.width/2, canvas.height/2, canvas.height);
          grad.addColorStop(0, 'rgba(150, 75, 0, 0)');
          grad.addColorStop(1, 'rgba(60, 30, 0, 0.6)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          if (noisePatternRef.current) {
              ctx.save();
              ctx.globalAlpha = 0.15;
              ctx.globalCompositeOperation = 'multiply';
              const ptrn = ctx.createPattern(noisePatternRef.current, 'repeat');
              if (ptrn) {
                  ctx.fillStyle = ptrn;
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
              ctx.restore();
          }
      }

      // Normal Vignette (Default)
      if (currentFilter === VideoFilter.NONE || currentFilter === VideoFilter.DREAMY) {
          const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.height/3, canvas.width/2, canvas.height/2, canvas.height);
          gradient.addColorStop(0, 'rgba(0,0,0,0)');
          gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // --- 6. SUBTITLES ---
      const showSubs = showSubtitlesRef.current;
      const subStyle = subtitleStyleRef.current;

      if (showSubs && currentScene.text && currentScene.text.trim().length > 0) {
        const isPortrait = format === VideoFormat.PORTRAIT;
        const fontSize = isPortrait ? 52 : 36;
        const lineHeight = fontSize * 1.3;
        const bottomMargin = isPortrait ? 280 : 90;
        const maxWidth = canvas.width * (isPortrait ? 0.85 : 0.7);
        
        // Dynamic Font loading
        if (subStyle === SubtitleStyle.COMIC) ctx.font = `900 ${fontSize}px "Comic Sans MS", "Impact", sans-serif`;
        else ctx.font = `900 ${fontSize}px Inter, Impact, sans-serif`; 

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const words = currentScene.text.trim().split(/\s+/);
        const lines: string[] = [];
        let currentLine = words[0];
        
        for(let i = 1; i < words.length; i++) {
            const w = words[i];
            const width = ctx.measureText(currentLine + " " + w).width;
            if (width < maxWidth) {
                currentLine += " " + w;
            } else {
                lines.push(currentLine);
                currentLine = w;
            }
        }
        lines.push(currentLine);
        
        const totalTextHeight = lines.length * lineHeight;
        const startY = canvas.height - bottomMargin - totalTextHeight;
        
        let sceneDuration = currentScene.durationEstimate || 5;
        if (currentScene.audioBuffer) sceneDuration = currentScene.audioBuffer.duration + 0.2; 
        
        const totalWords = words.length;
        const currentWordIndex = Math.min(totalWords - 1, Math.floor((elapsed / sceneDuration) * totalWords));
        
        // --- BACKGROUND BOXES ---
        if (subStyle === SubtitleStyle.MODERN) {
             const boxPadding = 20;
             const boxWidth = maxWidth + (boxPadding * 2);
             const boxHeight = totalTextHeight + (boxPadding * 2);
             const boxX = (canvas.width - boxWidth) / 2;
             const boxY = startY - boxPadding;

             ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
             ctx.beginPath();
             ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 16);
             ctx.fill();
        }

        // --- TEXT RENDERING ---
        let wordCounter = 0;
        
        lines.forEach((line, lineIdx) => {
            const lineY = startY + (lineIdx * lineHeight) + (lineHeight/2);
            const lineWords = line.trim().split(' ');
            
            let totalLineWidth = 0;
            const wordWidths = lineWords.map(w => {
                const wd = ctx.measureText(w + " ").width;
                totalLineWidth += wd;
                return wd;
            });
            
            let currentX = (canvas.width - totalLineWidth) / 2;
            
            lineWords.forEach((w, wIdx) => {
                const isActive = wordCounter === currentWordIndex;
                const isPast = wordCounter < currentWordIndex;
                
                ctx.shadowBlur = 0;
                ctx.strokeStyle = 'transparent';
                
                // --- STYLE: CLASSIC ---
                if (subStyle === SubtitleStyle.CLASSIC) {
                     ctx.fillStyle = isActive ? '#fbbf24' : '#ffffff';
                     ctx.lineWidth = 6;
                     ctx.strokeStyle = 'black';
                     ctx.strokeText(w, currentX + (wordWidths[wIdx]/2), lineY);
                     ctx.fillText(w, currentX + (wordWidths[wIdx]/2), lineY);
                } 
                // --- STYLE: NEON ---
                else if (subStyle === SubtitleStyle.NEON) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = isActive ? '#ffff00' : '#00ff00';
                    ctx.fillStyle = isActive ? '#ffffff' : '#ccffcc';
                    if (isPast) ctx.fillStyle = 'rgba(255,255,255,0.8)';
                    ctx.fillText(w, currentX + (wordWidths[wIdx]/2), lineY);
                }
                // --- STYLE: KARAOKE (NEW) ---
                else if (subStyle === SubtitleStyle.KARAOKE) {
                    ctx.save();
                    const centerX = currentX + (wordWidths[wIdx]/2);
                    
                    if (isActive) {
                        // Pop effect
                        const scale = 1.2;
                        ctx.translate(centerX, lineY);
                        ctx.scale(scale, scale);
                        ctx.translate(-centerX, -lineY);
                        
                        ctx.fillStyle = '#00ffff'; // Cyan pop
                        ctx.shadowColor = 'rgba(0,255,255,0.8)';
                        ctx.shadowBlur = 20;
                    } else {
                        ctx.fillStyle = isPast ? '#ffffff' : 'rgba(255,255,255,0.4)';
                    }
                    
                    // Bold outline for readability
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 4;
                    ctx.strokeText(w, centerX, lineY);
                    ctx.fillText(w, centerX, lineY);
                    
                    ctx.restore();
                }
                // --- STYLE: COMIC (NEW) ---
                else if (subStyle === SubtitleStyle.COMIC) {
                    const centerX = currentX + (wordWidths[wIdx]/2);
                    ctx.fillStyle = isActive ? '#facc15' : '#ffffff'; // Yellow active
                    ctx.lineWidth = 8;
                    ctx.strokeStyle = 'black';
                    ctx.lineJoin = 'round';
                    
                    // Offset shadow manually for comic feel
                    ctx.fillStyle = 'black';
                    ctx.fillText(w, centerX + 4, lineY + 4);
                    
                    ctx.fillStyle = isActive ? '#facc15' : '#ffffff';
                    ctx.strokeText(w, centerX, lineY);
                    ctx.fillText(w, centerX, lineY);
                }
                // --- STYLE: GLITCH (NEW) ---
                else if (subStyle === SubtitleStyle.GLITCH) {
                    const centerX = currentX + (wordWidths[wIdx]/2);
                    
                    if (Math.random() > 0.92) {
                        // RGB Split
                        ctx.fillStyle = 'red';
                        ctx.fillText(w, centerX - 3, lineY);
                        ctx.fillStyle = 'cyan';
                        ctx.fillText(w, centerX + 3, lineY);
                    }
                    
                    ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255,255,255,0.7)';
                    ctx.shadowColor = "rgba(0,0,0,0.8)";
                    ctx.shadowBlur = 4;
                    ctx.fillText(w, centerX, lineY);
                }
                // --- STYLE: NONE/DEFAULT (Modern) ---
                else {
                    ctx.fillStyle = isActive ? '#fbbf24' : '#ffffff';
                    if (wordCounter > currentWordIndex) ctx.fillStyle = 'rgba(255,255,255,0.35)';
                    ctx.shadowColor = "rgba(0,0,0,0.5)";
                    ctx.shadowBlur = 4;
                    ctx.fillText(w, currentX + (wordWidths[wIdx]/2), lineY);
                }

                currentX += wordWidths[wIdx];
                wordCounter++;
            });
        });
      }
      
      if (userTier === UserTier.FREE) {
          ctx.save();
          ctx.font = "bold 24px Inter";
          ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
          ctx.textAlign = "right";
          ctx.shadowColor = "black";
          ctx.shadowBlur = 4;
          const wmText = "⚡ Feito com ViralFlow (Versão Grátis)";
          ctx.fillText(wmText, canvas.width - 30, 50);
          ctx.restore();
      }

      // Scene transition logic
      let sceneLimit = currentScene.durationEstimate || 5;
      if (currentScene.audioBuffer) {
          sceneLimit = currentScene.audioBuffer.duration + 0.2;
      }

      if (elapsed >= sceneLimit) {
         handleNextScene();
      } else if (isPlaying) {
        rafRef.current = requestAnimationFrame(draw);
      }
    }
  };

  const stopSpeech = () => {
    if (speechSourceRef.current) {
      try { speechSourceRef.current.stop(); } catch (e) { }
      speechSourceRef.current.disconnect();
      speechSourceRef.current = null;
    }
  };

  const playSpeech = (buffer: AudioBuffer) => {
    const ctx = getAudioContext();
    stopSpeech();
    if (!masterGainRef.current) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(masterGainRef.current);
    source.start(0);
    speechSourceRef.current = source;
  };

  const stopMusic = () => {
    if (musicSourceRef.current) {
        try { musicSourceRef.current.stop(); } catch(e) {}
        musicSourceRef.current.disconnect();
        musicSourceRef.current = null;
    }
    musicGainRef.current = null;
  };

  // Modified to use scene logic or fallback
  const playMusic = () => {
    if (!musicBufferRef.current) return; 
    // We only use this simple playMusic if we are NOT handling complex scene logic
    // but wait, handleSceneMusic does it better.
  };

  const handleNextScene = () => {
    stopSpeech();
    cancelAnimationFrame(rafRef.current);
    startTimeRef.current = 0;
    
    if (currentSceneIndex < scenesRef.current.length - 1) {
      const nextIndex = currentSceneIndex + 1;
      setCurrentSceneIndex(nextIndex);
      // Audio transition logic handles inside effect when index changes
    } else {
      setIsPlaying(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
      }
      if (onPlaybackComplete) onPlaybackComplete();
    }
  };

  // Effects
  // IMPORTANT: We replaced simple "playMusic" with "handleSceneMusic" triggered by index change
  useEffect(() => {
      if (isPlaying) {
         handleSceneMusic(currentSceneIndex, true);
      } else {
         stopMusic();
      }
  }, [currentSceneIndex, isPlaying]);


  useEffect(() => {
    if (isPlaying && scenes[currentSceneIndex]) {
      const currentScene = scenes[currentSceneIndex];
      
      // Reset particles when scene changes (optional, or keep them flow)
      // For drastic changes, maybe reset? Let's keep them flowing if same effect, reset if diff.
      // Actually logic inside draw handles this check.

      if (currentScene.mediaType === 'video' && currentScene.videoUrl && videoRef.current) {
          if (videoRef.current.src !== currentScene.videoUrl) {
              videoRef.current.src = currentScene.videoUrl;
              videoRef.current.load();
          }
          videoRef.current.play().catch(e => console.log("Video play interrupted", e));
      } else if (videoRef.current) {
          videoRef.current.pause();
      }
      if (currentScene.audioBuffer) playSpeech(currentScene.audioBuffer);
      startTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(rafRef.current);
      stopSpeech();
      if (videoRef.current) videoRef.current.pause();
    }
    return () => {
      cancelAnimationFrame(rafRef.current);
      stopSpeech();
      if (videoRef.current) videoRef.current.pause();
    };
  }, [isPlaying, currentSceneIndex]);

  const togglePlay = () => {
    if (isRecording) return;
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    setIsPlaying(!isPlaying);
  };

  const containerClass = format === VideoFormat.PORTRAIT 
    ? "relative w-full aspect-[9/16] bg-black rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-zinc-800 ring-1 ring-zinc-700"
    : "relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800 ring-1 ring-zinc-700";

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className={containerClass}>
        <canvas 
          ref={canvasRef} 
          width={WIDTH} 
          height={HEIGHT} 
          className={`w-full h-full object-contain ${activeFilter === VideoFilter.VHS ? 'contrast-125' : ''}`}
        />
        
        {!isPlaying && !isRecording && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity z-20">
              <button 
                onClick={togglePlay}
                className="p-6 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all transform hover:scale-105"
              >
                <Play className="w-12 h-12 text-white fill-current" />
              </button>
           </div>
        )}
        
        {isRecording && (
            <div className="absolute top-8 right-6 flex items-center gap-2 px-3 py-1 bg-red-600/90 backdrop-blur text-white text-xs font-bold rounded-full animate-pulse z-30">
                <Circle className="w-3 h-3 fill-white" /> GRAVANDO (STEREO)
            </div>
        )}

        {format === VideoFormat.PORTRAIT && !isRecording && (
             <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10"></div>
        )}
      </div>

      <div className="w-full flex items-center justify-between px-4 py-3 glass-panel rounded-lg max-w-md">
        <div className="flex items-center gap-4">
            <button disabled={isRecording} onClick={() => setCurrentSceneIndex(Math.max(0, currentSceneIndex - 1))} className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50">
              <SkipBack className="w-5 h-5" />
            </button>
            <button disabled={isRecording} onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors disabled:opacity-50">
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>
            <button disabled={isRecording} onClick={() => setCurrentSceneIndex(Math.min(scenes.length - 1, currentSceneIndex + 1))} className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50">
              <SkipForward className="w-5 h-5" />
            </button>
        </div>
        <div className="text-xs font-mono text-zinc-500">
           CENA {currentSceneIndex + 1} / {scenes.length}
        </div>
      </div>
    </div>
  );
});

export default React.memo(VideoPlayer);
