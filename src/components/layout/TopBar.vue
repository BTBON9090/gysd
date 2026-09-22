<script setup lang="ts">
import { Bell, ChevronDown, LogOut, ArrowLeftRight, User } from 'lucide-vue-next'
import { ElBadge, ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <a href="#/workspace" class="brand" aria-label="万联易达供应商端">
        <span class="brand-logo" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="28" height="28">
            <rect width="32" height="32" rx="9" fill="url(#lg)" />
            <path d="M8 10h6.2v6.2H8zm9.8 0H24v6.2h-6.2zM8 16.8h6.2V23H8zm9.8 3.2H24V23h-6.2z" fill="#fff" />
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="32" y2="32">
                <stop stop-color="#ff6b66" />
                <stop offset="1" stop-color="#e53935" />
              </linearGradient>
            </defs>
          </svg>
        </span>
        <span class="brand-text">
          <strong>万联易达集团</strong>
          <small>供应商工作台</small>
        </span>
      </a>
    </div>

    <div class="topbar-right">
      <span class="entry-status" title="供应商入驻状态">
        <span class="entry-dot" />
        入驻：已通过
      </span>

      <button class="icon-btn" type="button" aria-label="消息通知">
        <ElBadge :value="2" :max="99">
          <Bell :size="20" stroke-width="1.8" />
        </ElBadge>
      </button>

      <ElDropdown trigger="click" placement="bottom-end">
        <button class="user-chip" type="button">
          <span class="avatar">周</span>
          <span class="user-meta">
            <strong>周启明</strong>
            <small>临港企服</small>
          </span>
          <ChevronDown :size="15" class="chev" />
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
  padding: 0 20px;
  background: var(--bg-topbar);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-light);
  z-index: 40;
}

.topbar-left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: var(--r-md);
  padding: 6px 10px 6px 6px;
  transition: background var(--t-fast) var(--ease-out);
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
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.01em;
}
.brand-text small {
  font-size: 11px;
  color: var(--text-secondary);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.entry-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 14px;
  border-radius: var(--r-pill);
  font-size: 13px;
  font-weight: 600;
  color: var(--c-green);
  background: var(--c-green-bg);
  border: 1px solid rgba(22, 163, 74, 0.18);
}
.entry-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--c-green);
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2);
}

.icon-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: var(--r-md);
  background: transparent;
  color: var(--text-regular);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background var(--t-fast) var(--ease-out), color var(--t-fast);
}
.icon-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: transparent;
  padding: 6px 8px 6px 6px;
  border-radius: var(--r-pill);
  cursor: pointer;
  transition: background var(--t-fast) var(--ease-out);
}
.user-chip:hover {
  background: var(--bg-hover);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  background: var(--brand-gradient);
  box-shadow: 0 2px 8px rgba(229, 57, 53, 0.3);
}

.user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.25;
}
.user-meta strong {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.user-meta small {
  font-size: 12px;
  color: var(--text-secondary);
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
