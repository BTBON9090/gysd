<script setup lang="ts">
/** 基础设置 · 成员管理，PRD §6.8.2。数据仅用于本地演示。 */
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElDialog, ElInput, ElMessage, ElTag } from 'element-plus'
import { Plus, Search, UsersRound } from 'lucide-vue-next'
import { useAcceptanceStore } from '@/stores/acceptance'
import { useOnboardingStore } from '@/stores/onboarding'
import { useProfileStore } from '@/stores/profile'

interface Member { id: string; name: string; mobile: string; enabled: boolean }
const acc = useAcceptanceStore()
const ob = useOnboardingStore()
const profile = useProfileStore()
const router = useRouter()
const storageKey = computed(() => `gysd-demo-members-${ob.activeId}`)
const defaults: Member[] = [
  { id: 'm1', name: '王敏', mobile: '13800138001', enabled: true },
  { id: 'm2', name: '李娟', mobile: '13800138002', enabled: true },
  { id: 'm3', name: '陈晨', mobile: '13800138003', enabled: false },
]
function loadMembers(): Member[] {
  try {
    const raw = localStorage.getItem(storageKey.value)
    if (raw !== null) {
      const data: unknown = JSON.parse(raw)
      if (Array.isArray(data)) return data.filter((m) => m && typeof m.id === 'string' && typeof m.name === 'string' && typeof m.mobile === 'string') as Member[]
    }
  } catch { /* 恢复演示默认数据 */ }
  return defaults.map((m) => ({ ...m }))
}
const others = ref<Member[]>(loadMembers())
watch(storageKey, () => { others.value = loadMembers() })
function save() { localStorage.setItem(storageKey.value, JSON.stringify(others.value)) }

const query = ref('')
const rows = computed(() => [
  { id: 'self', name: profile.name, mobile: profile.mobile, enabled: true, self: true },
  ...others.value.map((m) => ({ ...m, self: false })),
].filter((m) => !query.value || `${m.name}${m.mobile}`.includes(query.value.trim())))
const mask = (mobile: string) => mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')

const editorVisible = ref(false)
const editingId = ref('')
const form = reactive({ name: '', mobile: '' })
const errors = reactive({ name: '', mobile: '' })
const editorTitle = computed(() => editingId.value ? '编辑成员' : '新增成员')
function openAdd() {
  editingId.value = ''; form.name = ''; form.mobile = ''; errors.name = ''; errors.mobile = ''
  editorVisible.value = true
}
function openEdit(member: Member) {
  editingId.value = member.id; form.name = member.name; form.mobile = member.mobile
  errors.name = ''; errors.mobile = ''; editorVisible.value = true
}
function submitEditor() {
  errors.name = form.name.trim() ? '' : '请填写成员姓名'
  errors.mobile = /^1[3-9]\d{9}$/.test(form.mobile) ? '' : '请填写正确的 11 位手机号'
  if (errors.name || errors.mobile) return
  const duplicated = [{ id: 'self', mobile: profile.mobile }, ...others.value].some((m) => m.mobile === form.mobile && m.id !== editingId.value)
  if (duplicated) { errors.mobile = '该手机号已在当前主体成员中'; return }
  if (editingId.value) {
    const member = others.value.find((m) => m.id === editingId.value)
    if (!member) { ElMessage.error('成员不存在，请刷新列表'); editorVisible.value = false; return }
    member.name = form.name.trim(); member.mobile = form.mobile
    ElMessage.success('成员信息已保存（本地演示）')
  } else {
    others.value.unshift({ id: crypto.randomUUID(), name: form.name.trim(), mobile: form.mobile, enabled: true })
    ElMessage.success('成员已新增并启用（本地演示）')
  }
  save(); editorVisible.value = false
}

