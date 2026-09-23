<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMenu, ElMenuItem, ElSubMenu } from 'element-plus'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'
import { navMenus } from '@/composables/useNavMenus'

const route = useRoute()
const collapsed = defineModel<boolean>('collapsed', { default: false })
const activePath = computed(() => route.path)
const rootItems = navMenus
</script>

<template>
  <aside class="sidenav" :class="{ collapsed }">
    <div class="sidenav-head">
      <span v-if="!collapsed" class="section-label">工作台</span>
      <button
        class="collapse-btn"
        type="button"
        :aria-label="collapsed ? '展开侧栏' : '收起侧栏'"
        @click="collapsed = !collapsed"
      >
        <PanelLeftClose v-if="!collapsed" :size="16" />
        <PanelLeftOpen v-else :size="16" />
      </button>
    </div>

    <ElMenu
      class="nav-menu"
      :default-active="activePath"
      :collapse="collapsed"
      :collapse-transition="true"
      router
    >
      <template v-for="item in rootItems" :key="item.key">
        <ElSubMenu v-if="item.children?.length" :index="item.path">
          <template #title>
            <!-- EP collapse hides direct > span children of sub-menu title — wrap in div so icons survive -->
            <div class="nav-title">
              <span class="nav-icon" :class="`tone-${item.tone}`">
                <component :is="item.icon" :size="16" stroke-width="1.8" />
              </span>
              <span class="nav-label">{{ item.label }}</span>
            </div>
          </template>
          <ElMenuItem v-for="c in item.children" :key="c.key" :index="c.path">
            {{ c.label }}
          </ElMenuItem>
        </ElSubMenu>

        <ElMenuItem v-else :index="item.path">
          <span class="nav-icon" :class="`tone-${item.tone}`">
            <component :is="item.icon" :size="16" stroke-width="1.8" />
          </span>
          <template #title>
            <span class="nav-label">{{ item.label }}</span>
            <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
          </template>
        </ElMenuItem>
      </template>
    </ElMenu>

    <div v-if="!collapsed" class="sidenav-foot">
      <div class="foot-card">
        <strong>需要帮助？</strong>
        <p>供应商运营手册与在线客服</p>
        <button type="button" class="foot-link">查看指南</button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidenav {
  width: var(--sidebar-w);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-light);
  transition: width var(--t-base) var(--ease-out);
  overflow: hidden;
}
.sidenav.collapsed {
  width: var(--sidebar-w-collapsed);
}

.sidenav-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 8px 6px 10px;
  min-height: 44px;
}
/* 收起后只留折叠按钮，与下方图标对齐 */
.sidenav.collapsed .sidenav-head {
  justify-content: center;
  padding: 12px 0 6px;
}
.section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-placeholder);
  letter-spacing: 0.04em;
}
.collapse-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--r-xs);
  background: transparent;
  color: var(--text-placeholder);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background var(--t-fast), color var(--t-fast);
}
.collapse-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-menu {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 6px;
}

