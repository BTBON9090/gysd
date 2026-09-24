<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElCascader, ElCheckbox, ElCheckboxGroup, ElDialog, ElInput, ElMessage, ElMessageBox, ElOption, ElPagination, ElPopover, ElSelect, ElTag } from 'element-plus'
import { ArrowDownToLine, ArrowUpToLine, Eye, HeartHandshake, Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import ServicePreview from '@/components/service/ServicePreview.vue'
import DemoImage from '@/components/commerce/DemoImage.vue'
import { CATEGORY_TREE, money, serviceStatus, STATUS_LABEL, useCommerceStore, type Service } from '@/stores/commerce'
const c=useCommerceStore(),router=useRouter(),route=useRoute();const filter=reactive({park:String(route.query.park||''),category:'',name:''});const applied=reactive({...filter});const tab=ref('all');const page=ref(1);const selected=ref<string[]>([]);const action=ref<'publish'|'offline'>('publish');const dialog=ref(false);const target=ref<Service|null>(null);const detail=ref<Service|null>(null)
const tabs=[['all','全部'],['draft','草稿'],['reviewing','审核中'],['rejected','已驳回'],['on_sale','已上架'],['offline','已下架']]
const coverSource=(source:string)=>/^(local-image:|data:image\/|blob:|https?:\/)/.test(source)?source:''
const aggregateStatus=(service:Service)=>serviceStatus(service,undefined,c.joinedParks.map(park=>park.id))
const aggregateLabel=(service:Service)=>aggregateStatus(service)==='draft'?'草稿':aggregateStatus(service)==='on_sale'?'在售':STATUS_LABEL[aggregateStatus(service) as keyof typeof STATUS_LABEL]
const aggregateTone=(service:Service)=>aggregateStatus(service)==='on_sale'?'success':aggregateStatus(service)==='rejected'?'danger':aggregateStatus(service)==='reviewing'?'warning':'info'
const sales=(service:Service)=>c.data.orders.filter(order=>order.serviceId===service.id&&order.paid>0&&order.status!=='cancelled').length
const filtered=computed(()=>c.data.services.filter(s=>(!applied.category||s.category.startsWith(applied.category))&&(!applied.name||s.name.includes(applied.name))).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)))
function matches(s:Service,t:string){if(!applied.park)return t==='all'||serviceStatus(s,undefined,c.joinedParks.map(p=>p.id))===t;const own=s.listings[applied.park];if(t==='draft')return !own;if(!own)return false;return t==='all'||own.status===t}
const tabRows=computed(()=>filtered.value.filter(s=>matches(s,tab.value)));const rows=computed(()=>tabRows.value.slice((page.value-1)*20,page.value*20));const count=(t:string)=>filtered.value.filter(s=>matches(s,t)).length
watch(() => tabRows.value.length, length => { page.value = Math.min(page.value, Math.max(1, Math.ceil(length / 20))) })
function setTab(t:string){tab.value=t;page.value=1}function query(){Object.assign(applied,filter);page.value=1}function reset(){Object.assign(filter,{park:'',category:'',name:''});tab.value='all';query()}
function create(){if(!c.data.walletOpen){ElMessage.warning('发布服务前请先开通钱包');router.push('/wallet');return}router.push('/service/new')}
function continueDraft(s:Service){router.push(`/service/edit/${s.id}`)}
function eligible(s:Service,mode:'publish'|'offline'){return c.joinedParks.filter(p=>mode==='publish'? !['on_sale','reviewing'].includes(s.listings[p.id]?.status||'draft'):s.listings[p.id]?.status==='on_sale')}
function readyToPublish(s:Service){return s.category.split(' / ').length===3&&Boolean(s.name.trim()&&s.intro.trim()&&coverSource(s.cover)&&s.detail.trim()&&s.guarantee.trim())&&s.specs.length>0&&s.specs.every(spec=>spec.name.trim()&&spec.point.trim()&&spec.price>0&&spec.unit&&spec.standard.trim())}
function operate(s:Service,mode:'publish'|'offline'){if(mode==='publish'&&!readyToPublish(s)){ElMessage.warning('请先补全服务资料，再提交上架审核');router.push(`/service/edit/${s.id}`);return}target.value=s;action.value=mode;selected.value=[];dialog.value=true}
async function submit(){if(!target.value||!selected.value.length)return;if(action.value==='offline'){try{await ElMessageBox.confirm(`确认将「${target.value.name}」从以下 ${selected.value.length} 个园区下架？下架后该园区不再展示此服务。`,'确认下架',{confirmButtonText:'确认下架',cancelButtonText:'取消',type:'warning'})}catch{return}}c.changeListing(target.value.id,selected.value,action.value==='publish'?'reviewing':'offline');dialog.value=false;ElMessage.success(action.value==='publish'?'已提交园区审核':'服务已下架')}
async function edit(s:Service){if(Object.values(s.listings).some(x=>['on_sale','reviewing'].includes(x.status))){try{await ElMessageBox.confirm('编辑将使已上架或审核中的园区自动下架，保存后需要重新提交审核。','编辑服务',{confirmButtonText:'继续编辑',cancelButtonText:'取消',type:'warning'});c.changeListing(s.id,Object.entries(s.listings).filter(([,x])=>['on_sale','reviewing'].includes(x.status)).map(([id])=>id),'offline')}catch{return}}router.push(`/service/edit/${s.id}`)}
async function remove(s:Service){if(c.data.orders.some(o=>o.serviceId===s.id)){ElMessage.warning('该服务已有订单，不能删除');return}try{await ElMessageBox.confirm(`确认删除「${s.name||'未命名服务'}」？`,'删除服务',{confirmButtonText:'删除',cancelButtonText:'取消',type:'warning'});c.deleteService(s.id);ElMessage.success('服务已删除')}catch{/* cancelled */}}
</script>
<template>
  <div class="biz-page service-page">
    <header class="biz-head service-head">
      <div class="service-heading"><span class="service-heading-icon"><HeartHandshake :size="24" /></span><div><h1>服务管理</h1><p>按园区查看审核和上架状态，维护服务内容。</p></div></div>
      <ElButton type="primary" @click="create"><Plus :size="15" /> 发布服务</ElButton>
    </header>
    <section class="service-workspace">
      <div class="service-sticky list-sticky">
      <div class="service-filters"><div class="service-filter-fields"><ElSelect v-model="filter.park" clearable placeholder="全部已加入园区"><ElOption v-for="p in c.joinedParks" :key="p.id" :label="p.name" :value="p.id"/></ElSelect><ElCascader :model-value="filter.category?filter.category.split(' / '):[]" :options="CATEGORY_TREE" :props="{checkStrictly:true}" clearable filterable placeholder="全部分类" @change="filter.category=Array.isArray($event)?$event.join(' / '):''"/><ElInput v-model="filter.name" clearable placeholder="搜索服务名称" @keyup.enter="query"><template #prefix><Search :size="15" /></template></ElInput></div><div class="service-filter-actions"><ElButton type="primary" @click="query">查询</ElButton><ElButton @click="reset">重置</ElButton></div></div>
      <div class="biz-tabs service-tabs"><button v-for="[key,label] in tabs" :key="key" class="biz-tab" :class="{active:tab===key}" @click="setTab(key)">{{label}} <span>{{count(key)}}</span></button></div></div>
      <div v-if="!rows.length" class="biz-empty"><h3>{{c.data.services.length?'暂无匹配的服务':'暂无服务，发布第一个服务吧'}}</h3><p>{{c.data.services.length?'请调整筛选条件或清空筛选。':'提交后按园区审核。'}}</p><ElButton v-if="c.data.services.length" @click="reset">清空筛选</ElButton><ElButton v-else type="primary" @click="create">发布服务</ElButton></div>
      <div v-else class="service-list">
        <article v-for="s in rows" :key="s.id" class="service-card">
          <div class="service-card-body">
            <button type="button" class="service-cover" :aria-label="`查看${s.name||'服务'}详情`" @click="detail=s"><DemoImage :source="coverSource(s.cover)" empty-text="无封面" /></button>
            <div class="service-card-content">
              <div class="service-identity"><h3 :title="s.name"><button type="button" @click="detail=s">{{s.name||'未命名草稿'}}</button></h3><ElTag :type="aggregateTone(s)" effect="light">{{aggregateLabel(s)}}</ElTag></div>
              <p class="service-category" :title="s.category">{{s.category||'未选择分类'}}</p>
              <div class="service-park-statuses">
                <template v-for="p in c.joinedParks.slice(0,2)" :key="p.id"><ElPopover v-if="s.listings[p.id]?.status==='rejected'" trigger="click" placement="bottom-start" :width="300"><template #reference><button type="button" class="park-status is-rejected actionable"><b>{{p.name}}</b><i>·</i><span class="reject-label">已驳回</span></button></template><strong>园区审核未通过</strong><p class="reject-reason">{{ s.listings[p.id]?.reason || '请核对服务资料并重新提交。' }}</p><small>{{ s.listings[p.id]?.at.slice(0,19).replace('T',' ') }}</small></ElPopover><span v-else class="park-status" :class="`is-${s.listings[p.id]?.status||'draft'}`" :title="p.name"><b>{{p.name}}</b><i>·</i><span>{{s.listings[p.id]?STATUS_LABEL[s.listings[p.id].status]:'未发布'}}</span><em v-if="s.listings[p.id]?.forced">运营下架</em></span></template>
                <ElPopover v-if="c.joinedParks.length>2" trigger="click" placement="bottom-start" :width="330"><template #reference><button type="button" class="park-overflow">更多园区 {{ c.joinedParks.length-2 }}</button></template><div class="park-overflow-list"><div v-for="p in c.joinedParks.slice(2)" :key="p.id"><strong>{{ p.name }}</strong><span :class="{ rejected: s.listings[p.id]?.status==='rejected' }">{{ s.listings[p.id] ? STATUS_LABEL[s.listings[p.id].status] : '未发布' }}</span><small v-if="s.listings[p.id]?.status==='rejected'">{{ s.listings[p.id]?.reason || '请核对服务资料并重新提交。' }}</small></div></div></ElPopover><span v-if="!c.joinedParks.length" class="service-unpublished">尚未加入园区</span>
              </div>
              <div class="service-specs"><span v-for="(spec,index) in s.specs" :key="index" class="service-spec"><b>{{spec.name||`规格 ${index+1}`}}</b><strong>{{spec.price>0?`${money(spec.price)} / ${spec.unit}`:'价格待设置'}}</strong></span><span v-if="!s.specs.length" class="service-unpublished">尚未设置规格</span></div>
              <small class="service-updated">更新 {{s.updatedAt.slice(0,10)}}</small>
            </div>
            <div class="service-card-side">
              <div class="service-sales"><span>累计销量</span><strong>{{sales(s)}}</strong></div>
              <div class="service-actions"><ElButton @click="detail=s"><Eye :size="14" />详情</ElButton><ElButton v-if="s.published" @click="edit(s)"><Pencil :size="14" />编辑</ElButton><ElButton v-if="!s.published" type="primary" @click="continueDraft(s)"><Pencil :size="14" />继续发布</ElButton><ElButton v-else-if="eligible(s,'publish').length" type="primary" @click="operate(s,'publish')"><ArrowUpToLine :size="14" />上架</ElButton><ElButton v-if="eligible(s,'offline').length" :type="eligible(s,'publish').length?'default':'warning'" plain @click="operate(s,'offline')"><ArrowDownToLine :size="14" />下架</ElButton><ElButton text type="danger" @click="remove(s)"><Trash2 :size="14" />删除</ElButton></div>
            </div>
          </div>
        </article>
      </div>
      <div v-if="tabRows.length>20" class="biz-footer"><span>共 {{tabRows.length}} 项服务</span><ElPagination v-model:current-page="page" :page-size="20" :total="tabRows.length" layout="prev, pager, next" background /></div>
    </section>
