'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { FarmRecord, FarmRecordInsert, COOP_OPTIONS, RECORD_TYPE_OPTIONS, RecordType } from '@/lib/types'
import { Save, ArrowLeft, Calculator, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EditRecordPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [form, setForm] = useState<FarmRecordInsert | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [prevFeedRemaining, setPrevFeedRemaining] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    fetchRecord()
  }, [id])

  useEffect(() => {
    if (form) autoCalculate()
  }, [
    form?.good_eggs, form?.eggs_sold, form?.price_per_egg, form?.num_hens,
    form?.feed_used, form?.feed_purchased, form?.feed_cost,
    form?.utilities_cost, form?.other_expenses, form?.investment,
  ])

  const fetchRecord = async () => {
    const { data, error } = await supabase
      .from('farm_records')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      setError('ไม่พบข้อมูลที่ต้องการแก้ไข')
      setLoading(false)
      return
    }

    const record = data as FarmRecord
    setForm({
      date: record.date,
      record_type: record.record_type,
      coop: record.coop,
      num_hens: record.num_hens,
      good_eggs: record.good_eggs,
      broken_eggs: record.broken_eggs,
      eggs_sold: record.eggs_sold,
      price_per_egg: record.price_per_egg,
      revenue: record.revenue,
      feed_used: record.feed_used,
      feed_purchased: record.feed_purchased,
      feed_remaining: record.feed_remaining,
      feed_cost: record.feed_cost,
      utilities_cost: record.utilities_cost,
      other_expenses: record.other_expenses,
      investment: record.investment,
      total_expenses: record.total_expenses,
      profit: record.profit,
      dead_hens: record.dead_hens,
      production_rate: record.production_rate,
      notes: record.notes || '',
    })
    setPrevFeedRemaining(record.feed_remaining)
    setLoading(false)
  }

  const autoCalculate = () => {
    if (!form) return
    const revenue = form.eggs_sold * form.price_per_egg
    const totalExpenses = form.feed_cost + form.utilities_cost + form.other_expenses + form.investment
    const profit = revenue - totalExpenses
    const productionRate = form.num_hens > 0
      ? Math.round((form.good_eggs / form.num_hens) * 100 * 100) / 100
      : 0
    const feedRemaining = Math.max(0, Math.round((prevFeedRemaining - form.feed_used + form.feed_purchased) * 100) / 100)

    setForm(prev => prev ? {
      ...prev,
      revenue: Math.round(revenue * 100) / 100,
      feed_remaining: feedRemaining,
      total_expenses: Math.round(totalExpenses * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      production_rate: productionRate,
    } : prev)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setForm(prev => prev ? {
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    } : prev)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('farm_records')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push('/records')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3">❌</div>
          <p className="text-gray-600">{error || 'ไม่พบข้อมูล'}</p>
          <Link href="/records" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
            ← กลับไปรายการ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/records"
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">✏️ แก้ไขข้อมูล</h1>
          <p className="text-gray-500 text-sm">
            วันที่ {new Date(form.date).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
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
          <div className="mt-3 p-3 bg-emerald-50 rounded-xl flex items-center gap-3">
            <Calculator size={16} className="text-emerald-600" />
            <span className="text-sm text-emerald-700">
              อัตราออกไข่: <strong>{form.production_rate}%</strong>
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
              <input type="number" name="feed_remaining" value={form.feed_remaining} onChange={handleChange} min="0" step="0.1" className={inputClass} />
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
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #07122d, #0d2460)' }}>
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Calculator size={18} className="text-yellow-400" />
            สรุปการคำนวณ
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

        {/* Buttons */}
        <div className="flex gap-3 justify-between">
          <Link href="/records"
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            ยกเลิก
          </Link>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #1458dc, #0d2460)' }}>
            {saving ? (
              <><Loader2 size={18} className="animate-spin" /> กำลังบันทึก...</>
            ) : (
              <><Save size={18} /> บันทึกการแก้ไข</>
            )}
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
