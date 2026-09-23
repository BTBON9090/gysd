<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, ChevronDown, LogOut, ArrowLeftRight, User, PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'
import { ElBadge, ElButton, ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
import { useAcceptanceStore } from '@/stores/acceptance'
import { useOnboardingStore } from '@/stores/onboarding'

const acc = useAcceptanceStore()
const ob = useOnboardingStore()
const router = useRouter()
const collapsed = defineModel<boolean>('collapsed', { default: false })
const isPending = computed(() => acc.entryStatus === 'pending')
const entryText = computed(() => isPending.value
  ? { draft: '待提交', reviewing: '审核中', rejected: '已驳回', approved: '待提交' }[ob.status]
  : '已通过')
const entryTone = computed(() => isPending.value ? ob.status : 'approved')
const statusLabels = { draft: '待提交', reviewing: '审核中', rejected: '已驳回', approved: '已通过' }

function switchApplication(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  if (!ob.selectApplication(id)) return
  acc.setEntryStatus(ob.status === 'approved' ? 'approved' : 'pending')
  if (ob.status === 'reviewing' || ob.status === 'rejected' || ob.status === 'approved') router.push('/onboarding/progress')
  else router.push(ob.entityVerified ? `/onboarding/step/${Math.max(1, ob.maxStep)}` : '/onboarding/entity')
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <a href="#/workspace" class="brand" aria-label="万联易达供应商端">
        <img v-if="collapsed" src="/zqyq-logo-icon.png" alt="" class="brand-icon" />
        <img v-else src="/zqyq-logo-all.png" alt="万联易达集团" class="brand-image" />
      </a>
    </div>

    <button class="sidebar-toggle" type="button" :aria-label="collapsed ? '展开侧栏' : '收起侧栏'" @click="collapsed = !collapsed">
      <PanelLeftOpen v-if="collapsed" :size="18" />
      <PanelLeftClose v-else :size="18" />
    </button>

    <div class="topbar-right">
      <span
        class="entry-status"
        :class="[entryTone, { pending: isPending }]"
        title="供应商入驻状态"
      >
        <span class="entry-dot" />
        入驻：{{ entryText }}
      </span>

      <label v-if="ob.applications.some(item => item.entityVerified)" class="supplier-switch">
        <span>切换主体</span>
        <select :value="ob.activeId" @change="switchApplication">
          <option v-if="!ob.entityVerified" :value="ob.activeId">个人账号 · 新申请</option>
          <option v-for="item in ob.applications.filter(a => a.entityVerified)" :key="item.id" :value="item.id">{{ item.draft.entityName }} · {{ statusLabels[item.status] }}</option>
        </select>
      </label>

      <ElBadge :value="2" :max="99">
        <ElButton text circle aria-label="消息通知" class="icon-btn">
          <Bell :size="18" stroke-width="1.7" />
        </ElButton>
      </ElBadge>

      <ElDropdown trigger="click" placement="bottom-end">
        <button class="user-chip" type="button">
          <span class="avatar">周</span>
          <span class="user-meta">
            <strong>周启明</strong>
            <small>临港企服</small>
          </span>
          <ChevronDown :size="14" class="chev" />
        </button>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem :icon="User">个人资料</ElDropdownItem>
            <ElDropdownItem :icon="ArrowLeftRight">切换账号</ElDropdownItem>
            <ElDropdownItem :icon="LogOut" divided>退出登录</ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  height: var(--topbar-h);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 0 0;
  background: var(--bg-topbar);
  border-bottom: 1px solid var(--border-light);
  z-index: 40;
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--sidebar-w);
  height: var(--topbar-h);
  padding: 0 9px;
  background: #17233b;
  transition: background var(--t-fast);
}
.brand:hover {
  background: #213657;
}
.brand-image { display: block; width: 157px; height: auto; max-height: 36px; object-fit: contain; }
.brand-icon { display: block; width: 30px; height: 30px; object-fit: contain; }
.topbar:has(.brand-icon) .brand { width: var(--sidebar-w-collapsed); }
.sidebar-toggle { width: 32px; height: 32px; display: grid; place-items: center; flex: none; margin-left: 10px; border: 0; border-radius: 8px; background: transparent; color: #63728a; cursor: pointer; }
.sidebar-toggle:hover { background: #eef2f8; color: #233c69; }

.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.entry-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--status-success);
  background: var(--status-success-soft);
  border: 1px solid rgba(22, 163, 74, 0.15);
}
.entry-status.pending {
  color: var(--brand);
  background: var(--brand-soft);
  border-color: rgba(59, 99, 211, 0.18);
}
.entry-status.pending .entry-dot {
  background: var(--brand);
}
.entry-status.pending.reviewing { color: #91580e; background: #fff4df; border-color: #f0dcb8; }
.entry-status.pending.reviewing .entry-dot { background: #c2812a; }
.entry-status.pending.rejected { color: #a93c34; background: #fff0ed; border-color: #f3d3cf; }
.entry-status.pending.rejected .entry-dot { background: #c55349; }
.entry-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--status-success);
}

.icon-btn {
  color: var(--text-secondary);
}
.icon-btn:hover {
  color: var(--text-primary);
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  padding: 4px 6px 4px 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: background var(--t-fast);
}
.user-chip:hover {
  background: var(--bg-hover);
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 13px;
  color: #fff;
  background: var(--brand-gradient);
}

.user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.25;
}
.user-meta strong {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}
.user-meta small {
  font-size: 11.5px;
  color: var(--text-placeholder);
}

.chev {
  color: var(--text-placeholder);
}

.supplier-switch { display: flex; align-items: center; gap: 7px; color: var(--text-secondary); font-size: 12px; }
.supplier-switch select { width: 205px; height: 31px; padding: 0 8px; border: 1px solid var(--border-strong); border-radius: 7px; background: #fff; color: var(--text-primary); font: inherit; text-overflow: ellipsis; }
@media(max-width:900px) { .supplier-switch span { display: none; } .supplier-switch select { width: 150px; } .user-meta { display: none; } }
@media(max-width:620px) { .entry-status { display: none; } .supplier-switch select { width: 115px; } }

</style>