/* 菜单项：去重描边，仅浅底选中 */
.nav-menu :deep(.el-menu-item),
.nav-menu :deep(.el-sub-menu__title) {
  height: 40px;
  line-height: 40px;
  border-radius: var(--r-sm);
  margin-bottom: 2px;
  color: var(--text-regular);
  font-size: 14px;
  font-weight: 500;
  transition: background var(--t-fast) var(--ease-out), color var(--t-fast);
}
.nav-menu :deep(.el-menu-item:hover),
.nav-menu :deep(.el-sub-menu__title:hover) {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.nav-menu :deep(.el-menu-item.is-active) {
  background: var(--bg-active);
  color: var(--brand);
  font-weight: 600;
}
/* 去掉 EP 默认左侧高亮条 */
.nav-menu :deep(.el-menu-item.is-active)::before {
  display: none !important;
}
.nav-menu :deep(.el-sub-menu.is-active .el-sub-menu__title) {
  color: var(--brand);
}

.nav-menu :deep(.el-sub-menu .el-menu) {
  margin-left: 4px;
  padding-left: 0;
  background: transparent !important;
}
.nav-menu :deep(.el-sub-menu .el-menu-item) {
  height: 34px;
  line-height: 34px;
  font-size: 13.5px;
  font-weight: 400;
  padding-left: 44px !important;
  color: var(--text-secondary);
}
.nav-menu :deep(.el-sub-menu .el-menu-item.is-active) {
  background: transparent;
  color: var(--brand);
}

/* 折叠态：图标居中；标签隐藏。
   注意不要用 `> span { visibility:hidden }` 去仿 EP —— 会连图标一起藏掉。 */
.nav-title {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}
/* 行贴满侧栏，中线 = 侧栏中心。
   EP 折叠态会把 .el-menu--collapse 锁成 64px，比 56px 侧栏宽，必须拉回 100%。 */
.sidenav.collapsed .nav-menu {
  width: 100% !important;
  max-width: 100%;
  padding-left: 0;
  padding-right: 0;
}
.sidenav.collapsed .nav-menu :deep(.el-menu-item),
.sidenav.collapsed .nav-menu :deep(.el-sub-menu__title) {
  padding: 0 !important;
  justify-content: center;
}
/* 普通项折叠时包在 tooltip trigger 里，EP 默认左右 20px padding 把图标推向右侧 */
.sidenav.collapsed .nav-menu :deep(.el-menu-tooltip__trigger),
.sidenav.collapsed .nav-menu :deep(.el-tooltip__trigger) {
  width: 100%;
  padding: 0 !important;
  justify-content: center;
}
.sidenav.collapsed .nav-title {
  width: 100%;
  justify-content: center;
  flex: none;
}
.sidenav.collapsed .nav-label {
  display: none;
}
.sidenav.collapsed .nav-icon {
  margin-right: 0;
}
.sidenav.collapsed .nav-badge {
  display: none;
}

.nav-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  margin-right: 8px;
  transition: background var(--t-fast);
}

/* 收敛的图标色：低饱和底 + 中等饱和图标 */
.tone-red .nav-icon { background: var(--c-red-bg); color: var(--c-red); }
.tone-orange .nav-icon { background: var(--c-orange-bg); color: var(--c-orange); }
.tone-amber .nav-icon { background: var(--c-amber-bg); color: var(--c-amber); }
.tone-green .nav-icon { background: var(--c-green-bg); color: var(--c-green); }
.tone-teal .nav-icon { background: var(--c-teal-bg); color: var(--c-teal); }
.tone-cyan .nav-icon { background: var(--c-cyan-bg); color: var(--c-cyan); }
.tone-blue .nav-icon { background: var(--c-blue-bg); color: var(--c-blue); }
.tone-indigo .nav-icon { background: var(--c-indigo-bg); color: var(--c-indigo); }
.tone-purple .nav-icon { background: var(--c-purple-bg); color: var(--c-purple); }
.tone-pink .nav-icon { background: var(--c-pink-bg); color: var(--c-pink); }

/* 选中时图标不强制变白渐变，保持沉稳 */
.nav-menu :deep(.el-menu-item.is-active) .nav-icon {
  background: var(--brand-soft-strong);
  color: var(--brand);
}

.nav-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--r-pill);
  background: var(--status-danger);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: inline-grid;
  place-items: center;
  margin-left: auto;
}

.sidenav-foot {
  padding: 8px;
}
.foot-card {
  background: var(--bg-muted);
  border: 1px solid var(--border-light);
  border-radius: var(--r-md);
  padding: 12px;
}
.foot-card strong {
  font-size: 13px;
  color: var(--text-primary);
}
.foot-card p {
  margin: 3px 0 8px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}
.foot-link {
  border: none;
  background: transparent;
  color: var(--brand);
  font-weight: 600;
  font-size: 13px;
  padding: 0;
  cursor: pointer;
}
.foot-link:hover {
  text-decoration: underline;
}
</style>