<ElDialog v-model="dialog" :title="action==='publish'?`上架园区 · ${target?.name||''}`: `下架园区 · ${target?.name||''}`" width="560px"><p class="biz-muted">{{action==='publish'?'选择要上架的园区。已上架或审核中的园区不可重复提交。':'仅可下架已上架园区；审核中的园区不可下架。'}}</p><div class="biz-actions selection-tools"><ElButton plain @click="selected=target?eligible(target,action).map(p=>p.id):[]">全选可操作</ElButton><ElButton plain :disabled="!selected.length" @click="selected=[]">取消全选</ElButton></div><ElCheckboxGroup v-model="selected" class="park-options"><div v-for="p in c.joinedParks" :key="p.id" class="park-option"><ElCheckbox :value="p.id" :disabled="!target||!eligible(target,action).some(x=>x.id===p.id)">{{p.name}}</ElCheckbox><ElTag :type="target?.listings[p.id]?.status==='on_sale'?'success':target?.listings[p.id]?.status==='rejected'?'danger':'info'">{{target?.listings[p.id]?STATUS_LABEL[target.listings[p.id].status]:'未发布'}}</ElTag><small v-if="target?.listings[p.id]?.reason">{{target.listings[p.id].reason}} · {{target.listings[p.id].at.slice(0,19).replace('T',' ')}}</small></div></ElCheckboxGroup><template #footer><ElButton @click="dialog=false">取消</ElButton><ElButton type="primary" :disabled="!selected.length" @click="submit">{{action==='publish'?'提交上架审核':'下架所选'}}</ElButton></template></ElDialog>
<ElDialog :model-value="Boolean(detail)" @update:model-value="detail=null" title="客户端服务详情预览" width="760px"><ServicePreview v-if="detail" :service="detail"/></ElDialog></div></template>
<style scoped>
.service-page{min-width:760px;max-width:1190px}
.service-head{align-items:center;margin-bottom:29px}
.service-heading{display:flex;align-items:center;gap:15px}
.service-heading-icon{display:grid;place-items:center;flex:none;width:46px;height:46px;border-radius:11px;background:#eaf0ff;color:#3659c2}
.service-workspace{padding-top:20px;border-top:1px solid #e5ebf3}
.service-section-head{margin-bottom:17px}
.service-section-head h2{margin:0 0 3px;font-size:17px}
.service-section-head h2 span{margin-left:6px;padding:3px 7px;border-radius:6px;background:#edf2ff;color:#3458bd;font-size:12px}
.service-section-head p{margin:0;color:#7d899c;font-size:12px}
.service-filters{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px}
.service-filter-fields{display:grid;grid-template-columns:minmax(140px,1fr) minmax(140px,1fr) minmax(150px,1.15fr);gap:10px;min-width:0}
.service-filter-fields :deep(.el-select),.service-filter-fields :deep(.el-cascader),.service-filter-fields :deep(.el-input){width:100%;min-width:0}
.service-filter-actions{display:flex;align-items:center;gap:8px;white-space:nowrap}
.service-filter-actions :deep(.el-button){margin:0}
.service-tabs{margin:19px 0 18px;gap:2px;flex-wrap:nowrap;overflow-x:auto}
.service-tabs .biz-tab{flex:none;white-space:nowrap;padding:11px 13px}
.service-tabs .biz-tab span{margin-left:2px;color:#8997aa;font-size:11px}
.service-tabs .biz-tab.active span{color:#3153bd}
.service-list{display:grid;gap:15px}
.service-card{min-width:0;overflow:hidden;padding:18px 20px;border:1px solid #dfe7f1;border-radius:12px;background:#fff}
.service-card-body{display:grid;grid-template-columns:112px minmax(0,1fr) minmax(250px,29%);gap:18px;min-width:0}
.service-cover{width:112px;height:112px;overflow:hidden;border:1px solid #e3e9f2;border-radius:9px;background:#f7f9fd}
.service-card-content{min-width:0}
.service-card-side{display:flex;flex-direction:column;min-width:0;padding-left:17px;border-left:1px solid #edf0f5}
.service-identity{display:flex;align-items:center;gap:10px;min-width:0}
.service-identity h3{min-width:0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:0;color:#1e2e47;font-size:17px;font-weight:720;line-height:1.45}
.service-identity :deep(.el-tag){flex:none}
.service-category{margin:5px 0 0;color:#8290a4;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.service-park-statuses{display:flex;flex-wrap:wrap;gap:6px;margin-top:13px;min-width:0}
.park-status{display:inline-flex;align-items:center;gap:5px;max-width:min(260px,100%);min-width:0;padding:5px 8px;border:1px solid #dde6f4;border-radius:6px;background:#f6f9ff;color:#52647e;font-size:11px;line-height:1.3}
.park-status b{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
.park-status i{flex:none;font-style:normal;color:#9aa8b9}
.park-status>span{flex:none;color:#3157b3;font-weight:650}
.park-status em{flex:none;color:#bb5647;font-style:normal}
.park-status.is-on_sale{border-color:#bee9d9;background:#f1fbf7}.park-status.is-on_sale>span{color:#167c5f}
.park-status.is-offline,.park-status.is-rejected{border-color:#f5d6c1;background:#fff8f4}.park-status.is-offline>span,.park-status.is-rejected>span{color:#ad6632}
.service-unpublished{color:#8997a8;font-size:12px}
.service-specs{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;min-width:0}
.service-spec{display:inline-flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;width:100%;max-width:100%;padding:5px 8px;border:1px solid #e5ebf5;border-radius:7px;background:#f8faff;font-size:11px}
.service-spec b{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#4a5b73;font-weight:650}
.service-spec strong{flex:none;color:#315ac4;font-weight:700}
.service-actions{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:12px}
.service-actions :deep(.el-button){margin:0;min-height:30px;padding:5px 8px;border-radius:7px;font-size:11px}
.service-actions :deep(.el-button>span){display:inline-flex;align-items:center;gap:4px}
.service-sales{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0;color:#8b99ac;font-size:11px;white-space:nowrap}
.service-sales strong{color:#25354d;font-size:22px;line-height:1.2;font-variant-numeric:tabular-nums}
.service-updated{display:block;margin-top:auto;padding-top:8px;color:#9aa7b8;font-size:10px}
.selection-tools{margin:14px 0 4px}.selection-tools :deep(.el-button){min-height:32px;padding:5px 11px;margin:0;border-color:#d5dfef;background:#f8faff;color:#3b5da8}
.park-options{display:grid;gap:8px;margin-top:18px}.park-option{display:grid;grid-template-columns:1fr auto;align-items:center;gap:4px;padding:10px 0;border-bottom:1px solid #edf1f5}.park-option small{grid-column:1/-1;color:#ae5a4c;font-size:12px}
@media(max-width:1050px){.service-card-body{grid-template-columns:88px minmax(0,1fr) 250px;gap:13px}.service-cover{width:88px;height:88px}.service-card{padding:15px}.service-card-side{padding-left:12px}}
.service-cover{padding:0;cursor:pointer}.service-cover :deep(.demo-image){pointer-events:none}.service-identity h3 button{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}.service-identity h3 button:hover{color:#3158bd}.park-overflow{padding:5px 9px;border:1px solid #dce5f4;border-radius:6px;background:#f7f9fe;color:#3659b8;font-size:11px;cursor:pointer}.park-overflow-list{display:grid;gap:0}.park-overflow-list>div{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px;padding:9px 0;border-bottom:1px solid #edf1f7;font-size:12px}.park-overflow-list>div:last-child{border-bottom:0}.park-overflow-list strong{overflow-wrap:anywhere;color:#41536e}.park-overflow-list span{color:#57709b}.park-overflow-list span.rejected{color:#bd443d}.park-overflow-list small{grid-column:1/-1;color:#a75a54;line-height:1.5}
</style>

<style scoped>
.service-count{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 6px;vertical-align:middle;border-radius:6px;background:#edf2ff;color:#3458bd;font-size:12px;font-weight:700;letter-spacing:0}.service-workspace{padding-top:0;border-top:0}.service-sticky{margin-bottom:16px}.service-tabs{margin-bottom:0}.service-card-body{grid-template-columns:112px minmax(0,1fr) 300px}.service-card-content{display:flex;flex-direction:column;align-items:flex-start}.service-card-side{align-items:stretch;justify-content:space-between}.service-specs{max-width:100%;margin-top:12px}.service-spec{width:auto;max-width:100%;gap:13px}.service-updated{margin-top:9px;padding:0}.service-sales{justify-content:flex-start;gap:6px;font-size:12px}.service-sales strong{font-family:'D-DIN','DIN Alternate','Arial Narrow',sans-serif;font-size:23px;font-weight:700}.service-actions{align-items:center;justify-content:flex-start;flex-wrap:nowrap;gap:4px;margin-top:auto;padding-top:12px}.service-actions :deep(.el-button){min-height:26px;padding:4px 5px;font-size:11px}.park-status.actionable{cursor:pointer;font-size:11px;line-height:1.3;text-align:left;font-family:inherit}.park-status.is-rejected{border-color:#f0b3ae;background:#fff0ef}.park-status.is-rejected>span{color:#b74239}.reject-label{position:relative}.reject-label::after{content:"";position:absolute;right:-5px;top:-4px;width:6px;height:6px;border-radius:50%;background:#d83731;box-shadow:0 0 0 2px #fff0ef}.reject-reason{margin:8px 0;color:#4b5d75;font-size:12px;line-height:1.6}
@media(max-width:1050px){.service-card-body{grid-template-columns:88px minmax(0,1fr) 275px}}
</style>
