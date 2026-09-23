import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import { navMenus } from '@/composables/useNavMenus'
import { useAcceptanceStore } from '@/stores/acceptance'

const placeholder = () => import('@/views/PlaceholderView.vue')

const routes: RouteRecordRaw[] = [
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
          component: placeholder,
          meta: { title: m.label, placeholder: true },
        })),
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const acc = useAcceptanceStore()
  if (acc.entryStatus === 'pending' && !['/workspace', '/settings'].includes(to.path) && !to.path.startsWith('/onboarding/')) {
    return '/workspace'
  }
})

router.afterEach((to) => {
  const title = (to.meta.title as string) || '工作台'
  document.title = `${title} · 万联易达供应商端`
})

export default router
