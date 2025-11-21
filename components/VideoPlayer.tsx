
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Scene, VideoFormat, SubtitleStyle, UserTier } from '../types';
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
  bgMusicUrl?: string;
  bgMusicVolume: number;
  showSubtitles: boolean;
  subtitleStyle: SubtitleStyle;
  userTier: UserTier;
  onPlaybackComplete?: () => void;
}

export interface VideoPlayerRef {
  startRecording: () => void;
  stopRecording: () => void;
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
  const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  
  // Data Refs
  const musicBufferRef = useRef<AudioBuffer | null>(null);
  
  // Dimensions
  const WIDTH = format === VideoFormat.PORTRAIT ? 720 : 1280;
  const HEIGHT = format === VideoFormat.PORTRAIT ? 1280 : 720;

  // Refs for Loop State (Avoids Stale Closures)
  const scenesRef = useRef<Scene[]>(scenes);
  const showSubtitlesRef = useRef(showSubtitles); // FIX: Ref for subtitles
  const subtitleStyleRef = useRef(subtitleStyle);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const moveParamsRef = useRef<{x: number, y: number, scale: number, direction: number}[]>([]);

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
      // This ensures WHAT YOU HEAR IS WHAT YOU RECORD.
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

  // --- LOAD BACKGROUND MUSIC ---
  useEffect(() => {
    const loadMusic = async () => {
      if (!bgMusicUrl) {
        musicBufferRef.current = null;
        stopMusic();
        return;
      }
      try {
        const response = await fetch(bgMusicUrl);
        const arrayBuffer = await response.arrayBuffer();
        const ctx = getAudioContext();
        const decoded = await ctx.decodeAudioData(arrayBuffer);
        musicBufferRef.current = decoded;
        if (isPlaying) {
            stopMusic();
            playMusic();
        }
      } catch (e) {
        console.error("Erro ao carregar música de fundo:", e);
      }
    };
    loadMusic();
  }, [bgMusicUrl]);

  // --- UPDATE MUSIC VOLUME LIVE ---
  useEffect(() => {
    if (musicGainRef.current) {
        // Smooth transition for volume changes
        musicGainRef.current.gain.setTargetAtTime(bgMusicVolume, getAudioContext().currentTime, 0.1);
    }
  }, [bgMusicVolume]);

