

export type Language = 'pt' | 'en' | 'es';
export type Theme = 'dark' | 'clean' | 'creator';

// POLLINATIONS MODELS
// Public: Image models
// Admin Only: Video models (mapped via API)
export type PollinationsModel = 
  | 'flux' 
  | 'flux-realism' 
  | 'flux-anime' 
  | 'flux-3d' 
  | 'flux-cne' 
  | 'turbo' 
  | 'midjourney' 
  | 'any-dark'
  // Video Models (Admin)
  | 'veo' 
  | 'luma' 
  | 'kling' 
  | 'runway'
  | 'seedance'
  | 'seedance-pro';

export type GeminiModel = 'gemini-2.5-flash-image' | 'imagen-3.0-generate-001'; // Deprecated but kept for type safety in old signatures
export type GeminiTTSModel = 'gemini-2.5-flash-preview-tts' | 'gemini-2.5-pro-tts';

// --- GOOGLE GEMINI VOICE LIST ---
// Atualizado conforme documentação oficial
export const ALL_GEMINI_VOICES = [
  // --- MASCULINO (MALE) ---
  { id: 'Fenrir', label: '🎙️ Fenrir (Masc. Épico/Claro)', gender: 'male' },
  { id: 'Puck', label: '👦 Puck (Masc. Animado/Jovem)', gender: 'male' }, // CORRIGIDO: Puck é masculino
  { id: 'Charon', label: '💀 Charon (Masc. Grave/Confiável)', gender: 'male' },
  { id: 'Orus', label: '👔 Orus (Masc. Firme/Autoridade)', gender: 'male' },
  { id: 'Enceladus', label: '💨 Enceladus (Masc. Sopro/Breathy)', gender: 'male' }, // Confirmado Masc
  { id: 'Zubenelgenubi', label: '🦁 Zubenelgenubi (Masc. Profundo/Sério)', gender: 'male' },
  { id: 'Algenib', label: '🗿 Algenib (Masc. Rouco/Gravelly)', gender: 'male' },
  { id: 'Alnilam', label: '🛡️ Alnilam (Masc. Firme)', gender: 'male' },
  { id: 'Iapetus', label: '📢 Iapetus (Masc. Limpo)', gender: 'male' },
  { id: 'Umbriel', label: '🔊 Umbriel (Masc. Ressonante)', gender: 'male' },
  { id: 'Gacrux', label: '👨‍💼 Gacrux (Masc. Adulto)', gender: 'male' },
  { id: 'Achernar', label: '🧔 Achernar (Masc. Suave)', gender: 'male' },
  { id: 'Achird', label: '🤝 Achird (Masc. Amigável)', gender: 'male' },
  { id: 'Algieba', label: '🎷 Algieba (Masc. Suave/Smooth)', gender: 'male' },
  { id: 'Rasalgethi', label: '📚 Rasalgethi (Masc. Informativo)', gender: 'male' },
  { id: 'Schedar', label: '⚖️ Schedar (Masc. Uniforme)', gender: 'male' },
  
  // --- FEMININO (FEMALE) ---
  { id: 'Zephyr', label: '🌬️ Zephyr (Fem. Calma/Suave)', gender: 'female' }, // CORRIGIDO: Zephyr é feminino
  { id: 'Kore', label: '🧬 Kore (Fem. Tech/Firme)', gender: 'female' },
  { id: 'Aoede', label: '🎭 Aoede (Fem. Dramática/Leve)', gender: 'female' },
  { id: 'Leda', label: '👧 Leda (Fem. Jovem)', gender: 'female' },
  { id: 'Autonoe', label: '✨ Autonoe (Fem. Brilhante)', gender: 'female' },
  { id: 'Callirrhoe', label: '🍃 Callirrhoe (Fem. Tranquila)', gender: 'female' },
  { id: 'Despina', label: '🌊 Despina (Fem. Suave)', gender: 'female' },
  { id: 'Erinome', label: '💎 Erinome (Fem. Limpa)', gender: 'female' },
  { id: 'Laomedeia', label: '🎉 Laomedeia (Fem. Animada/Upbeat)', gender: 'female' },
  { id: 'Pulcherrima', label: '🎤 Pulcherrima (Fem. Projetada)', gender: 'female' },
  { id: 'Sulafat', label: '🔥 Sulafat (Fem. Quente)', gender: 'female' },
  { id: 'Vindemiatrix', label: '🤍 Vindemiatrix (Fem. Gentil)', gender: 'female' },
  { id: 'Sadachbia', label: '⚡ Sadachbia (Fem. Vivaz)', gender: 'female' },
  { id: 'Sadaltager', label: '🧠 Sadaltager (Fem. Conhecedora)', gender: 'female' }
];

