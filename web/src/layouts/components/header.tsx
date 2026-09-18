import { RAGFlowAvatar } from '@/components/ragflow-avatar';
import { LanguageButton } from '@/components/language-button';
import { useChangeLanguage } from '@/hooks/logic-hooks';
import {
  useFetchUserInfo,
  useListTenant,
} from '@/hooks/use-user-setting-request';
import { TenantRole } from '@/pages/user-setting/constants';
import { Routes } from '@/routes';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { BellButton } from './bell-button';
import ThemeButton from './theme-button';

export function Header() {
  const { t } = useTranslation();
  const changeLanguage = useChangeLanguage();
  const {
    data: { avatar, nickname },
  } = useFetchUserInfo();
  const { data: tenants } = useListTenant();
  const hasNotification = tenants?.some(
    (tenant) => tenant.role === TenantRole.Invite,
  );
  return (
    <div className="flex items-center gap-1" data-testid="auth-status">
      <LanguageButton onLanguageChange={changeLanguage} />
      <ThemeButton />
      {hasNotification && <BellButton />}
      <Link
        to={Routes.UserSetting}
        aria-label={t('header.setting')}
        className="ml-2 rounded-full"
        data-testid="settings-entrypoint"
      >
        <RAGFlowAvatar
          name={nickname}
          avatar={avatar}
          isPerson
          className="size-9"
        />
      </Link>
    </div>
  );
}