const actionVisible = ref(false)
const actionTarget = ref<Member | null>(null)
const action = ref<'enable' | 'disable' | 'delete'>('disable')
const actionTitle = computed(() => ({ enable: '启用成员', disable: '停用成员', delete: '删除成员' })[action.value])
function ask(member: Member, next: typeof action.value) {
  actionTarget.value = member; action.value = next; actionVisible.value = true
}
function confirmAction() {
  const target = actionTarget.value
  if (!target) return
  const index = others.value.findIndex((m) => m.id === target.id)
  if (index < 0) { ElMessage.error('成员不存在，请刷新列表'); actionVisible.value = false; return }
  if (action.value === 'delete') others.value.splice(index, 1)
  else others.value[index].enabled = action.value === 'enable'
  save(); actionVisible.value = false
  ElMessage.success(`${actionTitle.value}成功（本地演示）`)
}
</script>

<template>
  <div class="members-page">
    <header class="page-head">
      <p class="eyebrow">基础设置 <span>/</span> 成员管理</p>
      <div class="head-row">
        <div><h1>成员管理</h1><p>管理当前已通过主体的管理员账号。</p></div>
      </div>
    </header>

    <div v-if="acc.entryStatus !== 'approved'" class="not-ready">
      <UsersRound :size="26" /><h2>入驻通过后可管理成员</h2>
      <p>当前主体尚未通过审核，成员管理暂不可用。</p>
      <ElButton @click="router.push('/workspace')">查看入驻进度</ElButton>
    </div>
    <template v-else>
      <div class="list-toolbar">
        <div class="list-count">共 <strong>{{ rows.length }}</strong> 位成员 <span>· 全员管理员</span></div>
        <div class="toolbar-actions">
          <ElInput v-model="query" clearable placeholder="搜索姓名或手机号" class="search-input"><template #prefix><Search :size="15" /></template></ElInput>
          <ElButton type="primary" @click="openAdd"><Plus :size="16" /> 新增成员</ElButton>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>成员</th><th>手机号</th><th>角色</th><th>状态</th><th class="actions-col">操作</th></tr></thead>
          <tbody>
            <tr v-for="member in rows" :key="member.id">
              <td><div class="person"><span class="avatar">{{ member.name.slice(0, 1) }}</span><strong>{{ member.name }}</strong><span v-if="member.self" class="self-mark">本人</span></div></td>
              <td class="phone">{{ mask(member.mobile) }}</td>
              <td>管理员</td>
              <td><ElTag :type="member.enabled ? 'success' : 'info'" effect="light" size="small">{{ member.enabled ? '已启用' : '已停用' }}</ElTag></td>
              <td class="actions-col"><div v-if="!member.self" class="actions">
                <ElButton text size="small" @click="openEdit(member)">编辑</ElButton>
                <ElButton text size="small" @click="ask(member, member.enabled ? 'disable' : 'enable')">{{ member.enabled ? '停用' : '启用' }}</ElButton>
                <ElButton text type="danger" size="small" @click="ask(member, 'delete')">删除</ElButton>
              </div><span v-else class="self-tip">仅本人维护</span></td>
            </tr>
            <tr v-if="rows.length === 0"><td colspan="5" class="empty-row">没有符合条件的成员</td></tr>
          </tbody>
        </table>
      </div>
    </template>

    <ElDialog v-model="editorVisible" :title="editorTitle" width="440px" append-to-body>
      <div class="editor-form">
        <label>姓名 <b>*</b><ElInput v-model="form.name" maxlength="20" placeholder="请输入成员姓名" @input="errors.name = ''" /><small v-if="errors.name">{{ errors.name }}</small></label>
        <label>手机号 <b>*</b><ElInput v-model="form.mobile" maxlength="11" placeholder="请输入 11 位手机号" @input="errors.mobile = ''" /><small v-if="errors.mobile">{{ errors.mobile }}</small></label>
        <p>新增成员默认角色为管理员，开户成功后状态为已启用，可登录供应商端和园区客户端。</p>
      </div>
      <template #footer><ElButton @click="editorVisible = false">取消</ElButton><ElButton type="primary" @click="submitEditor">{{ editingId ? '保存修改' : '确认新增' }}</ElButton></template>
    </ElDialog>
    <ElDialog v-model="actionVisible" :title="actionTitle" width="420px" append-to-body>
      <p class="confirm-copy" v-if="actionTarget">{{ action === 'delete' ? `确认删除成员「${actionTarget.name}」？删除后需重新新增方可加入。` : action === 'disable' ? `确认停用成员「${actionTarget.name}」？停用后该成员将无法登录本企业。` : `确认启用成员「${actionTarget.name}」？启用后该成员可登录本企业。` }}</p>
      <template #footer><ElButton @click="actionVisible = false">取消</ElButton><ElButton :type="action === 'delete' ? 'danger' : 'primary'" @click="confirmAction">确认{{ actionTitle.slice(0, 2) }}</ElButton></template>
    </ElDialog>
  </div>
