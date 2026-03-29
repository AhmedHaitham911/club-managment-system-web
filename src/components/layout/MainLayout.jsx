import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function MainLayout() {
  return (
    // ضفنا dark:bg-slate-950 و transition-colors هنا
    <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 font-sans overflow-hidden transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <Navbar />
        {/* الـ Outlet هو المكان اللي هتترمي فيه محتويات الـ Home أو الـ Events حسب اللينك */}
        <Outlet />
      </main>
    </div>
  );
}