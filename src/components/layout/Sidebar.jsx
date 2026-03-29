import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import {
  Home as HomeIcon,
  Calendar,
  Users,
  Image as ImageIcon,
  Megaphone,
  LogOut,
  Flame,
  LogIn,
  ShieldAlert // 🚀 دي اللي كانت ناقصة وعملت المشكلة
} from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    // ضفنا dark:bg-slate-900 و dark:border-slate-800
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 hidden md:flex flex-col justify-between p-6 shadow-sm z-20 relative transition-colors duration-300">
      <div>
        <Link
          to="/"
          className="flex items-center gap-2 mb-10 hover:opacity-80 transition-opacity cursor-pointer block w-fit"
        >
          <div className="bg-gradient-to-br from-violet-600 to-fuchsia-500 p-2 rounded-xl text-white shadow-lg shadow-fuchsia-200 dark:shadow-none">
            <Flame size={24} fill="currentColor" />
          </div>
          {/* ضفنا dark:text-white */}
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            CampusClub.
          </h1>
        </Link>

        <nav className="space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-slate-800 hover:text-violet-700 dark:hover:text-violet-400 rounded-xl font-bold transition-colors"
          >
            <HomeIcon size={20} /> Dashboard
          </Link>
          <Link
            to="/events"
            className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white rounded-xl font-medium transition-colors"
          >
            <Calendar size={20} /> Events
          </Link>
          <Link
            to="/members"
            className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white rounded-xl font-medium transition-colors"
          >
            <Users size={20} /> Members
          </Link>
          <Link
            to="/announcements"
            className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white rounded-xl font-medium transition-colors"
          >
            <Megaphone size={20} /> Announcements
          </Link>
          <Link
            to="/gallery"
            className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white rounded-xl font-medium transition-colors"
          >
            <ImageIcon size={20} /> Gallery
          </Link>
          {/* ضيف الجزء ده تحت لينك الـ Gallery */}
          {user?.role === "Officer" && (
            <Link
              to="/admin-chat"
              className="flex items-center gap-3 px-4 py-3 mt-4 text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-xl font-bold transition-colors"
            >
              <ShieldAlert size={20} /> Admin Chat
            </Link>
          )}
        </nav>
      </div>

      <div className="border-t border-gray-100 dark:border-slate-800 pt-6">
        {user ? (
          <>
            <Link 
              to="/profile" 
              className="flex items-center gap-3 mb-6 p-2 -mx-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 p-0.5 shrink-0">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden">
                  <img 
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}&backgroundColor=b6e3f4`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}&backgroundColor=b6e3f4`)}
                  />
                </div>
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{user.role}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 text-red-500 hover:text-red-600 dark:hover:text-red-400 font-bold text-sm transition-colors w-full px-2"
            >
              <LogOut size={18} /> Sign Out
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/50 font-bold py-3 rounded-xl transition-colors w-full"
          >
            <LogIn size={18} /> Sign In
          </Link>
        )}
      </div>
    </aside>
  );
}