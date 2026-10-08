import { ChartNoAxesCombined, UserCheck } from 'lucide-react'

export type SidebarChild = {
  title: string
  href: string
}

export type SidebarItem = {
  id: string
  title: string
  icon?: typeof ChartNoAxesCombined
  href?: string
  type?: 'group' | 'simple'
  children?: SidebarChild[] | SidebarItem[]
}

export const sidebar_data: SidebarItem[] = [
  {
    id: 'main-group',
    title: 'Main',
    type: 'group',
    children: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: ChartNoAxesCombined,
        href: '/',
        children: [],
      },
      // {
      //   id: 'customers',
      //   title: 'Customers',
      //   icon: UserCheck,
      //   href: '/customers',
      //   children: [],
      // },
    ],
  },
]
