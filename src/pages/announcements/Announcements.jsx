import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AuthContext } from "../../context/AuthContext";
import {
  Megaphone,
  Search,
  Plus,
  Edit3,
  Trash2,
  Flame,
  X,
  Pin,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Announcements() {
  const { user } = useContext(AuthContext);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [announcementToEdit, setAnnouncementToEdit] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get("http://localhost:5000/announcements");
        setAnnouncements(response.data);
        setIsLoading(false);
      } catch (error) {
        toast.error("Oops! Couldn't load announcements.");
        setIsLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const createFormik = useFormik({
    initialValues: { title: "", content: "", isPinned: false },
    validationSchema: Yup.object({
      title: Yup.string().required("Title is required 📝"),
      content: Yup.string().required("Content is required 📋"),
    }),
    onSubmit: async (values, { resetForm }) => {
      const toastId = toast.loading("Publishing announcement... 📢");
      try {
        const newAnnouncement = {
          ...values,
          date: new Date().toISOString(),
        };
        const response = await axios.post(
          "http://localhost:5000/announcements",
          newAnnouncement
        );
        setAnnouncements([...announcements, response.data]);
        setIsCreateModalOpen(false);
        resetForm();
        toast.success("Announcement published successfully! 🎉", {
          id: toastId,
        });
      } catch (error) {
        toast.error("Failed to publish. Try again.", { id: toastId });
      }
    },
  });

  const editFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: announcementToEdit?.title || "",
      content: announcementToEdit?.content || "",
      isPinned: announcementToEdit?.isPinned || false,
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Required 📝"),
      content: Yup.string().required("Required 📋"),
    }),
    onSubmit: async (values, { resetForm }) => {
      if (!announcementToEdit) return;
      const toastId = toast.loading("Saving changes... 🔄");
      try {
        const updatedData = { ...announcementToEdit, ...values };
        const response = await axios.put(
          `http://localhost:5000/announcements/${announcementToEdit.id}`,
          updatedData
        );
        setAnnouncements(
          announcements.map((a) =>
            String(a.id) === String(announcementToEdit.id) ? response.data : a
          )
        );
        setIsEditModalOpen(false);
        setAnnouncementToEdit(null);
        resetForm();
        toast.success("Changes saved! ✏️", { id: toastId });
      } catch (error) {
        toast.error("Failed to save changes.", { id: toastId });
      }
    },
  });

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/announcements/${id}`);
      setAnnouncements(
        announcements.filter((a) => String(a.id) !== String(id))
      );
      toast.success("Announcement deleted! 🗑️");
    } catch (error) {
      toast.error("Failed to delete.");
    }
  };

  const openEditModal = (announcement) => {
    setAnnouncementToEdit(announcement);
    setIsEditModalOpen(true);
  };

  const processedAnnouncements = announcements
    .filter(
      (a) =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (a.isPinned === b.isPinned) {
        return new Date(b.date) - new Date(a.date);
      }
      return a.isPinned ? -1 : 1;
    });

  if (isLoading)
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-slate-950 transition-colors">
        <Megaphone size={48} className="text-violet-500 animate-bounce mb-4" />
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 animate-pulse">
          Loading campus buzz...
        </h2>
      </div>
    );

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            Campus Buzz <Megaphone className="text-fuchsia-500" size={32} />
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
            Stay updated with the latest news and announcements.
          </p>
        </div>

        {user?.role === "Officer" && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black py-3 px-6 rounded-2xl hover:shadow-lg hover:shadow-fuchsia-500/30 dark:hover:shadow-fuchsia-900/30 hover:-translate-y-1 transition-all"
          >
            <Plus size={20} /> New Announcement
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
        <div className="relative w-full">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-violet-100 dark:focus:border-violet-900/50 rounded-2xl pl-12 pr-4 py-3 outline-none focus:bg-white dark:focus:bg-slate-900 transition-all font-medium text-gray-700 dark:text-white"
          />
        </div>
      </div>

      {processedAnnouncements.length > 0 ? (
        <div className="space-y-6">
          {processedAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className={`relative overflow-hidden rounded-3xl p-6 md:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border ${
                announcement.isPinned
                  ? "bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/40 dark:to-pink-950/40 border-orange-200 dark:border-orange-900/50 shadow-orange-100 dark:shadow-none"
                  : "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none"
              }`}
            >
              {announcement.isPinned && (
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Megaphone size={120} />
                </div>
              )}

              <div className="relative z-10 flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  {announcement.isPinned ? (
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200 dark:shadow-none">
                      <Pin size={24} fill="currentColor" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-violet-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-violet-500 dark:text-violet-400 border border-violet-100 dark:border-slate-700">
                      <Megaphone size={24} />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <h3
                      className={`text-2xl font-black ${
                        announcement.isPinned
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-800 dark:text-gray-100"
                      }`}
                    >
                      {announcement.title}
                    </h3>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 dark:text-gray-500 bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg w-fit">
                      <Clock size={14} />
                      {new Date(announcement.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed whitespace-pre-wrap">
                    {announcement.content}
                  </p>

                  {user?.role === "Officer" && (
                    <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200/50 dark:border-slate-700/50">
                      <button
                        onClick={() => openEditModal(announcement)}
                        className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-4 py-2 rounded-xl transition-colors"
                      >
                        <Edit3 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400 hover:text-red-700 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 px-4 py-2 rounded-xl transition-colors"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center transition-colors">
          <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-full mb-4">
            <Search size={48} className="text-gray-300 dark:text-slate-600" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
            No announcements yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Check back later for club updates and news.
          </p>
        </div>
      )}

      {/* 📢 Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Megaphone className="text-violet-500" size={24} /> New Announcement
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  createFormik.resetForm();
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={createFormik.handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g., Important update for tomorrow..."
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    createFormik.touched.title && createFormik.errors.title
                      ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                      : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                  } outline-none transition-colors`}
                  value={createFormik.values.title}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Message Content
                </label>
                <textarea
                  name="content"
                  rows="5"
                  placeholder="Write your announcement here..."
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    createFormik.touched.content && createFormik.errors.content
                      ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                      : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                  } outline-none transition-colors resize-none`}
                  value={createFormik.values.content}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                ></textarea>
              </div>
              <label className="flex items-center gap-3 p-4 border-2 border-orange-100 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/30 rounded-xl cursor-pointer hover:bg-orange-100/50 dark:hover:bg-orange-900/30 transition-colors">
                <input
                  type="checkbox"
                  name="isPinned"
                  checked={createFormik.values.isPinned}
                  onChange={createFormik.handleChange}
                  className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 accent-orange-500"
                />
                <span className="font-bold text-orange-800 dark:text-orange-400 flex items-center gap-2">
                  <Pin size={18} /> Pin to top (Highlight as important)
                </span>
              </label>
              <div className="pt-4 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    createFormik.resetForm();
                  }}
                  className="px-6 py-3 font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createFormik.isSubmitting || !createFormik.isValid}
                  className="px-6 py-3 font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  Publish Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✏️ Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Edit3 className="text-blue-500" size={24} /> Edit Announcement
              </h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setAnnouncementToEdit(null);
                  editFormik.resetForm();
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={editFormik.handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    editFormik.touched.title && editFormik.errors.title
                      ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                      : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                  } outline-none transition-colors`}
                  value={editFormik.values.title}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Message Content
                </label>
                <textarea
                  name="content"
                  rows="5"
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    editFormik.touched.content && editFormik.errors.content
                      ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                      : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                  } outline-none transition-colors resize-none`}
                  value={editFormik.values.content}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                ></textarea>
              </div>
              <label className="flex items-center gap-3 p-4 border-2 border-orange-100 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/30 rounded-xl cursor-pointer hover:bg-orange-100/50 dark:hover:bg-orange-900/30 transition-colors">
                <input
                  type="checkbox"
                  name="isPinned"
                  checked={editFormik.values.isPinned}
                  onChange={editFormik.handleChange}
                  className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 accent-orange-500"
                />
                <span className="font-bold text-orange-800 dark:text-orange-400 flex items-center gap-2">
                  <Pin size={18} /> Pin to top (Highlight as important)
                </span>
              </label>
              <div className="pt-4 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setAnnouncementToEdit(null);
                    editFormik.resetForm();
                  }}
                  className="px-6 py-3 font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editFormik.isSubmitting || !editFormik.isValid}
                  className="px-6 py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}