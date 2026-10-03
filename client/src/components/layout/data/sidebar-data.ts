import {
  ChartNoAxesCombined,
  ClipboardCheck,
  ListTodo,
  Lock,
  LogIn,
  Mail,
  MailQuestion,
  MessageCircleMore,
  RefreshCcwDot,
  ScanLine,
  CircleQuestionMark,
  Box,
  ChartPie,
  Pyramid,
  Table,
  RectangleEllipsis,
  Palette,
} from 'lucide-react'

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
    ],
  },
]
