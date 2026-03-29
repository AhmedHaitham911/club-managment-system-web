import { useState, useEffect, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { ThemeContext } from "../../context/ThemeContext";
import {
  Bell,
  Megaphone,
  Calendar,
  CheckCircle2,
  Flame,
  Moon,
  Sun,
} from "lucide-react";

export default function Navbar() {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const dropdownRef = useRef(null);

  const getAvatar = (id, avatarUrl) =>
    avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}&backgroundColor=b6e3f4`;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        let notifs = [];

        // 1. الإعلانات
        const annRes = await axios.get("http://localhost:5000/announcements");
        const recentAnnouncements = annRes.data
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3)
          .map((a) => ({
            id: `ann_${a.id}`,
            type: "announcement",
            title: "New Announcement 📢",
            message: a.title,
            date: a.date,
            icon: <Megaphone size={16} className="text-fuchsia-500" />,
          }));
        notifs = [...notifs, ...recentAnnouncements];

        // 2. الأحداث
        if (user) {
          const rsvpsRes = await axios.get(
            `http://localhost:5000/rsvps?userId=${user.id}`,
          );
          const eventsRes = await axios.get("http://localhost:5000/events");

          const userEvents = rsvpsRes.data
            .map((rsvp) => {
              const event = eventsRes.data.find(
                (e) => String(e.id) === String(rsvp.eventId),
              );
              return event;
            })
            .filter(Boolean);

          const eventReminders = userEvents
            .filter((e) => e.status !== "Past")
            .slice(0, 2)
            .map((e) => ({
              id: `evt_${e.id}`,
              type: "event",
              title: "Upcoming Event 📅",
              message: `You're attending: ${e.title}`,
              date: e.date,
              icon: <Calendar size={16} className="text-violet-500" />,
            }));

          notifs = [...notifs, ...eventReminders];

          // 3. تنبيهات الإدارة
          if (user.role === "Officer") {
            const fullEvents = eventsRes.data
              .filter((e) => e.status === "Full")
              .slice(0, 2)
              .map((e) => ({
                id: `full_${e.id}`,
                type: "alert",
                title: "Event Sold Out! 🔥",
                message: `${e.title} has reached max capacity.`,
                date: new Date().toISOString(),
                icon: <Flame size={16} className="text-orange-500" />,
              }));
            notifs = [...notifs, ...fullEvents];
          }
        }

        // 🚀 فلترة الإشعارات اللي اتقرت قبل كده من الـ localStorage 🚀
        const dismissedNotifs = JSON.parse(
          localStorage.getItem("dismissedNotifs") || "[]",
        );
        notifs = notifs.filter((n) => !dismissedNotifs.includes(n.id));

        notifs.sort((a, b) => new Date(b.date) - new Date(a.date));
        setNotifications(notifs);

        if (notifs.length > 0) {
          const lastSeen = localStorage.getItem("lastSeenNotifications");
          if (!lastSeen || new Date(notifs[0].date) > new Date(lastSeen)) {
            setHasUnread(true);
          }
        }
      } catch (error) {
        console.error("Failed to load notifications", error);
      }
    };

    fetchNotifications();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (hasUnread) {
      setHasUnread(false);
      localStorage.setItem("lastSeenNotifications", new Date().toISOString());
    }
  };

  // 🚀 دالة هندلة الضغط على إشعار معين 🚀
  const handleNotificationClick = (notif) => {
    setIsDropdownOpen(false); // اقفل القايمة

    // 1. التوجيه للصفحة
    if (notif.type === "announcement") {
      navigate("/announcements");
    } else if (notif.type === "event" || notif.type === "alert") {
      navigate("/events");
    }

    // 2. شيل الإشعار من الـ UI حالاً
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));

    // 3. احفظ الـ ID بتاعه في الـ LocalStorage عشان ميظهرش تاني
    const dismissed = JSON.parse(
      localStorage.getItem("dismissedNotifs") || "[]",
    );
    if (!dismissed.includes(notif.id)) {
      dismissed.push(notif.id);
      localStorage.setItem("dismissedNotifs", JSON.stringify(dismissed));
    }
  };

  // 🚀 دالة زرار Mark all read 🚀
  const handleMarkAllRead = () => {
    const dismissed = JSON.parse(
      localStorage.getItem("dismissedNotifs") || "[]",
    );
    const allCurrentIds = notifications.map((n) => n.id);

    // نضيف كل اللي ظاهرين دلوقتي لقائمة المقروء
    const newDismissed = [...new Set([...dismissed, ...allCurrentIds])];
    localStorage.setItem("dismissedNotifs", JSON.stringify(newDismissed));

    setNotifications([]); // فضي القايمة
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 h-20 flex items-center justify-between px-8 z-30 sticky top-0 transition-colors">
      <div className="flex items-center gap-4">
        {user ? (
          <h2 className="text-xl font-black text-gray-800 dark:text-white hidden sm:block">
            Hello,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500">
              {user.name.split(" ")[0]}
            </span>
            !
          </h2>
        ) : (
          <h2 className="text-xl font-black text-gray-800 dark:text-white hidden sm:block">
            Welcome to CampusClub
          </h2>
        )}
      </div>

      <div className="flex items-center gap-4 relative" ref={dropdownRef}>
        <button
          onClick={toggleTheme}
          className="p-2.5 text-gray-400 hover:text-violet-600 bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all"
        >
          {theme === "light" ? <Moon size={22} /> : <Sun size={22} />}
        </button>

        <button
          onClick={handleOpenDropdown}
          className="relative p-2.5 text-gray-400 hover:text-violet-600 bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all"
        >
          <Bell size={22} />
          {hasUnread && (
            <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></span>
          )}
        </button>

        {isDropdownOpen && (
          <div className="absolute top-14 right-0 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-in slide-in-from-top-4 duration-200 z-50">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
              <h3 className="font-black text-gray-900 dark:text-white">
                Notifications
              </h3>
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-fuchsia-500 transition-colors flex items-center gap-1"
                >
                  <CheckCircle2 size={14} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)} // 🚀 الدالة مربوطة هنا 🚀
                    className="px-6 py-4 border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50/80 dark:hover:bg-slate-700/50 transition-colors cursor-pointer flex items-start gap-4"
                  >
                    <div className="mt-1 w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-center flex-shrink-0">
                      {notif.icon}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 dark:text-white mb-0.5">
                        {notif.title}
                      </p>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs font-bold text-gray-400 mt-2">
                        {new Date(notif.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center flex flex-col items-center">
                  <Bell
                    size={40}
                    className="text-gray-200 dark:text-slate-600 mb-3"
                  />
                  <p className="text-gray-500 dark:text-gray-400 font-bold">
                    You're all caught up!
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                    No new notifications at the moment.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {user && (
          <Link
            to="/profile"
            className="w-10 h-10 rounded-full border-2 border-violet-100 dark:border-violet-900 overflow-hidden hover:scale-105 transition-transform ml-2 shrink-0 bg-white"
          >
            <img
              src={getAvatar(user.id, user.avatar)}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => (e.target.src = getAvatar(user.id, ""))}
            />
          </Link>
        )}
      </div>
    </header>
  );
}
