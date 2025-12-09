import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
}) => {
  const [expression, setExpression] = useState<'SAD' | 'HAPPY' | 'CRYING'>('SAD');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative animate-scale-up border border-slate-100 dark:border-slate-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* --- ANIMATED MASCOT --- */}
          <div className="w-32 h-32 mb-4 relative">
             <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl">
                {/* Neck */}
                <rect x="45" y="80" width="30" height="20" fill="#ffdbac" />
                
                {/* Face */}
                <rect x="35" y="40" width="50" height="55" rx="12" fill="#ffdbac" />

                {/* Ears */}
                <circle cx="33" cy="65" r="4" fill="#ffdbac" />
                <circle cx="87" cy="65" r="4" fill="#ffdbac" />

                {/* Helmet (Static) */}
                <g>
                    <path d="M25 45 C25 15 95 15 95 45" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                    <rect x="25" y="40" width="70" height="10" fill="#ffffff" />
                    <path d="M20 45 L100 45 L100 52 Q60 56 20 52 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                    {/* SNI Logo */}
                    <rect x="47" y="22" width="26" height="14" rx="2" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="60" y="32" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="800" fill="#1e293b" textAnchor="middle" style={{ userSelect: 'none' }}>SNI</text>
                </g>

                {/* --- EXPRESSIONS --- */}
                
                {/* 1. SAD (Default) */}
                <g style={{ opacity: expression === 'SAD' ? 1 : 0, transition: 'opacity 0.3s' }}>
                    {/* Sad Brows */}
                    <path d="M40 55 Q45 52 50 55" stroke="#1e293b" strokeWidth="2" fill="none" />
                    <path d="M70 55 Q75 52 80 55" stroke="#1e293b" strokeWidth="2" fill="none" />
                    {/* Sad Eyes (Looking down) */}
                    <circle cx="45" cy="62" r="3" fill="#1e293b" />
                    <circle cx="75" cy="62" r="3" fill="#1e293b" />
                    {/* Sad Mouth */}
                    <path d="M50 78 Q60 70 70 78" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
                    {/* Sweat drop */}
                    <path d="M85 55 Q85 50 88 55 Q91 60 85 55" fill="#bae6fd" opacity="0.8">
                         <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
                         <animateTransform attributeName="transform" type="translate" values="0,0; 0,10" dur="2s" repeatCount="indefinite" />
                    </path>
                </g>

                {/* 2. HAPPY (Hover Stay) */}
                <g style={{ opacity: expression === 'HAPPY' ? 1 : 0, transition: 'opacity 0.3s' }}>
                    {/* Happy Brows */}
                    <path d="M40 52 Q45 48 50 52" stroke="#1e293b" strokeWidth="2" fill="none" />
                    <path d="M70 52 Q75 48 80 52" stroke="#1e293b" strokeWidth="2" fill="none" />
                    {/* Happy Eyes (Arc) */}
                    <path d="M40 60 Q45 58 50 60" stroke="#1e293b" strokeWidth="2" fill="none" />
                    <path d="M70 60 Q75 58 80 60" stroke="#1e293b" strokeWidth="2" fill="none" />
                    {/* Blush */}
                    <ellipse cx="42" cy="68" rx="6" ry="3" fill="#fecaca" opacity="0.6" />
                    <ellipse cx="78" cy="68" rx="6" ry="3" fill="#fecaca" opacity="0.6" />
                    {/* Happy Mouth */}
                    <path d="M48 72 Q60 85 72 72" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
                    {/* Hearts */}
                    <text x="30" y="50" fontSize="16" fill="#ef4444" style={{ opacity: expression === 'HAPPY' ? 1 : 0 }}>
                        <animate attributeName="dy" values="0;-5;0" dur="1s" repeatCount="indefinite" />
                        ♥
                    </text>
                    <text x="85" y="50" fontSize="12" fill="#ef4444" style={{ opacity: expression === 'HAPPY' ? 1 : 0 }}>
                         <animate attributeName="dy" values="0;-5;0" dur="1.2s" repeatCount="indefinite" />
                        ♥
                    </text>
                </g>

                {/* 3. CRYING (Hover Logout) */}
                <g style={{ opacity: expression === 'CRYING' ? 1 : 0, transition: 'opacity 0.3s' }}>
                    {/* Crying Brows */}
                    <path d="M40 50 Q45 55 50 50" stroke="#1e293b" strokeWidth="2" fill="none" />
                    <path d="M70 50 Q75 55 80 50" stroke="#1e293b" strokeWidth="2" fill="none" />
                    {/* Crying Eyes (Closed tightly) */}
                    <path d="M40 60 L50 64 M40 64 L50 60" stroke="#1e293b" strokeWidth="2" />
                    <path d="M70 60 L80 64 M70 64 L80 60" stroke="#1e293b" strokeWidth="2" />
                    {/* Tears Stream */}
                    <path d="M42 65 Q40 80 42 90" stroke="#60a5fa" strokeWidth="3" fill="none" opacity="0.7" />
                    <path d="M78 65 Q80 80 78 90" stroke="#60a5fa" strokeWidth="3" fill="none" opacity="0.7" />
                    {/* Wobbly Mouth */}
                    <path d="M50 78 Q60 75 70 78" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round">
                         <animate attributeName="d" values="M50 78 Q60 75 70 78; M50 78 Q60 81 70 78; M50 78 Q60 75 70 78" dur="0.2s" repeatCount="indefinite" />
                    </path>
                </g>

                {/* Hands (Dynamic based on state) */}
                <g>
                    {expression === 'SAD' && (
                        <>
                           <circle cx="30" cy="95" r="8" fill="#ffdbac" />
                           <circle cx="90" cy="95" r="8" fill="#ffdbac" />
                        </>
                    )}
                    {expression === 'HAPPY' && (
                        <>
                           {/* Thumbs up rough shape */}
                           <circle cx="25" cy="85" r="8" fill="#ffdbac" />
                           <circle cx="95" cy="85" r="8" fill="#ffdbac" />
                        </>
                    )}
                     {expression === 'CRYING' && (
                        <>
                           <circle cx="40" cy="85" r="8" fill="#ffdbac" />
                           <circle cx="80" cy="85" r="8" fill="#ffdbac" />
                        </>
                    )}
                </g>

             </svg>
          </div>

          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed max-w-xs">{message}</p>
          
          <div className="flex w-full gap-3">
            <button
              onMouseEnter={() => setExpression('HAPPY')}
              onMouseLeave={() => setExpression('SAD')}
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-all transform hover:-translate-y-1"
            >
              {cancelLabel}
            </button>
            <button
              onMouseEnter={() => setExpression('CRYING')}
              onMouseLeave={() => setExpression('SAD')}
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold transition-all shadow-lg shadow-red-500/30 transform hover:-translate-y-1"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;