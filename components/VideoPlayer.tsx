


import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Scene, VideoFormat, SubtitleStyle, UserTier, VideoFilter, ColorGradingPreset, LayerConfig, OverlayConfig, VideoTransition, ParticleEffect, CameraMovement } from '../types';
import { Play, Pause, SkipBack, SkipForward, Loader2, Maximize2, Minimize2 } from 'lucide-react';
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
  alpha: number;
  life: number;
  decay: number;
  type: ParticleEffect;
  rotation?: number;
  rotationSpeed?: number;
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
  const activeFilterRef = useRef(activeFilter);
  const globalTransitionRef = useRef(globalTransition);
  const channelLogoRef = useRef(channelLogo);
  
  // Media Caches
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const videoCacheRef = useRef<Map<string, HTMLVideoElement>>(new Map());

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

  // Handle Fullscreen Events explicitly to avoid "player missing" bug
  useEffect(() => {
      const handleFsChange = () => {
          setIsFullscreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', handleFsChange);
      return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
      if (!containerRef.current) return;
      if (!document.fullscreenElement) {
          containerRef.current.requestFullscreen().catch(console.error);
      } else {
          document.exitFullscreen().catch(console.error);
      }
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
      if (currentMusicUrlRef.current === url && musicSourceRef.current) return;

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

      canvas.width = WIDTH;
      canvas.height = HEIGHT;

      let sceneStartTime = performance.now();
      let currentIdx = currentSceneIndex;
      let hasStartedAudio = false;

      // Initialize Particles if needed
      particlesRef.current = [];

      if (isPlaying) {
          const buffer = bgMusicUrl ? musicBufferCacheRef.current.get(bgMusicUrl) : null;
          if (buffer && bgMusicUrl) playMusic(buffer, bgMusicUrl);
          sceneStartTime = performance.now();
          startTimeRef.current = sceneStartTime;
      } else {
          if (speechSourceRef.current) { try{speechSourceRef.current.stop();}catch(e){} speechSourceRef.current = null; }
          if (musicSourceRef.current) { try{musicSourceRef.current.stop();}catch(e){} musicSourceRef.current = null; currentMusicUrlRef.current = null; }
          hasStartedAudio = false;
          videoCacheRef.current.forEach(v => v.pause());
      }

      const render = (time: number) => {
          if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(audioDataArrayRef.current as any);
          }
          const bassVolume = audioDataArrayRef.current.slice(0, 10).reduce((a,b) => a+b, 0) / 10;

          // Clear
          ctx.setTransform(1, 0, 0, 1, 0, 0); 
          ctx.filter = 'none';
          ctx.globalAlpha = 1;
          ctx.clearRect(0, 0, WIDTH, HEIGHT);

          // Render Logic
          if (!isPlaying && !isRecordingRef.current) {
              // EDIT MODE
              if (scenesRef.current[currentSceneIndex]) {
                 drawScene(ctx, scenesRef.current[currentSceneIndex], 1, 0, false, 0, 0); 
              }
          } else {
              // PLAYBACK MODE
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
                   playSpeech(scene.audioBuffer);
                   hasStartedAudio = true;
              }

              drawScene(ctx, scene, 1, progress, true, bassVolume, elapsed);

              // Transitions
              const timeLeft = durationMs - elapsed;
              const transitionDuration = 800; // ms
              
              if (timeLeft < transitionDuration && scenesRef.current[currentIdx + 1]) {
                   const nextScene = scenesRef.current[currentIdx + 1];
                   const transProgress = 1 - (timeLeft / transitionDuration);
                   const type = scene.transition || globalTransitionRef.current;
                   drawTransition(ctx, type, nextScene, transProgress, bassVolume);
              }

              if (elapsed >= durationMs) {
                  if (currentIdx < scenesRef.current.length - 1) {
                      currentIdx++;
                      setCurrentSceneIndex(currentIdx);
                      sceneStartTime = time;
                      hasStartedAudio = false;
                      particlesRef.current = []; // Clear particles on scene change
                  } else {
                      setIsPlaying(false);
                      setIsExporting(false);
                      setExportProgress(100);
                      if (isRecordingRef.current && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                          mediaRecorderRef.current.stop();
                      }
                      if (onPlaybackComplete) onPlaybackComplete();
                  }
              }
          }

          // Global Overlays
          drawOverlays(ctx);

          if (isPlaying || isRecordingRef.current) {
              rafRef.current = requestAnimationFrame(render);
          }
      };

      rafRef.current = requestAnimationFrame(render);
      return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, currentSceneIndex, scenes, renderScale, format, isExporting, isFullscreen]); // Added isFullscreen dependency

  const updateAndDrawParticles = (ctx: CanvasRenderingContext2D, type: ParticleEffect) => {
      if (type === ParticleEffect.NONE) return;

      const isFloatingObject = type === ParticleEffect.FLOATING_HEARTS || 
                               type === ParticleEffect.FLOATING_LIKES ||
                               type === ParticleEffect.FLOATING_STARS ||
                               type === ParticleEffect.FLOATING_MONEY ||
                               type === ParticleEffect.FLOATING_MUSIC;

      // SPAWNING
      const maxParticles = isFloatingObject ? 20 : 100;
      if (particlesRef.current.length < maxParticles) {
          if (Math.random() < 0.2) { // Emission rate
              let p: Particle = {
                  x: Math.random() * WIDTH,
                  y: type === ParticleEffect.EMBERS ? HEIGHT + 10 : -10,
                  vx: (Math.random() - 0.5) * 2,
                  vy: 0,
                  size: 0,
                  color: '#fff',
                  alpha: 1,
                  life: 1,
                  decay: 0.005 + Math.random() * 0.01,
                  type: type,
                  rotation: Math.random() * 360,
                  rotationSpeed: (Math.random() - 0.5) * 5
              };

              if (type === ParticleEffect.SNOW) {
                  p.vy = 1 + Math.random() * 2;
                  p.size = 2 + Math.random() * 3;
                  p.color = 'rgba(255,255,255,0.8)';
              } else if (type === ParticleEffect.RAIN) {
                  p.vy = 15 + Math.random() * 10;
                  p.vx = (Math.random() - 0.5) * 1;
                  p.size = 1; // Width
                  p.color = 'rgba(150,180,255,0.6)';
              } else if (type === ParticleEffect.EMBERS) {
                  p.vy = -(1 + Math.random() * 2);
                  p.size = 2 + Math.random() * 4;
                  p.color = Math.random() > 0.5 ? '#ffaa00' : '#ff4400';
                  p.decay = 0.01 + Math.random() * 0.02;
              } else if (type === ParticleEffect.CONFETTI) {
                  p.y = -10;
                  p.vy = 3 + Math.random() * 4;
                  p.vx = (Math.random() - 0.5) * 5;
                  p.size = 5 + Math.random() * 5;
                  const colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f'];
                  p.color = colors[Math.floor(Math.random() * colors.length)];
              } else if (type === ParticleEffect.DUST) {
                  p.x = Math.random() * WIDTH;
                  p.y = Math.random() * HEIGHT;
                  p.vx = (Math.random() - 0.5) * 0.5;
                  p.vy = (Math.random() - 0.5) * 0.5;
                  p.size = 1 + Math.random() * 2;
                  p.color = 'rgba(200,200,200,0.3)';
                  p.alpha = Math.random() * 0.5;
              } else if (isFloatingObject) {
                  p.x = Math.random() * WIDTH;
                  p.y = HEIGHT + 20;
                  p.vy = -(1 + Math.random() * 2);
                  p.size = 20 + Math.random() * 30;
                  p.alpha = 1;
                  
                  let icons: string[] = ['⭐'];
                  if (type === ParticleEffect.FLOATING_HEARTS) icons = ['❤️', '💖', '💘', '💝', '💕'];
                  else if (type === ParticleEffect.FLOATING_LIKES) icons = ['👍', '👍🏻', '👍🏿', '🔥', '💯'];
                  else if (type === ParticleEffect.FLOATING_STARS) icons = ['⭐', '✨', '🌟', '💫'];
                  else if (type === ParticleEffect.FLOATING_MUSIC) icons = ['🎵', '🎶', '🎼', '🎹'];
                  else if (type === ParticleEffect.FLOATING_MONEY) icons = ['💵', '💰', '🤑', '💎'];

                  p.color = icons[Math.floor(Math.random() * icons.length)];
              }

              particlesRef.current.push(p);
          }
      }

      // UPDATE & DRAW
      ctx.save();
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          
          p.x += p.vx;
          p.y += p.vy;
          p.life -= p.decay;

          if (p.rotation !== undefined && p.rotationSpeed) {
              p.rotation += p.rotationSpeed;
          }

          if (p.type === ParticleEffect.SNOW) {
              p.x += Math.sin(p.y * 0.01) * 0.5; // Sway
          } else if (p.type === ParticleEffect.EMBERS) {
              p.size *= 0.98;
          }

          // Kill logic
          if (p.life <= 0 || (p.y > HEIGHT + 20 && p.type !== ParticleEffect.EMBERS && !isFloatingObject) || (p.y < -50 && isFloatingObject)) {
              particlesRef.current.splice(i, 1);
              continue;
          }

          ctx.globalAlpha = p.alpha * p.life;
          
          if (isFloatingObject) {
             ctx.translate(p.x, p.y);
             ctx.rotate(p.rotation! * Math.PI / 180);
             ctx.font = `${p.size}px serif`;
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText(p.color, 0, 0); // p.color is emoji
             ctx.setTransform(1, 0, 0, 1, 0, 0);
          } else {
            ctx.fillStyle = p.color;
            if (p.type === ParticleEffect.RAIN) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.vx, p.y + (p.vy * 2)); // Stretch based on velocity
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size;
                ctx.stroke();
            } else if (p.type === ParticleEffect.CONFETTI) {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.life * 10);
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                ctx.setTransform(1, 0, 0, 1, 0, 0); 
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
          }
      }
      ctx.restore();
  };

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

  const drawScene = (ctx: CanvasRenderingContext2D, scene: Scene, opacity: number, progress: number, animate: boolean, audioIntensity: number, elapsedTimeMs: number) => {
      ctx.save();
      ctx.globalAlpha = opacity;

      // 1. Camera Movement Logic
      let scale = 1;
      let tx = 0;
      let ty = 0;
      let rotation = 0;

      // HANDHELD SHAKE (Applied before rotation/scale)
      if (scene.cameraMovement === CameraMovement.HANDHELD || (scene.vfxConfig && scene.vfxConfig.shakeIntensity > 0 && animate)) {
          const intensity = (scene.vfxConfig?.shakeIntensity || 1) * 2 * renderScale;
          // Smooth sine wave based shake instead of random noise
          const shakeX = Math.sin(elapsedTimeMs * 0.002) * intensity + Math.cos(elapsedTimeMs * 0.005) * (intensity * 0.5);
          const shakeY = Math.cos(elapsedTimeMs * 0.003) * intensity + Math.sin(elapsedTimeMs * 0.007) * (intensity * 0.5);
          ctx.translate(shakeX, shakeY);
      }

      // 2. Base Media
      let mediaElement: HTMLImageElement | HTMLVideoElement | null = null;
      if (scene.mediaType === 'video' && scene.videoUrl) {
           mediaElement = getVideo(scene.videoUrl);
           if (mediaElement instanceof HTMLVideoElement) {
               if (animate && mediaElement.paused) mediaElement.play().catch(() => {}); 
               else if (!animate) mediaElement.pause();
           }
      } else {
           mediaElement = getImage(scene.imageUrl);
      }

      // Apply Canvas Filters
      if (activeFilterRef.current !== VideoFilter.NONE && activeFilterRef.current !== VideoFilter.NEURAL_CINEMATIC) {
          ctx.filter = getFilterStyle(activeFilterRef.current);
      }

      // Bloom
      if (scene.vfxConfig && scene.vfxConfig.bloomIntensity > 0) {
          const bloom = scene.vfxConfig.bloomIntensity;
          const currentFilter = ctx.filter === 'none' ? '' : ctx.filter;
          ctx.filter = `${currentFilter} brightness(${100 + bloom * 30}%) saturate(${100 + bloom * 20}%)`;
      }

      if (mediaElement) {
          if (animate) {
              const moveType = scene.cameraMovement || CameraMovement.STATIC;
              const moveAmount = 0.1 * progress; // 10% movement over scene duration

              switch(moveType) {
                  case CameraMovement.ZOOM_IN:
                      scale = 1 + moveAmount; // 1.0 -> 1.1
                      break;
                  case CameraMovement.ZOOM_OUT:
                      scale = 1.1 - moveAmount; // 1.1 -> 1.0
                      break;
                  case CameraMovement.PAN_LEFT:
                      scale = 1.1; 
                      tx = -moveAmount * WIDTH; 
                      break;
                  case CameraMovement.PAN_RIGHT:
                      scale = 1.1;
                      tx = moveAmount * WIDTH; 
                      break;
                  case CameraMovement.ROTATE_CW:
                      scale = 1.2; // Zoom in to avoid black corners
                      rotation = moveAmount * 20; // Rotate up to 2 degrees
                      break;
                   case CameraMovement.ROTATE_CCW:
                      scale = 1.2;
                      rotation = -moveAmount * 20;
                      break;
                  case CameraMovement.STATIC:
                  default:
                      scale = 1;
              }

              // Audio Reactive Bump
              if (activeFilterRef.current === VideoFilter.NEURAL_CINEMATIC && audioIntensity > 150) {
                   const bump = (audioIntensity - 150) / 1000;
                   scale += bump;
              }
          }

          // Apply Rotation if needed
          if (rotation !== 0) {
              ctx.translate(WIDTH/2, HEIGHT/2);
              ctx.rotate(rotation * Math.PI / 180);
              ctx.translate(-WIDTH/2, -HEIGHT/2);
          }

          // Chromatic Aberration
          if (scene.vfxConfig && scene.vfxConfig.chromaticAberration > 0) {
              const offset = scene.vfxConfig.chromaticAberration * 3 * renderScale;
              ctx.globalCompositeOperation = 'screen';
              
              ctx.save();
              ctx.translate(offset, 0);
              ctx.restore();
              
              ctx.globalCompositeOperation = 'source-over';
              drawImageCover(ctx, mediaElement, 0, 0, WIDTH, HEIGHT, scale, tx, ty);

              if (Math.random() < 0.1 * scene.vfxConfig.chromaticAberration) {
                   const y = Math.random() * HEIGHT;
                   const h = Math.random() * 50;
                   const shift = (Math.random() - 0.5) * 50;
                   try { ctx.drawImage(canvasRef.current!, 0, y, WIDTH, h, shift, y, WIDTH, h); } catch(e) {}
              }
          } else {
              drawImageCover(ctx, mediaElement, 0, 0, WIDTH, HEIGHT, scale, tx, ty);
          }

      } else {
          ctx.fillStyle = "#111";
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }

      ctx.filter = 'none';

      // 3. Post-Process
      if (activeFilterRef.current === VideoFilter.NEURAL_CINEMATIC) {
          drawNeuralCinematicEffect(ctx, audioIntensity);
      } else if (activeFilterRef.current !== VideoFilter.NONE) {
          applyOverlayEffects(ctx, activeFilterRef.current);
      }

      // 4. Color Grading (Cinematic LUTs Simulation)
      if (scene.colorGrading && scene.colorGrading !== ColorGradingPreset.NONE) {
          drawColorGrading(ctx, scene.colorGrading);
      }
      
      // 5. Particles
      if (animate && scene.particleEffect && scene.particleEffect !== ParticleEffect.NONE) {
          updateAndDrawParticles(ctx, scene.particleEffect);
      } else if (scene.particleEffect && scene.particleEffect !== ParticleEffect.NONE) {
          // Static draw (preview mode)
          updateAndDrawParticles(ctx, scene.particleEffect);
      }

      // 6. Advanced VFX (Vignette)
      if (scene.vfxConfig) {
          if (scene.vfxConfig.vignetteIntensity > 0) {
              const grad = ctx.createRadialGradient(WIDTH/2, HEIGHT/2, WIDTH * 0.3, WIDTH/2, HEIGHT/2, WIDTH * 0.9);
              grad.addColorStop(0, 'rgba(0,0,0,0)');
              grad.addColorStop(1, `rgba(0,0,0,${scene.vfxConfig.vignetteIntensity * 0.8})`);
              ctx.globalCompositeOperation = 'source-over';
              ctx.fillStyle = grad;
              ctx.fillRect(0, 0, WIDTH, HEIGHT);
          }
      }

      // 7. LAYERS (Multi-Layer System: Images, Videos, Text)
      if (scene.layers && scene.layers.length > 0) {
          scene.layers.forEach(layer => drawLayer(ctx, layer, elapsedTimeMs, animate));
      } else if (scene.overlay) {
          // Legacy support
          drawLayer(ctx, { 
              id: 'legacy', type: 'image', url: scene.overlay.url, name: 'Overlay', 
              x: scene.overlay.x, y: scene.overlay.y, 
              scale: scene.overlay.scale, opacity: scene.overlay.opacity ?? 1, rotation: 0 
          }, elapsedTimeMs, animate);
      }

      // 8. Subtitles
      if (showSubtitlesRef.current && scene.text) {
          drawSubtitles(ctx, scene.text, subtitleStyleRef.current, progress);
      }
      
      ctx.restore();
  };

  const drawColorGrading = (ctx: CanvasRenderingContext2D, preset: ColorGradingPreset) => {
      ctx.save();
      
      if (preset === ColorGradingPreset.TEAL_ORANGE) {
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
          ctx.globalCompositeOperation = 'soft-light';
          ctx.fillStyle = 'rgba(255, 160, 0, 0.3)';
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
      else if (preset === ColorGradingPreset.MATRIX) {
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = 'rgba(0, 255, 100, 0.2)';
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = 'rgba(0, 50, 20, 0.3)';
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
      else if (preset === ColorGradingPreset.DRAMATIC_BW) {
           ctx.globalCompositeOperation = 'color';
           ctx.fillStyle = '#000';
           ctx.fillRect(0,0,WIDTH,HEIGHT);
           ctx.globalCompositeOperation = 'overlay';
           ctx.fillStyle = 'rgba(0,0,0,0.5)'; // High Contrast
           ctx.fillRect(0,0,WIDTH,HEIGHT);
      }
      else if (preset === ColorGradingPreset.GOLDEN_HOUR) {
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = 'rgba(255, 200, 0, 0.2)';
          ctx.fillRect(0,0,WIDTH,HEIGHT);
          const grad = ctx.createLinearGradient(0,0,0,HEIGHT);
          grad.addColorStop(0, 'rgba(255, 150, 0, 0.2)');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = grad;
          ctx.fillRect(0,0,WIDTH,HEIGHT);
      }
      else if (preset === ColorGradingPreset.CYBER_NEON) {
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = 'rgba(255, 0, 255, 0.2)'; // Magenta
          ctx.fillRect(0,0,WIDTH,HEIGHT);
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = 'rgba(0, 255, 255, 0.1)'; // Cyan
          ctx.fillRect(0,0,WIDTH,HEIGHT);
      }

      ctx.restore();
  }

  const drawLayer = (ctx: CanvasRenderingContext2D, layer: LayerConfig, elapsedTimeMs: number, animate: boolean) => {
      ctx.save();
      const x = layer.x * WIDTH;
      const y = layer.y * HEIGHT;
      
      ctx.translate(x, y);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.scale(layer.scale, layer.scale);

      ctx.globalAlpha = layer.opacity;
      if (layer.blendMode) ctx.globalCompositeOperation = layer.blendMode;

      // Shadow Effects - Applied BEFORE drawing content
      if (layer.shadowColor) {
          ctx.shadowColor = layer.shadowColor;
          ctx.shadowBlur = (layer.shadowBlur || 0) * renderScale;
          ctx.shadowOffsetX = (layer.shadowOffsetX || 0) * renderScale;
          ctx.shadowOffsetY = (layer.shadowOffsetY || 0) * renderScale;
      } else {
          ctx.shadowColor = 'transparent';
      }

      if (layer.type === 'text' && layer.text) {
          const fontSize = (layer.fontSize || 50) * renderScale;
          const fontFamily = layer.fontFamily || 'Inter';
          const fontWeight = layer.fontWeight || 'bold';
          ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;
          ctx.fillStyle = layer.fontColor || '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          if (layer.textShadow) {
              // Override manual shadows for text defaults if checked
              ctx.shadowColor = 'rgba(0,0,0,0.8)';
              ctx.shadowBlur = 4 * renderScale;
              ctx.shadowOffsetX = 2 * renderScale;
              ctx.shadowOffsetY = 2 * renderScale;
          }
          
          ctx.fillText(layer.text, 0, 0);
      } else {
          // IMAGE or VIDEO LAYER
          let media: HTMLImageElement | HTMLVideoElement | null = null;
          
          if (layer.type === 'video' && layer.url) {
              media = getVideo(layer.url);
              if (media instanceof HTMLVideoElement) {
                   // Video Layer Sync Logic
                   if (animate) {
                       const videoTime = (elapsedTimeMs / 1000) % media.duration;
                       if (Math.abs(media.currentTime - videoTime) > 0.3) {
                           media.currentTime = videoTime;
                       }
                       if (media.paused) media.play().catch(()=>{});
                   } else {
                       media.currentTime = 0; // Preview at start
                       media.pause();
                   }
              }
          } else if (layer.url) {
              media = getImage(layer.url);
          }

          if(media) {
              const baseSize = WIDTH * 0.2; 
              // Determine Aspect Ratio
              let width = 0, height = 0;
              if (media instanceof HTMLVideoElement) {
                  width = media.videoWidth; height = media.videoHeight;
              } else {
                  width = media.width; height = media.height;
              }

              if (width > 0 && height > 0) {
                  const aspect = width / height;
                  let drawW, drawH;
                  if(aspect > 1) { drawW = baseSize; drawH = baseSize / aspect; }
                  else { drawH = baseSize; drawW = baseSize * aspect; }
                  
                  ctx.drawImage(media, -drawW/2, -drawH/2, drawW, drawH);
              }
          }
      }
      
      ctx.shadowColor = 'transparent'; // Reset shadow
      ctx.restore();
  };

  const drawNeuralCinematicEffect = (ctx: CanvasRenderingContext2D, audioIntensity: number) => {
      const flareIntensity = Math.max(0, (audioIntensity - 100) / 255); 
      if (flareIntensity > 0.1) {
          ctx.globalCompositeOperation = 'screen';
          const gradient = ctx.createLinearGradient(0, 0, WIDTH, 0);
          gradient.addColorStop(0, 'rgba(0, 100, 255, 0)');
          gradient.addColorStop(0.5, `rgba(100, 200, 255, ${flareIntensity * 0.5})`);
          gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, HEIGHT * 0.3, WIDTH, HEIGHT * 0.05);
      }
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = `rgba(0,0,0, 0.15)`;
      ctx.fillRect(0,0,WIDTH,HEIGHT);
  };

  const applyOverlayEffects = (ctx: CanvasRenderingContext2D, filter: VideoFilter) => {
       ctx.save();
       if (filter === VideoFilter.VHS) {
          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          for(let y=0; y<HEIGHT; y+=4) ctx.fillRect(0, y, WIDTH, 1);
       }
       ctx.restore();
  };

  const drawTransition = (ctx: CanvasRenderingContext2D, type: VideoTransition, nextScene: Scene, progress: number, audioIntensity: number) => {
      ctx.save();
      if (type === VideoTransition.FADE || type === VideoTransition.AUTO) {
          ctx.globalAlpha = progress;
          drawScene(ctx, nextScene, 1, 0, true, audioIntensity, 0); 
      } else if (type === VideoTransition.SLIDE) {
          const xOffset = WIDTH * (1 - progress);
          ctx.translate(xOffset, 0);
          drawScene(ctx, nextScene, 1, 0, true, audioIntensity, 0);
      } else if (type === VideoTransition.WIPE) {
          ctx.beginPath();
          ctx.rect(0, 0, WIDTH * progress, HEIGHT);
          ctx.clip();
          drawScene(ctx, nextScene, 1, 0, true, audioIntensity, 0);
      } else if (type === VideoTransition.ZOOM) {
          const scale = 0.5 + (0.5 * progress);
          ctx.translate(WIDTH/2, HEIGHT/2);
          ctx.scale(scale, scale);
          ctx.translate(-WIDTH/2, -HEIGHT/2);
          ctx.globalAlpha = progress;
          drawScene(ctx, nextScene, 1, 0, true, audioIntensity, 0);
      }
      ctx.restore();
  };

  const drawImageCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement | HTMLVideoElement, x: number, y: number, w: number, h: number, scale: number = 1, tx: number = 0, ty: number = 0) => {
      const imgWidth = img instanceof HTMLVideoElement ? img.videoWidth : img.width;
      const imgHeight = img instanceof HTMLVideoElement ? img.videoHeight : img.height;
      if (imgWidth === 0 || imgHeight === 0) return;

      const imgRatio = imgWidth / imgHeight;
      const winRatio = w / h;
      let nw = w, nh = h, nx = 0, ny = 0;

      if (imgRatio > winRatio) {
          nh = h;
          nw = h * imgRatio;
          nx = (w - nw) / 2;
      } else {
          nw = w;
          nh = w / imgRatio;
          ny = (h - nh) / 2;
      }

      ctx.save();
      ctx.translate(w/2, h/2);
      ctx.scale(scale, scale);
      ctx.translate(tx, ty);
      ctx.translate(-w/2, -h/2);
      ctx.drawImage(img, nx, ny, nw, nh);
      ctx.restore();
  };

  // Improved Subtitles
  const drawSubtitles = (ctx: CanvasRenderingContext2D, text: string, style: SubtitleStyle, progress: number) => {
       const SAFE_ZONE_WIDTH_PERCENT = 0.85; 
       let fontSize = WIDTH * 0.05;
       
       ctx.font = `900 ${fontSize}px "Inter", sans-serif`;
       const maxWidth = WIDTH * SAFE_ZONE_WIDTH_PERCENT;
       const x = WIDTH / 2;
       
       const words = text.split(' ');
       let lines: string[] = [];
       const calculateLines = (currentFontSize: number) => {
           ctx.font = `900 ${currentFontSize}px "Inter", sans-serif`;
           const resLines = [];
           let line = "";
           for(let w of words) {
               const testLine = line + w + " ";
               const metrics = ctx.measureText(testLine);
               if (metrics.width > maxWidth && line !== "") {
                   resLines.push(line.trim());
                   line = w + " ";
               } else { line = testLine; }
           }
           resLines.push(line.trim());
           return resLines;
       };

       lines = calculateLines(fontSize);
       if (lines.length > 2) { fontSize = fontSize * 0.75; lines = calculateLines(fontSize); }
       
       const lineHeight = fontSize * 1.25;
       const totalBlockHeight = lines.length * lineHeight;
       const bottomAnchor = HEIGHT * (1 - 0.08);
       const startY = bottomAnchor - totalBlockHeight + (lineHeight * 0.5);

       if (style === SubtitleStyle.WORD_BY_WORD) {
           const wordIdx = Math.floor(progress * words.length);
           const currentWord = words[Math.min(wordIdx, words.length - 1)] || "";
           ctx.shadowColor = 'rgba(0,0,0,0.8)';
           ctx.shadowBlur = 10;
           ctx.fillStyle = '#fbbf24'; 
           ctx.strokeStyle = '#000';
           ctx.lineWidth = fontSize * 0.1;
           ctx.strokeText(currentWord, x, HEIGHT * 0.85);
           ctx.fillText(currentWord, x, HEIGHT * 0.85);
           ctx.shadowBlur = 0;
           return;
       }

       lines.forEach((l, i) => {
           const ly = startY + (i * lineHeight);
           // Style Rendering (Same as before but ensures proper render)
           if (style === SubtitleStyle.MODERN) {
               const metrics = ctx.measureText(l);
               const bgW = metrics.width + (fontSize * 0.5);
               const bgH = fontSize * 1.1;
               ctx.fillStyle = 'rgba(0,0,0,0.7)';
               ctx.beginPath(); ctx.roundRect(x - bgW/2, ly - bgH/2, bgW, bgH, 8); ctx.fill();
               ctx.fillStyle = '#fff';
           } else {
               ctx.strokeStyle = '#000';
               ctx.lineWidth = fontSize * 0.15;
               ctx.lineJoin = 'round';
               ctx.strokeText(l, x, ly);
               ctx.fillStyle = style === SubtitleStyle.NEON ? '#00ffff' : '#fbbf24';
           }
           ctx.textAlign = 'center';
           ctx.textBaseline = 'middle';
           ctx.fillText(l, x, ly);
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
      // Auto-load without playing immediately to save resources until render
      vid.load();
      videoCacheRef.current.set(url, vid);
      return vid;
  };
  
  const drawOverlays = (ctx: CanvasRenderingContext2D) => {
     if (channelLogoRef.current) {
         drawLayer(ctx, { 
             id: 'logo', type: 'image', url: channelLogoRef.current.url, name: 'Logo',
             x: channelLogoRef.current.x, y: channelLogoRef.current.y, 
             scale: channelLogoRef.current.scale, opacity: channelLogoRef.current.opacity ?? 1, rotation: 0
         }, 0, false);
     }
  };

  useImperativeHandle(ref, () => ({
      startRecording: (hq) => {
          if (isRecordingRef.current) return;
          setIsExporting(true);
          setExportProgress(0);
          setCurrentSceneIndex(0);
          setIsPlaying(true);
          setRenderScale(hq ? 2 : 1);
          setTimeout(() => {
              if (!canvasRef.current || !destNodeRef.current) return;
              const canvasStream = canvasRef.current.captureStream(30);
              const audioStream = destNodeRef.current.stream;
              const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioStream.getAudioTracks()]);
              let mimeType = 'video/webm;codecs=vp9';
              if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
              
              chunksRef.current = [];
              const recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: hq ? 8000000 : 2500000 });
              recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
              recorder.onstop = () => {
                  const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                  triggerBrowserDownload(blob, `viralflow_${Date.now()}.webm`);
                  isRecordingRef.current = false;
                  setIsExporting(false);
                  setRenderScale(1);
              };
              recorder.start();
              mediaRecorderRef.current = recorder;
              isRecordingRef.current = true;
          }, 500);
      },
      stopRecording: () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
      }
  }));

  return (
    <div ref={containerRef} className={`relative w-full bg-black rounded-lg overflow-hidden shadow-2xl group border border-zinc-800 ${isFullscreen ? 'fixed inset-0 z-[100] h-screen w-screen border-none rounded-none' : 'aspect-video'}`}>
      <canvas ref={canvasRef} className="w-full h-full object-contain" />
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
      {!isExporting && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 pointer-events-none">
             <div className="absolute top-4 right-4 pointer-events-auto">
                 <button onClick={toggleFullscreen} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white backdrop-blur-md transition-colors">
                     {isFullscreen ? <Minimize2 className="w-5 h-5"/> : <Maximize2 className="w-5 h-5"/>}
                 </button>
             </div>
             
             <div className="pointer-events-auto flex items-center justify-center gap-6">
                <button onClick={() => { if(currentSceneIndex > 0) setCurrentSceneIndex(currentSceneIndex - 1); }} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all"><SkipBack className="w-6 h-6" /></button>
                <button onClick={() => setIsPlaying(!isPlaying)} className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 transition-all scale-100 hover:scale-110 active:scale-95">
                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </button>
                <button onClick={() => { if(currentSceneIndex < scenes.length - 1) setCurrentSceneIndex(currentSceneIndex + 1); }} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all"><SkipForward className="w-6 h-6" /></button>
             </div>
             <div className="text-center mt-4 text-xs font-mono text-zinc-400">CENA {currentSceneIndex + 1} / {scenes.length}</div>
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;
