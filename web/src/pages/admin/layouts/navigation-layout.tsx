import { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useNavigate } from 'react-router';

import { useMutation, useQuery } from '@tanstack/react-query';

import {
  LucideMonitor,
  LucideServerCrash,
  LucideSquareUserRound,
  LucideUserCog,
  LucideUserStar,
  LucideZap,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand-logo';
import { LanguageButton } from '@/components/language-button';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';
import { getSystemVersion, logout } from '@/services/admin-service';

import authorizationUtil from '@/utils/authorization-util';

import ThemeButton from '@/layouts/components/theme-button';
import { IS_ENTERPRISE } from '../utils';
import { CurrentUserInfoContext } from './root-layout';

const AdminNavigationLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [, setCurrentUserInfo] = useContext(CurrentUserInfoContext);
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed((value) => !value);

  const { data: version } = useQuery({
    queryKey: ['admin/version'],
    queryFn: async () => (await getSystemVersion())?.data?.data?.version,
  });

  const navItems = useMemo(
    () => [
      {
        path: Routes.AdminServices,
        name: t('admin.serviceStatus'),
        icon: <LucideServerCrash className="size-[1em]" />,
      },
      {
        path: Routes.AdminUserManagement,
        name: t('admin.userManagement'),
        icon: <LucideUserCog className="size-[1em]" />,
      },
      {
        path: Routes.AdminSandboxSettings,
        name: t('admin.sandboxSettings'),
        icon: <LucideZap className="size-[1em]" />,
      },
      ...(IS_ENTERPRISE
        ? [
            {
              path: Routes.AdminWhitelist,
              name: t('admin.registrationWhitelist'),
              icon: <LucideUserStar className="size-[1em]" />,
            },
            {
              path: Routes.AdminRoles,
              name: t('admin.roles'),
              icon: <LucideSquareUserRound className="size-[1em]" />,
            },
            {
              path: Routes.AdminMonitoring,
              name: t('admin.monitoring'),
              icon: <LucideMonitor className="size-[1em]" />,
            },
          ]
        : []),
    ],
    [t],
  );

  const logoutMutation = useMutation({
    mutationKey: ['adminLogout'],
    mutationFn: async () => {
      await logout();
      authorizationUtil.removeAll();
      navigate(Routes.Admin);
      setCurrentUserInfo({
        userInfo: null,
        source: null,
      });
    },
    retry: false,
  });
  const handleLogout = () => logoutMutation.mutate();

  return (
    <main className="flex h-dvh w-full flex-col overflow-auto bg-bg-base md:flex-row md:overflow-hidden">
      <aside
        className={cn(
          'flex shrink-0 flex-col gap-5 border-b border-sidebar-border bg-sidebar p-3 md:border-b-0 md:border-r',
          collapsed ? 'md:w-16' : 'md:w-64',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-center">
          <BrandLogo
            compact={collapsed}
            className={collapsed ? 'size-10' : 'w-52'}
          />
        </div>

        <nav className="min-h-0 overflow-auto">
          <ul className="space-y-1">
            {navItems.map((it) => (
              <li key={it.path}>
                <NavLink
                  to={it.path}
                  aria-label={it.name}
                  title={collapsed ? it.name : undefined}
                  className={({ isActive }) =>
                    cn(
                      'px-4 py-3 rounded-lg',
                      'text-base w-full flex items-center justify-start text-text-secondary',
                      'hover:bg-bg-card focus:bg-bg-card focus-visible:bg-bg-card',
                      'hover:text-text-primary focus:text-text-primary focus-visible:text-text-primary',
                      'active:text-text-primary',
                      'transition-colors',
                      collapsed && 'md:justify-center md:px-0',
                      {
                        'bg-primary/10 text-primary': isActive,
                      },
                    )
                  }
                >
                  {it.icon}
                  <span className={cn('ml-3', collapsed && 'md:hidden')}>
                    {it.name}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto space-y-4">
          <div
            className={cn(
              'flex justify-between items-center',
              collapsed && 'md:flex-col',
            )}
          >
            <span
              className={cn(
                'leading-none text-xs text-accent-primary',
                collapsed && 'md:hidden',
              )}
            >
              {version}
            </span>

            <LanguageButton />
            <ThemeButton />
          </div>

          <Button
            size="lg"
            variant="transparent"
            block
            onClick={handleLogout}
            aria-label={t('header.logout')}
            className={cn(collapsed && 'md:px-0')}
          >
            <LogOut className="size-4" />
            <span className={cn(collapsed && 'md:hidden')}>
              {t('header.logout')}
            </span>
          </Button>
          <Button
            variant="ghost"
            className="hidden w-full md:inline-flex"
            onClick={toggleSidebar}
            aria-label={t(
              collapsed ? 'brand.expandSidebar' : 'brand.collapseSidebar',
            )}
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <PanelLeftOpen />
            ) : (
              <>
                <PanelLeftClose />
                {t('brand.collapseSidebar')}
              </>
            )}
          </Button>
        </div>
      </aside>

      <section className="min-h-0 min-w-0 flex-1 overflow-auto p-4 sm:p-6">
        <Outlet />
      </section>
    </main>
  );
};

export default AdminNavigationLayout;
