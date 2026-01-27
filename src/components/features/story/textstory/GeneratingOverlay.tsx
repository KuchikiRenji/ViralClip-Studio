import { RefreshCw } from 'lucide-react';
import { useTranslation } from '../../../../hooks/useTranslation';
interface GeneratingOverlayProps {
  generationProgress: number;
}
export const GeneratingOverlay = ({
  generationProgress,
}) => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <RefreshCw size={48} className="text-blue-500 animate-spin mb-6" />
      <h2 className="text-2xl font-bold mb-2">{t('textStory.generating')}</h2>
      <p className="text-zinc-400 mb-6">{t('textStory.generatingHint')}</p>
      <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-100"
          style={{ width: `${generationProgress}%` }}
        />
      </div>
      <span className="text-sm text-zinc-500 mt-2">{generationProgress}%</span>
    </div>
  );
};







