'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { FarmRecord, formatCurrency, COOP_OPTIONS, RECORD_TYPE_OPTIONS } from '@/lib/types'
import Link from 'next/link'
import { PlusCircle, Search, Filter, Trash2, Edit } from 'lucide-react'

export default function RecordsPage() {
  const [records, setRecords] = useState<FarmRecord[]>([])
  const [filtered, setFiltered] = useState<FarmRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCoop, setFilterCoop] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterMonth, setFilterMonth] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchRecords()
  }, [])

  useEffect(() => {
    let result = [...records]
    if (search) {
      result = result.filter(r =>
        r.notes?.toLowerCase().includes(search.toLowerCase()) ||
        r.coop.includes(search)
      )
    }
    if (filterCoop) result = result.filter(r => r.coop === filterCoop)
    if (filterType) result = result.filter(r => r.record_type === filterType)
    if (filterMonth) {
      const [year, month] = filterMonth.split('-').map(Number)
      result = result.filter(r => {
        const d = new Date(r.date)
        return d.getFullYear() === year && d.getMonth() + 1 === month
      })
    }
    setFiltered(result)
  }, [records, search, filterCoop, filterType, filterMonth])

  const fetchRecords = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('farm_records')
      .select('*')
      .order('date', { ascending: false })

    if (!error && data) setRecords(data as FarmRecord[])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบรายการนี้?')) return
    const { error } = await supabase.from('farm_records').delete().eq('id', id)
    if (!error) {
      setRecords(prev => prev.filter(r => r.id !== id))
    }
  }

  // สรุปยอด
  const totalRevenue = filtered.reduce((s, r) => s + r.revenue, 0)
  const totalExpenses = filtered.reduce((s, r) => s + r.total_expenses, 0)
  const totalProfit = filtered.reduce((s, r) => s + r.profit, 0)
  const totalEggs = filtered.filter(r => r.record_type === 'ผลผลิตประจำวัน').reduce((s, r) => s + r.good_eggs, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">📋</div>
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📋 รายการบันทึกทั้งหมด</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} รายการ</p>
        </div>
        <Link href="/records/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium shadow-lg text-sm"
          style={{ background: 'linear-gradient(135deg, #1458dc, #0d2460)' }}>
          <PlusCircle size={18} />
          บันทึกใหม่
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'ไข่ดีรวม', value: `${totalEggs.toLocaleString()} ฟอง`, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'รายได้รวม', value: `฿${formatCurrency(totalRevenue)}`, color: 'bg-blue-50 text-blue-700' },
          { label: 'รายจ่ายรวม', value: `฿${formatCurrency(totalExpenses)}`, color: 'bg-red-50 text-red-700' },
          { label: 'กำไรรวม', value: `฿${formatCurrency(totalProfit)}`, color: totalProfit >= 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700' },
        ].map(item => (
          <div key={item.label} className={`${item.color} rounded-xl p-3 text-center`}>
            <div className="text-xs opacity-70 mb-1">{item.label}</div>
            <div className="font-bold text-lg">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหา..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <select value={filterCoop} onChange={e => setFilterCoop(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="">ทุกโรงเรือน</option>
            {COOP_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="">ทุกประเภท</option>
            {RECORD_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['วันที่', 'ประเภท', 'โรงเรือน', 'แม่ไก่', 'ไข่ดี', 'แตก', 'ขาย', 'ราคา/ฟอง', 'รายได้', 'รายจ่าย', 'กำไร', 'อัตรา%', 'หมายเหตุ', ''].map(h => (
                  <th key={h} className="text-left px-3 py-3 font-medium text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                    {new Date(r.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                      r.record_type === 'ผลผลิตประจำวัน' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {r.record_type === 'ผลผลิตประจำวัน' ? 'ผลผลิต' : r.record_type.substring(0, 6)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">{r.coop}</td>
                  <td className="px-3 py-2.5 text-center">{r.num_hens}</td>
                  <td className="px-3 py-2.5 text-center font-medium text-emerald-700">{r.good_eggs}</td>
                  <td className="px-3 py-2.5 text-center text-red-500">{r.broken_eggs}</td>
                  <td className="px-3 py-2.5 text-center text-blue-700">{r.eggs_sold}</td>
                  <td className="px-3 py-2.5 text-center">{r.price_per_egg > 0 ? `฿${r.price_per_egg}` : '-'}</td>
                  <td className="px-3 py-2.5 text-emerald-700 whitespace-nowrap">฿{formatCurrency(r.revenue)}</td>
                  <td className="px-3 py-2.5 text-red-600 whitespace-nowrap">฿{formatCurrency(r.total_expenses)}</td>
                  <td className={`px-3 py-2.5 font-medium whitespace-nowrap ${r.profit >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                    ฿{formatCurrency(r.profit)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-xs font-semibold ${
                      r.production_rate >= 80 ? 'text-emerald-600' :
                      r.production_rate >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>{r.production_rate}%</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 max-w-24 truncate">{r.notes || '-'}</td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => handleDelete(r.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-4 py-16 text-center text-gray-400">
                    <div className="text-3xl mb-2">🔍</div>
                    {records.length === 0 ? 'ยังไม่มีข้อมูล' : 'ไม่พบข้อมูลที่ค้นหา'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
