import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const PROFILE_KEY = 'gysd-demo-profile'
const PASSWORD_KEY = 'gysd-demo-password-hash'

type StoredProfile = {
  name: string
  mobile: string
  avatar: string
  registeredParks: string[]
}

function loadProfile(): StoredProfile {
  const fallback: StoredProfile = {
    name: '周启明',
    mobile: '13800008000',
    avatar: '',
    registeredParks: ['上海临港新片区智能制造产业园'],
  }
  try {
    const stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')
    return {
      name: typeof stored.name === 'string' ? stored.name : fallback.name,
      mobile: typeof stored.mobile === 'string' ? stored.mobile : fallback.mobile,
      avatar: typeof stored.avatar === 'string' ? stored.avatar : fallback.avatar,
      registeredParks: Array.isArray(stored.registeredParks) ? stored.registeredParks : fallback.registeredParks,
    }
  } catch {
    return fallback
  }
}

async function digest(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')
}

export const useProfileStore = defineStore('profile', () => {
  const initial = loadProfile()
  const name = ref(initial.name)
  const mobile = ref(initial.mobile)
  const avatar = ref(initial.avatar)
  const registeredParks = ref(initial.registeredParks)
  const passwordRecord = ref(localStorage.getItem(PASSWORD_KEY) || '')
  const hasPassword = computed(() => Boolean(passwordRecord.value))

  function persist() {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({
      name: name.value,
      mobile: mobile.value,
      avatar: avatar.value,
      registeredParks: registeredParks.value,
    }))
  }
  function setName(value: string) {
    name.value = value.trim()
    persist()
  }
  function setAvatar(value: string) {
    avatar.value = value
    persist()
  }
  function setMobile(value: string) {
    mobile.value = value
    persist()
  }
  async function verifyPassword(value: string): Promise<boolean> {
    if (!passwordRecord.value) return false
    const [salt, hash] = passwordRecord.value.split(':')
    return Boolean(salt && hash && (await digest(`${salt}:${value}`)) === hash)
  }
  async function setPassword(value: string) {
    const salt = crypto.randomUUID()
    passwordRecord.value = `${salt}:${await digest(`${salt}:${value}`)}`
    localStorage.setItem(PASSWORD_KEY, passwordRecord.value)
  }

  return { name, mobile, avatar, registeredParks, hasPassword, setName, setAvatar, setMobile, verifyPassword, setPassword }
})