  // Sync Prop to Ref & Preload
  useEffect(() => {
    scenesRef.current = scenes;
    scenes.forEach(scene => {
      if (scene.mediaType === 'image' && scene.imageUrl) {
        const cachedImg = imageCacheRef.current.get(scene.id);

        // CRITICAL FIX: Update cache if it doesn't exist OR if the URL has changed
        // This ensures when user uploads a new image, the player actually updates.
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

  // Sync Subtitles Ref
  useEffect(() => {
      showSubtitlesRef.current = showSubtitles;
      subtitleStyleRef.current = subtitleStyle;
  }, [showSubtitles, subtitleStyle]);

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

    if (canvas && ctx && currentScene) {
      // 1. Background
      const hue = (currentSceneIndex * 137.5) % 360;
      ctx.fillStyle = `hsl(${hue}, 20%, 10%)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Render Media (Video or Image)
      if (currentScene.mediaType === 'video' && videoRef.current && currentScene.videoUrl) {
          // VIDEO RENDERING (AUTO-CROP LOGIC)
          try {
              const vid = videoRef.current;
              if (vid.readyState >= 2) { 
                  // The magic logic for "Auto-Crop" (Cover)
                  const scale = Math.max(canvas.width / vid.videoWidth, canvas.height / vid.videoHeight);
                  const w = vid.videoWidth * scale;
                  const h = vid.videoHeight * scale;
                  const x = (canvas.width - w) / 2;
                  const y = (canvas.height - h) / 2;
                  
                  ctx.drawImage(vid, x, y, w, h);
              }
          } catch (e) {}
      } else {
          // IMAGE RENDERING (Ken Burns)
          const cachedImg = imageCacheRef.current.get(currentScene.id);

          if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
                // Determine Scene Duration for Animation Speed
                // FIX: Use audio duration if available for smooth sync, else estimate
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
            // Placeholder gradient
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, `hsl(${hue}, 40%, 20%)`);
            gradient.addColorStop(1, `hsl(${(hue + 40) % 360}, 30%, 10%)`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
      }
      
      // 3. Vignette
      const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.height/3, canvas.width/2, canvas.height/2, canvas.height);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 4. SUBTITLES (Use Ref to avoid stale state)
      const showSubs = showSubtitlesRef.current;
      const subStyle = subtitleStyleRef.current;

      if (showSubs && currentScene.text && currentScene.text.trim().length > 0) {
        const isPortrait = format === VideoFormat.PORTRAIT;
        const fontSize = isPortrait ? 52 : 36;
        const lineHeight = fontSize * 1.3;
        const bottomMargin = isPortrait ? 280 : 90;
        const maxWidth = canvas.width * (isPortrait ? 0.85 : 0.7);
        
        ctx.font = `900 ${fontSize}px Inter, Impact, sans-serif`; 
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
        
        // FIX: Use Exact Audio Duration for timing
        let sceneDuration = currentScene.durationEstimate || 5;
        if (currentScene.audioBuffer) {
             // Add small buffer (0.2s) so last word stays on screen briefly
             sceneDuration = currentScene.audioBuffer.duration + 0.2; 
        }
        
        const totalWords = words.length;
        // Ensure index doesn't exceed words length
        const currentWordIndex = Math.min(totalWords - 1, Math.floor((elapsed / sceneDuration) * totalWords));
        
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
                
                if (subStyle === SubtitleStyle.CLASSIC) {
                     ctx.fillStyle = isActive ? '#fbbf24' : '#ffffff';
                     ctx.lineWidth = 6;
                     ctx.strokeStyle = 'black';
                     ctx.strokeText(w, currentX + (wordWidths[wIdx]/2), lineY);
                     ctx.fillText(w, currentX + (wordWidths[wIdx]/2), lineY);
                } 
                else if (subStyle === SubtitleStyle.NEON) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = isActive ? '#ffff00' : '#00ff00';
                    ctx.fillStyle = isActive ? '#ffffff' : '#ccffcc';
                    if (isPast) ctx.fillStyle = 'rgba(255,255,255,0.8)';
                    
                    ctx.fillText(w, currentX + (wordWidths[wIdx]/2), lineY);
                }
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

      // FIX: Use Audio Duration + Buffer for Scene Transition
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
    
    // Ensure Master Chain Exists
    if (!masterGainRef.current) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    // Connect to Master Bus (Compressor)
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

  const playMusic = () => {
    if (!musicBufferRef.current) return;
    
    // If music is already playing, do nothing (Continuous Loop)
    if (musicSourceRef.current) return;

    const ctx = getAudioContext();
    
    // Ensure Master Chain Exists
    if (!masterGainRef.current) return;

    const source = ctx.createBufferSource();
    source.buffer = musicBufferRef.current;
    source.loop = true;
    
    const gain = ctx.createGain();
    gain.gain.value = bgMusicVolume;
    
    // Connect Chain: Music -> MusicGain -> MasterBus
    source.connect(gain);
    gain.connect(masterGainRef.current);
    
    source.start(0);
    musicSourceRef.current = source;
    musicGainRef.current = gain;
  };

  const handleNextScene = () => {
    stopSpeech();
    cancelAnimationFrame(rafRef.current);
    startTimeRef.current = 0;
    
    if (currentSceneIndex < scenesRef.current.length - 1) {
      setCurrentSceneIndex(currentSceneIndex + 1);
    } else {
      setIsPlaying(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
      }
      if (onPlaybackComplete) onPlaybackComplete();
    }
  };

  // --- INDEPENDENT MUSIC EFFECT (CONTINUOUS) ---
  useEffect(() => {
      if (isPlaying && bgMusicUrl) {
          playMusic();
      } else {
          stopMusic();
      }
      // Only cleanup stops music if we are actually pausing the whole player
      return () => {
          // Do not stop music here if we are just re-rendering, let the effect logic decide based on isPlaying
      };
  }, [isPlaying, bgMusicUrl]); // DEPENDS ONLY ON PLAY STATE, NOT SCENE INDEX

  // Explicit stop when component unmounts or explicit pause
  useEffect(() => {
      if (!isPlaying) stopMusic();
  }, [isPlaying]);


  // --- SCENE & VISUAL EFFECT (RESTARTS ON SCENE CHANGE) ---
  useEffect(() => {
    if (isPlaying && scenes[currentSceneIndex]) {
      const currentScene = scenes[currentSceneIndex];

      // 1. Handle Video Element source if video type
      if (currentScene.mediaType === 'video' && currentScene.videoUrl && videoRef.current) {
          if (videoRef.current.src !== currentScene.videoUrl) {
              videoRef.current.src = currentScene.videoUrl;
              videoRef.current.load();
          }
          videoRef.current.play().catch(e => console.log("Video play interrupted", e));
      } else if (videoRef.current) {
          videoRef.current.pause();
      }

      // 2. Speech (Syncs with scene)
      if (currentScene.audioBuffer) {
        playSpeech(currentScene.audioBuffer);
      }

      // 3. Start Visual Loop
      startTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(draw);
      
    } else {
      cancelAnimationFrame(rafRef.current);
      stopSpeech();
      // DO NOT STOP MUSIC HERE
      if (videoRef.current) videoRef.current.pause();
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      stopSpeech();
      if (videoRef.current) videoRef.current.pause();
    };
  }, [isPlaying, currentSceneIndex]); // DEPENDS ON SCENE

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
          className="w-full h-full object-contain"
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
