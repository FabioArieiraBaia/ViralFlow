

import React, { useRef, useState, useEffect } from 'react';
import VideoPlayer, { VideoPlayerRef } from '../VideoPlayer';
import { 
  Scene, VideoFormat, VideoFilter, VideoTransition, SubtitleStyle, UserTier, OverlayConfig, 
  Language, MusicAction, ImageProvider, GeminiModel, PollinationsModel, VFXConfig, SubtitleSettings, SpeakerTagStyle, ALL_GEMINI_VOICES, GenerationPhase
} from '../../types';
import { 
  Palette, Music, Zap, Download, Smartphone, Monitor, Music2, ImagePlus, 
  RefreshCcw, Layers, ImagePlus as ImageIcon, Volume2, Trash2, CheckSquare, 
  Square as SquareIcon, MicOff, Edit2, Plus, Crown, Lock, Save, Film, ListMusic, User, Users,
  ClipboardCheck, AlertTriangle, CheckCircle2, XCircle, ThumbsUp, X, Image, Mic, ChevronLeft, ChevronRight
} from 'lucide-react';
import { translations } from '../../services/translations';
import { Loader2, AlertCircle } from 'lucide-react';

interface EditorTabProps {
  scenes: Scene[];
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
  currentSceneIndex: number;
  setCurrentSceneIndex: (idx: number) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  format: VideoFormat;
  setFormat: (v: VideoFormat) => void;
  
  // Music Playlist
  bgMusicUrl: string;
  setBgMusicUrl: (v: string) => void;
  bgMusicPlaylist: string[];
  setBgMusicPlaylist: (v: string[]) => void;
  
  bgMusicVolume: number;
  setBgMusicVolume: (v: number) => void;
  showSubtitles: boolean;
  setShowSubtitles: (v: boolean) => void;
  subtitleStyle: SubtitleStyle;
  setSubtitleStyle: (v: SubtitleStyle) => void;
  subtitleSettings?: SubtitleSettings;
  setSubtitleSettings?: (v: SubtitleSettings) => void;
  activeFilter: VideoFilter;
  setActiveFilter: (v: VideoFilter) => void;
  globalTransition: VideoTransition;
  setGlobalTransition: (v: VideoTransition) => void;
  globalVfx: VFXConfig;
  setGlobalVfx: (v: VFXConfig) => void;
  userTier: UserTier;
  channelLogo: OverlayConfig | undefined;
  setChannelLogo: (v: OverlayConfig | undefined) => void;
  isGenerating: boolean;
  isReviewing: boolean;
  handleForceRegenerateAll: () => void;
  handleExportScript: () => void;
  playerRef: React.RefObject<VideoPlayerRef>;
  lang: Language;
  setShowUpgradeModal: (v: boolean) => void;
  
  // Speaker Tags
  showSpeakerTags: boolean;
  setShowSpeakerTags: (v: boolean) => void;
  speakerTagStyle: SpeakerTagStyle;
  setSpeakerTagStyle: (v: SpeakerTagStyle) => void;
  
  // Timeline Actions
  selectedSceneIds: Set<string>;
  handleToggleSelectScene: (id: string) => void;
  handleSelectAll: () => void;
  handleBulkRegenerate: (type: 'images' | 'audio') => void;
  handleBulkDelete: () => void;
  handleAddScene: () => void;
  regenerateSceneAsset: (index: number, type: 'image') => void;
  setEditingScene: (s: Scene) => void;
  
  // New Approval Flow
  generationPhase?: GenerationPhase;
  onApproveScript?: (generateImagesFirst?: boolean) => void;
}