export type GenerationPhase = 'idle' | 'scripting' | 'script_approval' | 'audio_processing' | 'ready_for_visuals' | 'visual_processing' | 'done';

export enum VideoStyle {
  SCARY = 'Terror Analógico (Creepypasta)',
  DOCUMENTARY = 'Cinematográfico Realista (Estilo NatGeo/BBC)',
  MOTIVATIONAL = 'Estoicismo/Dark Motivation',
  TECH_NEWS = 'Tech Futurista (Cyberpunk)',
  MEME = 'Shitpost/Caótico (Gen Z)',
  STORY = 'Animação 3D (Estilo Pixar)',
  CURIOSITY = 'Você Sabia? (Curiosidades Rápidas)',
  MYSTERY = 'True Crime (Investigativo)',
  RELAX = 'Natureza 8K (Relaxamento)',
  HISTORY = 'Pintura Clássica a Óleo',
  PROFESSOR = 'Professor / Tutorial (Didático)',
  NEWS = 'Reportagem / Jornalismo (TV News)',
  KIDS_STORY = 'História Infantil (Multi-Voz / Fábula)',
  DEBATE = 'Debate / Podcast (Host vs Convidado)'
}

export enum VideoPacing {
  HYPER = 'Frenético (TikTok/Shorts - Cortes 2s)',
  FAST = 'Rápido (YouTuber Dinâmico - Cortes 4s)',
  NORMAL = 'Narrativo (Padrão TV - Cortes 6s)',
  SLOW = 'Contemplativo (Documentário - Cortes 8s+)'
}

export enum VisualIntensity {
  LOW = 'Estático (1 Imagem/Cena)',
  MEDIUM = 'Dinâmico (A cada 4-5s)',
  HIGH = 'Intenso (A cada 2-3s)',
  HYPER = 'Insano (A cada 1-2s)'
}

export enum VideoDuration {
  SHORT = 'Shorts Viral (< 60s)',
  MEDIUM = 'Explicação (2-5 min)',
  LONG = 'Deep Dive (10 min+)',
  MOVIE = '🎬 Filme / Documentário (Longa Metragem)'
}

export enum VideoFormat {
  LANDSCAPE = 'Horizontal (YouTube 16:9)',
  PORTRAIT = 'Vertical (Shorts/Reels 9:16)'
}

export enum SubtitleStyle {
  MODERN = 'Moderno (Caixa Escura)',
  CLASSIC = 'Clássico (Borda Preta)',
  NEON = 'Neon (Brilho Colorido)',
  KARAOKE = 'Karaoke (Highlight Dinâmico)',
  GLITCH = 'Glitch (Cyberpunk)',
  COMIC = 'Comic (Quadrinhos)',
  WORD_BY_WORD = 'Palavra por Palavra (Speed Reading)',
  NONE = 'Desativado' 
}

export enum SpeakerTagStyle {
  CINEMATIC = 'Cinematic (Clean)',
  BOXED = 'Boxed (Solid Tag)',
  NEON = 'Neon Glow',
  BUBBLE = 'Speech Bubble',
  TV_NEWS = 'TV News (Lower Third)'
}

export enum VideoFilter {
  NONE = 'Normal',
  VHS = 'VHS Retro (Anos 90)',
  VINTAGE = 'Filme Antigo (1950)',
  CYBERPUNK = 'Cyberpunk (Neon/Azul)',
  NOIR = 'Noir (Preto e Branco)',
  DREAMY = 'Sonho (Glow Suave)',
  SEPIA = 'Sépia (Western)',
  COLD = 'Frio (Cinemático Azul)',
  WARM = 'Quente (Golden Hour)',
  HIGH_CONTRAST = 'Alto Contraste (Dramático)',
  NEURAL_CINEMATIC = '🧠 Neural Cinematic (Audio-Reactive)'
}

export enum ColorGradingPreset {
  NONE = 'Nenhum',
  TEAL_ORANGE = 'Teal & Orange (Cinema)',
  MATRIX = 'Matrix (Verde Tech)',
  DRAMATIC_BW = 'Dramático P&B',
  GOLDEN_HOUR = 'Golden Hour (Quente)',
  FADED_FILM = 'Filme Desbotado',
  CYBER_NEON = 'Cyber Neon (Roxo/Azul)'
}

