import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import {
  House,
  Database,
  MessagesSquare,
  Search,
  Workflow,
  Brain,
  Files,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';

const MenuItems = [
  { path: Routes.Root, name: 'header.home', icon: House, paths: [Routes.Root] },
  {
    path: Routes.Datasets,
    name: 'header.dataset',
    icon: Database,
    paths: [Routes.Datasets, Routes.DatasetBase],
  },
  {
    path: Routes.Chats,
    name: 'header.chat',
    icon: MessagesSquare,
    paths: [Routes.Chats, Routes.Chat],
    testId: 'nav-chat',
  },
  {
    path: Routes.Searches,
    name: 'header.search',
    icon: Search,
    paths: [Routes.Searches, Routes.Search],
    testId: 'nav-search',
  },
  {
    path: Routes.Agents,
    name: 'header.flow',
    icon: Workflow,
    paths: [
      Routes.Agents,
      Routes.Agent,
      Routes.AgentTemplates,
      Routes.AgentList,
    ],
    testId: 'nav-agent',
  },
  {
    path: Routes.Memories,
    name: 'header.memories',
    icon: Brain,
    paths: [
      Routes.Memories,
      Routes.Memory,
      Routes.MemoryMessage,
      Routes.MemorySetting,
    ],
  },
  {
    path: Routes.Files,
    name: 'header.fileManager',
    icon: Files,
    paths: [Routes.Files],
  },
  {
    path: Routes.UserSetting,
    name: 'header.setting',
    icon: Settings,
    paths: [Routes.UserSetting, Routes.ProfileSetting],
  },
];

export function SidebarNavigation({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  return (
    <nav
      aria-label={t('brand.navigation')}
      className="min-h-0 flex-1 overflow-y-auto p-3"
    >
      <ul className="space-y-1">
        {MenuItems.map(({ path, name, icon: Icon, paths, testId }) => {
          const active = paths.some(
            (candidate) =>
              pathname === candidate ||
              (candidate !== '/' && pathname.startsWith(`${candidate}/`)),
          );
          return (
            <li key={path}>
              <Link
                to={path}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                aria-label={t(name)}
                title={collapsed ? t(name) : undefined}
                data-testid={testId}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-sidebar-accent hover:text-text-primary',
                  collapsed && 'justify-center px-0',
                  active && 'bg-primary/10 text-primary hover:text-primary',
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                {!collapsed && <span className="truncate">{t(name)}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
