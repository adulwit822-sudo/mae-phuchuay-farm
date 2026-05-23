import Sidebar from '@/components/Sidebar'

export default function EditRecordLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-0 pt-16 lg:pt-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