export const EditorTab: React.FC<EditorTabProps> = (props) => {
  const t = translations[props.lang];
  const [activeStudioTab, setActiveStudioTab] = useState<'visual'|'audio'|'brand'|'export'|'cast'>('visual');
  const [mobileView, setMobileView] = useState<'player' | 'timeline'>('player');
  const musicInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Stats for Reviewer
  const totalDuration = props.scenes.reduce((acc, s) => acc + (s.audioBuffer ? s.audioBuffer.duration : s.durationEstimate), 0);
  const missingAudioCount = props.scenes.filter(s => !s.audioUrl).length;
  const missingVisualCount = props.scenes.filter(s => !s.imageUrl && !s.videoUrl).length;
  const isReady = missingAudioCount === 0 && missingVisualCount === 0 && props.scenes.length > 0;

  // Cast Management State
  const [castList, setCastList] = useState<{original: string, newName: string, voice: string}[]>([]);

  // Initialize Cast List when scenes change
  useEffect(() => {
    const uniqueSpeakers = new Set(props.scenes.map(s => s.speaker));
    const cast = Array.from(uniqueSpeakers).map(speaker => {
      const scene = props.scenes.find(s => s.speaker === speaker);
      return {
        original: speaker,
        newName: speaker,
        voice: scene?.assignedVoice || 'Fenrir'
      };
    });
    setCastList(cast);
  }, [props.scenes.length]);

  const handleUpdateCast = () => {
    props.setScenes(prev => prev.map(scene => {
      const castMember = castList.find(c => c.original === scene.speaker);
      if (castMember) {
        return {
          ...scene,
          speaker: castMember.newName,
          assignedVoice: castMember.voice
        };
      }
      return scene;
    }));
    setCastList(prev => prev.map(c => ({...c, original: c.newName})));
    alert(t.castUpdated);
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newUrls = Array.from(files).map((f: any) => URL.createObjectURL(f));
      if (props.bgMusicPlaylist.length === 0 && newUrls.length > 0) {
        props.setBgMusicUrl(newUrls[0]);
      }
      props.setBgMusicPlaylist([...props.bgMusicPlaylist, ...newUrls]);
    }
  };

  const removeTrack = (index: number) => {
    const newList = props.bgMusicPlaylist.filter((_, i) => i !== index);
    props.setBgMusicPlaylist(newList);
    if (newList.length > 0) {
      props.setBgMusicUrl(newList[0]);
    } else {
      props.setBgMusicUrl("");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) props.setChannelLogo({ url: URL.createObjectURL(file), x: 0.8, y: 0.05, scale: 0.3 });
  };

  if (props.scenes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-tertiary)]">
        <div className="themed-text-secondary">{t.noScenesAvailable}</div>
      </div>
    );
  }

  const studioTabs = [
    { id: 'visual', label: 'Visual', icon: Palette },
    { id: 'audio', label: props.lang === 'pt' ? 'Áudio' : 'Audio', icon: Music },
    { id: 'cast', label: props.lang === 'pt' ? 'Elenco' : 'Cast', icon: Users },
    { id: 'brand', label: 'Brand', icon: Zap },
    { id: 'export', label: props.lang === 'pt' ? 'Baixar' : 'Export', icon: Download }
  ];

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full items-start overflow-hidden relative animate-in fade-in duration-500">
      
      {/* === MOBILE VIEW TOGGLE === */}
      <div className="lg:hidden w-full flex border-b themed-border bg-[var(--bg-secondary)]">
        <button 
          onClick={() => setMobileView('player')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors touch-target ${
            mobileView === 'player' ? 'themed-accent bg-[var(--accent-primary)]/10' : 'themed-text-secondary'
          }`}
        >
          <Film className="w-4 h-4" /> Player
        </button>
        <button 
          onClick={() => setMobileView('timeline')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors touch-target ${
            mobileView === 'timeline' ? 'themed-accent bg-[var(--accent-primary)]/10' : 'themed-text-secondary'
          }`}
        >
          <Layers className="w-4 h-4" /> Timeline ({props.scenes.length})
        </button>
      </div>

      {/* === LEFT COLUMN: PLAYER & CONTROLS === */}
      <div className={`w-full lg:w-1/2 xl:w-2/5 bg-[var(--bg-primary)] flex flex-col items-center border-r themed-border z-10 lg:h-full overflow-y-auto custom-scrollbar hide-scrollbar-mobile ${mobileView === 'timeline' ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* PLAYER */}
        <div className="w-full p-4 md:p-6 pb-0">
          <div className="w-full max-w-[400px] mx-auto shadow-2xl rounded-lg overflow-hidden border themed-border">
            <VideoPlayer 
              ref={props.playerRef}
              scenes={props.scenes}
              currentSceneIndex={props.currentSceneIndex}
              setCurrentSceneIndex={props.setCurrentSceneIndex}
              isPlaying={props.isPlaying}
              setIsPlaying={props.setIsPlaying}
              format={props.format}
              bgMusicUrl={props.bgMusicUrl}
              bgMusicPlaylist={props.bgMusicPlaylist}
              bgMusicVolume={props.bgMusicVolume}
              showSubtitles={props.showSubtitles}
              subtitleStyle={props.subtitleStyle}
              subtitleSettings={props.subtitleSettings}
              activeFilter={props.activeFilter}
              globalTransition={props.globalTransition}
              globalVfx={props.globalVfx}
              userTier={props.userTier}
              onPlaybackComplete={() => props.setIsPlaying(false)}
              channelLogo={props.channelLogo}
              showSpeakerTags={props.showSpeakerTags}
              speakerTagStyle={props.speakerTagStyle}
              onUpdateChannelLogo={props.setChannelLogo}
              onUpdateSceneOverlay={(id, cfg) => {
                props.setScenes(prev => prev.map(s => s.id === id ? { ...s, overlay: cfg } : s));
              }}
            />
          </div>
        </div>

        {/* STUDIO TABS */}
        <div className="w-full p-4 md:p-6 pt-4 md:pt-6 pb-20 lg:pb-6">
          <div className="bg-[var(--bg-secondary)] border themed-border rounded-xl shadow-sm overflow-hidden">
            <div className="flex border-b themed-border bg-[var(--bg-tertiary)] overflow-x-auto hide-scrollbar-mobile">
              {studioTabs.map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveStudioTab(tab.id as any)} 
                  className={`flex-1 min-w-[60px] py-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 touch-target ${
                    activeStudioTab === tab.id 
                      ? 'bg-[var(--bg-secondary)] themed-accent border-b-2 border-[var(--accent-primary)]' 
                      : 'themed-text-secondary hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <tab.icon className="w-3 h-3" /> <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="p-4 md:p-5 space-y-4 md:space-y-5 min-h-[250px]">
              
              {/* CAST (ELENCO) */}
              {activeStudioTab === 'cast' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  <h4 className="text-xs font-bold themed-text-secondary uppercase flex items-center gap-2">
                    <Users className="w-4 h-4"/> {t.editCastBulk}
                  </h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                    {castList.map((member, idx) => (
                      <div key={idx} className="bg-[var(--bg-tertiary)] p-3 rounded-lg border themed-border space-y-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold themed-text-secondary uppercase">{t.nameAllScenes}</label>
                          <input 
                            value={member.newName} 
                            onChange={(e) => {
                              const newVal = e.target.value;
                              setCastList(prev => prev.map((c, i) => i === idx ? {...c, newName: newVal} : c));
                            }}
                            className="w-full bg-[var(--bg-primary)] border themed-border rounded p-1.5 text-xs font-bold themed-text touch-target"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold themed-text-secondary uppercase">{t.assignedVoice}</label>
                          <select 
                            value={member.voice}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              setCastList(prev => prev.map((c, i) => i === idx ? {...c, voice: newVal} : c));
                            }}
                            className="w-full bg-[var(--bg-primary)] border themed-border rounded p-1.5 text-[10px] themed-text touch-target"
                          >
                            {ALL_GEMINI_VOICES.map(v => (
                              <option key={v.id} value={v.id}>{v.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleUpdateCast} className="w-full py-2 themed-btn rounded-lg text-xs font-bold shadow-md transition-colors touch-target">
                    {t.applyChanges}
                  </button>
                  <p className="text-[9px] themed-text-secondary text-center">{t.castNote}</p>
                </div>
              )}

              {/* VISUAL */}
              {activeStudioTab === 'visual' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div>
                    <label className="text-[10px] font-bold themed-text-secondary uppercase mb-2 block">{t.screenFormat}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => props.setFormat(VideoFormat.PORTRAIT)} className={`flex items-center justify-center gap-2 py-2 rounded-lg border transition-all touch-target ${props.format === VideoFormat.PORTRAIT ? 'themed-btn' : 'bg-[var(--bg-tertiary)] themed-text-secondary themed-border'}`}>
                        <Smartphone className="w-4 h-4" /> <span className="text-xs font-bold">{t.vertical}</span>
                      </button>
                      <button onClick={() => props.setFormat(VideoFormat.LANDSCAPE)} className={`flex items-center justify-center gap-2 py-2 rounded-lg border transition-all touch-target ${props.format === VideoFormat.LANDSCAPE ? 'themed-btn' : 'bg-[var(--bg-tertiary)] themed-text-secondary themed-border'}`}>
                        <Monitor className="w-4 h-4" /> <span className="text-xs font-bold">{t.horizontal}</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold themed-text-secondary uppercase mb-2 block">{t.globalFilter}</label>
                      <select value={props.activeFilter} onChange={(e) => props.setActiveFilter(e.target.value as VideoFilter)} className="w-full bg-[var(--bg-tertiary)] border themed-border rounded-lg p-2 text-xs themed-text outline-none touch-target">
                        {Object.values(VideoFilter).map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold themed-text-secondary uppercase mb-2 block">{t.defaultTransition}</label>
                      <select value={props.globalTransition} onChange={(e) => props.setGlobalTransition(e.target.value as VideoTransition)} className="w-full bg-[var(--bg-tertiary)] border themed-border rounded-lg p-2 text-xs themed-text outline-none touch-target">
                        {Object.values(VideoTransition).map(vt => <option key={vt} value={vt}>{vt}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  {/* Speaker Tag Control */}
                  <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg border themed-border space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold themed-text-secondary uppercase flex items-center gap-1"><User className="w-3 h-3"/> {t.showSpeaker}</label>
                      <button onClick={() => props.setShowSpeakerTags(!props.showSpeakerTags)} className={`w-10 h-5 rounded-full transition-colors relative touch-target ${props.showSpeakerTags ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-elevated)]'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${props.showSpeakerTags ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </button>
                    </div>
                    {props.showSpeakerTags && (
                      <div className="animate-in slide-in-from-top-2">
                        <label className="text-[9px] font-bold themed-text-secondary mb-1 block">{t.speakerStyle}</label>
                        <select value={props.speakerTagStyle} onChange={(e) => props.setSpeakerTagStyle(e.target.value as SpeakerTagStyle)} className="w-full bg-[var(--bg-primary)] border themed-border rounded p-1 text-xs themed-text touch-target">
                          {Object.values(SpeakerTagStyle).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-bold themed-text-secondary uppercase">{t.globalSubtitles}</label>
                      <button onClick={() => props.setShowSubtitles(!props.showSubtitles)} className={`w-10 h-5 rounded-full transition-colors relative touch-target ${props.showSubtitles ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-elevated)]'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${props.showSubtitles ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </button>
                    </div>
                    {props.showSubtitles && (
                      <div className="space-y-3">
                        <select value={props.subtitleStyle} onChange={(e) => props.setSubtitleStyle(e.target.value as SubtitleStyle)} className="w-full bg-[var(--bg-tertiary)] border themed-border rounded-lg p-2 text-xs themed-text outline-none touch-target">
                          {Object.values(SubtitleStyle).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        
                        {props.subtitleSettings && props.setSubtitleSettings && (
                          <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg border themed-border space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="flex justify-between text-[10px] themed-text-secondary mb-1">
                                  <span>{t.fontSize}</span>
                                  <span>{Math.round(props.subtitleSettings.fontSizeMultiplier * 100)}%</span>
                                </div>
                                <input type="range" min="0.5" max="2.0" step="0.1" value={props.subtitleSettings.fontSizeMultiplier} onChange={(e) => props.setSubtitleSettings!({...props.subtitleSettings!, fontSizeMultiplier: parseFloat(e.target.value)})} className="w-full h-1 bg-[var(--bg-elevated)] rounded appearance-none accent-[var(--accent-primary)]" />
                              </div>
                              <div>
                                <div className="flex justify-between text-[10px] themed-text-secondary mb-1">
                                  <span>{t.verticalPosition}</span>
                                  <span>{Math.round(props.subtitleSettings.yPosition * 100)}%</span>
                                </div>
                                <input type="range" min="0.1" max="0.95" step="0.01" value={props.subtitleSettings.yPosition} onChange={(e) => props.setSubtitleSettings!({...props.subtitleSettings!, yPosition: parseFloat(e.target.value)})} className="w-full h-1 bg-[var(--bg-elevated)] rounded appearance-none accent-[var(--accent-primary)]" />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold themed-text-secondary mb-1 block">{t.fontFamily}</label>
                              <select value={props.subtitleSettings.fontFamily} onChange={(e) => props.setSubtitleSettings!({...props.subtitleSettings!, fontFamily: e.target.value})} className="w-full bg-[var(--bg-primary)] border themed-border rounded p-1 text-xs themed-text touch-target">
                                <option value="Inter">{t.fontInter}</option>
                                <option value="Montserrat">{t.fontMontserrat}</option>
                                <option value="Oswald">{t.fontOswald}</option>
                                <option value="Playfair Display">{t.fontPlayfair}</option>
                                <option value="JetBrains Mono">{t.fontJetBrains}</option>
                                <option value="Comic Neue">{t.fontComic}</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="pt-2 border-t themed-border">
                    <label className="text-[10px] font-bold themed-text-secondary uppercase mb-3 block flex items-center gap-1"><Film className="w-3 h-3"/> {t.globalVfx}</label>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-[10px] themed-text-secondary mb-1">
                          <span>{t.vignette}</span>
                          <span>{Math.round(props.globalVfx.vignetteIntensity * 100)}%</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.1" value={props.globalVfx.vignetteIntensity} onChange={(e) => props.setGlobalVfx({...props.globalVfx, vignetteIntensity: parseFloat(e.target.value)})} className="w-full h-1 bg-[var(--bg-elevated)] rounded appearance-none accent-[var(--accent-primary)]" />
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] themed-text-secondary mb-1">
                          <span>{t.filmGrain}</span>
                          <span>{Math.round(props.globalVfx.filmGrain * 100)}%</span>
                        </div>
                        <input type="range" min="0" max="0.5" step="0.05" value={props.globalVfx.filmGrain} onChange={(e) => props.setGlobalVfx({...props.globalVfx, filmGrain: parseFloat(e.target.value)})} className="w-full h-1 bg-[var(--bg-elevated)] rounded appearance-none accent-[var(--accent-primary)]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AUDIO */}
              {activeStudioTab === 'audio' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg border themed-border text-center cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors touch-target" onClick={() => musicInputRef.current?.click()}>
                    <Music2 className="w-6 h-6 themed-accent mx-auto mb-2" />
                    <p className="text-xs font-bold themed-text">{t.addMusicPlaylist}</p>
                    <p className="text-[10px] themed-text-secondary mt-1">{t.mp3WavMultiple}</p>
                    <input type="file" multiple ref={musicInputRef} onChange={handleMusicUpload} className="hidden" accept="audio/*" />
                  </div>
                  
                  {props.bgMusicPlaylist.length > 0 && (
                    <div className="space-y-4">
                      <div className="bg-[var(--bg-tertiary)] border themed-border rounded-lg p-2 max-h-40 overflow-y-auto custom-scrollbar">
                        <h4 className="text-[10px] font-bold themed-text-secondary uppercase mb-2 flex items-center gap-1 px-2"><ListMusic className="w-3 h-3"/> {t.playlist} ({props.bgMusicPlaylist.length})</h4>
                        {props.bgMusicPlaylist.map((url, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded bg-[var(--bg-primary)] mb-1 border themed-border">
                            <span className="text-xs themed-text font-mono truncate w-40">{t.track} {idx + 1}</span>
                            <button onClick={() => removeTrack(idx)} className="text-[var(--error)] hover:bg-[var(--error)]/10 p-1 rounded touch-target"><Trash2 className="w-3 h-3"/></button>
                          </div>
                        ))}
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-2 font-medium themed-text"><span>{t.overallVolume}</span><span>{Math.round(props.bgMusicVolume * 100)}%</span></div>
                        <input type="range" min="0" max="0.5" step="0.01" value={props.bgMusicVolume} onChange={(e) => props.setBgMusicVolume(parseFloat(e.target.value))} className="w-full h-2 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* BRAND */}
              {activeStudioTab === 'brand' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg border themed-border text-center cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors touch-target" onClick={() => logoInputRef.current?.click()}>
                    {props.channelLogo ? <img src={props.channelLogo.url} className="h-10 mx-auto object-contain mb-2" /> : <ImagePlus className="w-6 h-6 themed-accent mx-auto mb-2" />}
                    <p className="text-xs font-bold themed-text">{props.channelLogo ? t.changeLogo : t.uploadChannelLogo}</p>
                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                  </div>
                  {props.channelLogo && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold themed-text-secondary uppercase mb-1 block">{t.positionX}</label>
                        <input type="range" min="0" max="1" step="0.01" value={props.channelLogo.x} onChange={(e) => props.setChannelLogo({...props.channelLogo!, x: parseFloat(e.target.value)})} className="w-full h-2 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold themed-text-secondary uppercase mb-1 block">{t.positionY}</label>
                        <input type="range" min="0" max="1" step="0.01" value={props.channelLogo.y} onChange={(e) => props.setChannelLogo({...props.channelLogo!, y: parseFloat(e.target.value)})} className="w-full h-2 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold themed-text-secondary uppercase mb-1 block">{t.sizeScale}</label>
                        <input type="range" min="0.1" max="2" step="0.1" value={props.channelLogo.scale} onChange={(e) => props.setChannelLogo({...props.channelLogo!, scale: parseFloat(e.target.value)})} className="w-full h-2 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]" />
                      </div>
                      <button onClick={() => props.setChannelLogo(undefined)} className="w-full py-2 text-xs font-bold text-[var(--error)] hover:bg-[var(--error)]/10 rounded transition-colors mt-2 touch-target">{t.removeLogo}</button>
                    </div>
                  )}
                </div>
              )}

              {/* EXPORT */}
              {activeStudioTab === 'export' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  
                  {/* REVISOR FINAL */}
                  <div className={`p-4 rounded-xl border ${isReady ? 'bg-[var(--success)]/5 border-[var(--success)]/30' : 'bg-[var(--warning)]/5 border-[var(--warning)]/30'} space-y-3`}>
                    <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2">
                      <ClipboardCheck className={`w-4 h-4 ${isReady ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`} />
                      <h4 className={`text-xs font-bold uppercase ${isReady ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>{t.finalQualityReviewer}</h4>
                    </div>
                    <ul className="space-y-1">
                      <li className="flex items-center justify-between text-xs">
                        <span className="themed-text-secondary">{t.totalScenes}:</span>
                        <span className="font-bold themed-text">{props.scenes.length}</span>
                      </li>
                      <li className="flex items-center justify-between text-xs">
                        <span className="themed-text-secondary">{t.estimatedDuration}:</span>
                        <span className="font-bold themed-text">{totalDuration.toFixed(1)}s</span>
                      </li>
                      <li className="flex items-center justify-between text-xs">
                        <span className="themed-text-secondary">{t.audioStatus}:</span>
                        <span className={`font-bold flex items-center gap-1 ${missingAudioCount === 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                          {missingAudioCount === 0 ? <CheckCircle2 className="w-3 h-3"/> : <AlertTriangle className="w-3 h-3"/>}
                          {missingAudioCount === 0 ? t.complete : `${missingAudioCount} ${t.missing}`}
                        </span>
                      </li>
                      <li className="flex items-center justify-between text-xs">
                        <span className="themed-text-secondary">{t.visualStatus}:</span>
                        <span className={`font-bold flex items-center gap-1 ${missingVisualCount === 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                          {missingVisualCount === 0 ? <CheckCircle2 className="w-3 h-3"/> : <AlertTriangle className="w-3 h-3"/>}
                          {missingVisualCount === 0 ? t.complete : `${missingVisualCount} ${t.missing}`}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <button onClick={() => props.playerRef.current?.startRecording(false)} disabled={props.isGenerating || props.isPlaying || props.isReviewing} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] themed-text font-bold transition-all text-sm disabled:opacity-50 shadow-lg touch-target">
                    <Download className="w-5 h-5" /> {t.exportHD}
                  </button>
                  <button onClick={() => { if(props.userTier === UserTier.FREE) { props.setShowUpgradeModal(true); } else { props.playerRef.current?.startRecording(true); } }} disabled={props.isGenerating || props.isPlaying || props.isReviewing} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold transition-all text-sm relative overflow-hidden group disabled:opacity-50 shadow-lg hover:shadow-amber-500/20 touch-target">
                    <Crown className="w-5 h-5" /> {t.export4kUltra} 
                    {props.userTier === UserTier.FREE && ( <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity"><Lock className="w-5 h-5 text-white" /></div> )}
                  </button>
                  <div className="pt-4 border-t themed-border">
                    <button onClick={props.handleExportScript} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border themed-border themed-text-secondary hover:themed-text text-xs font-medium transition-colors touch-target">
                      <Save className="w-4 h-4" /> {t.saveProjectJson}
                    </button>
                  </div>
                  <div className="mt-4 bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 rounded-lg p-3">
                    <div onClick={props.handleForceRegenerateAll} className="cursor-pointer flex items-center justify-between text-xs font-bold themed-accent hover:opacity-80 transition-colors touch-target">
                      <span className="flex items-center gap-2"><RefreshCcw className="w-3 h-3"/> {t.regenerateAll}</span>
                      <span>{props.isGenerating ? "..." : t.start}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === RIGHT COLUMN: TIMELINE === */}
      <div className={`flex-1 h-full bg-[var(--bg-secondary)] flex flex-col overflow-y-auto custom-scrollbar hide-scrollbar-mobile relative ${mobileView === 'player' ? 'hidden lg:flex' : 'flex'}`} id="timeline-container">
        <div className="p-3 md:p-4 border-b themed-border bg-[var(--bg-tertiary)] space-y-3 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <h3 className="font-bold themed-text flex items-center gap-2 text-sm md:text-base"><Layers className="w-4 h-4" /> {t.timeline}</h3>
              <button onClick={props.handleSelectAll} className="text-[10px] px-2 py-1 rounded bg-[var(--bg-elevated)] themed-text-secondary hover:bg-[var(--accent-primary)] hover:text-white transition-colors touch-target">
                {props.selectedSceneIds.size === props.scenes.length ? t.deselectAll : t.selectAll}
              </button>
            </div>
            <div className="flex gap-2 text-xs">
              <div className="bg-[var(--bg-elevated)] px-3 py-1 rounded-full themed-text-secondary font-medium">{t.scenes}: {props.scenes.length}</div>
            </div>
          </div>
          
          {props.selectedSceneIds.size > 0 && (
            <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
              <button onClick={() => props.handleBulkRegenerate('images')} className="flex-1 py-2 bg-[var(--bg-primary)] border themed-border rounded text-[10px] font-bold hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-center gap-1 touch-target">
                <ImageIcon className="w-3 h-3"/> {t.reImagine} ({props.selectedSceneIds.size})
              </button>
              <button onClick={() => props.handleBulkRegenerate('audio')} className="flex-1 py-2 bg-[var(--bg-primary)] border themed-border rounded text-[10px] font-bold hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-center gap-1 touch-target">
                <Volume2 className="w-3 h-3"/> {t.reDub} ({props.selectedSceneIds.size})
              </button>
              <button onClick={props.handleBulkDelete} className="px-3 py-2 bg-[var(--error)]/10 text-[var(--error)] rounded hover:bg-[var(--error)]/20 transition-colors touch-target"><Trash2 className="w-4 h-4"/></button>
            </div>
          )}
        </div>

        <div className="p-3 md:p-4 space-y-3 md:space-y-4 pb-32">
          {props.scenes.map((scene, index) => (
            <div 
              key={scene.id} 
              onClick={() => props.setCurrentSceneIndex(index)} 
              className={`group relative flex gap-3 md:gap-4 p-3 md:p-4 rounded-xl border transition-all cursor-pointer touch-target ${
                props.currentSceneIndex === index 
                  ? 'bg-[var(--accent-primary)]/5 border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]' 
                  : 'bg-[var(--bg-primary)] themed-border hover:border-[var(--border-accent)]'
              } ${props.selectedSceneIds.has(scene.id) ? 'bg-[var(--accent-primary)]/10' : ''}`}
            >
              <div 
                onClick={(e) => { e.stopPropagation(); props.handleToggleSelectScene(scene.id); }} 
                className="absolute -left-1 -top-1 md:-left-2 md:-top-2 z-30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1 md:p-2 cursor-pointer touch-target" 
                style={{ opacity: props.selectedSceneIds.has(scene.id) ? 1 : undefined }}
              >
                {props.selectedSceneIds.has(scene.id) ? (
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-[var(--accent-primary)] rounded-full flex items-center justify-center shadow-md">
                    <CheckSquare className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-[var(--bg-primary)] border themed-border rounded-full flex items-center justify-center shadow-md">
                    <SquareIcon className="w-3 h-3 md:w-4 md:h-4 themed-text-secondary" />
                  </div>
                )}
              </div>
              <div className="w-20 h-20 md:w-32 md:h-32 rounded-lg bg-black shrink-0 overflow-hidden relative border themed-border">
                {scene.isGeneratingImage ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-tertiary)]"><Loader2 className="w-6 h-6 themed-accent animate-spin" /></div>
                ) : scene.mediaType === 'video' && scene.videoUrl ? (
                  <video src={scene.videoUrl} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={scene.imageUrl} className="w-full h-full object-cover" loading="lazy" />
                )}
                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 rounded font-mono">{index + 1}</div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 md:py-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex flex-col">
                      <span className="text-[11px] md:text-xs font-bold themed-accent uppercase tracking-wide truncate max-w-[100px] md:max-w-none">{scene.speaker}</span>
                      <span className="text-[9px] themed-text-secondary">{scene.assignedVoice || 'Fenrir'}</span>
                    </div>
                    <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); props.regenerateSceneAsset(index, 'image'); }} className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded themed-text-secondary touch-target" title={t.regenerateImage}>
                        <RefreshCcw className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); props.setEditingScene(scene); }} className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded themed-text-secondary touch-target" title={t.editSceneBtn}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm themed-text-secondary line-clamp-2 md:line-clamp-3 leading-relaxed">{scene.text}</p>
                </div>
                <div className="flex items-center gap-2 md:gap-3 mt-2">
                  {scene.audioError ? (
                    <span className="text-[10px] text-[var(--error)] flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" /> {t.errorAudio}</span>
                  ) : scene.isGeneratingAudio ? (
                    <span className="text-[10px] themed-text-secondary flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> {t.generatingVoice}</span>
                  ) : scene.audioUrl ? (
                    <span className="text-[10px] text-[var(--success)] flex items-center gap-1 font-medium"><Volume2 className="w-3 h-3" /> {t.audioOk}</span>
                  ) : (
                    <span className="text-[10px] themed-text-secondary flex items-center gap-1 font-medium opacity-60"><MicOff className="w-3 h-3" /> {t.noAudio}</span>
                  )}
                  {scene.layers && scene.layers.length > 0 && (
                    <span className="text-[10px] text-[var(--warning)] flex items-center gap-1 font-medium"><Layers className="w-3 h-3" /> {scene.layers.length} {t.layers}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <button onClick={props.handleAddScene} className="w-full py-4 border-2 border-dashed themed-border rounded-xl flex items-center justify-center gap-2 themed-text-secondary hover:themed-accent hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all group touch-target">
            <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm">{t.addNewScene}</span>
          </button>
        </div>
      </div>

      {/* === APPROVAL BAR (Sticky Footer) === */}
      {props.generationPhase === 'script_approval' && (
        <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500 w-[95%] md:w-[90%] max-w-2xl">
          <div className="bg-[var(--bg-secondary)]/95 backdrop-blur-md border border-[var(--accent-primary)]/50 shadow-2xl rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 text-center md:text-left">
              <h3 className="themed-text font-bold text-base md:text-lg flex items-center justify-center md:justify-start gap-2">
                <CheckCircle2 className="w-5 h-5 themed-accent" /> {t.scriptApproval}
              </h3>
              <p className="themed-text-secondary text-[11px] md:text-xs mt-1">
                {t.reviewSceneText}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <p className="themed-text-secondary text-[10px] md:text-xs text-center mb-1">{t.chooseGenerationOrder}</p>
              <div className="flex gap-2 w-full">
                <button 
                  onClick={() => props.onApproveScript?.(false)}
                  className="flex-1 px-3 md:px-4 py-3 themed-btn rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 touch-target text-sm"
                >
                  <Mic className="w-4 h-4" /> {t.audioFirst}
                </button>
                <button 
                  onClick={() => props.onApproveScript?.(true)}
                  className="flex-1 px-3 md:px-4 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 touch-target text-sm"
                >
                  <Image className="w-4 h-4" /> {t.imagesFirst}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
