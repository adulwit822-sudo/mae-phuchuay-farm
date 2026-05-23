'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setError('ลงทะเบียนสำเร็จ! กรุณาตรวจสอบ email เพื่อยืนยันตัวตน')
        setMode('login')
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #07122d 0%, #0d2460 50%, #1458dc 100%)' }}>

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #c9a227, transparent)' }} />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #c9a227, transparent)' }} />
        {[...Array(6)].map((_, i) => (
          <div key={i}
            className="absolute rounded-full opacity-5"
            style={{
              width: `${(i + 1) * 80}px`,
              height: `${(i + 1) * 80}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              background: '#c9a227',
            }} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-36 h-36 flex items-center justify-center mb-3 drop-shadow-2xl">
              <img
                src="/logo.png"
                alt="แม่ผู้ช่วยฟาร์ม"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const t = e.currentTarget
                  t.style.display = 'none'
                  t.nextElementSibling?.removeAttribute('style')
                }}
              />
              <div className="text-6xl hidden">🥚</div>
            </div>
            <h1 className="font-prompt text-3xl text-white tracking-wide drop-shadow">แม่ผู้ช่วยฟาร์ม</h1>
            <p className="text-yellow-300 text-sm mt-1 tracking-widest uppercase font-medium">Mae Phuchuay Farm</p>
            <p className="text-white/60 text-xs mt-1">ไข่สดใหม่ทุกวัน จากฟาร์ม!</p>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-white/10 rounded-xl p-1 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m ? 'bg-yellow-400 text-navy-900' : 'text-white/70 hover:text-white'
                }`}>
                {m === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm mb-1.5">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 transition"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-1.5">รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 transition"
              />
            </div>

            {error && (
              <div className={`p-3 rounded-xl text-sm ${
                error.includes('สำเร็จ')
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-navy-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #c9a227)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  กำลังดำเนินการ...
                </span>
              ) : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </form>

          <p className="text-center text-white/40 text-xs mt-6">
            © 2025 Mae Phuchuay Farm · ไข่สดใหม่ทุกวัน จากฟาร์ม!
          </p>
        </div>
      </div>
    </div>
  )
}
