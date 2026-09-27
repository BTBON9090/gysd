// Isolated business checks: edits must not change the approved archive before review.
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'
const storage = new Map()
globalThis.localStorage = { getItem: k=>storage.get(k)??null, setItem:(k,v)=>storage.set(k,String(v)), removeItem:k=>storage.delete(k) }
const vite = await createServer({server:{middlewareMode:true},appType:'custom'})
try {
  const {useOnboardingStore} = await vite.ssrLoadModule('/src/stores/onboarding.ts')
  const {useMerchantChangeStore} = await vite.ssrLoadModule('/src/stores/merchantChange.ts')
  setActivePinia(createPinia())
  const ob = useOnboardingStore(), change = useMerchantChangeStore()
  ob.fillDemoAll(); ob.status='approved'
  const initialName = ob.draft.serviceName
  assert.equal(change.start(),true)
  const draft = change.current().draft
  draft.serviceName = '变更后的服务商'
  draft.documents = { license:{source:'local-document:fixture',name:'license.png'} }
  assert.equal(ob.draft.serviceName,initialName)
  assert.equal(ob.draft.documents,undefined)
  draft.accountName='不一致账户'
  assert(ob.validateStep(5,draft).some(x=>x.includes('账户名称')))
  assert.equal(change.submit(),false)
  draft.accountName=draft.entityName
  draft.park='不允许改变的园区'
  assert.equal(change.submit(),false)
  draft.park=ob.draft.park
  draft.licenseLegalPerson='不一致法人'
  assert.equal(change.submit(),false)
  draft.licenseLegalPerson=draft.legalPerson
  assert.equal(change.submit(),true)
  assert.equal(ob.draft.serviceName,initialName)
  assert.equal(change.start(),false)
  assert.equal(change.review('rejected'),true)
  assert.equal(ob.draft.serviceName,initialName)
  assert.equal(change.submit(),true)
  assert.equal(change.review('approved'),true)
  assert.equal(ob.draft.serviceName,'变更后的服务商')
  assert.equal(ob.draft.documents.license.name,'license.png')
  assert.equal(change.current(),null)
  console.log('PASS: shared validation, immutable identity, draft isolation, review lock, reject/resubmit, approved fields and file references')
} finally { await vite.close() }
