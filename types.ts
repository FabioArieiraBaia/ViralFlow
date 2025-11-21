

export type Language = 'pt' | 'en' | 'es';
export type Theme = 'light' | 'dark';

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
  HISTORY = 'Pintura Clássica a Óleo'
}

export enum VideoPacing {
  HYPER = 'Frenético (TikTok/Shorts - Cortes 2s)',
  FAST = 'Rápido (YouTuber Dinâmico - Cortes 4s)',
  NORMAL = 'Narrativo (Padrão TV - Cortes 6s)',
  SLOW = 'Contemplativo (Documentário - Cortes 8s+)'
}

export enum VideoDuration {
  SHORT = 'Shorts Viral (< 60s)',
  MEDIUM = 'Explicação (2-5 min)',
  LONG = 'Deep Dive (10 min+)'
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
  NONE = 'Desativado' 
}

export enum VideoFilter {
  NONE = 'Normal',
  VHS = 'VHS Retro (Anos 90)',
  VINTAGE = 'Filme Antigo (1950)',
  CYBERPUNK = 'Cyberpunk (Neon/Azul)',
  NOIR = 'Noir (Preto e Branco)',
  DREAMY = 'Sonho (Glow Suave)'
}

export enum ParticleEffect {
  NONE = 'Nenhum',
  SNOW = 'Neve',
  RAIN = 'Chuva',
  EMBERS = 'Brasas (Fogo)',
  CONFETTI = 'Confete',
  DUST = 'Poeira Flutuante'
}

export enum MusicAction {
  CONTINUE = 'Continuar Anterior',
  START_NEW = 'Iniciar Nova Música',
  STOP = 'Parar Música'
}

export enum ImageProvider {
  GEMINI = 'Gemini 2.5 Flash (Google)',
  POLLINATIONS = 'Pollinations.ai (Flux/SD - Grátis)',
  STOCK_VIDEO = 'Stock Video (Pexels - Real)',
  UPLOAD = 'Upload Próprio (Arquivo Local)'
}

export enum UserTier {
  FREE = 'FREE',
  PRO = 'PRO'
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

export interface Scene {
  id: string;
  speaker: string; 
  text: string;
  visualPrompt: string;
  durationEstimate: number;
  assignedVoice?: string; // Voz persistente do personagem (Elenco)
  
  // Generated Assets
  mediaType: 'image' | 'video';
  imageUrl?: string; // Usado para preview na sidebar e fallback
  videoUrl?: string; // Usado se mediaType for video
  
  imagePath?: string; // Caminho local
  audioUrl?: string; 
  audioPath?: string; // Caminho local
  audioBuffer?: AudioBuffer;
  
  // Effects & Post-Processing
  particleEffect?: ParticleEffect;
  musicConfig?: SceneMusicConfig;

  isGeneratingImage: boolean;
  isGeneratingAudio: boolean;
  audioError?: boolean; // Flag to indicate if TTS failed
}

export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
}

export interface ProjectState {
  topic: string;
  channelName: string;
  style: VideoStyle;
  pacing: VideoPacing;
  voice: string;
  duration: VideoDuration;
  format: VideoFormat;
  scenes: Scene[];
  
  // Audio Fields (Global fallback)
  bgMusicUrl?: string;
  bgMusicVolume: number;
  
  // Subtitles
  showSubtitles: boolean;
  subtitleStyle: SubtitleStyle;
  
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
  visual_prompt: string;
}