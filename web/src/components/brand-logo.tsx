import { cn } from '@/lib/utils';
import { appName } from '@/conf.json';

/** Uses the supplied artwork unchanged, framing its transparent margins. */
export function BrandLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={appName}
      className={cn('brand-logo', compact && 'brand-logo-compact', className)}
    >
      <img
        src={compact ? '/jorjin-rag-icon.svg' : '/jorjin-rag-logo.png'}
        alt=""
        aria-hidden="true"
      />
    </span>
  );
}