export enum VideoTransition {
  NONE = 'Corte Seco (Cut)',
  FADE = 'Fade / Dissolver',
  SLIDE = 'Deslizar (Slide)',
  WIPE = 'Limpar (Wipe)',
  ZOOM = 'Zoom In/Out',
  GLITCH = 'Glitch Digital',
  PIXELATE = 'Pixelização',
  CURTAIN = 'Cortinas (Teatro)',
  AUTO = '🤖 IA Auto (Aleatório)'
}

export enum CameraMovement {
  STATIC = 'STATIC',
  ZOOM_IN = 'ZOOM_IN',
  ZOOM_OUT = 'ZOOM_OUT',
  PAN_LEFT = 'PAN_LEFT',
  PAN_RIGHT = 'PAN_RIGHT',
  ROTATE_CW = 'ROTATE_CW',
  ROTATE_CCW = 'ROTATE_CCW',
  HANDHELD = 'HANDHELD'
}

export enum ParticleEffect {
  NONE = 'Nenhum',
  SNOW = 'Neve',
  RAIN = 'Chuva',
  EMBERS = 'Brasas (Fogo)',
  CONFETTI = 'Confete',
  DUST = 'Poeira Flutuante',
  // Specific 3D Object Types
  FLOATING_HEARTS = '3D Corações (Amor)',
  FLOATING_LIKES = '3D Likes (Social)',
  FLOATING_STARS = '3D Estrelas (Mágica)',
  FLOATING_MUSIC = '3D Notas (Música)',
  FLOATING_MONEY = '3D Dinheiro (Business)'
}

export enum MusicAction {
  CONTINUE = 'Continuar Anterior',
  START_NEW = 'Iniciar Nova Música',
  STOP = 'Parar Música'
}

export enum ImageProvider {
  NONE = 'Apenas Roteiro (Sem Imagem)',
  POLLINATIONS = 'Pollinations.ai (Flux/Veo/Luma)',
  STOCK_VIDEO = 'Stock Video (Pexels - Real)',
  UPLOAD = 'Upload Próprio (Arquivo Local)'
}

export enum UserTier {
  FREE = 'FREE',
  PRO = 'PRO'
}

export enum LayerAnimation {
  NONE = 'Nenhum',
  FADE = 'Fade (Suave)',
  SLIDE_UP = 'Slide Cima',
  SLIDE_DOWN = 'Slide Baixo',
  SLIDE_LEFT = 'Slide Esq',
  SLIDE_RIGHT = 'Slide Dir',
  SCALE = 'Pop / Scale',
  TYPEWRITER = 'Datilografar (Texto)'
}

export interface Soundtrack {
  id: string;
  label: string;
  url: string; // URL remota ou path local
  tags: VideoStyle[]; // Estilos que essa música suporta
}

export interface SceneMusicConfig {
  action: MusicAction;
  trackId?: string; // ID from STOCK_LIBRARY or 'custom'
  customUrl?: string; // If user uploaded specific track
  volume: number; // 0.0 to 1.0
}

export interface AudioLayer {
  id: string;
  name: string;
  url: string;
  volume: number; // 0.0 to 1.0
  startTime: number; // Delay in seconds relative to scene start
  type: 'sfx' | 'voiceover';
}

export interface Keyframe {
  id: string;
  time: number; // 0.0 to 1.0 (relative to scene duration)
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

export interface LayerConfig {
  id: string;
  type: 'image' | 'text' | 'video'; 
  // Common properties
  name: string;
  x: number; // 0.0 to 1.0
  y: number; // 0.0 to 1.0
  scale: number; // 0.1 to 5.0
  rotation: number; // degrees
  opacity: number; // 0.0 to 1.0
  blendMode?: GlobalCompositeOperation;
  
  // Animation
  keyframes?: Keyframe[];
  entryEffect?: LayerAnimation;
  entryDuration?: number; // Duration of entry in seconds (Default 1.0)
  
  exitEffect?: LayerAnimation;
  exitDuration?: number; // Duration of exit in seconds (Default 1.0)
  
  animationDuration?: number; // Deprecated, kept for compat

  // Visibility Timing (Sequencing)
  startTime?: number; // Seconds relative to scene start
  endTime?: number;   // Seconds relative to scene start

  // SPECIAL FLAG: TREAT AS BACKGROUND (FULL SCREEN COVER)
  isBackground?: boolean; 

  // Video Specific (Trimming)
  trimStart?: number; // Start time in seconds
  trimEnd?: number;   // End time in seconds
  totalDuration?: number; // Original video duration (cached)

  // Shadow Effects
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;

