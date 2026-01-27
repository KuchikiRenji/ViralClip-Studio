import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';
import { Card, CardVariant } from '../../atoms/Card';
import { Text } from '../../atoms/Text';
import { LucideIcon } from 'lucide-react';

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  buttonText: string;
  onClick: () => void;
  variant?: CardVariant;
  className?: string;
  children?: React.ReactNode;
}

interface ActionCardRootProps extends ActionCardProps {
  decorative?: React.ReactNode;
}

export const ActionCardRoot = forwardRef<HTMLDivElement, ActionCardRootProps>(
  ({
    title,
    description,
    icon: Icon,
    buttonText,
    onClick,
    variant = 'default',
    className,
    decorative,
    children,
    ...props
  }, ref) => {
    return (
      <Card
        ref={ref}
        variant={variant}
        className={cn(
          'group cursor-pointer transition-all duration-300 active:scale-[0.98] h-[220px] xs:h-[230px] sm:h-[250px] lg:h-[280px] touch-manipulation overflow-hidden flex flex-col',
          className
        )}
        style={{
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          borderRadius: '12px',
        }}
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
        {...props}
      >
        <div className="relative w-full h-[150px] sm:h-[170px] lg:h-[190px] overflow-hidden">
          {decorative && (
            <>
              <div className="absolute inset-0 transform group-hover:scale-105 transition-transform duration-700 ease-out">
                {decorative}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/15 to-transparent" />
            </>
          )}
        </div>
        <div className="relative z-10 flex-1 flex flex-col gap-3 px-3 sm:px-4 lg:px-5 xl:px-6 py-3 sm:py-4 lg:py-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-zinc-800/70 flex items-center justify-center text-white">
              <Icon size={20} strokeWidth={1.8} />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <Text
                as="h3"
                className="text-white leading-tight line-clamp-2 font-semibold"
                size="md"
              >
                {title}
              </Text>
              <Text as="p" className="text-zinc-400 line-clamp-2 leading-snug" size="sm">
                {description}
              </Text>
            </div>
          </div>
          <div className="mt-auto">
            <button
              type="button"
              className="px-3 sm:px-3.5 lg:px-4 py-2 sm:py-2.5 bg-[rgb(var(--color-brand-primary-rgb))] hover:brightness-110 active:brightness-90 text-white rounded-md sm:rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[rgb(var(--color-brand-primary-rgb))]/20 touch-target-sm"
              style={{
                fontSize: 'clamp(11px, 2vw, 14px)',
                fontWeight: '500',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <span className="truncate">{buttonText}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 group-hover:translate-x-0.5 transition-all duration-200">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
          {children}
        </div>
      </Card>
    );
  }
);

ActionCardRoot.displayName = 'ActionCard';

interface ActionCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const ActionCardHeader = ({ children, className }: ActionCardHeaderProps) => {
  return (
    <div className={cn('pb-4 border-b border-white/5', className)}>
      {children}
    </div>
  );
};

interface ActionCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const ActionCardContent = ({ children, className }: ActionCardContentProps) => {
  return (
    <div className={cn('flex-1', className)}>
      {children}
    </div>
  );
};

interface ActionCardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ActionCardFooter = ({ children, className }: ActionCardFooterProps) => {
  return (
    <div className={cn('pt-4 border-t border-white/5', className)}>
      {children}
    </div>
  );
};

export const ActionCard = Object.assign(ActionCardRoot, {
  Header: ActionCardHeader,
  Content: ActionCardContent,
  Footer: ActionCardFooter,
});
