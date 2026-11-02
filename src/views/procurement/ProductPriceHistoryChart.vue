<script setup lang="ts">
import { computed, ref, watch } from 'vue'
type RecordItem = { time:string; original:number; sale:number; tax?:number }
const props = defineProps<{ records: RecordItem[]; mode:'taxed'|'untaxed' }>()
const hovered = ref<number|null>(null)
watch(()=>[props.records,props.mode],()=>{hovered.value=null})
const chart = computed(() => {
  const points = props.records.map(record => {
    const hasTax=typeof record.tax==='number' && Number.isFinite(record.tax)
    const factor=props.mode==='untaxed' ? 1 : hasTax ? 1+record.tax!/100 : null
    return {...record,timestamp:Date.parse(record.time), originalValue:factor===null?null:Math.round(record.original*factor*100)/100, saleValue:factor===null?null:Math.round(record.sale*factor*100)/100}
  }).filter(point=>Number.isFinite(point.timestamp) && Number.isFinite(point.original) && Number.isFinite(point.sale)).sort((a,b)=>a.timestamp-b.timestamp)
  const valid=points.filter(point=>point.originalValue!==null && point.saleValue!==null)
  if (!valid.length) return null
  const minTime=points[0].timestamp,maxTime=points[points.length-1].timestamp
  const values=valid.flatMap(point=>[point.originalValue!,point.saleValue!])
  const minValue=Math.min(...values),maxValue=Math.max(...values),pad=Math.max((maxValue-minValue)*0.15,maxValue*0.03,1)
  const low=Math.max(0,minValue-pad),high=maxValue+pad
  const x=(time:number,index:number)=>maxTime===minTime?(points.length===1?280:55+index*490/(points.length-1)):55+(time-minTime)*490/(maxTime-minTime)
  const y=(value:number)=>20+(high-value)*150/(high-low)
  function segments(key:'originalValue'|'saleValue') { const lines:string[][]=[];let current:string[]=[];points.forEach((point,index)=>{const value=point[key];if(value===null){if(current.length)lines.push(current);current=[]}else current.push(`${x(point.timestamp,index)},${y(value)}`)});if(current.length)lines.push(current);return lines.filter(line=>line.length>1).map(line=>line.join(' ')) }
  return {points,low,high,x,y,originalLines:segments('originalValue'),saleLines:segments('saleValue')}
})
function shortDate(timestamp:number) { const date=new Date(timestamp);return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}` }
</script>
<template>
  <section class="price-chart" aria-label="历史价格趋势">
    <div class="chart-heading"><div class="chart-legend"><span><i class="original-mark"></i>{{mode==='taxed'?'含税原价':'未税原价'}}</span><span><i class="sale-mark"></i>{{mode==='taxed'?'含税销售价':'未税销售价'}}</span></div></div>
    <template v-if="chart"><svg viewBox="0 0 600 220" role="img" :aria-label="`${mode==='taxed'?'含税':'未税'}价格随替换时间变化，详细记录见下方表格`">
      <g v-for="fraction in [0,0.25,0.5,0.75,1]" :key="fraction"><line x1="55" x2="545" :y1="20+150*fraction" :y2="20+150*fraction" stroke="#e2e8f1"/><text x="46" :y="24+150*fraction" text-anchor="end">{{(chart.high-(chart.high-chart.low)*fraction).toFixed(2)}}</text></g>
      <polyline v-for="(line,index) in chart.originalLines" :key="`o${index}`" :points="line" fill="none" stroke="#1e75ff" stroke-width="2"/><polyline v-for="(line,index) in chart.saleLines" :key="`s${index}`" :points="line" fill="none" stroke="#e31937" stroke-width="2" stroke-dasharray="5 3"/>
      <g v-for="(point,index) in chart.points" :key="index" tabindex="0" @mouseenter="hovered=index" @mouseleave="hovered=null" @focus="hovered=index" @blur="hovered=null"><line v-if="hovered===index" :x1="chart.x(point.timestamp,index)" :x2="chart.x(point.timestamp,index)" y1="20" y2="170" stroke="#aebdd1" stroke-dasharray="3 3"/><circle v-if="point.originalValue!==null" :cx="chart.x(point.timestamp,index)" :cy="chart.y(point.originalValue)" r="4.5" fill="#1e75ff" stroke="#fff" stroke-width="2"/><circle v-if="point.saleValue!==null" :cx="chart.x(point.timestamp,index)" :cy="chart.y(point.saleValue)" r="4.5" fill="#e31937" stroke="#fff" stroke-width="2"/><rect :x="chart.x(point.timestamp,index)-10" y="20" width="20" height="150" fill="transparent"/><title>{{point.time}}：{{point.originalValue===null?'未记录税率':`原价 ¥${point.originalValue.toFixed(2)}，销售价 ¥${point.saleValue!.toFixed(2)}`}}</title></g>
      <text x="55" y="194">{{shortDate(chart.points[0].timestamp)}}</text><text v-if="chart.points.length>1" x="545" y="194" text-anchor="end">{{shortDate(chart.points[chart.points.length-1].timestamp)}}</text>
    </svg><div v-if="hovered!==null && chart.points[hovered]" class="chart-readout">{{chart.points[hovered].time}}　<span v-if="chart.points[hovered].originalValue!==null">{{mode==='taxed'?'含税':'未税'}}原价 ¥{{chart.points[hovered].originalValue!.toFixed(2)}}　销售价 ¥{{chart.points[hovered].saleValue!.toFixed(2)}}</span><span v-else>该记录未保存税率</span></div><p v-else>将鼠标移至数据点查看价格；横轴为价格被替换的时间。</p></template>
    <div v-else class="chart-empty">{{records.length && mode==='taxed'?'历史记录未保存税率，无法绘制含税曲线。':'暂无可绘制的历史价格记录。'}}</div>
  </section>
</template>
<style scoped>
.price-chart{margin-top:18px;padding:16px 16px 8px;border:1px solid #e4eaf3;border-radius:7px;background:#fff}.chart-heading{display:flex;align-items:center;gap:12px;color:#34465e;font-size:13px}.chart-legend{display:flex;gap:22px;color:#52637a;font-size:13px}.chart-legend span{display:flex;align-items:center;gap:7px}.chart-legend i{display:block;width:20px;border-top:2px solid #1e75ff}.chart-legend .sale-mark{border-color:#e31937;border-top-style:dashed}.price-chart svg{width:100%;height:auto;max-height:260px;display:block;margin-top:12px}.price-chart text{font-size:11px;fill:#75849a}.price-chart p,.chart-readout{font-size:12px;color:#7c8ba1;margin:0 0 6px;min-height:19px}.chart-empty{padding:44px 12px;text-align:center;color:#8795a8;font-size:13px}
</style>
