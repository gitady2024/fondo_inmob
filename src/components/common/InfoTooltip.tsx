import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  title?: string;
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  text,
  title,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ml-1.5 align-middle ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-label={title || 'Información adicional'}
        className="text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer p-0.5 rounded-full hover:bg-slate-800/60 focus:outline-none"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 sm:w-72 p-3 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl shadow-black/80 text-left z-50 backdrop-blur-xl animate-fade-in pointer-events-auto"
        >
          {title && (
            <div className="font-bold text-white text-xs mb-1 flex items-center gap-1.5 border-b border-slate-800 pb-1">
              <span className="text-indigo-400">ℹ</span>
              <span>{title}</span>
            </div>
          )}
          <p className="text-[11px] leading-relaxed text-slate-300 font-normal">
            {text}
          </p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-700" />
        </div>
      )}
    </div>
  );
};
