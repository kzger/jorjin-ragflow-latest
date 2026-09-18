import { cn } from '@/lib/utils';

/**
 * Basic page container:
 * - Full size
 * - Responsive content gutters
 * - Auto scrollbar
 */
export function PageContainer({
  className,
  ...props
}: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn(
        'size-full px-4 py-6 sm:px-6 lg:px-8 overflow-auto',
        className,
      )}
      {...props}
    />
  );
}
