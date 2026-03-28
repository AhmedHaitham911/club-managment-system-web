import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Flame, MapPin, Users, Ticket, Megaphone, Pin } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [eventsRes, announcementsRes] = await Promise.all([
          axios.get("http://localhost:5000/events"),
          axios.get("http://localhost:5000/announcements"),
        ]);

        setEvents(eventsRes.data);
        setAnnouncements(announcementsRes.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-slate-950">
        <Flame size={48} className="text-orange-500 animate-bounce mb-4" />
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 animate-pulse">
          Loading your campus vibe...
        </h2>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 rounded-3xl p-8 text-white shadow-xl shadow-violet-200 dark:shadow-none flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2">
            {user ? `What's up, ${user.name}! 👋` : "Welcome to CampusClub! 👋"}
          </h2>
          <p className="text-white/80 font-medium">
            {user
              ? "Ready for upcoming events this week? Let's make it count!"
              : "Join the squad to RSVP and attend the best events on campus."}
          </p>
        </div>
        <button
          onClick={() => navigate("/events")}
          className="relative z-10 mt-6 md:mt-0 bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
        >
          Explore Events
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Events Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            {/* ضفنا dark:text-white */}
            <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Flame className="text-orange-500" size={24} /> Trending Events
            </h3>
            <button
              onClick={() => navigate("/events")}
              className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:text-fuchsia-500 transition-colors"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.slice(0, 4).map((event) => (
              /* تعديل ألوان كارت الإيفنت dark:bg-slate-900 dark:border-slate-800 */
              <div
                key={event.id}
                className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:shadow-violet-100 dark:hover:shadow-slate-800 hover:-translate-y-1 transition-all duration-300 group flex flex-col"
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* تعديل لون التاريخ dark:bg-slate-800 dark:text-white */}
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black text-gray-900 dark:text-white shadow-sm">
                    {new Date(event.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  {event.status === "Full" && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      Fully Booked
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  {/* تعديل لون العنوان dark:text-white */}
                  <h4 className="text-lg font-black text-gray-900 dark:text-white mb-2 line-clamp-1">
                    {event.title}
                  </h4>
                  {/* تعديل لون الوصف dark:text-gray-400 */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4 line-clamp-2 flex-1">
                    {event.description}
                  </p>

                  {/* تعديل لون الأيقونات والنصوص dark:text-gray-300 */}
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-600 dark:text-gray-300 mb-5">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-violet-500" />{" "}
                      {event.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} className="text-orange-500" />{" "}
                      {event.registeredCount}/{event.capacity}
                    </span>
                  </div>

                  {/* تعديل لون زرار الحجز dark:bg-slate-800 dark:text-gray-500 */}
                  <button
                    onClick={() => navigate("/events")}
                    disabled={event.status === "Full"}
                    className={`w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all mt-auto ${
                      event.status === "Full"
                        ? "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        : "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 hover:bg-violet-600 dark:hover:bg-violet-600 hover:text-white dark:hover:text-white"
                    }`}
                  >
                    <Ticket size={16} />
                    {event.status === "Full" ? "Sold Out" : "Get Tickets"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            {/* ضفنا dark:text-white */}
            <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Megaphone className="text-fuchsia-500" size={24} /> Announcements
            </h3>
            {user && (
              <button
                onClick={() => navigate("/announcements")}
                className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:text-fuchsia-500 transition-colors"
              >
                See All
              </button>
            )}
          </div>

          <div className="space-y-4">
            {announcements.slice(0, 3).map((announcement) => (
              /* تعديل ألوان كروت الإعلانات dark:bg-slate-900 dark:border-slate-800 وطبعا المثبت لونه مختلف */
              <div
                key={announcement.id}
                className={`p-5 rounded-2xl border ${
                  announcement.isPinned
                    ? "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-900"
                    : "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 shadow-sm"
                } transition-all hover:shadow-md dark:hover:shadow-slate-800`}
              >
                <div className="flex items-start gap-3">
                  {announcement.isPinned ? (
                    <Pin
                      size={18}
                      className="text-orange-500 mt-1 flex-shrink-0"
                      fill="currentColor"
                    />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-violet-500 mt-2 flex-shrink-0"></div>
                  )}
                  <div>
                    {/* تعديل لون العنوان dark:text-white */}
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                      {announcement.title}
                    </h4>
                    {/* تعديل لون المحتوى dark:text-gray-300 */}
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed mb-3 line-clamp-3">
                      {announcement.content}
                    </p>
                    {/* تعديل لون التاريخ dark:text-gray-500 */}
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                      {new Date(announcement.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
                No recent announcements.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
