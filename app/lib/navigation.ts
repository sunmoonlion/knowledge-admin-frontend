import {
  ChartNoAxesCombined,
  Database,
  FolderOpen,
  Gauge,
  BookOpen,
  Settings,
  TableProperties,
  type LucideIcon,
} from 'lucide-react'

export type AdminNavigationItem = {
  key: string
  path: string
  labelKey:
    | 'dashboard'
    | 'reference'
    | 'richReference'
    | 'settings'
    | 'knowledgeIngestions'
    | 'knowledgeCatalog'
    | 'knowledgeDatasets'
  icon: LucideIcon
  requiredRoles?: readonly string[]
  pinned?: boolean
}

export const adminNavigation: readonly AdminNavigationItem[] = [
  {
    key: 'dashboard',
    path: '/dashboard',
    labelKey: 'dashboard',
    icon: Gauge,
    pinned: true,
  },

  {
    key: 'knowledge-ingestions',
    path: '/knowledge/ingestions',
    labelKey: 'knowledgeIngestions',
    icon: BookOpen,
    requiredRoles: ['admin', 'operator'],
  },
  // 数据目录（账 56 起只在管理端）：公共库里有什么。只读，只给 knowledge 管理员
  {
    key: 'knowledge-catalog',
    path: '/knowledge/catalog',
    labelKey: 'knowledgeCatalog',
    icon: FolderOpen,
    requiredRoles: ['admin'],
  },
  // 数据集登记（PRD/apps/knowledge.md 3.3）。只读，只给 knowledge 管理员
  {
    key: 'knowledge-datasets',
    path: '/knowledge/datasets',
    labelKey: 'knowledgeDatasets',
    icon: Database,
    requiredRoles: ['admin'],
  },
  {
    key: 'reference',
    path: '/reference',
    labelKey: 'reference',
    icon: TableProperties,
    requiredRoles: ['admin', 'operator'],
  },
  {
    key: 'rich-reference',
    path: '/rich-reference',
    labelKey: 'richReference',
    icon: ChartNoAxesCombined,
    requiredRoles: ['admin'],
  },
  {
    key: 'settings',
    path: '/settings',
    labelKey: 'settings',
    icon: Settings,
  },
]

export function filterNavigationByRoles(
  roles: readonly string[],
  items: readonly AdminNavigationItem[] = adminNavigation,
) {
  const roleSet = new Set(roles)
  return items.filter(
    (item) => !item.requiredRoles || item.requiredRoles.some((role) => roleSet.has(role)),
  )
}

export function findNavigationItem(pathname: string) {
  const pathWithoutLocale = pathname.replace(/^\/(?:en|zh-CN)(?=\/|$)/, '') || '/'
  return adminNavigation.find(
    (item) =>
      pathWithoutLocale === item.path ||
      (item.path !== '/dashboard' && pathWithoutLocale.startsWith(`${item.path}/`)),
  )
}
