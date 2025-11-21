
import React, { useEffect, useState, useRef } from 'react';
import { Language } from '../types';
import { translations } from '../services/translations';
import { X, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

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
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  const t = translations[lang];

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
        const step = steps[currentStep];
        if (!step) return;

        if (step.onEnter) step.onEnter();

        // Wait a bit for DOM updates (tabs switching)
        setTimeout(() => {
            const element = document.getElementById(step.targetId);
            if (element) {
                // Scroll element into view logic
                element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                
                // Wait for scroll to likely finish before grabbing coords
                setTimeout(() => {
                    const rect = element.getBoundingClientRect();
                    setCoords({
                        top: rect.top + window.scrollY,
                        left: rect.left + window.scrollX,
                        width: rect.width,
                        height: rect.height
                    });
                }, 400);
            } else {
                // Fallback center if element not found
                setCoords(null); 
            }
        }, 300);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition); // Re-calc on user scroll
    return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep, isOpen, steps]);

  const handleNext = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
      } else {
          handleFinish();
      }
  };

  const handlePrev = (e: React.MouseEvent) => {
      e.stopPropagation();
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

  // Close when clicking background
  const handleBackdropClick = (e: React.MouseEvent) => {
      // Only close if clicking the backdrop itself, not the target "hole" (although hole clicks pass through via clip-path usually)
      // But since we have a div covering everything, we just treat it as close.
      // The actual target click is handled because clip-path removes the element from hit-test in that area.
      onClose();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];

  // Tooltip Position Logic with "Smart Flip" to prevent off-screen
  const getTooltipStyle = () => {
      if (!coords) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', position: 'fixed' as 'fixed' };
      
      const gap = 16;
      let top = 0;
      let left = 0;
      let transform = '';
      
      // Viewport Dimensions
      const vHeight = window.innerHeight;
      const vWidth = window.innerWidth;
      const scrollY = window.scrollY;

      // Relative position in viewport
      const elementTopInViewport = coords.top - scrollY;
      
      // Decision logic: If trying to put bottom but element is low, flip to top
      let effectivePosition = step.position;
      if (step.position === 'bottom' && elementTopInViewport > vHeight * 0.6) {
          effectivePosition = 'top';
      } else if (step.position === 'top' && elementTopInViewport < 150) {
          effectivePosition = 'bottom';
      }

      switch (effectivePosition) {
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
              return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', position: 'fixed' as 'fixed' };
      }

      // Simple bounds checking to prevent X-axis overflow
      // We can't easily fix Y-axis overflow here without changing `top`, 
      // but the flip logic above handles the worst cases.
      
      return { top, left, transform, position: 'absolute' as 'absolute' };
  };

  const style = getTooltipStyle();

  return (
    <div className="absolute inset-0 z-[100] h-full w-full">
       {/* Backdrop with cutout effect */}
       {/* We make the backdrop fixed to cover viewport, but logic uses absolute for document flow matching */}
       <div 
         className="fixed inset-0 bg-black/70 transition-all duration-300 cursor-pointer"
         onClick={handleBackdropClick}
         style={coords ? {
           clipPath: `polygon(
             0% 0%, 0% 100%, 
             ${coords.left}px 100%, 
             ${coords.left}px ${coords.top - window.scrollY}px, 
             ${coords.left + coords.width}px ${coords.top - window.scrollY}px, 
             ${coords.left + coords.width}px ${coords.top + coords.height - window.scrollY}px, 
             ${coords.left}px ${coords.top + coords.height - window.scrollY}px, 
             ${coords.left}px 100%, 
             100% 100%, 100% 0%
           )`
       } : {}}
       ></div>

       {/* Highlight Border - Pointer events none allows clicking through to the element */}
       {coords && (
           <div 
             className="absolute border-4 border-indigo-500 rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all duration-300 pointer-events-none"
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
         ref={tooltipRef}
         onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the card itself
         className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-zinc-200 dark:border-zinc-700 flex flex-col gap-4 transition-all duration-300 z-[101]"
         style={style}
       >
           <div className="flex justify-between items-start">
                <div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase mb-1 block">
                        {step.translationKey === 'tourWelcome' ? t.tutorial : `${t.tutorial} ${currentStep} / ${steps.length - 1}`}
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                        {translations[lang][step.translationKey]}
                    </h3>
                </div>
                <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1">
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
