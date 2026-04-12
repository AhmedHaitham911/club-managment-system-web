import { useEffect, useMemo, useState, useContext } from "react";
import toast from "react-hot-toast";
import { Megaphone, Plus, Edit3, Trash2, Pin } from "lucide-react";
import { AuthContext } from "../../context/auth-context";
import { api, getErrorMessage, unwrapData } from "../../lib/api";

const emptyForm = { title: "", content: "", pinned: false };

export default function Announcements() {
  const { user } = useContext(AuthContext);
  const isOfficer = user?.role === "Officer";

  const [announcements, setAnnouncements] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");

  const loadAnnouncements = async () => {
    const res = await api.get("/announcements?limit=100");
    setAnnouncements(unwrapData(res) || []);
  };

  useEffect(() => {
    loadAnnouncements().catch((error) => {
      toast.error(getErrorMessage(error, "Failed to load announcements."));
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return announcements.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.content?.toLowerCase().includes(q)
    );
  }, [announcements, search]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading(editingId ? "Updating..." : "Publishing...");
    try {
      if (editingId) {
        await api.put(`/announcements/${editingId}`, form);
      } else {
        await api.post("/announcements", form);
      }
      await loadAnnouncements();
      setForm(emptyForm);
      setEditingId("");
      toast.success(editingId ? "Updated." : "Published.", { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error, "Save failed."), { id: toastId });
    }
  };

  const onEdit = (a) => {
    setEditingId(a._id);
    setForm({ title: a.title || "", content: a.content || "", pinned: Boolean(a.pinned) });
  };

  const onDelete = async (id) => {
    const toastId = toast.loading("Deleting...");
    try {
      await api.delete(`/announcements/${id}`);
      await loadAnnouncements();
      toast.success("Deleted.", { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error, "Delete failed."), { id: toastId });
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <Megaphone className="text-fuchsia-500" /> Announcements
        </h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white"
        />
      </div>

      {isOfficer && (
        <form onSubmit={onSubmit} className="p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Title"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
            required
          />
          <textarea
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            placeholder="Content"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
            required
          />
          <label className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => setForm((p) => ({ ...p, pinned: e.target.checked }))}
            />
            Pinned announcement
          </label>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold flex items-center gap-2">
              <Plus size={16} /> {editingId ? "Update" : "Publish"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(""); setForm(emptyForm); }} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="space-y-3">
        {filtered.map((a) => (
          <div key={a._id} className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                  {a.pinned && <Pin size={15} className="text-orange-500" />} {a.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{a.content}</p>
              </div>
              {isOfficer && (
                <div className="flex gap-2">
                  <button onClick={() => onEdit(a)} className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600"><Edit3 size={14} /></button>
                  <button onClick={() => onDelete(a._id)} className="px-2 py-1 rounded-lg bg-red-50 text-red-600"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
