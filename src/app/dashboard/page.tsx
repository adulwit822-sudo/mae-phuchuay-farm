'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { FarmRecord, formatCurrency, THAI_MONTHS } from '@/lib/types'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts'
import { TrendingUp, TrendingDown, Egg, DollarSign, Package, Activity } from 'lucide-react'

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b']

interface DashboardStats {
  todayEggs: number
  todayRevenue: number
  todayProfit: number
  todayProductionRate: number
  monthEggs: number
  monthRevenue: number
  monthProfit: number
  feedRemaining: number
  totalRevenue: number
  totalExpenses: number
  totalProfit: number
}

export default function DashboardPage() {
  const [records, setRecords] = useState<FarmRecord[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [selectedMonth, selectedYear])

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('farm_records')
      .select('*')
      .order('date', { ascending: false })

    if (error) { console.error(error); setLoading(false); return }

    const allRecords = data as FarmRecord[]
    setRecords(allRecords)

    // คำนวณ stats
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = allRecords.filter(r => r.date === today && r.record_type === 'ผลผลิตประจำวัน')
    const monthRecords = allRecords.filter(r => {
      const d = new Date(r.date)
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear
    })
    const productionRecords = monthRecords.filter(r => r.record_type === 'ผลผลิตประจำวัน')

    const latestRecord = allRecords.find(r => r.record_type === 'ผลผลิตประจำวัน')

    setStats({
      todayEggs: todayRecords.reduce((s, r) => s + r.good_eggs, 0),
      todayRevenue: todayRecords.reduce((s, r) => s + r.revenue, 0),
      todayProfit: todayRecords.reduce((s, r) => s + r.profit, 0),
      todayProductionRate: latestRecord?.production_rate || 0,
      monthEggs: productionRecords.reduce((s, r) => s + r.good_eggs, 0),
      monthRevenue: monthRecords.reduce((s, r) => s + r.revenue, 0),
      monthProfit: monthRecords.reduce((s, r) => s + r.profit, 0),
      feedRemaining: latestRecord?.feed_remaining || 0,
      totalRevenue: allRecords.reduce((s, r) => s + r.revenue, 0),
      totalExpenses: allRecords.reduce((s, r) => s + r.total_expenses, 0),
      totalProfit: allRecords.reduce((s, r) => s + r.profit, 0),
    })

    // กราฟผลผลิตรายวัน (30 วันล่าสุด)
    const last30 = allRecords
      .filter(r => r.record_type === 'ผลผลิตประจำวัน')
      .slice(0, 30)
      .reverse()
      .map(r => ({
        date: new Date(r.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }),
        ไข่ดี: r.good_eggs,
        ขาย: r.eggs_sold,
        อัตราออกไข่: r.production_rate,
        รายได้: r.revenue,
      }))
    setChartData(last30)

    // กราฟสรุปรายเดือน
    const monthlyMap: Record<string, any> = {}
    allRecords.forEach(r => {
      const d = new Date(r.date)
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          name: `${THAI_MONTHS[d.getMonth() + 1]} ${d.getFullYear() + 543}`,
          sort: d.getFullYear() * 100 + d.getMonth() + 1,
          ไข่รวม: 0, รายได้: 0, รายจ่าย: 0, กำไร: 0,
        }
      }
      monthlyMap[key].ไข่รวม += r.good_eggs
      monthlyMap[key].รายได้ += r.revenue
      monthlyMap[key].รายจ่าย += r.total_expenses
      monthlyMap[key].กำไร += r.profit
    })
    setMonthlyData(Object.values(monthlyMap).sort((a, b) => a.sort - b.sort))

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">🥚</div>
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  const latestRecord = records.find(r => r.record_type === 'ผลผลิตประจำวัน')
  const eggBreakdown = latestRecord ? [
    { name: 'ไข่ดี', value: latestRecord.good_eggs, color: '#22c55e' },
    { name: 'ไข่แตก', value: latestRecord.broken_eggs, color: '#ef4444' },
  ].filter(i => i.value > 0) : []

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">🏠 แดชบอร์ด</h1>
          <p className="text-gray-500 text-sm mt-1">
            ภาพรวมฟาร์มแม่ผู้ช่วย · อัพเดตล่าสุด{' '}
            {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(+e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {THAI_MONTHS.slice(1).map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(+e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {[2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y + 543}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="ไข่วันนี้"
          value={`${stats?.todayEggs || 0} ฟอง`}
          subtitle={`อัตราออกไข่ ${stats?.todayProductionRate || latestRecord?.production_rate || 0}%`}
          icon="🥚"
          color="from-emerald-500 to-green-600"
          trend={null}
        />
        <StatCard
          title={`ไข่เดือน${THAI_MONTHS[selectedMonth]}`}
          value={`${stats?.monthEggs.toLocaleString() || 0} ฟอง`}
          subtitle={`รายได้ ฿${formatCurrency(stats?.monthRevenue || 0)}`}
          icon="📦"
          color="from-blue-500 to-blue-700"
          trend={null}
        />
        <StatCard
          title="รายได้เดือนนี้"
          value={`฿${formatCurrency(stats?.monthRevenue || 0)}`}
          subtitle={`กำไร ฿${formatCurrency(stats?.monthProfit || 0)}`}
          icon="💰"
          color="from-amber-500 to-yellow-600"
          trend={stats?.monthProfit && stats.monthProfit > 0 ? 'up' : 'down'}
        />
        <StatCard
          title="อาหารคงเหลือ"
          value={`${formatCurrency(stats?.feedRemaining || 0)} กก.`}
          subtitle="สต็อกอาหารไก่"
          icon="🌾"
          color="from-purple-500 to-purple-700"
          trend={null}
        />
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'รายได้รวม', value: stats?.totalRevenue || 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'รายจ่ายรวม', value: stats?.totalExpenses || 0, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'กำไรรวม', value: stats?.totalProfit || 0, color: (stats?.totalProfit || 0) >= 0 ? 'text-blue-700' : 'text-red-700', bg: 'bg-blue-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 text-center`}>
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className={`text-xl font-bold ${color}`}>฿{formatCurrency(value)}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Production line chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-blue-500" />
            ผลผลิตไข่ 30 วันล่าสุด
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="ไข่ดี" stroke="#22c55e" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="ขาย" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-sm">ยังไม่มีข้อมูล กรุณาบันทึกข้อมูลก่อน</p>
              </div>
            </div>
          )}
        </div>

        {/* Pie + latest stats */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Egg size={18} className="text-emerald-500" />
            สัดส่วนไข่ล่าสุด
          </h2>
          {eggBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={eggBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="value" paddingAngle={3}>
                    {eggBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {eggBreakdown.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-semibold">{item.value} ฟอง</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              ยังไม่มีข้อมูล
            </div>
          )}

          {latestRecord && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <InfoRow label="อัตราออกไข่" value={`${latestRecord.production_rate}%`} />
              <InfoRow label="จำนวนแม่ไก่" value={`${latestRecord.num_hens} ตัว`} />
              <InfoRow label="วันที่ล่าสุด" value={new Date(latestRecord.date).toLocaleDateString('th-TH')} />
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* อัตราการออกไข่ */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">📈 อัตราออกไข่ (%)</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`, 'อัตราออกไข่']} />
                <Line type="monotone" dataKey="อัตราออกไข่" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">ยังไม่มีข้อมูล</div>
          )}
        </div>

        {/* รายได้รายเดือน */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">💰 รายได้-รายจ่ายรายเดือน</h2>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Bar dataKey="รายได้" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="รายจ่าย" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">ยังไม่มีข้อมูล</div>
          )}
        </div>
      </div>

      {/* Recent records */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">🗒️ รายการล่าสุด</h2>
          <a href="/records" className="text-sm text-blue-600 hover:underline">ดูทั้งหมด →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['วันที่', 'ประเภท', 'โรงเรือน', 'ไข่ดี', 'ขาย', 'รายได้', 'กำไร', 'อัตรา%'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.slice(0, 10).map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600">{new Date(r.date).toLocaleDateString('th-TH')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.record_type === 'ผลผลิตประจำวัน'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {r.record_type === 'ผลผลิตประจำวัน' ? 'ผลผลิต' : 'ลงทุน'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.coop}</td>
                  <td className="px-4 py-3 font-medium text-emerald-700">{r.good_eggs}</td>
                  <td className="px-4 py-3 text-blue-700">{r.eggs_sold}</td>
                  <td className="px-4 py-3 text-gray-800">฿{formatCurrency(r.revenue)}</td>
                  <td className={`px-4 py-3 font-medium ${r.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ฿{formatCurrency(r.profit)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${
                      r.production_rate >= 80 ? 'text-emerald-600' :
                      r.production_rate >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {r.production_rate}%
                    </span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <div className="text-2xl mb-2">📋</div>
                    ยังไม่มีข้อมูล กรุณาบันทึกข้อมูลก่อน
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

function StatCard({ title, value, subtitle, icon, color, trend }: {
  title: string, value: string, subtitle: string, icon: string,
  color: string, trend: 'up' | 'down' | null
}) {
  return (
    <div className="card-hover bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-xl shadow-sm`}>
          {icon}
        </div>
        {trend === 'up' && <TrendingUp size={16} className="text-emerald-500" />}
        {trend === 'down' && <TrendingDown size={16} className="text-red-500" />}
      </div>
      <div className="text-xl font-bold text-gray-800 mb-0.5">{value}</div>
      <div className="text-xs text-gray-400">{title}</div>
      <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}
