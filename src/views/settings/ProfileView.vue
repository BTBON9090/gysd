<script setup lang="ts">
/**
 * 基础设置 · 个人信息（PRD §6.8.1）
 * 头像 / 姓名本地保存；密码与手机号按 PRD 规则校验后更新本地演示资料（无中台）。
 */
import { computed, nextTick, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElRadio,
  ElRadioGroup,
  ElTag,
} from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Camera, KeyRound, Lock, LogOut, ShieldCheck, Smartphone, Trash2, UserRound } from 'lucide-vue-next'
import { useProfileStore } from '@/stores/profile'
import { useOnboardingStore } from '@/stores/onboarding'
import { useSessionStore } from '@/stores/session'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

const profile = useProfileStore()
const ob = useOnboardingStore()
const router = useRouter()
const session = useSessionStore()

const fileRef = ref<HTMLInputElement | null>(null)

/* ===== 只读展示 ===== */
const parks = computed(() => profile.registeredParks.filter(Boolean))
const maskedMobile = computed(() =>
  /^1\d{10}$/.test(profile.mobile) ? profile.mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') : profile.mobile,
)
const avatarInitial = computed(() => (profile.name || '供').trim().slice(0, 1))
const merchantName = computed(() => ob.entityVerified ? ob.draft.entityName : '暂无当前商户')

/* ===== 头像与姓名：本地保存 ===== */
const nameDraft = ref(profile.name)
const nameDirty = computed(() => {
  const next = nameDraft.value.trim()
  return next.length > 0 && next !== profile.name
})

function pickAvatar() {
  fileRef.value?.click()
}

function onAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    ElMessage.warning('请选择 JPG 或 PNG 格式的图片')
    return
  }
  if (file.size > MAX_AVATAR_BYTES) {
    ElMessage.warning('头像不能超过 5MB')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 256
      const context = canvas.getContext('2d')
      if (!context) { ElMessage.error('头像处理失败，请重试'); return }
      const side = Math.min(img.width, img.height)
      context.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256)
      profile.setAvatar(canvas.toDataURL('image/jpeg', 0.85))
      ElMessage.success('头像已更新')
    }
    img.onerror = () => ElMessage.error('头像读取失败，请重试')
    img.src = String(reader.result || '')
  }
  reader.onerror = () => ElMessage.error('头像读取失败，请重试')
  reader.readAsDataURL(file)
}

function removeAvatar() {
  profile.setAvatar('')
  ElMessage.success('已恢复默认头像')
}

function saveName() {
  if (!nameDirty.value) return
  profile.setName(nameDraft.value)
  nameDraft.value = profile.name
  ElMessage.success('姓名已保存')
}

function resetName() {
  nameDraft.value = profile.name
}

/* ===== 密码：≥8 位且含字母与数字（PRD §6.8.1） ===== */
const pwdVisible = ref(false)
const pwdRef = ref<FormInstance>()
const pwdSubmitting = ref(false)
const pwdForm = reactive({ old: '', next: '', confirm: '' })
const pwdTitle = computed(() => (profile.hasPassword ? '修改密码' : '设置密码'))

function validateOld(_rule: unknown, value: string, callback: (error?: Error) => void) {
  if (!value) return callback(new Error('请输入原密码'))
  profile.verifyPassword(value).then((ok) => callback(ok ? undefined : new Error('原密码不正确')))
}

function validateConfirm(_rule: unknown, value: string, callback: (error?: Error) => void) {
  if (!value) return callback(new Error('请再次输入新密码'))
  if (value !== pwdForm.next) return callback(new Error('两次输入的密码不一致'))
  callback()
}

const pwdRules = computed<FormRules>(() => ({
  old: profile.hasPassword ? [{ validator: validateOld, trigger: 'blur' }] : [],
  next: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码至少 8 位', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: '密码须同时包含字母和数字', trigger: 'blur' },
  ],
  confirm: [{ validator: validateConfirm, trigger: 'blur' }],
}))

