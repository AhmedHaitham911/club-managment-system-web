import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AuthContext } from "../../context/AuthContext";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  ZoomIn,
  Calendar,
  Images,
  ArrowLeft,
  Upload,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

// 🚀 دالة ضغط الصورة وتحويلها لـ Base64 عشان تتخزن في الـ db.json
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800; // مساحة كويسة للصور
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height *= MAX_WIDTH / width));
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        resolve(compressedBase64);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function Gallery() {
  const { user } = useContext(AuthContext);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null); // لو null هيعرض الألبومات، لو مليان هيعرض الصور
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateAlbumModalOpen, setIsCreateAlbumModalOpen] = useState(false);
  const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await axios.get("http://localhost:5000/albums");
        const sortedAlbums = response.data.sort(
          (a, b) => new Date(b.date) - new Date(a.date),
        );
        setAlbums(sortedAlbums);
        setIsLoading(false);
      } catch (error) {
        toast.error("Oops! Couldn't load the gallery albums.");
        setIsLoading(false);
      }
    };
    fetchAlbums();
  }, []);

  const handleImageUpload = async (e, formikInstance, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading("Processing image...");
    try {
      const base64Image = await compressImage(file);
      formikInstance.setFieldValue(fieldName, base64Image);
      toast.success("Image attached successfully!", { id: toastId });
    } catch (error) {
      toast.error("Failed to process image.", { id: toastId });
    }
  };

  // 🚀 Formik لإنشاء ألبوم جديد
  const createAlbumFormik = useFormik({
    initialValues: { title: "", coverImage: "", description: "" },
    validationSchema: Yup.object({
      title: Yup.string().required("Title is required"),
      coverImage: Yup.string()
        .required("Cover Image is required")
        .test(
          "is-url-or-base64",
          "Must be a valid URL or uploaded image",
          (value) => {
            if (!value) return false;
            return value.startsWith("http") || value.startsWith("data:image");
          },
        ),
    }),
    onSubmit: async (values, { resetForm }) => {
      const toastId = toast.loading("Creating album... 📁");
      try {
        const newAlbum = {
          ...values,
          date: new Date().toISOString(),
          photos: [], // الألبوم بيبدأ فاضي
        };
        const response = await axios.post(
          "http://localhost:5000/albums",
          newAlbum,
        );
        setAlbums([response.data, ...albums]);
        setIsCreateAlbumModalOpen(false);
        resetForm();
        toast.success("Album created! 🎉", { id: toastId });
      } catch (error) {
        toast.error("Failed to create album.", { id: toastId });
      }
    },
  });

  // 🚀 Formik لإضافة صورة جوه الألبوم
  const addPhotoFormik = useFormik({
    initialValues: { imageUrl: "", caption: "" },
    validationSchema: Yup.object({
      imageUrl: Yup.string()
        .required("Image is required")
        .test(
          "is-url-or-base64",
          "Must be a valid URL or uploaded image",
          (value) => {
            if (!value) return false;
            return value.startsWith("http") || value.startsWith("data:image");
          },
        ),
      caption: Yup.string()
        .max(100, "Keep it short!")
        .required("Caption is required"),
    }),
    onSubmit: async (values, { resetForm }) => {
      if (!selectedAlbum) return;
      const toastId = toast.loading("Adding photo to album... 📸");
      try {
        const newPhoto = {
          id: Date.now().toString(),
          ...values,
          date: new Date().toISOString(),
        };

        const updatedPhotos = [newPhoto, ...(selectedAlbum.photos || [])];

        const response = await axios.patch(
          `http://localhost:5000/albums/${selectedAlbum.id}`,
          {
            photos: updatedPhotos,
          },
        );

        const updatedAlbum = response.data;
        setSelectedAlbum(updatedAlbum);
        setAlbums(
          albums.map((a) => (a.id === updatedAlbum.id ? updatedAlbum : a)),
        );

        setIsAddPhotoModalOpen(false);
        resetForm();
        toast.success("Photo added! 🎉", { id: toastId });
      } catch (error) {
        toast.error("Failed to add photo.", { id: toastId });
      }
    },
  });

  const handleDeleteAlbum = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`http://localhost:5000/albums/${id}`);
      setAlbums(albums.filter((a) => String(a.id) !== String(id)));
      if (selectedAlbum && String(selectedAlbum.id) === String(id)) {
        setSelectedAlbum(null);
      }
      toast.success("Album deleted! 🗑️");
    } catch (error) {
      toast.error("Failed to delete album.");
    }
  };

  const handleDeletePhoto = async (photoId, e) => {
    e.stopPropagation();
    try {
      const updatedPhotos = selectedAlbum.photos.filter(
        (p) => String(p.id) !== String(photoId),
      );
      const response = await axios.patch(
        `http://localhost:5000/albums/${selectedAlbum.id}`,
        {
          photos: updatedPhotos,
        },
      );

      const updatedAlbum = response.data;
      setSelectedAlbum(updatedAlbum);
      setAlbums(
        albums.map((a) => (a.id === updatedAlbum.id ? updatedAlbum : a)),
      );
      toast.success("Photo deleted! 🗑️");
    } catch (error) {
      toast.error("Failed to delete photo.");
    }
  };

  if (isLoading)
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-slate-950 transition-colors">
        <Images size={48} className="text-violet-500 animate-bounce mb-4" />
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 animate-pulse">
          Loading memories...
        </h2>
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors duration-300">
      {/* 🚀 Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            {selectedAlbum ? selectedAlbum.title : "Club Albums"}{" "}
            <Images className="text-fuchsia-500" size={32} />
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
            {selectedAlbum
              ? selectedAlbum.description
              : "Relive the best moments grouped by events and gatherings."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {selectedAlbum && (
            <button
              onClick={() => setSelectedAlbum(null)}
              className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold py-3 px-6 rounded-2xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
            >
              <ArrowLeft size={20} /> Back to Albums
            </button>
          )}

          {user?.role === "Officer" && !selectedAlbum && (
            <button
              onClick={() => setIsCreateAlbumModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black py-3 px-6 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <Plus size={20} /> New Album
            </button>
          )}

          {user?.role === "Officer" && selectedAlbum && (
            <button
              onClick={() => setIsAddPhotoModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black py-3 px-6 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <Plus size={20} /> Add Photo
            </button>
          )}
        </div>
      </div>

      {/* 🚀 عرض الألبومات */}
      {!selectedAlbum &&
        (albums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {albums.map((album) => (
              <div
                key={album.id}
                onClick={() => setSelectedAlbum(album)}
                className="group relative bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div className="h-48 relative overflow-hidden shrink-0">
                  <img
                    src={album.coverImage}
                    alt={album.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg w-fit">
                      <ImageIcon size={14} /> {album.photos?.length || 0} Photos
                    </span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 line-clamp-1">
                    {album.title}
                  </h3>
                  <p className="text-xs text-gray-400 font-bold flex items-center gap-1">
                    <Calendar size={14} />{" "}
                    {new Date(album.date).toLocaleDateString()}
                  </p>
                </div>
                {user?.role === "Officer" && (
                  <button
                    onClick={(e) => handleDeleteAlbum(album.id, e)}
                    className="absolute top-4 right-4 p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              No albums yet
            </h3>
          </div>
        ))}

      {/* 🚀 عرض الصور جوه الألبوم */}
      {selectedAlbum &&
        (selectedAlbum.photos?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedAlbum.photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setFullscreenPhoto(photo)}
                className="group relative h-48 bg-gray-100 dark:bg-slate-800 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.caption}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <ZoomIn className="text-white" size={32} />
                </div>
                <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-sm font-bold truncate">
                    {photo.caption}
                  </p>
                </div>
                {user?.role === "Officer" && (
                  <button
                    onClick={(e) => handleDeletePhoto(photo.id, e)}
                    className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">
              This album is empty. Add some photos!
            </h3>
          </div>
        ))}

      {/* 🚀 Modal: Create Album */}
      {isCreateAlbumModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Images className="text-violet-500" size={24} /> Create Album
              </h2>
              <button
                onClick={() => {
                  setIsCreateAlbumModalOpen(false);
                  createAlbumFormik.resetForm();
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={createAlbumFormik.handleSubmit}
              className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1"
            >
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Album Title
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g., Tech Summit 2026"
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    createAlbumFormik.touched.title &&
                    createAlbumFormik.errors.title
                      ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                      : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                  } outline-none transition-colors`}
                  value={createAlbumFormik.values.title}
                  onChange={createAlbumFormik.handleChange}
                  onBlur={createAlbumFormik.handleBlur}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Cover Image (URL or Upload)
                </label>
                {createAlbumFormik.values.coverImage?.startsWith(
                  "data:image",
                ) ? (
                  <div className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-900/30 border-2 border-violet-100 dark:border-violet-800 rounded-xl">
                    <span className="text-sm font-bold text-violet-700 dark:text-violet-300 flex items-center gap-2">
                      <CheckCircle2 size={18} /> Image Ready
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        createAlbumFormik.setFieldValue("coverImage", "")
                      }
                      className="text-red-500 hover:text-red-600 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      name="coverImage"
                      placeholder="Paste image URL here..."
                      className={`flex-1 px-4 py-3 rounded-xl border-2 ${
                        createAlbumFormik.touched.coverImage &&
                        createAlbumFormik.errors.coverImage
                          ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                          : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                      } outline-none transition-colors`}
                      value={createAlbumFormik.values.coverImage}
                      onChange={createAlbumFormik.handleChange}
                      onBlur={createAlbumFormik.handleBlur}
                    />
                    <label
                      className="cursor-pointer bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 p-3.5 rounded-xl transition-colors flex items-center justify-center"
                      title="Upload from device"
                    >
                      <Upload size={20} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(e, createAlbumFormik, "coverImage")
                        }
                      />
                    </label>
                  </div>
                )}
                {createAlbumFormik.values.coverImage &&
                  !createAlbumFormik.errors.coverImage && (
                    <img
                      src={createAlbumFormik.values.coverImage}
                      className="mt-3 h-32 w-full object-cover rounded-xl border border-gray-100 dark:border-slate-700"
                      alt="Preview"
                    />
                  )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="Short description of the event..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white outline-none transition-colors"
                  value={createAlbumFormik.values.description}
                  onChange={createAlbumFormik.handleChange}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateAlbumModalOpen(false);
                    createAlbumFormik.resetForm();
                  }}
                  className="px-6 py-3 font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createAlbumFormik.isSubmitting || !createAlbumFormik.isValid
                  }
                  className="px-6 py-3 font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  Create Album
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚀 Modal: Add Photo */}
      {isAddPhotoModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="text-violet-500" size={24} /> Add Photo to
                Album
              </h2>
              <button
                onClick={() => {
                  setIsAddPhotoModalOpen(false);
                  addPhotoFormik.resetForm();
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={addPhotoFormik.handleSubmit}
              className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1"
            >
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Image (URL or Upload)
                </label>
                {addPhotoFormik.values.imageUrl?.startsWith("data:image") ? (
                  <div className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-900/30 border-2 border-violet-100 dark:border-violet-800 rounded-xl">
                    <span className="text-sm font-bold text-violet-700 dark:text-violet-300 flex items-center gap-2">
                      <CheckCircle2 size={18} /> Image Ready
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        addPhotoFormik.setFieldValue("imageUrl", "")
                      }
                      className="text-red-500 hover:text-red-600 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      name="imageUrl"
                      placeholder="Paste image URL here..."
                      className={`flex-1 px-4 py-3 rounded-xl border-2 ${
                        addPhotoFormik.touched.imageUrl &&
                        addPhotoFormik.errors.imageUrl
                          ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                          : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                      } outline-none transition-colors`}
                      value={addPhotoFormik.values.imageUrl}
                      onChange={addPhotoFormik.handleChange}
                      onBlur={addPhotoFormik.handleBlur}
                    />
                    <label
                      className="cursor-pointer bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 p-3.5 rounded-xl transition-colors flex items-center justify-center"
                      title="Upload from device"
                    >
                      <Upload size={20} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(e, addPhotoFormik, "imageUrl")
                        }
                      />
                    </label>
                  </div>
                )}
                {addPhotoFormik.values.imageUrl &&
                  !addPhotoFormik.errors.imageUrl && (
                    <img
                      src={addPhotoFormik.values.imageUrl}
                      className="mt-3 h-32 w-full object-cover rounded-xl border border-gray-100 dark:border-slate-700"
                      alt="Preview"
                    />
                  )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Caption
                </label>
                <input
                  type="text"
                  name="caption"
                  placeholder="What's happening in this photo?"
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    addPhotoFormik.touched.caption &&
                    addPhotoFormik.errors.caption
                      ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                      : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                  } outline-none transition-colors`}
                  value={addPhotoFormik.values.caption}
                  onChange={addPhotoFormik.handleChange}
                  onBlur={addPhotoFormik.handleBlur}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddPhotoModalOpen(false);
                    addPhotoFormik.resetForm();
                  }}
                  className="px-6 py-3 font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    addPhotoFormik.isSubmitting || !addPhotoFormik.isValid
                  }
                  className="px-6 py-3 font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  Upload Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Photo */}
      {fullscreenPhoto && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setFullscreenPhoto(null)}
        >
          <button className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-md transition-all">
            <X size={24} />
          </button>
          <div
            className="max-w-5xl w-full flex flex-col items-center gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={fullscreenPhoto.imageUrl}
              alt={fullscreenPhoto.caption}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl shadow-violet-900/20"
            />
            <div className="text-center bg-black/50 px-8 py-4 rounded-2xl backdrop-blur-md border border-white/10">
              <p className="text-white text-xl font-black mb-1">
                {fullscreenPhoto.caption}
              </p>
              <p className="text-gray-400 text-sm font-bold flex items-center justify-center gap-2">
                <Calendar size={14} />{" "}
                {new Date(fullscreenPhoto.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
