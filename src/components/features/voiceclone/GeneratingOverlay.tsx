import { useTranslation } from '../../../hooks/useTranslation';
interface GeneratingOverlayProps {
  generationProgress: number;
}
export const GeneratingOverlay = ({
  generationProgress,
}) => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('voiceClone.generating')}</h2>
        <p className="text-zinc-400 mb-4">{t('voiceClone.generatingProgress', { progress: generationProgress })}</p>
        <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden mx-auto">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${generationProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};