async function openPassword() {
  pwdForm.old = ''
  pwdForm.next = ''
  pwdForm.confirm = ''
  pwdVisible.value = true
  await nextTick()
  pwdRef.value?.clearValidate()
}

async function submitPassword() {
  if (!pwdRef.value) return
  const valid = await pwdRef.value.validate().catch(() => false)
  if (!valid) return
  pwdSubmitting.value = true
  try {
    const label = pwdTitle.value
    await profile.setPassword(pwdForm.next)
    ElMessage.success(`${label}成功`)
    pwdVisible.value = false
  } finally {
    pwdSubmitting.value = false
  }
}

/* ===== 更换手机号：新号 + 原号验证码或密码（PRD §6.8.1） ===== */
const mobileVisible = ref(false)
const mobileForm = reactive({ verifyMode: 'sms', newMobile: '', code: '', password: '' })
const demoCode = ref('')
const countdown = ref(0)
let countdownTimer: number | undefined

const mobileValid = computed(() => /^1[3-9]\d{9}$/.test(mobileForm.newMobile))

function clearTimer() {
  if (countdownTimer !== undefined) {
    window.clearInterval(countdownTimer)
    countdownTimer = undefined
  }
}

function stopCountdown() {
  clearTimer()
  countdown.value = 0
}

function sendCode() {
  demoCode.value = String(Math.floor(100000 + Math.random() * 900000))
  clearTimer()
  countdown.value = 60
  countdownTimer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) clearTimer()
  }, 1000)
  ElMessage.success(`演示：原手机号验证码为 ${demoCode.value}`)
}

function openMobile() {
  mobileForm.verifyMode = 'sms'
  mobileForm.newMobile = ''
  mobileForm.code = ''
  mobileForm.password = ''
  demoCode.value = ''
  stopCountdown()
  mobileVisible.value = true
}

function closeMobile() {
  stopCountdown()
  mobileVisible.value = false
}

async function submitMobile() {
  if (!mobileValid.value) {
    ElMessage.warning('请输入 11 位新手机号')
    return
  }
  if (mobileForm.newMobile === profile.mobile) {
    ElMessage.warning('新手机号不能与原手机号相同')
    return
  }
  if (mobileForm.verifyMode === 'sms') {
    if (!demoCode.value) { ElMessage.warning('请先获取原手机号验证码'); return }
    if (mobileForm.code.trim() !== demoCode.value) { ElMessage.warning('原手机号验证码不正确'); return }
  } else {
    if (!profile.hasPassword || !(await profile.verifyPassword(mobileForm.password))) {
      ElMessage.warning('密码校验失败')
      return
    }
  }
  profile.setMobile(mobileForm.newMobile)
  closeMobile()
  ElMessage.success('手机号更换成功')
}

