import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-background text-on-surface overflow-hidden relative transition-colors duration-200">
      {/* Background Subtle Glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] -z-10 pointer-events-none"></div>
      <div className="fixed bottom-0 left-64 w-[600px] h-[600px] bg-secondary/5 blur-[180px] -z-10 pointer-events-none"></div>

      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden z-10">
        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-6 bg-transparent">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
