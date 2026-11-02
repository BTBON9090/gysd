import type { Product } from '@/stores/products'

type DemoItem = { id: string; productId?: string; name: string; sku: string; unit: string; cover?: string; brand?: string; model?: string }
type DemoOrder = { id: string; items: DemoItem[] }
type KnownLine = { orderId: string; itemId: string; name: string; sku: string; productId: string }

// These are specific lines from the shipped demonstration orders, not fuzzy matching rules.
const knownLines: KnownLine[] = [
  { orderId:'JC-DEMO-001', itemId:'1', name:'工业防护手套', sku:'耐磨款 · M 码', productId:'JC-PRODUCT-002' },
  { orderId:'JC-DEMO-001', itemId:'2', name:'安全防护眼镜', sku:'透明款', productId:'JC-PRODUCT-003' },
  { orderId:'JC-DEMO-002', itemId:'3', name:'工业安全帽', sku:'白色 · 标准款', productId:'JC-PRODUCT-001' },
  { orderId:'JC-DEMO-003', itemId:'4', name:'防护口罩', sku:'独立包装', productId:'JC-PRODUCT-004' },
  { orderId:'JC-DEMO-004', itemId:'extra-0', name:'工业安全帽', sku:'SKU-1001', productId:'JC-PRODUCT-001' },
  { orderId:'JC-DEMO-005', itemId:'extra-1', name:'防护眼镜', sku:'SKU-1002', productId:'JC-PRODUCT-003' },
  { orderId:'JC-DEMO-008', itemId:'extra-4', name:'劳保口罩', sku:'SKU-1005', productId:'JC-PRODUCT-004' },
  { orderId:'JC-DEMO-009', itemId:'extra-5', name:'安全警示牌', sku:'SKU-1006', productId:'JC-PRODUCT-010' },
  { orderId:'JC-DEMO-010', itemId:'extra-6', name:'工业防护手套', sku:'SKU-1007', productId:'JC-PRODUCT-002' },
]

/** Backfill only untouched, known example lines; preserve all real and edited order data. */
export function linkKnownDemoOrders<T extends DemoOrder>(orders: T[], products: Product[]): T[] {
  const productById = new Map(products.map(product => [product.id, product]))
  const lineById = new Map(knownLines.map(line => [`${line.orderId}\0${line.itemId}`, line]))
  return orders.map(order => ({
    ...order,
    items: order.items.map(item => {
      const line = lineById.get(`${order.id}\0${item.id}`)
      if (!line || item.productId || item.name !== line.name || item.sku !== line.sku) return item
      const product = productById.get(line.productId)
      if (!product) return item
      return { ...item, productId: product.id }
    }),
  })) as T[]
}
