import { useEffect, useMemo, useState, useContext } from "react";
import toast from "react-hot-toast";
import { Calendar, MapPin, Users, Plus, Trash2, Edit3, Ticket } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { api, getErrorMessage, unwrapData } from "../../lib/api";

const emptyForm = {
  title: "",
  description: "",
  date: "",
  location: "",
  capacity: 10,
};

export default function Events() {
  const { user } = useContext(AuthContext);
  const isOfficer = user?.role === "Officer";
  const isMember = user?.role === "Member";

  const [events, setEvents] = useState([]);
  const [myRsvpEventIds, setMyRsvpEventIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingEventId, setEditingEventId] = useState("");

  const loadEvents = async () => {
    const res = await api.get("/events?limit=100");
    setEvents(unwrapData(res) || []);
  };

  const loadMyRsvps = async () => {
    if (!isMember) {
      setMyRsvpEventIds(new Set());
      return;
    }

    const res = await api.get("/rsvps/me?limit=200");
    const rows = unwrapData(res) || [];
    setMyRsvpEventIds(new Set(rows.map((row) => String(row.eventId))));
  };

  useEffect(() => {
    const run = async () => {
      try {
        await Promise.all([loadEvents(), loadMyRsvps()]);
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to load events."));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [isMember]);

  const filteredEvents = useMemo(() => {
    const q = search.toLowerCase();
    return events.filter(
      (e) =>
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
    );
  }, [events, search]);

  const onSubmitEvent = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      capacity: Number(form.capacity),
    };

    const toastId = toast.loading(editingEventId ? "Updating event..." : "Creating event...");
    try {
      if (editingEventId) {
        await api.put(`/events/${editingEventId}`, payload);
      } else {
        await api.post("/events", payload);
      }

      await loadEvents();
      setForm(emptyForm);
      setEditingEventId("");
      toast.success(editingEventId ? "Event updated." : "Event created.", { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save event."), { id: toastId });
    }
  };

  const onEdit = (event) => {
    const iso = event.date ? new Date(event.date).toISOString().slice(0, 16) : "";
    setForm({
      title: event.title || "",
      description: event.description || "",
      date: iso,
      location: event.location || "",
      capacity: event.capacity || 10,
    });
    setEditingEventId(event._id);
  };

  const onDelete = async (eventId) => {
    const toastId = toast.loading("Deleting event...");
    try {
      await api.delete(`/events/${eventId}`);
      await loadEvents();
      toast.success("Event deleted.", { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error, "Delete failed."), { id: toastId });
    }
  };

  const onRsvp = async (eventId) => {
    const toastId = toast.loading("Creating RSVP...");
    try {
      await api.post("/rsvps", { eventId });
      await Promise.all([loadEvents(), loadMyRsvps()]);
      toast.success("RSVP created.", { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error, "RSVP failed."), { id: toastId });
    }
  };

  const onCancelRsvp = async (eventId) => {
    const toastId = toast.loading("Canceling RSVP...");
    try {
      await api.delete(`/rsvps/${eventId}`);
      await Promise.all([loadEvents(), loadMyRsvps()]);
      toast.success("RSVP canceled.", { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error, "Cancel failed."), { id: toastId });
    }
  };

  if (loading) {
    return <div className="p-8">Loading events...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Events</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events"
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white"
        />
      </div>

      {isOfficer && (
        <form onSubmit={onSubmitEvent} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <input className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white" placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <input className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white" placeholder="Location" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} required />
          <input type="datetime-local" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
          <input type="number" min="1" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} required />
          <textarea className="md:col-span-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white" placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold flex items-center gap-2">
              <Plus size={16} /> {editingEventId ? "Update Event" : "Create Event"}
            </button>
            {editingEventId && (
              <button type="button" onClick={() => { setEditingEventId(""); setForm(emptyForm); }} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold">
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.map((event) => {
          const eventId = String(event._id);
          const isFull = event.attendeeCount >= event.capacity || !event.isOpen;
          const hasRsvp = myRsvpEventIds.has(eventId);

          return (
            <div key={eventId} className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h3 className="font-black text-lg text-gray-900 dark:text-white">{event.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">{event.description}</p>
              <div className="text-xs font-bold text-gray-600 dark:text-gray-300 space-y-1 mb-4">
                <div className="flex items-center gap-1"><Calendar size={13} /> {new Date(event.date).toLocaleString()}</div>
                <div className="flex items-center gap-1"><MapPin size={13} /> {event.location}</div>
                <div className="flex items-center gap-1"><Users size={13} /> {event.attendeeCount}/{event.capacity}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                {isOfficer && (
                  <>
                    <button onClick={() => onEdit(event)} className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 font-bold text-sm flex items-center gap-1"><Edit3 size={14} /> Edit</button>
                    <button onClick={() => onDelete(eventId)} className="px-3 py-2 rounded-lg bg-red-50 text-red-600 font-bold text-sm flex items-center gap-1"><Trash2 size={14} /> Delete</button>
                  </>
                )}

                {isMember && !hasRsvp && (
                  <button
                    disabled={isFull}
                    onClick={() => onRsvp(eventId)}
                    className="px-3 py-2 rounded-lg bg-violet-600 text-white font-bold text-sm flex items-center gap-1 disabled:opacity-50"
                  >
                    <Ticket size={14} /> RSVP
                  </button>
                )}

                {isMember && hasRsvp && (
                  <button onClick={() => onCancelRsvp(eventId)} className="px-3 py-2 rounded-lg bg-orange-100 text-orange-700 font-bold text-sm">
                    Cancel RSVP
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
