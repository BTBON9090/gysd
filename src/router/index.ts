import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import { navMenus } from '@/composables/useNavMenus'

const placeholder = () => import('@/views/PlaceholderView.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppShell,
    children: [
      { path: '', redirect: '/workspace' },
      { path: 'workspace', name: 'workspace', component: () => import('@/views/WorkspaceView.vue'), meta: { title: '工作台' } },
      ...navMenus
        .filter((m) => m.key !== 'workspace')
        .map((m) => ({
          path: m.path,
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

router.afterEach((to) => {
  const title = (to.meta.title as string) || '工作台'
  document.title = `${title} · 万联易达供应商端`
})

export default router
