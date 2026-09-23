import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import { navMenus } from '@/composables/useNavMenus'
import { useAcceptanceStore } from '@/stores/acceptance'
import { useSessionStore } from '@/stores/session'

const placeholder = () => import('@/views/PlaceholderView.vue')

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'demo-login', component: () => import('@/views/DemoLoginView.vue'), meta: { title: '重新进入演示' } },
  { path: '/customer-demo', name: 'customer-demo', component: () => import('@/views/CustomerDemoView.vue'), meta: { title: '园区客户端演示' } },
  {
    path: '/',
    component: AppShell,
    children: [
      { path: '', redirect: '/workspace' },
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
      ...navMenus
        .filter((m) => m.key !== 'workspace')
        .map((m) => ({
          path: m.path.replace(/^\//, ''),
          name: m.key,
          component: m.key === 'settings' ? () => import('@/views/settings/ProfileView.vue') : m.key === 'service' ? () => import('@/views/service/ServiceView.vue') : m.key === 'merchant' ? () => import('@/views/merchant/MerchantArchiveView.vue') : placeholder,
          meta: { title: m.label, placeholder: true },
        })),
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
  if (session.loggedIn && to.path === '/login') return '/workspace'
  const acc = useAcceptanceStore()
  if (to.query.entry === 'approved') acc.setEntryStatus('approved')
  if (to.query.entry === 'pending') acc.setEntryStatus('pending')
  if (acc.entryStatus === 'pending' && !['/workspace', '/settings', '/customer-demo'].includes(to.path) && !to.path.startsWith('/onboarding/')) {
    return '/workspace'
  }
})

router.afterEach((to) => {
  const title = (to.meta.title as string) || '工作台'
  document.title = `${title} · 万联易达供应商端`
})

export default router
