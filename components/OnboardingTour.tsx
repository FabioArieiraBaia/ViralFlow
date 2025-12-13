import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { translations } from '../services/translations';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

export interface TourStep {
  targetId: string;
  translationKey: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  onEnter?: () => void; // Callback when step starts
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  steps: TourStep[];
  lang: Language;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose, steps, lang }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState<{top: number, left: number, width: number, height: number} | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  
  const t = translations[lang];

  useEffect(() => {
    if (!isOpen) return;

    const step = steps[currentStep];
    if (!step) return;

    if (step.onEnter) step.onEnter();

    // Função para calcular a posição
    const updatePosition = () => {
        const element = document.getElementById(step.targetId);
        if (element) {
            const rect = element.getBoundingClientRect();
            // FIX: Usamos rect.top direto (viewport relative) pois o container pai é 'fixed'.
            // Não somar window.scrollY aqui.
            setCoords({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            });
        } else {
            // Se o elemento não existe (ex: aba fechada), centraliza ou esconde
            setCoords(null); 
        }
    };

    // 1. Tentar focar no elemento
    const element = document.getElementById(step.targetId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // 2. Atualizar posição imediatamente
    updatePosition();

    // 3. Adicionar listeners para acompanhar o scroll e resize em tempo real
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { capture: true, passive: true });

    // 4. Polling temporário para garantir que a posição atualize durante a animação de scroll suave
    const intervalId = setInterval(updatePosition, 16); // ~60fps update
    const timeoutId = setTimeout(() => clearInterval(intervalId), 1000); // Para após 1s (tempo suficiente para o scroll)

    return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, { capture: true });
        clearInterval(intervalId);
        clearTimeout(timeoutId);
    };
  }, [currentStep, isOpen, steps]);

  const handleNext = () => {
      if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
      } else {
          handleFinish();
      }
  };

  const handlePrev = () => {
      if (currentStep > 0) {
          setCurrentStep(currentStep - 1);
      }
  };

  const handleFinish = () => {
      if (dontShowAgain) {
          localStorage.setItem('viralflow_tour_seen', 'true');
      }
      onClose();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  if (!step) return null;

  // Tooltip Position Logic
  const getTooltipStyle = () => {
      if (!coords) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      
      const gap = 16;
      // Precisamos garantir que o tooltip não saia da tela
      // Logica simplificada, mas funcional
      
      let top = 0;
      let left = 0;
      let transform = '';

      switch (step.position) {
          case 'bottom':
              top = coords.top + coords.height + gap;
              left = coords.left + (coords.width / 2);
              transform = 'translateX(-50%)';
              break;
          case 'top':
              top = coords.top - gap;
              left = coords.left + (coords.width / 2);
              transform = 'translate(-50%, -100%)';
              break;
          case 'right':
              top = coords.top + (coords.height / 2);
              left = coords.left + coords.width + gap;
              transform = 'translateY(-50%)';
              break;
          case 'left':
              top = coords.top + (coords.height / 2);
              left = coords.left - gap;
              transform = 'translate(-100%, -50%)';
              break;
          default:
              return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      }

      // Verificação de bordas básica para manter o tooltip na tela
      const winH = window.innerHeight;
      const winW = window.innerWidth;
      
      // Se estiver muito embaixo, joga pra cima (fallback simples)
      if (top > winH - 100 && step.position === 'bottom') {
           top = coords.top - gap;
           transform = 'translate(-50%, -100%)';
      }

      return { top, left, transform };
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
       {/* Backdrop with cutout effect */}
       {/* Removido transition-all do backdrop para evitar lag visual enquanto rola a página */}
       <div className="absolute inset-0 bg-black/70" style={coords ? {
           clipPath: `polygon(
             0% 0%, 0% 100%, 
             ${coords.left}px 100%, 
             ${coords.left}px ${coords.top}px, 
             ${coords.left + coords.width}px ${coords.top}px, 
             ${coords.left + coords.width}px ${coords.top + coords.height}px, 
             ${coords.left}px ${coords.top + coords.height}px, 
             ${coords.left}px 100%, 
             100% 100%, 100% 0%
           )`
       } : {}}></div>

       {/* Highlight Border */}
       {coords && (
           <div 
             className="absolute border-4 border-indigo-500 rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.6)] pointer-events-none"
             style={{
                 top: coords.top,
                 left: coords.left,
                 width: coords.width,
                 height: coords.height
             }}
           ></div>
       )}

       {/* Tooltip Card */}
       <div 
         className="absolute bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-zinc-200 dark:border-zinc-700 flex flex-col gap-4 transition-all duration-300"
         style={getTooltipStyle()}
       >
           <div className="flex justify-between items-start">
                <div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase mb-1 block">
                        {step.translationKey === 'tourWelcome' ? t.tutorial : `${t.tutorial} ${currentStep + 1} / ${steps.length}`}
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                        {translations[lang][step.translationKey] || step.translationKey}
                    </h3>
                </div>
                <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                    <X className="w-5 h-5" />
                </button>
           </div>
           
           <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200">
                    <input 
                        type="checkbox" 
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {t.dontShowAgain}
                </label>

                <div className="flex items-center gap-2">
                    {currentStep > 0 && (
                        <button 
                            onClick={handlePrev}
                            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                    <button 
                        onClick={handleNext}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-colors"
                    >
                        {currentStep === steps.length - 1 ? t.finish : t.next}
                        {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
           </div>
       </div>
    </div>
  );
};

export default OnboardingTour;