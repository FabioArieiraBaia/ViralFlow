

import React from 'react';
import { Settings, Key, ChevronRight, Video, ShieldCheck, Terminal, Copy, Calendar, CheckCircle2, Image } from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../services/translations';
import { getApiKeyCount } from '../../services/geminiService';

const MASTER_KEY = 'ADMIN-TEST-KEY-2025';

interface SettingsTabProps {
  lang: Language;
  manualKeys: string;
  updateKeys: (v: string) => void;
  apiKeyCount: number;
  pexelsKey: string;
  updatePexelsKey: (v: string) => void;
  pollinationsToken: string;
  updatePollinationsToken: (v: string) => void;
  userKey: string;
  selectedLicenseType: any;
  setSelectedLicenseType: (v: any) => void;
  handleGenerateLicense: () => void;
  generatedAdminKey: string;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  lang, manualKeys, updateKeys, apiKeyCount, pexelsKey, updatePexelsKey,
  pollinationsToken, updatePollinationsToken,
  userKey, selectedLicenseType, setSelectedLicenseType, handleGenerateLicense, generatedAdminKey
}) => {
  const t = translations[lang];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 animate-in fade-in duration-500">
        <div className="max-w-2xl mx-auto space-y-8">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Settings className="w-6 h-6" /> {t.settings}</h2>
                
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
                    <div>
                        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Key className="w-4 h-4 text-indigo-500" /> {t.keysTitle}</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{t.keysDesc}</p>
                    </div>
                    <textarea value={manualKeys} onChange={(e) => updateKeys(e.target.value)} className="w-full h-32 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-600 dark:text-zinc-300 outline-none focus:border-indigo-500 resize-none" placeholder="AIzaSy..." />
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${apiKeyCount > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{apiKeyCount} {t.activeKeys}</span>
                        </div>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">{t.getKey} <ChevronRight className="w-3 h-3" /></a>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
                    <div>
                        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Image className="w-4 h-4 text-pink-500" /> {t.pollinationsTitle}</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{t.pollinationsDesc}</p>
                    </div>
                    <input type="text" value={pollinationsToken} onChange={(e) => updatePollinationsToken(e.target.value)} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-600 dark:text-zinc-300 outline-none focus:border-pink-500" placeholder="plln_sk_..." />
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
                    <div>
                        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Video className="w-4 h-4 text-emerald-500" /> {t.pexelsTitle}</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{t.pexelsDesc}</p>
                    </div>
                    <input type="text" value={pexelsKey} onChange={(e) => updatePexelsKey(e.target.value)} className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-600 dark:text-zinc-300 outline-none focus:border-emerald-500" placeholder="Pexels API Key..." />
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
                    <div>
                        <h4 className="font-bold text-sm text-amber-800 dark:text-amber-400">{t.localSecurity}</h4>
                        <p className="text-xs text-amber-700 dark:text-amber-500/80 mt-1">{t.localSecDesc}</p>
                    </div>
                </div>

                {/* ADMIN PANEL */}
                {userKey === MASTER_KEY && (
                    <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6 space-y-4 relative overflow-hidden">
                        <div className="absolute -top-4 -right-4 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl"></div>
                        <div>
                            <h3 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                                <Terminal className="w-4 h-4" /> Painel do Vendedor (Admin)
                            </h3>
                            <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">Gere chaves de licença para venda.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2 block">Tipo de Licença</label>
                                <div className="space-y-2">
                                    {[
                                        { id: 'VF-M', label: '📅 Mensal', icon: Calendar },
                                        { id: 'VF-T', label: '📅 Trimestral', icon: Calendar },
                                        { id: 'VF-A', label: '📅 Anual', icon: Calendar },
                                        { id: 'VF-L', label: '♾️ Vitalício (Lifetime)', icon: CheckCircle2 },
                                    ].map(t => (
                                        <button 
                                        key={t.id} 
                                        onClick={() => setSelectedLicenseType(t.id)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${selectedLicenseType === t.id ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'}`}
                                        >
                                        <t.icon className="w-3 h-3"/> {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col justify-end">
                                <button onClick={handleGenerateLicense} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 mb-2">
                                    <Key className="w-4 h-4" /> Gerar Chave
                                </button>
                                {generatedAdminKey && (
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 relative group">
                                        <div className="font-mono text-xs text-zinc-600 dark:text-zinc-300 break-all">{generatedAdminKey}</div>
                                        <button onClick={() => { navigator.clipboard.writeText(generatedAdminKey); alert("Chave Copiada!"); }} className="absolute top-1 right-1 p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900 text-zinc-400 hover:text-indigo-500 transition-colors"><Copy className="w-3 h-3" /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
        </div>
    </div>
  );
};