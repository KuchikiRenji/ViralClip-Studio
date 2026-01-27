import { Check, Loader2 } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';

type ExportPhase = 'preparing' | 'rendering' | 'encoding' | 'complete';

interface ExportProgressProps {
  exportProgress: number;
  exportPhase: ExportPhase;
  exportComplete: boolean;
}

export const ExportProgress = ({
  exportProgress,
  exportPhase,
  exportComplete,
}) => {
  const { t } = useTranslation();

  const getPhaseLabel = (phase: ExportPhase): string => {
    switch (phase) {
      case 'preparing':
        return t('export.phase.preparing');
      case 'rendering':
        return t('export.phase.rendering');
      case 'encoding':
        return t('export.phase.encoding');
      case 'complete':
        return t('export.phase.complete');
      default:
        return phase;
    }
  };

  return (
    <div className="py-6 space-y-6">
      <div className="text-center">
        {exportComplete ? (
          <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <Check size={32} className="text-green-400" />
          </div>
        ) : (
          <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
            <Loader2 size={32} className="text-blue-400 animate-spin" />
          </div>
        )}
        <h3 className="text-lg font-bold text-white mb-1">
          {exportComplete ? t('export.exportComplete') : t('export.exporting')}
        </h3>
        <p className="text-sm text-zinc-400">
          {exportPhase === 'complete' ? t('export.readyToDownload') : getPhaseLabel(exportPhase)}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-zinc-400">
          <span>{t('export.progress')}</span>
          <span>{Math.round(exportProgress)}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${exportComplete ? 'bg-green-500' : 'bg-blue-600'}`}
            style={{ width: `${exportProgress}%` }}
          />
        </div>
      </div>

      {!exportComplete && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className={`p-2 rounded-lg transition-colors ${
            exportPhase === 'preparing' 
              ? 'bg-blue-600/20 text-blue-400' 
              : exportProgress > 33 
                ? 'bg-green-600/20 text-green-400' 
                : 'bg-zinc-800/50 text-zinc-500'
          }`}>
            <span className="text-xs">{t('export.phase.preparing')}</span>
          </div>
          <div className={`p-2 rounded-lg transition-colors ${
            exportPhase === 'rendering' 
              ? 'bg-blue-600/20 text-blue-400' 
              : exportProgress > 66 
                ? 'bg-green-600/20 text-green-400' 
                : 'bg-zinc-800/50 text-zinc-500'
          }`}>
            <span className="text-xs">{t('export.phase.rendering')}</span>
          </div>
          <div className={`p-2 rounded-lg transition-colors ${
            exportPhase === 'encoding' 
              ? 'bg-blue-600/20 text-blue-400' 
              : 'bg-zinc-800/50 text-zinc-500'
          }`}>
            <span className="text-xs">{t('export.phase.encoding')}</span>
          </div>
        </div>
      )}
    </div>
  );
};
