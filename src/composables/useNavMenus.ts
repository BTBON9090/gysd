import type { Component } from 'vue'
import {
  LayoutDashboard,
  MapPinned,
  Store,
  HeartHandshake,
  ClipboardList,
  RotateCcw,
  ReceiptText,
  Wallet,
  Star,
  Building2,
  Settings,
} from 'lucide-vue-next'

export interface NavItem {
  key: string
  label: string
  path: string
  icon: Component
  /** 语义色 class 后缀 */
  tone: 'red' | 'blue' | 'cyan' | 'green' | 'amber' | 'orange' | 'purple' | 'pink' | 'indigo' | 'teal'
  badge?: number
  children?: { key: string; label: string; path: string }[]
}

export const navMenus: NavItem[] = [
  { key: 'workspace', label: '工作台', path: '/workspace', icon: LayoutDashboard, tone: 'red' },
  { key: 'park', label: '我的园区', path: '/park', icon: MapPinned, tone: 'blue' },
  {
    key: 'shop',
    label: '店铺管理',
    path: '/shop',
    icon: Store,
    tone: 'cyan',
    children: [
      { key: 'shop-info', label: '店铺信息', path: '/shop/info' },
      { key: 'shop-decorate', label: '店铺装修', path: '/shop/decorate' },
    ],
  },
  { key: 'service', label: '服务管理', path: '/service', icon: HeartHandshake, tone: 'green' },
  { key: 'order', label: '订单管理', path: '/order', icon: ClipboardList, tone: 'amber', badge: 0 },
  { key: 'aftersale', label: '售后管理', path: '/aftersale', icon: RotateCcw, tone: 'orange' },
  {
    key: 'invoice',
    label: '发票管理',
    path: '/invoice',
    icon: ReceiptText,
    tone: 'teal',
    children: [
      { key: 'invoice-open', label: '开票申请', path: '/invoice/open' },
      { key: 'invoice-record', label: '开票记录', path: '/invoice/record' },
    ],
  },
  { key: 'wallet', label: '我的钱包', path: '/wallet', icon: Wallet, tone: 'pink' },
  { key: 'review', label: '评价中心', path: '/review', icon: Star, tone: 'purple' },
  { key: 'merchant', label: '商户管理', path: '/merchant', icon: Building2, tone: 'indigo' },
  {
    key: 'settings',
    label: '基础设置',
    path: '/settings',
    icon: Settings,
    tone: 'amber',
    children: [
      { key: 'settings-account', label: '账号安全', path: '/settings/account' },
      { key: 'settings-member', label: '成员管理', path: '/settings/member' },
    ],
  },
]
