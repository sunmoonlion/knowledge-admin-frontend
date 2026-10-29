import {
  BookA,
  ChartNoAxesCombined,
  Gauge,
  BookOpen,
  HardDrive,
  ShieldBan,
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
    | 'userDataUsage'
    | 'userDataVocabulary'
    | 'userDataMaterials'
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
  // 用户资料：用量、词表、被禁用资料的处理（SDD 0044 第四节）
  {
    key: 'user-data-usage',
    path: '/user-data/usage',
    labelKey: 'userDataUsage',
    icon: HardDrive,
    requiredRoles: ['admin', 'operator'],
  },
  {
    key: 'user-data-vocabulary',
    path: '/user-data/vocabulary',
    labelKey: 'userDataVocabulary',
    icon: BookA,
    requiredRoles: ['admin', 'operator'],
  },
  {
    key: 'user-data-materials',
    path: '/user-data/materials',
    labelKey: 'userDataMaterials',
    icon: ShieldBan,
    requiredRoles: ['admin', 'operator'],
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
