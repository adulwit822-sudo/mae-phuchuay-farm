'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  LayoutDashboard, ClipboardList, Package, BarChart2,
  PlusCircle, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/records', label: 'บันทึกข้อมูล', icon: ClipboardList },
  { href: '/records/new', label: 'บันทึกใหม่', icon: PlusCircle },
  { href: '/stock', label: 'สต็อก / ขาย', icon: Package },
  { href: '/reports', label: 'รายงาน', icon: BarChart2 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-xl">
            🥚
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">แม่ผู้ช่วยฟาร์ม</div>
            <div className="text-yellow-300/70 text-xs">Mae Phuchuay Farm</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href) && href !== '/records/new')
          return (
            <Link key={href} href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-yellow-400 text-navy-900 shadow-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}>
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all">
          <LogOut size={18} />
          ออกจากระบบ
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 min-h-screen"
        style={{ background: 'linear-gradient(180deg, #07122d 0%, #0d2460 100%)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 shadow-lg"
        style={{ background: '#07122d' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-lg">🥚</div>
          <span className="text-white font-bold text-sm">แม่ผู้ช่วยฟาร์ม</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white p-1">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 flex flex-col"
            style={{ background: 'linear-gradient(180deg, #07122d 0%, #0d2460 100%)' }}>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  )
}
