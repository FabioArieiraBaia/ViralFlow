import React, { useRef, useState } from 'react';
import VideoPlayer, { VideoPlayerRef } from '../VideoPlayer';
import { 
  Scene, VideoFormat, VideoFilter, VideoTransition, SubtitleStyle, UserTier, OverlayConfig, 
  Language, MusicAction, ImageProvider, GeminiModel, PollinationsModel, VFXConfig
} from '../../types';
import { 
  Palette, Music, Zap, Download, Smartphone, Monitor, Music2, ImagePlus, 
  RefreshCcw, Layers, ImagePlus as ImageIcon, Volume2, Trash2, CheckSquare, 
  Square as SquareIcon, MicOff, Edit2, Plus, Crown, Lock, Save, Film 
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
  bgMusicUrl: string;
  setBgMusicUrl: (v: string) => void;
  bgMusicVolume: number;
  setBgMusicVolume: (v: number) => void;
  showSubtitles: boolean;
  setShowSubtitles: (v: boolean) => void;
  subtitleStyle: SubtitleStyle;
  setSubtitleStyle: (v: SubtitleStyle) => void;
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
  
  // Timeline Actions
  selectedSceneIds: Set<string>;
  handleToggleSelectScene: (id: string) => void;
  handleSelectAll: () => void;
  handleBulkRegenerate: (type: 'images' | 'audio') => void;
  handleBulkDelete: () => void;
  handleAddScene: () => void;
  regenerateSceneAsset: (index: number, type: 'image') => void;
  setEditingScene: (s: Scene) => void;
}

