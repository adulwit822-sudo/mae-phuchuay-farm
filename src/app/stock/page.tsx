'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { FarmRecord, formatCurrency } from '@/lib/types'
import { Package, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'

export default function StockPage() {
  const [records, setRecords] = useState<FarmRecord[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data } = await supabase
      .from('farm_records')
      .select('*')
      .eq('record_type', 'ผลผลิตประจำวัน')
      .order('date', { ascending: false })

    if (data) setRecords(data as FarmRecord[])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce">📦</div>
      </div>
    )
  }

  const latest = records[0]
  const feedRemaining = latest?.feed_remaining || 0
  const currentHens = latest?.num_hens || 0
  const daysOfFeedLeft = feedRemaining > 0 && latest?.feed_used > 0
    ? Math.floor(feedRemaining / latest.feed_used)
    : 0

  // ไข่สะสม (ผลิตรวม - ขายรวม)
  const totalProduced = records.reduce((s, r) => s + r.good_eggs, 0)
  const totalSold = records.reduce((s, r) => s + r.eggs_sold, 0)
  const eggStock = totalProduced - totalSold

  // กราฟอาหารคงเหลือ
  const feedChart = records.slice(0, 30).reverse().map(r => ({
    date: new Date(r.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }),
    อาหารคงเหลือ: r.feed_remaining,
    อาหารที่ใช้: r.feed_used,
  }))

  // กราฟไข่ (ผลิต vs ขาย)
  const eggChart = records.slice(0, 30).reverse().map(r => ({
    date: new Date(r.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }),
    ผลิต: r.good_eggs,
    ขาย: r.eggs_sold,
    คงเหลือ: r.good_eggs - r.eggs_sold,
  }))

  // สถานะอาหาร
  const feedStatus = daysOfFeedLeft > 7 ? 'good' : daysOfFeedLeft > 3 ? 'warning' : 'danger'

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">📦 สต็อก / การขาย</h1>
        <p className="text-gray-500 text-sm mt-1">ติดตามสต็อกไข่และอาหารไก่</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl">🥚</div>
            <div className="text-xs text-gray-500">ไข่คงเหลือ (ประมาณ)</div>
          </div>
          <div className="text-2xl font-bold text-amber-700">{eggStock.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">ฟอง</div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl">🐓</div>
            <div className="text-xs text-gray-500">แม่ไก่ปัจจุบัน</div>
          </div>
          <div className="text-2xl font-bold text-emerald-700">{currentHens.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">ตัว</div>
        </div>

        <div className={`bg-white rounded-2xl p-4 shadow-sm border card-hover ${
          feedStatus === 'good' ? 'border-gray-100' :
          feedStatus === 'warning' ? 'border-yellow-300' : 'border-red-300'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl">🌾</div>
              <div className="text-xs text-gray-500">อาหารคงเหลือ</div>
            </div>
            {feedStatus === 'good' && <CheckCircle size={16} className="text-emerald-500" />}
            {feedStatus === 'warning' && <AlertTriangle size={16} className="text-yellow-500" />}
            {feedStatus === 'danger' && <AlertTriangle size={16} className="text-red-500" />}
          </div>
          <div className="text-2xl font-bold text-green-700">{feedRemaining}</div>
          <div className="text-xs text-gray-400 mt-1">กก.</div>
          {daysOfFeedLeft > 0 && (
            <div className={`text-xs mt-2 font-medium ${
              feedStatus === 'good' ? 'text-emerald-600' :
              feedStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              เหลือประมาณ {daysOfFeedLeft} วัน
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">📈</div>
            <div className="text-xs text-gray-500">อัตราออกไข่ล่าสุด</div>
          </div>
          <div className="text-2xl font-bold text-blue-700">{latest?.production_rate || 0}%</div>
          <div className="text-xs text-gray-400 mt-1">
            {latest ? new Date(latest.date).toLocaleDateString('th-TH') : '-'}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'ผลิตรวมทั้งหมด', value: totalProduced, unit: 'ฟอง', color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'ขายรวมทั้งหมด', value: totalSold, unit: 'ฟอง', color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'รายได้รวมทั้งหมด', value: records.reduce((s, r) => s + r.revenue, 0), unit: 'บาท', color: 'text-amber-700', bg: 'bg-amber-50', isCurrency: true },
        ].map(item => (
          <div key={item.label} className={`${item.bg} rounded-2xl p-4 text-center`}>
            <div className="text-xs text-gray-500 mb-1">{item.label}</div>
            <div className={`text-xl font-bold ${item.color}`}>
              {item.isCurrency ? `฿${formatCurrency(item.value)}` : item.value.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">{item.unit}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Feed remaining chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">🌾 สต็อกอาหารไก่ (30 วันล่าสุด)</h2>
          {feedChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={feedChart}>
                <defs>
                  <linearGradient id="feedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip />
                <Area type="monotone" dataKey="อาหารคงเหลือ" stroke="#22c55e" fill="url(#feedGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">ยังไม่มีข้อมูล</div>
          )}
        </div>

        {/* Egg production vs sold */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">🥚 ผลผลิต vs ขาย (30 วันล่าสุด)</h2>
          {eggChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={eggChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ผลิต" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="ขาย" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">ยังไม่มีข้อมูล</div>
          )}
        </div>
      </div>

      {/* Alert */}
      {feedStatus !== 'good' && (
        <div className={`mt-6 p-4 rounded-2xl flex items-start gap-3 ${
          feedStatus === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'
        }`}>
          <AlertTriangle size={20} className={feedStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'} />
          <div>
            <div className={`font-semibold ${feedStatus === 'warning' ? 'text-yellow-800' : 'text-red-800'}`}>
              {feedStatus === 'warning' ? '⚠️ อาหารเหลือน้อย!' : '🚨 อาหารใกล้หมด!'}
            </div>
            <div className={`text-sm mt-1 ${feedStatus === 'warning' ? 'text-yellow-700' : 'text-red-700'}`}>
              เหลืออาหาร {feedRemaining} กก. ประมาณ {daysOfFeedLeft} วัน — กรุณาสั่งซื้ออาหารเพิ่ม
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