/* ===== 退出登录：二次确认（PRD §6.5.5） ===== */
async function logout() {
  try {
    await ElMessageBox.confirm('是否确认退出？', '退出登录', {
      customClass: 'ob-confirm-box',
      confirmButtonText: '确认退出',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  session.logout()
  router.replace('/login')
}

onUnmounted(stopCountdown)
</script>

<template>
  <div class="profile-page">
    <header class="page-intro">
      <p class="eyebrow">基础设置 <span>/</span> 个人信息</p>
      <h1>个人信息</h1>
      <p class="page-subtitle">维护头像、姓名与登录密码；注册园区、当前商户与当前角色为只读信息。</p>
    </header>

    <div class="card-grid">
      <!-- 个人资料 -->
      <section class="card">
        <div class="card-head">
          <span class="card-ic"><UserRound :size="18" /></span>
          <div>
            <h2>个人资料</h2>
            <p>头像与姓名保存于本机，用于演示。</p>
          </div>
        </div>

        <div class="avatar-row">
          <button
            class="avatar-btn"
            type="button"
            :aria-label="profile.avatar ? '更换头像' : '上传头像'"
            @click="pickAvatar"
          >
            <img v-if="profile.avatar" :src="profile.avatar" alt="当前头像" />
            <span v-else class="avatar-letter">{{ avatarInitial }}</span>
            <span class="avatar-mask"><Camera :size="17" /></span>
          </button>
          <div class="avatar-meta">
            <strong>头像</strong>
            <p>支持 JPG / PNG，建议 1:1，不超过 5MB。</p>
            <div class="avatar-actions">
              <ElButton size="small" @click="pickAvatar">更换头像</ElButton>
              <ElButton v-if="profile.avatar" size="small" text @click="removeAvatar">
                <Trash2 :size="13" /> 恢复默认
              </ElButton>
            </div>
          </div>
          <input ref="fileRef" class="sr-only" type="file" accept="image/*" @change="onAvatarChange" />
        </div>

        <dl class="facts">
          <div class="fact">
            <dt>姓名</dt>
            <dd class="fact-edit">
              <ElInput v-model="nameDraft" maxlength="20" placeholder="请输入姓名" @keyup.enter="saveName" />
              <ElButton type="primary" size="small" :disabled="!nameDirty" @click="saveName">保存</ElButton>
              <ElButton v-if="nameDirty" size="small" text @click="resetName">取消</ElButton>
            </dd>
          </div>
          <div class="fact">
            <dt>注册园区</dt>
            <dd>
              <div v-if="parks.length" class="tag-list">
                <ElTag v-for="park in parks" :key="park" size="small" type="info" effect="light">{{ park }}</ElTag>
              </div>
              <span v-else class="readonly">—</span>
            </dd>
          </div>
          <div class="fact">
            <dt>手机号</dt>
            <dd><span class="readonly num">{{ maskedMobile }}</span></dd>
          </div>
          <div class="fact">
            <dt>当前商户</dt>
            <dd><span class="readonly">{{ merchantName }}</span></dd>
          </div>
          <div class="fact">
            <dt>当前角色</dt>
            <dd><ElTag size="small" type="success" effect="light">管理员</ElTag></dd>
          </div>
        </dl>
      </section>

      <!-- 账号安全 -->
      <section class="card">
        <div class="card-head">
          <span class="card-ic"><ShieldCheck :size="18" /></span>
          <div>
            <h2>账号安全</h2>
            <p>登录密码、绑定手机号与退出登录。</p>
          </div>
        </div>

        <ul class="security-list">
          <li>
            <span class="sec-ic"><KeyRound :size="17" /></span>
            <div class="sec-main">
              <strong>登录密码</strong>
              <p>{{ profile.hasPassword ? '密码须至少 8 位，且包含字母与数字。' : '尚未设置密码，建议设置后使用密码登录。' }}</p>
            </div>
            <span class="sec-state" :class="profile.hasPassword ? 'on' : 'off'">
              {{ profile.hasPassword ? '已设置' : '未设置' }}
            </span>
            <ElButton type="primary" plain size="small" @click="openPassword">
              {{ profile.hasPassword ? '修改密码' : '设置密码' }}
            </ElButton>
          </li>
          <li>
            <span class="sec-ic"><Smartphone :size="17" /></span>
            <div class="sec-main">
              <strong>绑定手机号</strong>
              <p>已绑定 <span class="num">{{ maskedMobile }}</span>，更换需验证原手机号或密码。</p>
            </div>
            <ElButton plain size="small" @click="openMobile">更换手机号</ElButton>
          </li>
          <li class="sec-danger">
            <span class="sec-ic danger"><LogOut :size="17" /></span>
            <div class="sec-main">
              <strong>退出登录</strong>
              <p>退出后需重新登录；待提交的入驻草稿不会被删除。</p>
            </div>
            <ElButton type="danger" plain size="small" @click="logout">退出登录</ElButton>
          </li>
        </ul>
      </section>
    </div>

    <!-- 设置 / 修改密码 -->
    <ElDialog v-model="pwdVisible" :title="pwdTitle" width="420px" append-to-body>
      <ElForm ref="pwdRef" :model="pwdForm" :rules="pwdRules" label-position="top" @submit.prevent>
        <ElFormItem v-if="profile.hasPassword" label="原密码" prop="old">
          <ElInput v-model="pwdForm.old" type="password" show-password placeholder="请输入原密码" autocomplete="current-password" />
        </ElFormItem>
        <ElFormItem label="新密码" prop="next">
          <ElInput v-model="pwdForm.next" type="password" show-password placeholder="至少 8 位，包含字母和数字" autocomplete="new-password" />
        </ElFormItem>
        <ElFormItem label="确认新密码" prop="confirm">
          <ElInput v-model="pwdForm.confirm" type="password" show-password placeholder="请再次输入新密码" autocomplete="new-password" />
        </ElFormItem>
        <p class="form-note"><Lock :size="12" /> 演示环境：仅在本机保存密码摘要，不连接数据中台。</p>
      </ElForm>
      <template #footer>
        <ElButton @click="pwdVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="pwdSubmitting" @click="submitPassword">
          {{ profile.hasPassword ? '确认修改' : '确认设置' }}
        </ElButton>
      </template>
    </ElDialog>

    <!-- 更换手机号 -->
    <ElDialog v-model="mobileVisible" title="更换手机号" width="440px" append-to-body @closed="stopCountdown">
      <div class="mobile-current">
        <span>当前手机号</span>
        <strong class="num">{{ maskedMobile }}</strong>
      </div>
      <ElRadioGroup v-model="mobileForm.verifyMode" class="mobile-radio">
        <ElRadio value="sms">原手机号验证码</ElRadio>
        <ElRadio value="password" :disabled="!profile.hasPassword">密码验证</ElRadio>
      </ElRadioGroup>
      <ElForm label-position="top" @submit.prevent>
        <ElFormItem label="新手机号码">
          <ElInput v-model="mobileForm.newMobile" maxlength="11" placeholder="请输入 11 位新手机号" />
        </ElFormItem>
        <ElFormItem v-if="mobileForm.verifyMode === 'sms'" label="原手机号验证码">
          <div class="code-row">
            <ElInput v-model="mobileForm.code" maxlength="6" placeholder="请输入验证码" />
            <ElButton :disabled="countdown > 0" @click="sendCode">
              {{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
            </ElButton>
          </div>
        </ElFormItem>
        <ElFormItem v-else label="登录密码">
          <ElInput v-model="mobileForm.password" type="password" show-password placeholder="请输入当前登录密码" />
        </ElFormItem>
        <p class="form-note">演示环境会在页面提示验证码，不发送真实短信。</p>
      </ElForm>
      <template #footer>
        <ElButton @click="closeMobile">取消</ElButton>
        <ElButton type="primary" @click="submitMobile">确认更换</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 1040px;
  margin: 0 auto;
  padding: var(--sp-page-y) var(--sp-page-x) 28px;
}

.page-intro { margin-bottom: 22px; }
.eyebrow { margin: 0 0 9px; color: #3656c5; font-size: 12px; font-weight: 700; }
.eyebrow span { margin: 0 7px; color: #a9b5c7; }
.page-intro h1 { margin: 0; color: #17233b; font-size: 27px; letter-spacing: -0.025em; }
.page-subtitle { margin: 7px 0 0; color: #586880; font-size: 14px; }

.card-grid { display: grid; gap: 16px; }
.card {
  padding: 24px 26px;
  border: 1px solid var(--border-light);
  border-radius: var(--r-xl);
  background: var(--bg-card);
}
.card-head { display: flex; gap: 13px; align-items: flex-start; margin-bottom: 20px; }
.card-ic {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex: none;
  border-radius: 10px;
  background: #eef2ff;
  color: #3656c5;
}
.card-head h2 { margin: 0; color: #17233b; font-size: 17px; }
.card-head p { margin: 4px 0 0; color: #5c6980; font-size: 13px; }

/* 头像 */
.avatar-row {
  display: flex;
  gap: 18px;
  align-items: center;
  padding: 16px 18px;
  border-radius: var(--r-lg);
  background: var(--bg-muted);
  margin-bottom: 20px;
}
.avatar-btn {
  position: relative;
  width: 72px;
  height: 72px;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  background: var(--brand-gradient);
  color: #fff;
}
.avatar-btn img { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-letter { display: grid; place-items: center; height: 100%; font-size: 26px; font-weight: 700; }
.avatar-mask {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(17, 24, 39, 0.5);
  color: #fff;
  opacity: 0;
  transition: opacity var(--t-fast) var(--ease-out);
}
.avatar-btn:hover .avatar-mask,
.avatar-btn:focus-visible .avatar-mask { opacity: 1; }
.avatar-meta strong { display: block; color: var(--text-primary); font-size: 14px; }
.avatar-meta p { margin: 4px 0 10px; color: var(--text-placeholder); font-size: 12.5px; }
.avatar-actions { display: flex; gap: 8px; align-items: center; }
.avatar-actions :deep(svg) { margin-right: 4px; }

/* 只读信息 */
.facts { margin: 0; display: grid; gap: 2px; }
.fact {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding: 11px 0;
  border-top: 1px solid var(--border-lighter);
}
.fact:first-child { border-top: 0; }
.fact dt { color: var(--text-placeholder); font-size: 13px; }
.fact dd { margin: 0; min-width: 0; }
.fact-edit { display: flex; gap: 8px; align-items: center; max-width: 420px; }
.readonly { color: var(--text-primary); font-size: 13.5px; }
.num { font-variant-numeric: tabular-nums; }
.tag-list { display: flex; flex-wrap: wrap; gap: 6px; }

/* 账号安全 */
.security-list { list-style: none; margin: 0; padding: 0; }
.security-list li {
  display: flex;
  gap: 13px;
  align-items: center;
  padding: 14px 0;
  border-top: 1px solid var(--border-lighter);
}
.security-list li:first-child { border-top: 0; padding-top: 0; }
.sec-ic {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: none;
  border-radius: 9px;
  background: #eef2ff;
  color: #3656c5;
}
.sec-ic.danger { background: var(--status-danger-soft); color: var(--status-danger); }
.sec-main { flex: 1; min-width: 0; }
.sec-main strong { display: block; color: var(--text-primary); font-size: 13.5px; }
.sec-main p { margin: 3px 0 0; color: var(--text-placeholder); font-size: 12.5px; }
.sec-state {
  flex: none;
  height: 22px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
}
.sec-state.on { background: var(--status-success-soft); color: var(--status-success); }
.sec-state.off { background: var(--bg-chip); color: var(--text-placeholder); }
.sec-danger :deep(.el-button) { flex: none; }

/* 弹窗 */
.mobile-current {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 14px;
  margin-bottom: 14px;
  border-radius: var(--r-md);
  background: var(--bg-muted);
  color: var(--text-secondary);
  font-size: 13px;
}
.mobile-current strong { color: var(--text-primary); }
.mobile-radio { margin-bottom: 6px; }
.code-row { display: flex; gap: 8px; width: 100%; }
.code-row :deep(.el-button) { flex: none; }
.form-note {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 0 0 12px;
  color: var(--text-placeholder);
  font-size: 12px;
  line-height: 1.5;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 720px) {
  .fact { grid-template-columns: minmax(0, 1fr); gap: 6px; }
  .security-list li { flex-wrap: wrap; }
  .sec-main { flex-basis: calc(100% - 47px); }
}
</style>
