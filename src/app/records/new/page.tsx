'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { FarmRecordInsert, COOP_OPTIONS, RECORD_TYPE_OPTIONS, RecordType } from '@/lib/types'
import { Save, ArrowLeft, Calculator } from 'lucide-react'
import Link from 'next/link'

const defaultForm: FarmRecordInsert = {
  date: new Date().toISOString().split('T')[0],
  record_type: 'ผลผลิตประจำวัน',
  coop: 'เล้า A',
  num_hens: 0,
  good_eggs: 0,
  broken_eggs: 0,
  eggs_sold: 0,
  price_per_egg: 0,
  revenue: 0,
  feed_used: 0,
  feed_purchased: 0,
  feed_remaining: 0,
  feed_cost: 0,
  utilities_cost: 0,
  other_expenses: 0,
  investment: 0,
  total_expenses: 0,
  profit: 0,
  dead_hens: 0,
  production_rate: 0,
  notes: '',
}

export default function NewRecordPage() {
  const router = useRouter()
  const [form, setForm] = useState<FarmRecordInsert>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [prevFeedRemaining, setPrevFeedRemaining] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    fetchLatestFeedRemaining()
  }, [form.coop])

  useEffect(() => {
    autoCalculate()
  }, [form.good_eggs, form.eggs_sold, form.price_per_egg, form.num_hens,
      form.feed_used, form.feed_purchased, form.feed_cost,
      form.utilities_cost, form.other_expenses, form.investment, prevFeedRemaining])

  const fetchLatestFeedRemaining = async () => {
    const { data } = await supabase
      .from('farm_records')
      .select('feed_remaining')
      .eq('coop', form.coop)
      .order('date', { ascending: false })
      .limit(1)
      .single()
    if (data) setPrevFeedRemaining(data.feed_remaining)
  }

  const autoCalculate = () => {
    const revenue = form.eggs_sold * form.price_per_egg
    const feedRemaining = prevFeedRemaining - form.feed_used + form.feed_purchased
    const totalExpenses = form.feed_cost + form.utilities_cost + form.other_expenses + form.investment
    const profit = revenue - totalExpenses
    const productionRate = form.num_hens > 0
      ? Math.round((form.good_eggs / form.num_hens) * 100 * 100) / 100
      : 0

    setForm(prev => ({
      ...prev,
      revenue: Math.round(revenue * 100) / 100,
      feed_remaining: Math.max(0, Math.round(feedRemaining * 100) / 100),
      total_expenses: Math.round(totalExpenses * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      production_rate: productionRate,
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('กรุณาเข้าสู่ระบบก่อน'); setLoading(false); return }

    const { error: insertError } = await supabase
      .from('farm_records')
      .insert([{ ...form, user_id: user.id }])

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/records')
    router.refresh()
  }

  const isProduction = form.record_type === 'ผลผลิตประจำวัน'

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/records"
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📝 บันทึกข้อมูลใหม่</h1>
          <p className="text-gray-500 text-sm">บันทึกข้อมูลผลผลิตและค่าใช้จ่ายประจำวัน</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ข้อมูลพื้นฐาน */}
        <Section title="📋 ข้อมูลพื้นฐาน">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="วันที่ *" required>
              <input type="date" name="date" value={form.date} onChange={handleChange} required
                className={inputClass} />
            </FormField>
            <FormField label="ประเภทบันทึก *" required>
              <select name="record_type" value={form.record_type} onChange={handleChange} className={inputClass}>
                {RECORD_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="โรงเรือน *" required>
              <select name="coop" value={form.coop} onChange={handleChange} className={inputClass}>
                {COOP_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
          </div>
        </Section>

        {/* ข้อมูลไก่และไข่ */}
        <Section title="🐓 ข้อมูลไก่และไข่">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FormField label="จำนวนแม่ไก่ (ตัว)">
              <input type="number" name="num_hens" value={form.num_hens} onChange={handleChange} min="0" className={inputClass} />
            </FormField>
            <FormField label="ไข่ดี (ฟอง)">
              <input type="number" name="good_eggs" value={form.good_eggs} onChange={handleChange} min="0" className={inputClass} />
            </FormField>
            <FormField label="ไข่แตก/คัดทิ้ง (ฟอง)">
              <input type="number" name="broken_eggs" value={form.broken_eggs} onChange={handleChange} min="0" className={inputClass} />
            </FormField>
            <FormField label="ตาย/คัดออก (ตัว)">
              <input type="number" name="dead_hens" value={form.dead_hens} onChange={handleChange} min="0" className={inputClass} />
            </FormField>
          </div>

          {/* อัตราออกไข่ */}
          <div className="mt-3 p-3 bg-emerald-50 rounded-xl flex items-center gap-3">
            <Calculator size={16} className="text-emerald-600" />
            <span className="text-sm text-emerald-700">
              อัตราออกไข่ (คำนวณอัตโนมัติ): <strong>{form.production_rate}%</strong>
              {form.num_hens > 0 && ` (${form.good_eggs}/${form.num_hens} ตัว)`}
            </span>
          </div>
        </Section>

        {/* รายได้ */}
        <Section title="💰 รายได้จากการขาย">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <FormField label="ไข่ที่ขาย (ฟอง)">
              <input type="number" name="eggs_sold" value={form.eggs_sold} onChange={handleChange} min="0" className={inputClass} />
            </FormField>
            <FormField label="ราคา/ฟอง (บาท)">
              <input type="number" name="price_per_egg" value={form.price_per_egg} onChange={handleChange} min="0" step="0.01" className={inputClass} />
            </FormField>
            <FormField label="รายได้รวม (บาท)">
              <div className={`${inputClass} bg-emerald-50 text-emerald-700 font-semibold cursor-not-allowed`}>
                ฿{form.revenue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </div>
            </FormField>
          </div>
        </Section>

        {/* อาหาร */}
        <Section title="🌾 ข้อมูลอาหารไก่">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FormField label="อาหารที่ใช้ (กก.)">
              <input type="number" name="feed_used" value={form.feed_used} onChange={handleChange} min="0" step="0.1" className={inputClass} />
            </FormField>
            <FormField label="อาหารซื้อเข้า (กก.)">
              <input type="number" name="feed_purchased" value={form.feed_purchased} onChange={handleChange} min="0" step="0.1" className={inputClass} />
            </FormField>
            <FormField label="อาหารคงเหลือ (กก.)">
              <div className={`${inputClass} bg-blue-50 text-blue-700 font-medium cursor-not-allowed`}>
                {form.feed_remaining} กก.
              </div>
            </FormField>
            <FormField label="ค่าอาหาร (บาท)">
              <input type="number" name="feed_cost" value={form.feed_cost} onChange={handleChange} min="0" className={inputClass} />
            </FormField>
          </div>
        </Section>

        {/* ค่าใช้จ่าย */}
        <Section title="💸 ค่าใช้จ่ายอื่นๆ">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <FormField label="ค่าน้ำ/ไฟ/ยา (บาท)">
              <input type="number" name="utilities_cost" value={form.utilities_cost} onChange={handleChange} min="0" className={inputClass} />
            </FormField>
            <FormField label="รายจ่ายอื่นๆ (บาท)">
              <input type="number" name="other_expenses" value={form.other_expenses} onChange={handleChange} min="0" className={inputClass} />
            </FormField>
            <FormField label="ลงทุน/โรงเรือน/อุปกรณ์ (บาท)">
              <input type="number" name="investment" value={form.investment} onChange={handleChange} min="0" className={inputClass} />
            </FormField>
          </div>
        </Section>

        {/* สรุป */}
        <div className="bg-navy-900 rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #07122d, #0d2460)' }}>
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Calculator size={18} className="text-yellow-400" />
            สรุปการคำนวณ (อัตโนมัติ)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <SummaryCard label="รายได้รวม" value={`฿${form.revenue.toLocaleString('th-TH')}`} color="text-emerald-400" />
            <SummaryCard label="รายจ่ายรวม" value={`฿${form.total_expenses.toLocaleString('th-TH')}`} color="text-red-400" />
            <SummaryCard label="กำไร/ขาดทุน" value={`฿${form.profit.toLocaleString('th-TH')}`}
              color={form.profit >= 0 ? 'text-yellow-400' : 'text-red-400'} />
          </div>
        </div>

        {/* หมายเหตุ */}
        <Section title="📌 หมายเหตุ">
          <textarea name="notes" value={form.notes} onChange={handleChange}
            placeholder="บันทึกเพิ่มเติม..." rows={3}
            className={`${inputClass} resize-none`} />
        </Section>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            ❌ {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <Link href="/records"
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            ยกเลิก
          </Link>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #1458dc, #0d2460)' }}>
            <Save size={18} />
            {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  )
}

function FormField({ label, required, children }: { label: string, required?: boolean, children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="bg-white/10 rounded-xl p-3 text-center">
      <div className="text-white/60 text-xs mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  )
}

const inputClass = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition bg-white"
