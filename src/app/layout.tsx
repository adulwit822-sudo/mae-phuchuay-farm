import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'แม่ผู้ช่วยฟาร์ม | Mae Phuchuay Farm',
  description: 'ระบบจัดการฟาร์มไข่ไก่ - Mae Phuchuay Farm',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
