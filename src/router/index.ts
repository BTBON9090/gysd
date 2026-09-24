import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import { useAcceptanceStore } from '@/stores/acceptance'
import { useCommerceStore } from '@/stores/commerce'
import { useSessionStore } from '@/stores/session'
import { useOnboardingStore } from '@/stores/onboarding'

const entryPage = () => useAcceptanceStore().entryStatus === 'approved' || useOnboardingStore().status === 'approved' ? '/park' : '/workspace'

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'demo-login', component: () => import('@/views/DemoLoginView.vue'), meta: { title: '重新进入演示' } },
  { path: '/customer-demo', name: 'customer-demo', component: () => import('@/views/CustomerDemoView.vue'), meta: { title: '园区客户端演示' } },
  {
    path: '/',
    component: AppShell,
    children: [
      { path: '', redirect: entryPage },
      {
        path: 'workspace',
        name: 'workspace',
        component: () => import('@/views/WorkspaceView.vue'),
        meta: { title: '工作台' },
      },
      {
        path: 'onboarding',
        component: () => import('@/views/onboarding/OnboardingLayout.vue'),
        children: [
          { path: '', redirect: '/workspace' },
          { path: 'entity', name: 'onboarding-entity', component: () => import('@/views/onboarding/EntityView.vue'), meta: { title: '经营主体' } },
          { path: 'step/:n', name: 'onboarding-step', component: () => import('@/views/onboarding/StepView.vue'), meta: { title: '供应商入驻' } },
          { path: 'progress', name: 'onboarding-progress', component: () => import('@/views/onboarding/ProgressView.vue'), meta: { title: '入驻进度查询' } },
        ],
      },
      { path: 'park', name: 'park', component: () => import('@/views/commerce/ParkView.vue'), meta: { title: '我的园区' } },
      { path: 'shop', redirect: '/shop/info' },
      { path: 'shop/info', name: 'shop-info', component: () => import('@/views/commerce/ShopInfoView.vue'), meta: { title: '店铺资料' } },
      { path: 'shop/cases', name: 'shop-cases', component: () => import('@/views/commerce/CasesView.vue'), meta: { title: '案例管理' } },
      { path: 'service', name: 'service', component: () => import('@/views/service/ServiceView.vue'), meta: { title: '服务管理' } },
      { path: 'service/new', name: 'service-new', component: () => import('@/views/service/ServiceEditorView.vue'), meta: { title: '发布服务' } },
      { path: 'service/edit/:id', name: 'service-edit', component: () => import('@/views/service/ServiceEditorView.vue'), meta: { title: '编辑服务' } },
      { path: 'service/submitted', name: 'service-submitted', component: () => import('@/views/service/ServiceSubmittedView.vue'), meta: { title: '提交成功' } },
      { path: 'order', name: 'order', component: () => import('@/views/commerce/OrdersView.vue'), meta: { title: '订单管理' } },
      { path: 'order/:id', name: 'order-detail', component: () => import('@/views/commerce/OrderDetailView.vue'), meta: { title: '订单详情' } },
      { path: 'aftersale', name: 'aftersale', component: () => import('@/views/commerce/AfterSaleView.vue'), meta: { title: '售后管理' } },
      { path: 'invoice', redirect: '/invoice/open' },
      { path: 'invoice/open', name: 'invoice-open', component: () => import('@/views/commerce/InvoiceOpenView.vue'), meta: { title: '开票申请' } },
      { path: 'invoice/record', name: 'invoice-record', component: () => import('@/views/commerce/InvoiceRecordView.vue'), meta: { title: '开票记录' } },
      { path: 'wallet', name: 'wallet', component: () => import('@/views/commerce/WalletView.vue'), meta: { title: '我的钱包' } },
      { path: 'review', name: 'review', component: () => import('@/views/commerce/ReviewView.vue'), meta: { title: '评价中心' } },
      { path: 'merchant', name: 'merchant', component: () => import('@/views/merchant/MerchantArchiveView.vue'), meta: { title: '商户管理' } },
      { path: 'merchant/change', name: 'merchant-change', component: () => import('@/views/merchant/MerchantChangeView.vue'), meta: { title: '入驻信息变更' } },
      { path: 'settings', name: 'settings', component: () => import('@/views/settings/ProfileView.vue'), meta: { title: '个人信息' } },
      { path: 'settings/member', name: 'settings-member', component: () => import('@/views/settings/MembersView.vue'), meta: { title: '成员管理' } },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const session = useSessionStore()
  if (!session.loggedIn && to.path !== '/login') return '/login'
  if (session.loggedIn && to.path === '/login') return entryPage()
  const acc = useAcceptanceStore()
  if (to.query.entry === 'approved') acc.setEntryStatus('approved')
  if (to.query.entry === 'pending') acc.setEntryStatus('pending')
  if (acc.entryStatus === 'pending' && !['/workspace', '/settings', '/customer-demo'].includes(to.path) && !to.path.startsWith('/onboarding/')) {
    return '/workspace'
  }
  if (to.path === '/service/new' && !useCommerceStore().data.walletOpen) return '/wallet'
})

router.afterEach((to) => {
  const title = (to.meta.title as string) || '工作台'
  document.title = `${title} · 万联易达供应商端`
})

export default router
