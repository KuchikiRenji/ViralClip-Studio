import { ProjectItem } from '../types';
import { StatusBadge } from './StatusBadge';
import { TypeBadge } from './TypeBadge';
import { BottomSheet } from '../../../shared/BottomSheet';
import { useIsMobile } from '../../../../hooks/useTouchGestures';
import { useTranslation } from '../../../../hooks/useTranslation';

interface PreviewModalProps {
  item: ProjectItem | null;
  onClose: () => void;
}

export const PreviewModal = ({ item, onClose }: PreviewModalProps) => {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  
  if (!item) return null;
  
  const content = (
    <>
      <div className="aspect-[9/16] max-h-[70vh] bg-black">
        {item.videoUrl ? (
          <video src={item.videoUrl} controls autoPlay preload="none" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative">
            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="text-zinc-400 text-sm">{t('common.noVideoAvailable')}</p>
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
        <div className="flex items-center gap-2">
          <StatusBadge status={item.status} />
          <TypeBadge type={item.type} />
        </div>
      </div>
    </>
  );
  
  if (isMobile) {
    return (
      <BottomSheet
        isOpen={!!item}
        onClose={onClose}
        title={item.title}
        snapPoints={[0.9]}
        maxHeight="90vh"
      >
        {content}
      </BottomSheet>
    );
  }
  
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-w-lg w-full bg-zinc-900 rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    </div>
  );
};


