import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden text-gray-800 dark:text-slate-150 transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
