import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { changeLanguageAsync, supportedLanguages } from '@/locales/config';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function LanguageButton({
  onLanguageChange = changeLanguageAsync,
}: {
  onLanguageChange?: (language: string) => void;
}) {
  const { t, i18n } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={t('common.language')}
        >
          <Languages className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={i18n.language}
          onValueChange={onLanguageChange}
        >
          {supportedLanguages.map(({ code, displayName }) => (
            <DropdownMenuRadioItem key={code} value={code}>
              {displayName}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
