import { ArrowLeft, Undo, Redo, Eye, Download } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';

interface EditorHeaderProps {
  onBack: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: () => void;
}

export const EditorHeader = ({ onBack, onUndo, onRedo, canUndo, canRedo, onExport }: EditorHeaderProps) => {
  const { t } = useTranslation();
  return (
    <header className="h-14 sm:h-16 bg-surface-darker flex items-center justify-between px-3 sm:px-6 shrink-0 border-b border-white/10 lg:rounded-t-2xl">
      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={onBack} 
          className="w-10 h-10 sm:w-11 sm:h-11 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-lg flex items-center justify-center transition-colors touch-target active:scale-95"
          type="button"
        >
          <ArrowLeft size={18} className="sm:hidden" />
          <ArrowLeft size={20} className="hidden sm:block" />
        </button>
        <div className="flex flex-col">
          <span className="text-sm sm:text-lg font-semibold">{t('editVideo.title')}</span>
          <span className="text-[10px] sm:text-xs text-zinc-500 hidden sm:block">{t('editVideo.subtitle')}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-colors touch-target disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 active:bg-zinc-700 active:scale-95"
          title={t('editVideo.undo')}
          type="button"
        >
          <Undo size={16} className="sm:hidden" />
          <Undo size={18} className="hidden sm:block" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-colors touch-target disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 active:bg-zinc-700 active:scale-95"
          title={t('editVideo.redo')}
          type="button"
        >
          <Redo size={16} className="sm:hidden" />
          <Redo size={18} className="hidden sm:block" />
        </button>
        <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />
        <button 
          className="hidden md:flex px-3 py-2 border border-white/20 rounded-lg text-xs sm:text-sm font-medium hover:bg-white/5 active:bg-white/10 transition-colors items-center gap-2 touch-target active:scale-95"
          type="button"
        >
          <Eye size={14} /> {t('editVideo.preview')}
        </button>
        <button 
          onClick={onExport}
          className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg text-xs sm:text-sm font-semibold hover:from-blue-500 hover:to-blue-400 active:from-blue-700 active:to-blue-600 transition-all flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-blue-600/20 touch-target active:scale-95"
          type="button"
        >
          <Download size={14} className="sm:hidden" />
          <Download size={16} className="hidden sm:block" />
          <span className="hidden xs:inline">{t('editVideo.export')}</span>
        </button>
      </div>
    </header>
  );
};