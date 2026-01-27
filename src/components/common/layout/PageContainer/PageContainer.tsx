import { HTMLAttributes } from 'react';
import { cn } from '../../../../lib/utils';
import { DESIGN_TOKENS } from '../../../../constants';

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: string;
}

const PAGE_CONTAINER_CLASS =
  'w-full flex justify-center px-4 pt-6 pb-8 sm:px-6 sm:pt-8 sm:pb-10 lg:px-8 lg:pt-8 lg:pb-12';

const CONTENT_WRAPPER_CLASS =
  'w-full';

export const PageContainer = ({
  className,
  maxWidth = DESIGN_TOKENS.layout.content.base,
  children,
  ...props
}: PageContainerProps) => {
  return (
    <div
      className={cn(PAGE_CONTAINER_CLASS, className)}
      {...props}
    >
      <div 
        className={CONTENT_WRAPPER_CLASS}
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  );
};
