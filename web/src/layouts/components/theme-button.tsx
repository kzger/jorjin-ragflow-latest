import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeEnum } from '@/constants/common';
import { cn } from '@/lib/utils';

export default function ThemeButton({ className }: { className?: string }) {
  const { setTheme, preference } = useTheme();
  const { t } = useTranslation();
  const Icon =
    preference === ThemeEnum.System
      ? Monitor
      : preference === ThemeEnum.Dark
        ? Moon
        : Sun;
  const handleChange = (value: string) => setTheme(value as ThemeEnum);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className={cn('shrink-0', className)}
          aria-label={t('brand.theme')}
        >
          <Icon className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={preference} onValueChange={handleChange}>
          {[ThemeEnum.Light, ThemeEnum.Dark, ThemeEnum.System].map((value) => (
            <DropdownMenuRadioItem key={value} value={value}>
              {t(`brand.${value}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
