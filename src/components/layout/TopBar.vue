<script setup lang="ts">
import { computed } from 'vue'
import { Bell, ChevronDown, LogOut, ArrowLeftRight, User } from 'lucide-vue-next'
import { ElBadge, ElButton, ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
import { useAcceptanceStore } from '@/stores/acceptance'

const acc = useAcceptanceStore()
const isPending = computed(() => acc.entryStatus === 'pending')
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <a href="#/workspace" class="brand" aria-label="万联易达供应商端">
        <span class="brand-logo" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="24" height="24">
            <rect width="32" height="32" rx="8" fill="#3b63d3" />
            <path d="M8 10h6.2v6.2H8zm9.8 0H24v6.2h-6.2zM8 16.8h6.2V23H8zm9.8 3.2H24V23h-6.2z" fill="#fff" />
          </svg>
        </span>
        <span class="brand-text">
          <strong>万联易达集团</strong>
          <small>供应商工作台</small>
        </span>
      </a>
    </div>

    <div class="topbar-right">
      <span
        class="entry-status"
        :class="{ pending: isPending }"
        title="供应商入驻状态"
      >
        <span class="entry-dot" />
        {{ isPending ? '入驻：待提交' : '入驻：已通过' }}
      </span>

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
  padding: 0 16px;
  background: var(--bg-topbar);
  border-bottom: 1px solid var(--border-light);
  z-index: 40;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: var(--r-sm);
  padding: 4px 8px 4px 4px;
  transition: background var(--t-fast);
}
.brand:hover {
  background: var(--bg-hover);
}

.brand-logo {
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.brand-text strong {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.01em;
}
.brand-text small {
  font-size: 11px;
  color: var(--text-placeholder);
  letter-spacing: 0.06em;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.entry-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border-radius: var(--r-pill);
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
  border-radius: var(--r-pill);
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

@media (max-width: 720px) {
  .user-meta,
  .brand-text small,
  .entry-status {
    display: none;
  }
}
</style>
