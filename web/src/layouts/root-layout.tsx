import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router';
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ExternalLink,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Header } from './components/header';
import { SidebarNavigation } from './components/global-navbar';

export function RootLayoutContainer({ children }: React.PropsWithChildren) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('jorjin-sidebar-collapsed') === 'true',
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleSidebar = () =>
    setCollapsed((value) => {
      localStorage.setItem('jorjin-sidebar-collapsed', String(!value));
      return !value;
    });
  const closeMobile = () => setMobileOpen(false);
  return (
    <div className="flex size-full min-w-0 bg-bg-base">
      <aside
        className={cn(
          'hidden h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <Link
          to="/"
          className="flex h-20 shrink-0 items-center justify-center border-b border-sidebar-border px-3"
        >
          <BrandLogo
            compact={collapsed}
            className={collapsed ? 'size-10' : 'w-full'}
          />
        </Link>
        <SidebarNavigation collapsed={collapsed} />
        <div className="space-y-2 border-t border-sidebar-border p-3">
          <a
            href="https://jorjin.com/"
            target="_blank"
            rel="noreferrer noopener"
            aria-label={t('brand.website')}
            title={t('brand.website')}
            className="flex min-h-10 items-center justify-center gap-2 rounded-lg text-sm text-text-secondary hover:bg-sidebar-accent"
          >
            <ExternalLink className="size-4" />
            {!collapsed && t('brand.website')}
          </a>
          <Button
            variant="ghost"
            className="w-full"
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
                <span>{t('brand.collapseSidebar')}</span>
              </>
            )}
          </Button>
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border-button bg-bg-component px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="lg:hidden"
                  aria-label={t('brand.navigation')}
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex w-72 flex-col gap-0 bg-sidebar p-0"
              >
                <SheetTitle className="sr-only">
                  {t('brand.navigation')}
                </SheetTitle>
                <Link
                  to="/"
                  onClick={closeMobile}
                  className="flex h-20 items-center px-6"
                >
                  <BrandLogo className="w-52" />
                </Link>
                <SidebarNavigation onNavigate={closeMobile} />
                <a
                  href="https://jorjin.com/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="border-t border-sidebar-border p-5 text-sm text-text-secondary"
                >
                  {t('brand.website')}
                </a>
              </SheetContent>
            </Sheet>
            <span className="truncate text-sm font-semibold text-text-secondary">
              Jorjin RAG
            </span>
          </div>
          <Header />
        </header>
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function RootLayout() {
  return (
    <RootLayoutContainer>
      <Outlet />
    </RootLayoutContainer>
  );
}