  // Image/Video specific
  url?: string;
  base64?: string; // Base64 data for persistence (blob URLs expire)
  hasVideo?: boolean; // Flag indicating video was present but base64 excluded due to size (JSON export)
  
  // Text specific
  text?: string;
  fontSize?: number;
  fontColor?: string;
  fontFamily?: string;
  fontWeight?: string; // 'bold' | 'normal'
  textShadow?: boolean;
}

// Deprecated overlay config kept for migration if needed, but we prefer LayerConfig[]
export interface OverlayConfig {
  url: string;
  x: number; 
  y: number; 
  scale: number; 
  opacity?: number; 
}

export interface VFXConfig {
  shakeIntensity: number; // 0 to 10
  chromaticAberration: number; // 0 to 10
  bloomIntensity: number; // 0 to 1
  vignetteIntensity: number; // 0 to 1
  filmGrain: number; // 0 to 1
}

export interface SubtitleSettings {
  fontSizeMultiplier: number; // 0.5 to 2.0 (Default 1.0)
  yPosition: number; // 0.0 to 1.0 (Default 0.9 - Bottom)
  fontFamily: string; // Font Family string
}

export interface Scene {
  id: string;
  speaker: string; 
  text: string;
  visualPrompt: string;
  durationEstimate: number; // Seconds (Float)
  assignedVoice?: string; // Voz persistente do personagem (Elenco)
  ttsStyle?: string; // NEW: Instrução de estilo para a IA (Ex: "Animado", "Sussurrando")
  
  // Generated Assets
  mediaType: 'image' | 'video';
  imageUrl?: string; // Usado para preview na sidebar e fallback
  imageBase64?: string; // SAVED FOR JSON EXPORT
  videoUrl?: string; // Usado se mediaType for video
  videoBase64?: string; // SAVED FOR JSON EXPORT (null in new exports - videos too large)
  hasVideo?: boolean; // Flag indicating video was present but base64 excluded due to size (JSON export)
  
  imagePath?: string; // Caminho local
  audioUrl?: string; 
  audioBase64?: string; // SAVED FOR JSON EXPORT
  audioPath?: string; // Caminho local
  audioBuffer?: AudioBuffer;
  
  // Effects & Post-Processing
  cameraMovement?: CameraMovement;
  particleEffect?: ParticleEffect;
  musicConfig?: SceneMusicConfig;
  
  // New Layer System
  layers?: LayerConfig[]; 
  audioLayers?: AudioLayer[]; // NEW: Multiple audio tracks (SFX) per scene
  
  overlay?: OverlayConfig; // Legacy support (converted to layer 0)
  
  transition?: VideoTransition; // PRO Feature: Specific transition to next scene
  vfxConfig?: VFXConfig; // NEW: Advanced VFX per scene
  colorGrading?: ColorGradingPreset; // NEW: Cinematic Filters

  isGeneratingImage: boolean;
  isGeneratingAudio: boolean;
  audioError?: boolean; // Flag to indicate if TTS failed
}

export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
}

export interface ViralMetadataResult {
  titles: string[];
  description: string;
  tags: string; // Comma separated string for copy-paste
}

export interface ProjectState {
  topic: string;
  channelName: string;
  style: VideoStyle;
  pacing: VideoPacing;
  visualIntensity: VisualIntensity; // NEW: Controls image density
  voice: string;
  duration: VideoDuration;
  format: VideoFormat;
  contentLanguage: Language; // Idioma do Vídeo (Conteúdo)
  scenes: Scene[];
  
  // Audio Fields (Global fallback)
  bgMusicUrl?: string;
  bgMusicVolume: number;
  
  // TTS Settings
  ttsModel: GeminiTTSModel;
  globalTtsStyle: string; // Ex: "Narrador de documentário, tom sério"
  
  // Branding (Global)
  channelLogo?: OverlayConfig;

  // Transitions (Global)
  globalTransition: VideoTransition;

  // Subtitles
  showSubtitles: boolean;
  subtitleStyle: SubtitleStyle;
  subtitleSettings?: SubtitleSettings;
  
  // Speaker Tag
  showSpeakerTags: boolean;
  speakerTagStyle: SpeakerTagStyle;

  // Output
  metadata?: VideoMetadata;
  thumbnails: string[]; // Lista de URLs/Paths das thumbnails geradas
  localPath?: string;
  
  isPlaying: boolean;
  currentSceneIndex: number;
}

export interface GeneratedScriptItem {
  speaker: string;
  text: string;
  visual_prompt?: string; // Generated by Photography Director Agent after script approval
  cameraMovement?: string;
  gender?: 'male' | 'female'; // NEW: For better voice assignment
}