<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PanelLeftClose, PanelLeftOpen, ChevronRight } from 'lucide-vue-next'
import { navMenus, type NavItem } from '@/composables/useNavMenus'

const route = useRoute()
const router = useRouter()
const collapsed = ref(false)
const openGroups = ref<Record<string, boolean>>({ shop: true })

const activePath = computed(() => route.path)

function isActive(item: NavItem): boolean {
  if (item.children?.length) {
    return activePath.value === item.path || item.children.some((c) => activePath.value.startsWith(c.path))
  }
  return activePath.value === item.path
}

function go(item: NavItem) {
  if (item.children?.length) {
    openGroups.value[item.key] = !openGroups.value[item.key]
    if (!isActive(item)) router.push(item.path)
    return
  }
  router.push(item.path)
}

function goChild(path: string) {
  router.push(path)
}
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
        <PanelLeftClose v-if="!collapsed" :size="18" />
        <PanelLeftOpen v-else :size="18" />
      </button>
    </div>

    <nav class="nav-list" aria-label="主导航">
      <div v-for="item in navMenus" :key="item.key" class="nav-block">
        <button
          class="nav-item"
          :class="[{ active: isActive(item), disabled: collapsed && !!item.children }, `tone-${item.tone}`]"
          type="button"
          :title="item.label"
          @click="go(item)"
        >
          <span class="nav-icon" aria-hidden="true">
            <component :is="item.icon" :size="18" stroke-width="1.9" />
          </span>
          <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
          <span v-if="!collapsed && item.badge" class="nav-badge">{{ item.badge }}</span>
          <ChevronRight
            v-if="!collapsed && item.children"
            class="nav-arrow"
            :class="{ open: openGroups[item.key] }"
            :size="14"
          />
        </button>

        <transition name="sub">
          <div v-if="!collapsed && item.children && openGroups[item.key]" class="sub-list">
            <button
              v-for="c in item.children"
              :key="c.key"
              class="sub-item"
              :class="{ active: activePath === c.path }"
              type="button"
              @click="goChild(c.path)"
            >
              {{ c.label }}
            </button>
          </div>
        </transition>
      </div>
    </nav>

    <div v-if="!collapsed" class="sidenav-foot">
      <div class="foot-card">
        <strong>需要帮助？</strong>
        <p>供应商运营手册与在线客服</p>
        <button type="button" class="foot-link">查看指南 →</button>
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
  padding: 18px 14px 10px 18px;
  min-height: 52px;
}
.section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.04em;
}
.collapse-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--r-sm);
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

.nav-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 46px;
  padding: 0 12px;
  border: none;
  border-radius: var(--r-md);
  background: transparent;
  cursor: pointer;
  color: var(--text-regular);
  font-size: 14.5px;
  font-weight: 500;
  text-align: left;
  transition:
    background var(--t-fast) var(--ease-out),
    color var(--t-fast),
    box-shadow var(--t-fast);
}
.collapsed .nav-item {
  justify-content: center;
  padding: 0;
  gap: 0;
}
.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.nav-item.active {
  background: var(--bg-active);
  color: var(--brand-red);
  font-weight: 600;
  box-shadow: inset 3px 0 0 var(--brand-red);
}

/* 彩色图标芯片：浅底 + 饱满图标，统一尺寸，避免花哨 */
.nav-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: transform var(--t-fast) var(--ease-spring), box-shadow var(--t-fast);
}
.nav-item:hover .nav-icon {
  transform: translateY(-1px);
}
.nav-item.active .nav-icon {
  color: #fff;
  background: var(--brand-gradient) !important;
  box-shadow: 0 3px 10px rgba(229, 57, 53, 0.3);
}

/* tone → 浅底色 + 前景图标色 */
.tone-red .nav-icon { background: var(--c-red-bg); color: var(--c-red); }
.tone-orange .nav-icon { background: var(--c-orange-bg); color: var(--c-orange); }
.tone-amber .nav-icon { background: var(--c-amber-bg); color: #d97706; }
.tone-green .nav-icon { background: var(--c-green-bg); color: var(--c-green); }
.tone-teal .nav-icon { background: var(--c-teal-bg); color: var(--c-teal); }
.tone-cyan .nav-icon { background: var(--c-cyan-bg); color: var(--c-cyan); }
.tone-blue .nav-icon { background: var(--c-blue-bg); color: var(--c-blue); }
.tone-indigo .nav-icon { background: var(--c-indigo-bg); color: var(--c-indigo); }
.tone-purple .nav-icon { background: var(--c-purple-bg); color: var(--c-purple); }
.tone-pink .nav-icon { background: var(--c-pink-bg); color: var(--c-pink); }

.nav-label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: var(--r-pill);
  background: var(--brand-red);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.nav-arrow {
  color: var(--text-placeholder);
  transition: transform var(--t-base) var(--ease-out);
  flex-shrink: 0;
}
.nav-arrow.open {
  transform: rotate(90deg);
}

.sub-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 4px 0 6px 44px;
  padding-left: 12px;
  border-left: 1.5px solid var(--border-light);
}
.sub-item {
  border: none;
  background: transparent;
  text-align: left;
  padding: 8px 10px;
  border-radius: var(--r-sm);
  font-size: 13.5px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background var(--t-fast), color var(--t-fast);
}
.sub-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.sub-item.active {
  color: var(--brand-red);
  font-weight: 600;
  background: var(--brand-red-soft);
}

.sidenav-foot {
  padding: 12px;
}
.foot-card {
  background: linear-gradient(140deg, #fff7ed, #fff1f2);
  border: 1px solid #ffe4e0;
  border-radius: var(--r-md);
  padding: 14px;
}
.foot-card strong {
  font-size: 13.5px;
  color: var(--text-primary);
}
.foot-card p {
  margin: 4px 0 10px;
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.5;
}
.foot-link {
  border: none;
  background: #fff;
  color: var(--brand-red);
  font-weight: 600;
  font-size: 13px;
  padding: 7px 12px;
  border-radius: var(--r-pill);
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition: transform var(--t-fast) var(--ease-spring), box-shadow var(--t-fast);
}
.foot-link:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* 子菜单展开动效 */
.sub-enter-active,
.sub-leave-active {
  transition: opacity var(--t-base) var(--ease-out), transform var(--t-base) var(--ease-out);
  overflow: hidden;
}
.sub-enter-from,
.sub-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
