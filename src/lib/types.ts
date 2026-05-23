export type RecordType =
  | 'ผลผลิตประจำวัน'
  | 'ลงทุนเริ่มต้น/อุปกรณ์'
  | 'ซื้ออาหาร'
  | 'ค่าใช้จ่ายอื่นๆ'

export interface FarmRecord {
  id: string
  user_id: string
  date: string
  year?: number
  month?: number
  record_type: RecordType
  coop: string
  num_hens: number
  good_eggs: number
  broken_eggs: number
  eggs_sold: number
  price_per_egg: number
  revenue: number
  feed_used: number
  feed_purchased: number
  feed_remaining: number
  feed_cost: number
  utilities_cost: number
  other_expenses: number
  investment: number
  total_expenses: number
  profit: number
  dead_hens: number
  production_rate: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface FarmRecordInsert {
  date: string
  record_type: RecordType
  coop: string
  num_hens: number
  good_eggs: number
  broken_eggs: number
  eggs_sold: number
  price_per_egg: number
  revenue: number
  feed_used: number
  feed_purchased: number
  feed_remaining: number
  feed_cost: number
  utilities_cost: number
  other_expenses: number
  investment: number
  total_expenses: number
  profit: number
  dead_hens: number
  production_rate: number
  notes?: string
}

export interface MonthlySummary {
  year: number
  month: number
  coop: string
  total_good_eggs: number
  total_broken_eggs: number
  total_eggs_sold: number
  total_revenue: number
  total_feed_cost: number
  total_utilities: number
  total_other_expenses: number
  total_investment: number
  total_expenses: number
  total_profit: number
  total_dead_hens: number
  avg_production_rate: number
  days_recorded: number
}

export const COOP_OPTIONS = ['เล้า A', 'เล้า B', 'เล้า C', 'เล้า D']

export const RECORD_TYPE_OPTIONS: RecordType[] = [
  'ผลผลิตประจำวัน',
  'ลงทุนเริ่มต้น/อุปกรณ์',
  'ซื้ออาหาร',
  'ค่าใช้จ่ายอื่นๆ',
]

export const THAI_MONTHS = [
  '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
]

export const THAI_MONTHS_FULL = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

export function formatThaiDate(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDate()
  const month = THAI_MONTHS[d.getMonth() + 1]
  const year = d.getFullYear() + 543
  return `${day} ${month} ${year}`
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}
