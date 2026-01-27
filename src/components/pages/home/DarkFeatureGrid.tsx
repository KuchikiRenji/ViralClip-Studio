import React from 'react';
import {
  Film,
  Image as ImageIcon,
  Zap,
  Mic2,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { type CreationMode, type ViewType } from '../../../types';
import { useTranslation } from '../../../hooks/useTranslation';
import { DESIGN_TOKENS } from '../../../constants/designTokens';

interface DarkFeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  hasButton?: boolean;
  buttonText?: string;
  decorative?: React.ReactNode;
  onClick: () => void;
}

const DarkFeatureCard = ({
  icon: Icon,
  title,
  description,
  hasButton = true,
  buttonText,
  decorative,
  onClick,
}: DarkFeatureCardProps) => {
  return (
    <article
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${title}: ${description}`}
      className="bg-black border border-gray-800 rounded-xl overflow-hidden group cursor-pointer flex flex-col min-h-[280px] transition-all duration-300 hover:border-gray-600 hover:bg-gray-900/50 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-black touch-manipulation active:scale-[0.98]"
    >
      {decorative && (
        <div className="relative w-full h-32 overflow-hidden">
          <div className="absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity duration-300">
            {decorative}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      )}
      <div className="flex-1 flex flex-col gap-4 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon size={20} className="text-white" strokeWidth={1.8} />
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <h3
            className="font-semibold text-white leading-tight"
            style={{
              fontSize: 'clamp(16px, 2.2vw, 20px)',
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
            }}
          >
            {title}
          </h3>
          <p
            className="text-gray-400 leading-relaxed flex-1"
            style={{
              fontSize: 'clamp(13px, 1.8vw, 15px)',
              fontWeight: DESIGN_TOKENS.typography.fontWeight.normal,
            }}
          >
            {description}
          </p>
        </div>

        {hasButton && buttonText && (
          <div className="mt-auto">
            <button
              type="button"
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-sm border border-gray-700 hover:border-gray-600 touch-target-sm w-full justify-center"
              style={{
                fontSize: 'clamp(13px, 2vw, 14px)',
                fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <span className="truncate">{buttonText}</span>
              <ChevronRight size={14} className="flex-shrink-0 group-hover:translate-x-0.5 transition-all duration-200" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

interface DarkFeatureGridProps {
  onNavigate?: (view: ViewType, mode?: CreationMode) => void;
}

export const DarkFeatureGrid = ({ onNavigate }: DarkFeatureGridProps) => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Film,
      title: t('home.generateClips'),
      description: t('home.generateClipsDesc'),
      hasButton: true,
      buttonText: t('common.tryNow'),
      onClick: () => onNavigate?.('create-story', 'viral-clips'),
    },
    {
      icon: ImageIcon,
      title: t('home.createImages'),
      description: t('home.createImagesDesc'),
      hasButton: true,
      buttonText: t('common.tryNow'),
      onClick: () => onNavigate?.('create-image'),
    },
    {
      icon: Zap,
      title: t('home.autoClipping'),
      description: t('home.autoClippingDesc'),
      hasButton: true,
      buttonText: t('common.tryNow'),
      onClick: () => onNavigate?.('auto-clipping'),
    },
    {
      icon: Mic2,
      title: t('home.cloneVoice'),
      description: t('home.cloneVoiceDesc'),
      hasButton: true,
      buttonText: t('common.tryNow'),
      onClick: () => onNavigate?.('voice-clone'),
    },
    {
      icon: MessageSquare,
      title: t('home.createTextStory'),
      description: t('home.createTextStoryDesc'),
      hasButton: false,
      onClick: () => onNavigate?.('text-story'),
    },
  ];

  return (
    <section className="animate-fade-in" aria-label="AI Features">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
        {features.map((feature, index) => (
          <DarkFeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            hasButton={feature.hasButton}
            buttonText={feature.buttonText}
            onClick={feature.onClick}
          />
        ))}
      </div>
    </section>
  );
};
