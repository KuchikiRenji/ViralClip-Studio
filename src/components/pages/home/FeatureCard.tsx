import { ChevronRight } from 'lucide-react';
import { DESIGN_TOKENS } from '../../../constants/designTokens';
import { FeatureId, FEATURE_BACKGROUND_IMAGES, FEATURE_IMAGE_SCALE, FEATURE_IMAGE_POSITION } from '../../../constants/home';

interface FeatureCardProps {
  title: string;
  description: string;
  buttonText: string;
  featureId: FeatureId;
  onClick: () => void;
}

export const FeatureCard = ({
  title,
  description,
  buttonText,
  featureId,
  onClick,
}: FeatureCardProps) => {
  const backgroundImage = FEATURE_BACKGROUND_IMAGES[featureId];
  const imageScale = FEATURE_IMAGE_SCALE[featureId] || 1;
  const imagePosition = FEATURE_IMAGE_POSITION[featureId] || 'center';
  const cardHeightClass =
    featureId === 'text-story' || featureId === 'video-ranking'
      ? 'h-[260px] xs:h-[280px] sm:h-[320px] lg:h-[340px]'
      : 'h-[240px] xs:h-[250px] sm:h-[270px] lg:h-[300px]';
  const imageHeightClass =
    featureId === 'text-story' || featureId === 'video-ranking'
      ? 'h-[180px] sm:h-[190px] lg:h-[210px]'
      : 'h-[160px] sm:h-[170px] lg:h-[190px]';

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
      className={`${cardHeightClass} bg-zinc-900/40 border border-white/[0.06] rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer relative hover:border-white/[0.12] hover:bg-zinc-900/60 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-primary-rgb))]/50 focus:ring-offset-2 focus:ring-offset-zinc-950 touch-manipulation active:scale-[0.98] flex flex-col`}
      style={{ boxShadow: DESIGN_TOKENS.shadow.md }}
    >
      {backgroundImage && (
        <div className={`relative w-full ${imageHeightClass} overflow-hidden`}>
          <img
            loading="lazy"
            src={backgroundImage}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            style={{ transform: `scale(${imageScale})`, objectPosition: imagePosition }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
        </div>
      )}
      <div className="flex-1 flex flex-col gap-3 px-3 sm:px-4 lg:px-5 xl:px-6 py-3 sm:py-4 lg:py-5">
        <div className="flex flex-col gap-1">
          <h3
            className="font-semibold text-white leading-tight line-clamp-2"
            style={{
              fontSize: 'clamp(13px, 2.6vw, 20px)',
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
            }}
          >
            {title}
          </h3>
          <p
            className="text-zinc-400 line-clamp-2 leading-snug"
            style={{
              fontSize: 'clamp(11px, 1.9vw, 14px)',
              fontWeight: DESIGN_TOKENS.typography.fontWeight.normal,
            }}
          >
            {description}
          </p>
        </div>
        <div className="mt-auto">
          <button
            type="button"
            className="px-3 sm:px-3.5 lg:px-4 py-2 sm:py-2.5 bg-[rgb(var(--color-brand-primary-rgb))] hover:brightness-110 active:brightness-90 text-white rounded-md sm:rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[rgb(var(--color-brand-primary-rgb))]/20 touch-target-sm"
            style={{
              fontSize: 'clamp(11px, 2vw, 14px)',
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
      </div>
    </article>
  );
};