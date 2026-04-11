import { useEffect, useState, useContext } from "react";
import toast from "react-hot-toast";
import { Image as ImageIcon, Plus, Edit3, Trash2 } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { api, getErrorMessage, unwrapData } from "../../lib/api";

const emptyPhoto = {
  title: "",
  description: "",
  date: "",
  imageUrl: "",
};

export default function Gallery() {
  const { user } = useContext(AuthContext);
  const isOfficer = user?.role === "Officer";

  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState(emptyPhoto);
  const [editingId, setEditingId] = useState("");

  const loadPhotos = async () => {
    const res = await api.get("/gallery?limit=200");
    setPhotos(unwrapData(res) || []);
  };

  useEffect(() => {
    loadPhotos().catch((error) => {
      toast.error(getErrorMessage(error, "Failed to load gallery."));
    });
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading(editingId ? "Updating photo..." : "Adding photo...");
    try {
      if (editingId) {
        await api.put(`/gallery/${editingId}`, form);
      } else {
        await api.post("/gallery", form);
      }
      await loadPhotos();
      setForm(emptyPhoto);
      setEditingId("");
      toast.success(editingId ? "Photo updated." : "Photo added.", { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error, "Save failed."), { id: toastId });
    }
  };

  const onEdit = (photo) => {
    setEditingId(photo._id);
    setForm({
      title: photo.title || "",
      description: photo.description || "",
      date: photo.date ? new Date(photo.date).toISOString().slice(0, 10) : "",
      imageUrl: photo.imageUrl || "",
    });
  };

  const onDelete = async (id) => {
    const toastId = toast.loading("Deleting...");
    try {
      await api.delete(`/gallery/${id}`);
      await loadPhotos();
      toast.success("Deleted.", { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error, "Delete failed."), { id: toastId });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
        <ImageIcon className="text-fuchsia-500" /> Gallery
      </h1>

      {isOfficer && (
        <form
          onSubmit={onSubmit}
          className="p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
            required
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
            required
          />
          <input
            type="text"
            placeholder="Image URL"
            value={form.imageUrl}
            onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
            className="md:col-span-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
            required
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="md:col-span-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
            required
          />
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold flex items-center gap-2"
            >
              <Plus size={16} /> {editingId ? "Update" : "Add"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId("");
                  setForm(emptyPhoto);
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <div
            key={photo._id}
            className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
          >
            <img src={photo.imageUrl} alt={photo.title} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="font-black text-gray-900 dark:text-white">{photo.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{photo.description}</p>
              <p className="text-xs font-bold text-gray-400 mt-2">
                {new Date(photo.date).toLocaleDateString()}
              </p>
              {isOfficer && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => onEdit(photo)} className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => onDelete(photo._id)} className="px-2 py-1 rounded-lg bg-red-50 text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
