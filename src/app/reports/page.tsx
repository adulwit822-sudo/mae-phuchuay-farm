'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { FarmRecord, formatCurrency, THAI_MONTHS, THAI_MONTHS_FULL } from '@/lib/types'
import { Download, FileText } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from 'recharts'

interface MonthSummary {
  year: number
  month: number
  label: string
  totalEggs: number
  totalSold: number
  totalRevenue: number
  totalFeedCost: number
  totalUtilities: number
  totalOther: number
  totalInvestment: number
  totalExpenses: number
  totalProfit: number
  totalDeadHens: number
  avgProductionRate: number
  recordCount: number
}

export default function ReportsPage() {
  const [records, setRecords] = useState<FarmRecord[]>([])
  const [monthly, setMonthly] = useState<MonthSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data } = await supabase
      .from('farm_records')
      .select('*')
      .order('date', { ascending: true })

    if (data) {
      setRecords(data as FarmRecord[])
      computeMonthly(data as FarmRecord[])
    }
    setLoading(false)
  }

  const computeMonthly = (data: FarmRecord[]) => {
    const map: Record<string, MonthSummary> = {}
    data.forEach(r => {
      const d = new Date(r.date)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      const key = `${y}-${m}`
      if (!map[key]) {
        map[key] = {
          year: y, month: m,
          label: `${THAI_MONTHS[m]} ${y + 543}`,
          totalEggs: 0, totalSold: 0, totalRevenue: 0,
          totalFeedCost: 0, totalUtilities: 0, totalOther: 0,
          totalInvestment: 0, totalExpenses: 0, totalProfit: 0,
          totalDeadHens: 0, avgProductionRate: 0, recordCount: 0,
        }
      }
      const s = map[key]
      s.totalEggs += r.good_eggs
      s.totalSold += r.eggs_sold
      s.totalRevenue += r.revenue
      s.totalFeedCost += r.feed_cost
      s.totalUtilities += r.utilities_cost
      s.totalOther += r.other_expenses
      s.totalInvestment += r.investment
      s.totalExpenses += r.total_expenses
      s.totalProfit += r.profit
      s.totalDeadHens += r.dead_hens
      if (r.production_rate > 0) {
        s.avgProductionRate = (s.avgProductionRate * s.recordCount + r.production_rate) / (s.recordCount + 1)
      }
      s.recordCount++
    })
    setMonthly(Object.values(map).sort((a, b) => a.year * 100 + a.month - (b.year * 100 + b.month)))
  }

  const filteredMonthly = monthly.filter(m => m.year === selectedYear)

  const yearlyStats = filteredMonthly.reduce((acc, m) => ({
    totalEggs: acc.totalEggs + m.totalEggs,
    totalRevenue: acc.totalRevenue + m.totalRevenue,
    totalExpenses: acc.totalExpenses + m.totalExpenses,
    totalProfit: acc.totalProfit + m.totalProfit,
  }), { totalEggs: 0, totalRevenue: 0, totalExpenses: 0, totalProfit: 0 })

  const exportCSV = () => {
    const headers = ['เดือน', 'ไข่ดีรวม', 'ขายรวม', 'รายได้', 'ค่าอาหาร', 'ค่าน้ำไฟยา', 'อื่นๆ', 'ลงทุน', 'รายจ่ายรวม', 'กำไร', 'อัตราเฉลี่ย%']
    const rows = filteredMonthly.map(m => [
      m.label, m.totalEggs, m.totalSold, m.totalRevenue,
      m.totalFeedCost, m.totalUtilities, m.totalOther,
      m.totalInvestment, m.totalExpenses, m.totalProfit,
      m.avgProductionRate.toFixed(1),
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `รายงานฟาร์ม_${selectedYear + 543}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAllCSV = () => {
    const headers = ['วันที่', 'ประเภท', 'โรงเรือน', 'แม่ไก่', 'ไข่ดี', 'ไข่แตก', 'ขาย', 'ราคา/ฟอง', 'รายได้', 'อาหารที่ใช้', 'อาหารคงเหลือ', 'ค่าอาหาร', 'ค่าน้ำไฟยา', 'อื่นๆ', 'ลงทุน', 'รายจ่ายรวม', 'กำไร', 'อัตรา%', 'หมายเหตุ']
    const rows = records.map(r => [
      r.date, r.record_type, r.coop, r.num_hens, r.good_eggs, r.broken_eggs,
      r.eggs_sold, r.price_per_egg, r.revenue, r.feed_used, r.feed_remaining,
      r.feed_cost, r.utilities_cost, r.other_expenses, r.investment,
      r.total_expenses, r.profit, r.production_rate, r.notes || '',
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ข้อมูลฟาร์มทั้งหมด.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce">📊</div>
      </div>
    )
  }

  const availableYears = [...new Set(monthly.map(m => m.year))].sort()

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📊 รายงาน</h1>
          <p className="text-gray-500 text-sm mt-1">สรุปผลการดำเนินงานฟาร์ม</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {(availableYears.length > 0 ? availableYears : [selectedYear]).map(y => (
              <option key={y} value={y}>ปี {y + 543}</option>
            ))}
          </select>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
            <Download size={16} />
            Export เดือนนี้
          </button>
          <button onClick={exportAllCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
            <FileText size={16} />
            Export ทั้งหมด
          </button>
        </div>
      </div>

      {/* Yearly Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: `ไข่รวมปี ${selectedYear + 543}`, value: `${yearlyStats.totalEggs.toLocaleString()} ฟอง`, color: 'from-emerald-500 to-green-600' },
          { label: 'รายได้รวมปี', value: `฿${formatCurrency(yearlyStats.totalRevenue)}`, color: 'from-blue-500 to-blue-700' },
          { label: 'รายจ่ายรวมปี', value: `฿${formatCurrency(yearlyStats.totalExpenses)}`, color: 'from-red-500 to-red-700' },
          { label: 'กำไรรวมปี', value: `฿${formatCurrency(yearlyStats.totalProfit)}`, color: yearlyStats.totalProfit >= 0 ? 'from-amber-500 to-yellow-600' : 'from-red-600 to-red-800' },
        ].map(item => (
          <div key={item.label} className={`bg-gradient-to-br ${item.color} rounded-2xl p-4 text-white shadow-md`}>
            <div className="text-xs text-white/70 mb-2">{item.label}</div>
            <div className="text-xl font-bold">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">💰 รายได้ vs รายจ่ายรายเดือน</h2>
          {filteredMonthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={filteredMonthly.map(m => ({ name: m.label, รายได้: m.totalRevenue, รายจ่าย: m.totalExpenses }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Bar dataKey="รายได้" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="รายจ่าย" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">📈 กำไรรายเดือน</h2>
          {filteredMonthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={filteredMonthly.map(m => ({ name: m.label, กำไร: m.totalProfit }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="กำไร" radius={[4, 4, 0, 0]}
                  fill="#3b82f6"
                  label={false}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">🥚 ผลผลิตไข่รายเดือน</h2>
          {filteredMonthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={filteredMonthly.map(m => ({ name: m.label, ไข่ดี: m.totalEggs, ขาย: m.totalSold }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ไข่ดี" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="ขาย" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">🐓 อัตราออกไข่เฉลี่ยรายเดือน (%)</h2>
          {filteredMonthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={filteredMonthly.map(m => ({ name: m.label, อัตรา: +m.avgProductionRate.toFixed(1) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip formatter={(v) => [`${v}%`, 'อัตราออกไข่']} />
                <Line type="monotone" dataKey="อัตรา" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </div>

      {/* Monthly table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">📅 ตารางสรุปรายเดือน — ปี {selectedYear + 543}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['เดือน', 'ไข่ดีรวม', 'ขายรวม', 'รายได้', 'ค่าอาหาร', 'ค่าน้ำ/ไฟ/ยา', 'ลงทุน', 'รายจ่ายรวม', 'กำไร', 'อัตราเฉลี่ย%'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMonthly.map(m => (
                <tr key={`${m.year}-${m.month}`} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-700">{m.label}</td>
                  <td className="px-4 py-3 text-emerald-700">{m.totalEggs.toLocaleString()}</td>
                  <td className="px-4 py-3 text-blue-700">{m.totalSold.toLocaleString()}</td>
                  <td className="px-4 py-3 text-emerald-600">฿{formatCurrency(m.totalRevenue)}</td>
                  <td className="px-4 py-3 text-gray-600">฿{formatCurrency(m.totalFeedCost)}</td>
                  <td className="px-4 py-3 text-gray-600">฿{formatCurrency(m.totalUtilities)}</td>
                  <td className="px-4 py-3 text-gray-600">฿{formatCurrency(m.totalInvestment)}</td>
                  <td className="px-4 py-3 text-red-600">฿{formatCurrency(m.totalExpenses)}</td>
                  <td className={`px-4 py-3 font-semibold ${m.totalProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    ฿{formatCurrency(m.totalProfit)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${
                      m.avgProductionRate >= 80 ? 'text-emerald-600' :
                      m.avgProductionRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>{m.avgProductionRate.toFixed(1)}%</span>
                  </td>
                </tr>
              ))}
              {filteredMonthly.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                    <div className="text-2xl mb-2">📋</div>
                    ไม่มีข้อมูลสำหรับปีนี้
                  </td>
                </tr>
              )}
              {/* Total row */}
              {filteredMonthly.length > 0 && (
                <tr className="bg-gray-900 text-white">
                  <td className="px-4 py-3 font-bold">รวมทั้งปี</td>
                  <td className="px-4 py-3 font-semibold">{yearlyStats.totalEggs.toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold">{filteredMonthly.reduce((s, m) => s + m.totalSold, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-400">฿{formatCurrency(yearlyStats.totalRevenue)}</td>
                  <td className="px-4 py-3 font-semibold">฿{formatCurrency(filteredMonthly.reduce((s, m) => s + m.totalFeedCost, 0))}</td>
                  <td className="px-4 py-3 font-semibold">฿{formatCurrency(filteredMonthly.reduce((s, m) => s + m.totalUtilities, 0))}</td>
                  <td className="px-4 py-3 font-semibold">฿{formatCurrency(filteredMonthly.reduce((s, m) => s + m.totalInvestment, 0))}</td>
                  <td className="px-4 py-3 font-semibold text-red-400">฿{formatCurrency(yearlyStats.totalExpenses)}</td>
                  <td className={`px-4 py-3 font-bold text-lg ${yearlyStats.totalProfit >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                    ฿{formatCurrency(yearlyStats.totalProfit)}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {(filteredMonthly.reduce((s, m) => s + m.avgProductionRate, 0) / (filteredMonthly.length || 1)).toFixed(1)}%
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

function EmptyChart() {
  return (
    <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
      <div className="text-center">
        <div className="text-2xl mb-2">📊</div>
        ยังไม่มีข้อมูล
      </div>
    </div>
  )
}
