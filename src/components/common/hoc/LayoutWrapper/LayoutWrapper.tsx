import { Container } from '../../layout';
import { cn } from '../../../../lib/utils';

interface LayoutWrapperProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  maxWidth?: string;
  padding?: string;
}

export const LayoutWrapper = ({
  children,
  className,
  containerClassName,
  size = 'lg',
  maxWidth,
  padding = 'py-6 sm:py-8',
}: LayoutWrapperProps) => {
  return (
    <div className={cn(padding, className)}>
      <Container
        size={size}
        className={cn(maxWidth && `max-w-[${maxWidth}]`, containerClassName)}
      >
        {children}
      </Container>
    </div>
  );
};

interface PageLayoutProps extends LayoutWrapperProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageLayout = ({
  children,
  title,
  subtitle,
  actions,
  className,
  ...props
}: PageLayoutProps) => {
  return (
    <LayoutWrapper className={className} {...props}>
      {(title || subtitle || actions) && (
        <div className="mb-6 sm:mb-8">
          {(title || subtitle) && (
            <div className="mb-4">
              {title && (
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-zinc-400 text-sm sm:text-base">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {actions && (
            <div className="flex justify-end">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </LayoutWrapper>
  );
};
