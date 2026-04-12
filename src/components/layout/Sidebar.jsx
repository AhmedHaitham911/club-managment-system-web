import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/auth-context";
import {
  Home as HomeIcon,
  Calendar,
  Users,
  Image as ImageIcon,
  Megaphone,
  LogOut,
  Flame,
  LogIn,
  ShieldAlert,
} from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const isOfficer = user?.role === "Officer";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const avatar =
    user?.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || "guest"}&backgroundColor=b6e3f4`;

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 hidden md:flex flex-col justify-between p-6 shadow-sm z-20">
      <div>
        <Link to="/" className="flex items-center gap-2 mb-10 w-fit">
          <div className="bg-gradient-to-br from-violet-600 to-fuchsia-500 p-2 rounded-xl text-white">
            <Flame size={24} fill="currentColor" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">CampusClub.</h1>
        </Link>

        <nav className="space-y-2">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-slate-800 rounded-xl font-bold">
            <HomeIcon size={20} /> Dashboard
          </Link>
          <Link to="/events" className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl font-medium">
            <Calendar size={20} /> Events
          </Link>
          {isOfficer && (
            <Link to="/members" className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl font-medium">
              <Users size={20} /> Members
            </Link>
          )}
          <Link to="/announcements" className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl font-medium">
            <Megaphone size={20} /> Announcements
          </Link>
          <Link to="/gallery" className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl font-medium">
            <ImageIcon size={20} /> Gallery
          </Link>
          {isOfficer && (
            <Link to="/admin-chat" className="flex items-center gap-3 px-4 py-3 mt-4 text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-950/30 rounded-xl font-bold">
              <ShieldAlert size={20} /> Admin Chat
            </Link>
          )}
        </nav>
      </div>

      <div className="border-t border-gray-100 dark:border-slate-800 pt-6">
        {user ? (
          <>
            <Link to="/profile" className="flex items-center gap-3 mb-6 p-2 -mx-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 p-0.5">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full overflow-hidden">
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{user.role}</p>
              </div>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-3 text-red-500 hover:text-red-600 font-bold text-sm w-full px-2">
              <LogOut size={18} /> Sign Out
            </button>
          </>
        ) : (
          <Link to="/login" className="flex items-center justify-center gap-2 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 font-bold py-3 rounded-xl w-full">
            <LogIn size={18} /> Sign In
          </Link>
        )}
      </div>
    </aside>
  );
}
