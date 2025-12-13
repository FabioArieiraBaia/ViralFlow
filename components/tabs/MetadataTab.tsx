
import React, { useState } from 'react';
import { Hash, Sparkles, Loader2, Copy, Download, RefreshCcw } from 'lucide-react';
import { VideoMetadata, ViralMetadataResult, Language, VideoStyle, ImageProvider } from '../../types';
import { generateViralMetadata, generateThumbnails } from '../../services/geminiService';
import { translations } from '../../services/translations';

interface MetadataTabProps {
  lang: Language;
  metaTopic: string;
  setMetaTopic: (v: string) => void;
  metaContext: string;
  setMetaContext: (v: string) => void;
  viralMetaResult: ViralMetadataResult | null;
  setViralMetaResult: (v: ViralMetadataResult | null) => void;
  metadata: VideoMetadata | null;
  thumbnails: string[];
  setThumbnails: (v: string[]) => void;
  scenesLength: number;
  topic: string;
  style: VideoStyle;
  thumbProvider: ImageProvider;
}

export const MetadataTab: React.FC<MetadataTabProps> = ({
  lang, metaTopic, setMetaTopic, metaContext, setMetaContext,
  viralMetaResult, setViralMetaResult, metadata, thumbnails, setThumbnails,
  scenesLength, topic, style, thumbProvider
}) => {
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
  const t = translations[lang];

  const handleGenerateViralMetadata = async () => {
    if (!metaTopic) return alert("Digite um tópico/título.");
    setIsGeneratingMeta(true);
    try {
        const result = await generateViralMetadata(metaTopic, metaContext || "Video about " + metaTopic);
        setViralMetaResult(result);
    } catch (e) {
        console.error(e);
        alert("Erro ao gerar metadados: " + e);
    } finally {
        setIsGeneratingMeta(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 animate-in fade-in duration-500">
        <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Hash className="w-6 h-6" /> Viral Metadata Generator
            </h2>
            
            {/* INPUT SECTION */}
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
                <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">Gerador Independente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Tópico / Título Base</label>
                        <input 
                            value={metaTopic}
                            onChange={(e) => setMetaTopic(e.target.value)}
                            placeholder="Ex: Como ganhar dinheiro na internet" 
                            className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Contexto (Opcional)</label>
                        <input 
                            value={metaContext}
                            onChange={(e) => setMetaContext(e.target.value)}
                            placeholder="Ex: Focado em marketing digital para iniciantes" 
                            className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
                <button 
                    onClick={handleGenerateViralMetadata}
                    disabled={isGeneratingMeta}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                >
                    {isGeneratingMeta ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {isGeneratingMeta ? "Gerando Ouro..." : "Gerar Títulos Virais & SEO"}
                </button>
            </div>

            {/* RESULTS SECTION */}
            {viralMetaResult && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">5 Títulos Clickbait</label>
                        <div className="space-y-2">
                            {viralMetaResult.titles.map((t, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="flex-1 text-sm font-bold text-zinc-800 dark:text-white bg-zinc-100 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                        {t}
                                    </div>
                                    <button onClick={() => copyToClipboard(t)} className="p-3 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-zinc-500 hover:text-indigo-500 transition-colors"><Copy className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-2 relative group">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Descrição (AIDA)</label>
                            <button onClick={() => copyToClipboard(viralMetaResult.description)} className="text-xs flex items-center gap-1 text-indigo-500 font-bold hover:underline"><Copy className="w-3 h-3" /> Copiar Tudo</button>
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap bg-zinc-50 dark:bg-black p-4 rounded-lg border border-transparent focus:border-indigo-500 transition-colors max-h-60 overflow-y-auto custom-scrollbar">
                            {viralMetaResult.description}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-2 relative">
                        <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tags</label>
                                <button onClick={() => copyToClipboard(viralMetaResult.tags)} className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-500 transition-colors flex items-center gap-1"><Copy className="w-3 h-3" /> Copiar Lista</button>
                        </div>
                        <textarea 
                            readOnly 
                            value={viralMetaResult.tags} 
                            className="w-full h-24 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs text-zinc-600 dark:text-zinc-400 font-mono resize-none focus:outline-none"
                        />
                    </div>
                </div>
            )}

            {/* EXISTING METADATA */}
            {scenesLength > 0 && (
                <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Metadados do Projeto Atual</h3>
                        {metadata ? (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.title}</label>
                                <div className="text-lg font-medium text-zinc-900 dark:text-white select-all bg-zinc-50 dark:bg-black p-3 rounded-lg">{metadata.title}</div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.description}</label>
                                <div className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap select-all bg-zinc-50 dark:bg-black p-3 rounded-lg">{metadata.description}</div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.tags}</label>
                                <div className="flex flex-wrap gap-2">
                                    {metadata.tags.map(tag => ( <span key={tag} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-100 dark:border-indigo-500/30">#{tag}</span> ))}
                                </div>
                            </div>
                            {thumbnails.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t.suggestedThumbs}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {thumbnails.map((thumb, idx) => (
                                            <div key={idx} className="group relative aspect-video bg-zinc-100 dark:bg-black rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                                                <img src={thumb} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                                <button onClick={() => { const a = document.createElement('a'); a.href = thumb; a.download = `thumbnail_${idx}.png`; a.click(); }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs"><Download className="w-4 h-4 mr-1"/> Baixar</button>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => generateThumbnails(topic, style, ImageProvider.POLLINATIONS).then(setThumbnails)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"><RefreshCcw className="w-3 h-3"/> {t.regenerateThumbs}</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                            <p>{t.noScenesYet}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};