</template>

<style scoped>
.members-page{max-width:1120px;margin:auto;padding:var(--sp-page-y) var(--sp-page-x) 44px;color:#20304a}.page-head{margin-bottom:30px}.eyebrow{margin:0 0 10px;color:#3656c5;font-size:12px;font-weight:700}.eyebrow span{margin:0 8px;color:#a9b5c7}.head-row h1{font-size:27px;letter-spacing:-.025em;margin:0}.head-row p{font-size:14px;color:#5b6980;margin:8px 0 0}.list-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:12px}.toolbar-actions{display:flex;align-items:center;gap:10px}.toolbar-actions :deep(.el-button){height:36px;border-radius:8px}.toolbar-actions :deep(svg){margin-right:5px}.list-count{font-size:13px;color:#64738a}.list-count strong{color:#253757}.list-count span{margin-left:6px}.search-input{width:248px}.table-wrap{border:1px solid #e3e9f2;border-radius:12px;overflow:auto;background:#fff}table{width:100%;min-width:640px;border-collapse:collapse;text-align:left;font-size:13px}th{font-size:12px;font-weight:650;color:#65738a;background:#f7f9fc}th,td{padding:15px 18px}tbody tr+tr{border-top:1px solid #edf1f6}.person{display:flex;align-items:center;gap:10px}.person strong{color:#1c2c46;font-weight:650}.avatar{display:grid;place-items:center;width:31px;height:31px;border-radius:8px;background:#edf1ff;color:#3656c5;font-weight:700}.self-mark{font-size:11px;padding:2px 6px;border-radius:5px;background:#eff3f9;color:#64738a}.phone{font-variant-numeric:tabular-nums;color:#40516b}.actions-col{text-align:right}.actions{display:flex;justify-content:flex-end;gap:0}.actions :deep(.el-button){margin:0}.self-tip{color:#97a1b2;font-size:12px}.empty-row{text-align:center;color:#75839a;padding:40px}.demo-note{font-size:12px;color:#7a879a;margin-top:13px}.not-ready{text-align:center;padding:70px 20px;color:#68778c}.not-ready h2{font-size:19px;color:#20304a;margin:12px 0 5px}.not-ready p{margin:0 0 18px}.editor-form{display:grid;gap:20px}.editor-form label{display:grid;gap:7px;font-size:13px;font-weight:600;color:#293a55}.editor-form b{display:none}.editor-form small{color:#c94a42;font-weight:400}.editor-form p{margin:0;padding:11px 13px;border-radius:8px;background:#f4f7ff;color:#52647d;font-size:12px;line-height:1.55}.confirm-copy{margin:0;color:#42516a;line-height:1.65;font-size:14px}@media(max-width:700px){.list-toolbar{align-items:stretch;flex-direction:column}.toolbar-actions{width:100%;flex-wrap:wrap}.search-input{width:auto;flex:1;min-width:170px}}
</style>
