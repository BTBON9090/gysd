const PREFIX = 'local-image:'
const VIDEO_PREFIX = 'local-video:'
const DB_NAME = 'gysd-demo-media'
const STORE_NAME = 'images'
const urlCache = new Map<string, string>()

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveDemoFile(file: File, prefix: string): Promise<string> {
  const db = await openDb()
  const key = `${prefix}${crypto.randomUUID()}`
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(file, key)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
  db.close()
  return key
}

export function saveDemoImage(file: File): Promise<string> { return saveDemoFile(file, PREFIX) }
export function saveDemoVideo(file: File): Promise<string> { return saveDemoFile(file, VIDEO_PREFIX) }

export async function resolveDemoImage(source: string): Promise<string> {
  if (!source) return ''
  if (!source.startsWith(PREFIX) && !source.startsWith(VIDEO_PREFIX)) return /^(data:image\/|blob:|https?:\/)/.test(source) ? source : ''
  const cached = urlCache.get(source)
  if (cached) return cached
  const db = await openDb()
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(source)
    request.onsuccess = () => resolve(request.result as Blob | undefined)
    request.onerror = () => reject(request.error)
  })
  db.close()
  if (!blob) return ''
  const url = URL.createObjectURL(blob)
  urlCache.set(source, url)
  return url
}
