import { useState, useEffect, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Megaphone, Calendar, Moon, Sun } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { ThemeContext } from "../../context/ThemeContext";
import { api, unwrapData } from "../../lib/api";

export default function Navbar() {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setNotifications([]);
        return;
      }

      try {
        const [annRes, eventsRes] = await Promise.all([
          api.get("/announcements?limit=3"),
          api.get("/events?limit=3"),
        ]);

        const ann = (unwrapData(annRes) || []).map((a) => ({
          id: `ann-${a._id}`,
          title: "Announcement",
          message: a.title,
          type: "announcement",
          date: a.createdAt || a.updatedAt,
        }));

        const ev = (unwrapData(eventsRes) || []).map((e) => ({
          id: `evt-${e._id}`,
          title: "Event",
          message: e.title,
          type: "event",
          date: e.date,
        }));

        setNotifications([...ann, ...ev].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6));
      } catch {
        setNotifications([]);
      }
    };

    fetchNotifications();
  }, [user]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleNotificationClick = (notif) => {
    setOpen(false);
    navigate(notif.type === "announcement" ? "/announcements" : "/events");
  };

  const avatar =
    user?.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || "guest"}&backgroundColor=b6e3f4`;

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 h-20 flex items-center justify-between px-8 sticky top-0 z-30">
      <h2 className="text-xl font-black text-gray-800 dark:text-white hidden sm:block">
        {user ? `Hello, ${user.name.split(" ")[0]}` : "Campus Club"}
      </h2>

      <div className="flex items-center gap-4 relative" ref={dropdownRef}>
        <button onClick={toggleTheme} className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-xl text-gray-500 dark:text-gray-300">
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <button onClick={() => setOpen((v) => !v)} className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-xl text-gray-500 dark:text-gray-300 relative">
          <Bell size={20} />
          {!!notifications.length && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />}
        </button>

        {open && (
          <div className="absolute top-14 right-0 w-80 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xl overflow-hidden">
            <div className="px-4 py-3 font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700">Notifications</div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <button key={n.id} onClick={() => handleNotificationClick(n)} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700">
                  <div className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1">
                    {n.type === "announcement" ? <Megaphone size={12} /> : <Calendar size={12} />}
                    {n.title}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-200">{n.message}</div>
                </button>
              ))}
              {!notifications.length && <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">No notifications.</div>}
            </div>
          </div>
        )}

        {user && (
          <Link to="/profile" className="w-10 h-10 rounded-full overflow-hidden border-2 border-violet-100 dark:border-violet-900 bg-white">
            <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
          </Link>
        )}
      </div>
    </header>
  );
}
