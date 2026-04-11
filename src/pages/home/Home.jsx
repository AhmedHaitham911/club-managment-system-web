import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, MapPin, Users, Megaphone } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { api, getErrorMessage, unwrapData } from "../../lib/api";

export default function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, announcementsRes] = await Promise.all([
          api.get("/events?limit=6"),
          api.get("/announcements?limit=5"),
        ]);

        setEvents(unwrapData(eventsRes) || []);
        setAnnouncements(unwrapData(announcementsRes) || []);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load dashboard."));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-slate-950">
        <Flame size={48} className="text-orange-500 animate-bounce mb-4" />
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">Loading...</h2>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 rounded-3xl p-8 text-white">
        <h2 className="text-3xl font-black mb-2">
          {user ? `Welcome, ${user.name}` : "Welcome to CampusClub"}
        </h2>
        <p className="text-white/85">
          Browse events and latest announcements.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Upcoming Events</h3>
            <button onClick={() => navigate("/events")} className="text-violet-600 font-bold">View All</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <div key={event._id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5">
                <h4 className="text-lg font-black text-gray-900 dark:text-white">{event.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{event.description}</p>
                <div className="text-xs font-bold text-gray-600 dark:text-gray-300 flex flex-wrap gap-3">
                  <span className="flex items-center gap-1"><MapPin size={13} /> {event.location}</span>
                  <span className="flex items-center gap-1"><Users size={13} /> {event.attendeeCount}/{event.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone size={20} className="text-fuchsia-500" /> Announcements
          </h3>

          {announcements.map((item) => (
            <div key={item._id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4">
              <h4 className="font-bold text-gray-900 dark:text-white">{item.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