export const EditorTab: React.FC<EditorTabProps> = (props) => {
  const t = translations[props.lang];
  const [activeStudioTab, setActiveStudioTab] = useState<'visual'|'audio'|'brand'|'export'>('visual');
  const musicInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) props.setBgMusicUrl(URL.createObjectURL(file));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) props.setChannelLogo({ url: URL.createObjectURL(file), x: 0.8, y: 0.05, scale: 0.3 });
  };

  if (props.scenes.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-black/50">
           <div className="text-zinc-500">Nenhuma cena disponível. Crie ou importe um projeto.</div>
        </div>
      );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full items-start overflow-hidden relative animate-in fade-in duration-500">
        
        {/* LEFT COLUMN: PLAYER & CONTROLS */}
        <div className="w-full md:w-1/2 lg:w-2/5 bg-zinc-100 dark:bg-black flex flex-col items-center border-r border-zinc-200 dark:border-zinc-800 z-10 md:h-full overflow-y-auto custom-scrollbar">
            
            {/* PLAYER */}
            <div className="w-full p-6 pb-0">
                <div className="w-full max-w-[400px] mx-auto shadow-2xl rounded-lg overflow-hidden border border-zinc-800">
                    <VideoPlayer 
                        ref={props.playerRef}
                        scenes={props.scenes}
                        currentSceneIndex={props.currentSceneIndex}
                        setCurrentSceneIndex={props.setCurrentSceneIndex}
                        isPlaying={props.isPlaying}
                        setIsPlaying={props.setIsPlaying}
                        format={props.format}
                        bgMusicUrl={props.bgMusicUrl}
                        bgMusicVolume={props.bgMusicVolume}
                        showSubtitles={props.showSubtitles}
                        subtitleStyle={props.subtitleStyle}
                        activeFilter={props.activeFilter}
                        globalTransition={props.globalTransition}
                        globalVfx={props.globalVfx}
                        userTier={props.userTier}
                        onPlaybackComplete={() => props.setIsPlaying(false)}
                        channelLogo={props.channelLogo}
                        onUpdateChannelLogo={props.setChannelLogo}
                        onUpdateSceneOverlay={(id, cfg) => {
                            props.setScenes(prev => prev.map(s => s.id === id ? { ...s, overlay: cfg } : s));
                        }}
                    />
                </div>
            </div>

            {/* STUDIO TABS */}
            <div className="w-full p-6 pt-6">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                        {[
                            { id: 'visual', label: 'Visual', icon: Palette },
                            { id: 'audio', label: 'Áudio', icon: Music },
                            { id: 'brand', label: 'Brand', icon: Zap },
                            { id: 'export', label: 'Baixar', icon: Download }
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setActiveStudioTab(tab.id as any)} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeStudioTab === tab.id ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                                <tab.icon className="w-3 h-3" /> {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-5 space-y-5 min-h-[250px]">
                        {/* VISUAL */}
                        {activeStudioTab === 'visual' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Formato de Tela</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => props.setFormat(VideoFormat.PORTRAIT)} className={`flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${props.format === VideoFormat.PORTRAIT ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}><Smartphone className="w-4 h-4" /> <span className="text-xs font-bold">Vertical</span></button>
                                        <button onClick={() => props.setFormat(VideoFormat.LANDSCAPE)} className={`flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${props.format === VideoFormat.LANDSCAPE ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}><Monitor className="w-4 h-4" /> <span className="text-xs font-bold">Horizontal</span></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Filtro Global</label>
                                        <select value={props.activeFilter} onChange={(e) => props.setActiveFilter(e.target.value as VideoFilter)} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs outline-none">
                                            {Object.values(VideoFilter).map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Transição Padrão</label>
                                        <select value={props.globalTransition} onChange={(e) => props.setGlobalTransition(e.target.value as VideoTransition)} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs outline-none">
                                            {Object.values(VideoTransition).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Legendas Globais</label>
                                        <button onClick={() => props.setShowSubtitles(!props.showSubtitles)} className={`w-8 h-4 rounded-full transition-colors relative ${props.showSubtitles ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}><div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${props.showSubtitles ? 'translate-x-4' : 'translate-x-0'}`}></div></button>
                                    </div>
                                    {props.showSubtitles && (
                                        <select value={props.subtitleStyle} onChange={(e) => props.setSubtitleStyle(e.target.value as SubtitleStyle)} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs outline-none">
                                            {Object.values(SubtitleStyle).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    )}
                                </div>
                                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-3 block flex items-center gap-1"><Film className="w-3 h-3"/> Global VFX (Efeitos de Filme)</label>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                                                <span>Vinheta (Borda Escura)</span>
                                                <span>{Math.round(props.globalVfx.vignetteIntensity * 100)}%</span>
                                            </div>
                                            <input type="range" min="0" max="1" step="0.1" value={props.globalVfx.vignetteIntensity} onChange={(e) => props.setGlobalVfx({...props.globalVfx, vignetteIntensity: parseFloat(e.target.value)})} className="w-full h-1 bg-zinc-300 dark:bg-zinc-700 rounded appearance-none" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                                                <span>Granulação de Filme (Film Grain)</span>
                                                <span>{Math.round(props.globalVfx.filmGrain * 100)}%</span>
                                            </div>
                                            <input type="range" min="0" max="0.5" step="0.05" value={props.globalVfx.filmGrain} onChange={(e) => props.setGlobalVfx({...props.globalVfx, filmGrain: parseFloat(e.target.value)})} className="w-full h-1 bg-zinc-300 dark:bg-zinc-700 rounded appearance-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* AUDIO */}
                        {activeStudioTab === 'audio' && (
                             <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors" onClick={() => musicInputRef.current?.click()}>
                                    <Music2 className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{props.bgMusicUrl ? "Música Carregada (Trocar)" : "Carregar Música de Fundo"}</p>
                                    <p className="text-[10px] text-zinc-400 mt-1">MP3 ou WAV</p>
                                    <input type="file" ref={musicInputRef} onChange={handleMusicUpload} className="hidden" accept="audio/*" />
                                </div>
                                {props.bgMusicUrl && (
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-xs mb-2 font-medium"><span>Volume da Música</span><span>{Math.round(props.bgMusicVolume * 100)}%</span></div>
                                            <input type="range" min="0" max="0.5" step="0.01" value={props.bgMusicVolume} onChange={(e) => props.setBgMusicVolume(parseFloat(e.target.value))} className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                        </div>
                                    </div>
                                )}
                             </div>
                        )}

                        {/* BRAND */}
                        {activeStudioTab === 'brand' && (
                             <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors" onClick={() => logoInputRef.current?.click()}>
                                    {props.channelLogo ? <img src={props.channelLogo.url} className="h-10 mx-auto object-contain mb-2" /> : <ImagePlus className="w-6 h-6 text-indigo-500 mx-auto mb-2" />}
                                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{props.channelLogo ? "Alterar Logo" : "Upload Logo do Canal"}</p>
                                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                                </div>
                                {props.channelLogo && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Posição X</label>
                                            <input type="range" min="0" max="1" step="0.01" value={props.channelLogo.x} onChange={(e) => props.setChannelLogo({...props.channelLogo!, x: parseFloat(e.target.value)})} className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Posição Y</label>
                                            <input type="range" min="0" max="1" step="0.01" value={props.channelLogo.y} onChange={(e) => props.setChannelLogo({...props.channelLogo!, y: parseFloat(e.target.value)})} className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Tamanho (Escala)</label>
                                            <input type="range" min="0.1" max="2" step="0.1" value={props.channelLogo.scale} onChange={(e) => props.setChannelLogo({...props.channelLogo!, scale: parseFloat(e.target.value)})} className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                        </div>
                                        <button onClick={() => props.setChannelLogo(undefined)} className="w-full py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors mt-2">Remover Logo</button>
                                    </div>
                                )}
                             </div>
                        )}

                        {/* EXPORT */}
                        {activeStudioTab === 'export' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                                <button onClick={() => props.playerRef.current?.startRecording(false)} disabled={props.isGenerating || props.isPlaying || props.isReviewing} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-all text-sm disabled:opacity-50 shadow-lg"><Download className="w-5 h-5" /> Exportar HD (720p)</button>
                                <button onClick={() => { if(props.userTier === UserTier.FREE) { props.setShowUpgradeModal(true); } else { props.playerRef.current?.startRecording(true); } }} disabled={props.isGenerating || props.isPlaying || props.isReviewing} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold transition-all text-sm relative overflow-hidden group disabled:opacity-50 shadow-lg hover:shadow-amber-500/20"><Crown className="w-5 h-5" /> Exportar 4K Ultra HD {props.userTier === UserTier.FREE && ( <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity"><Lock className="w-5 h-5 text-white" /></div> )}</button>
                                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                    <button onClick={props.handleExportScript} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs font-medium transition-colors"><Save className="w-4 h-4" /> Salvar Projeto (JSON)</button>
                                </div>
                                <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-lg p-3">
                                        <div onClick={props.handleForceRegenerateAll} className="cursor-pointer flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white transition-colors">
                                            <span className="flex items-center gap-2"><RefreshCcw className="w-3 h-3"/> Regenerar Tudo</span>
                                            <span>{props.isGenerating ? "..." : "Iniciar"}</span>
                                        </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: TIMELINE */}
        <div className="flex-1 h-full bg-white dark:bg-zinc-950 flex flex-col overflow-y-auto custom-scrollbar relative" id="timeline-container">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-3 sticky top-0 z-20 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Layers className="w-4 h-4" /> {t.timeline}</h3>
                        <button onClick={props.handleSelectAll} className="text-[10px] px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-indigo-500 hover:text-white transition-colors">{props.selectedSceneIds.size === props.scenes.length ? "Desmarcar Todos" : "Selecionar Todos"}</button>
                    </div>
                    <div className="flex gap-2 text-xs">
                        <div className="bg-zinc-200 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-600 dark:text-zinc-400 font-medium">Cenas: {props.scenes.length}</div>
                    </div>
                </div>
                
                {props.selectedSceneIds.size > 0 && (
                    <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                        <button onClick={() => props.handleBulkRegenerate('images')} className="flex-1 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px] font-bold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1"><ImageIcon className="w-3 h-3"/> Re-Imaginar ({props.selectedSceneIds.size})</button>
                        <button onClick={() => props.handleBulkRegenerate('audio')} className="flex-1 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px] font-bold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1"><Volume2 className="w-3 h-3"/> Re-Dublar ({props.selectedSceneIds.size})</button>
                        <button onClick={props.handleBulkDelete} className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                )}
            </div>

            <div className="p-4 space-y-4 pb-32">
                {props.scenes.map((scene, index) => (
                    <div key={scene.id} onClick={() => props.setCurrentSceneIndex(index)} className={`group relative flex gap-4 p-4 rounded-xl border transition-all cursor-pointer ${props.currentSceneIndex === index ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'} ${props.selectedSceneIds.has(scene.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/30' : ''}`}>
                        <div onClick={(e) => { e.stopPropagation(); props.handleToggleSelectScene(scene.id); }} className="absolute -left-2 -top-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity p-2 cursor-pointer" style={{ opacity: props.selectedSceneIds.has(scene.id) ? 1 : undefined }}>{props.selectedSceneIds.has(scene.id) ? ( <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-md"><CheckSquare className="w-4 h-4 text-white" /></div> ) : ( <div className="w-6 h-6 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-full flex items-center justify-center shadow-md"><SquareIcon className="w-4 h-4 text-zinc-400" /></div> )}</div>
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-black shrink-0 overflow-hidden relative border border-zinc-200 dark:border-zinc-800">
                            {scene.isGeneratingImage ? ( <div className="absolute inset-0 flex items-center justify-center bg-zinc-900"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div> ) : scene.mediaType === 'video' && scene.videoUrl ? ( <video src={scene.videoUrl} className="w-full h-full object-cover" muted /> ) : ( <img src={scene.imageUrl} className="w-full h-full object-cover" loading="lazy" /> )}
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 rounded font-mono">{index + 1}</div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex flex-col"><span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{scene.speaker}</span><span className="text-[9px] text-zinc-400">{scene.assignedVoice || 'Fenrir'}</span></div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); props.regenerateSceneAsset(index, 'image'); }} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-500 dark:text-zinc-400" title="Regenerar Imagem"><RefreshCcw className="w-3.5 h-3.5" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); props.setEditingScene(scene); }} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-500 dark:text-zinc-400" title="Editar Cena"><Edit2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-3 leading-relaxed">{scene.text}</p>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                                {scene.audioError ? ( <span className="text-[10px] text-red-500 flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" /> Erro Áudio</span> ) : scene.isGeneratingAudio ? ( <span className="text-[10px] text-zinc-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Gerando voz...</span> ) : scene.audioUrl ? ( <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium"><Volume2 className="w-3 h-3" /> Áudio OK</span> ) : ( <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium opacity-60"><MicOff className="w-3 h-3" /> Sem Áudio</span> )}
                                {scene.layers && scene.layers.length > 0 && ( <span className="text-[10px] text-amber-500 flex items-center gap-1 font-medium"><Layers className="w-3 h-3" /> {scene.layers.length} Camadas</span> )}
                            </div>
                        </div>
                    </div>
                ))}
                <button onClick={props.handleAddScene} className="w-full py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl flex items-center justify-center gap-2 text-zinc-400 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"><Plus className="w-6 h-6 group-hover:scale-110 transition-transform" /><span className="font-bold text-sm">Adicionar Nova Cena</span></button>
            </div>
        </div>
    </div>
  );
};