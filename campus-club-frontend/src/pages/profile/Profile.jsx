import { useContext } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import {
  User,
  Lock,
  Save,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400; // مساحة صغيرة جدا تناسب البروفايل
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

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
        resolve(compressedBase64);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function Profile() {
  const { user, updateUser } = useContext(AuthContext);

  const getAvatar = (id, avatarUrl) =>
    avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}&backgroundColor=b6e3f4`;

  const formik = useFormik({
    initialValues: {
      name: user?.name || "",
      password: user?.password || "",
      avatar: user?.avatar || "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      password: Yup.string()
        .min(6, "At least 6 characters")
        .required("Password is required"),
    }),
    onSubmit: async (values) => {
      const toastId = toast.loading("Saving changes...");
      try {
        const updatedData = { ...user, ...values };
        const response = await axios.patch(
          `http://localhost:5000/users/${user.id}`,
          updatedData,
        );

        updateUser(response.data);
        toast.success("Profile updated successfully! 🌟", { id: toastId });
      } catch (error) {
        toast.error("Failed to update profile.", { id: toastId });
      }
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading("Processing image...");
    try {
      const base64Image = await compressImage(file);
      formik.setFieldValue("avatar", base64Image);
      toast.success("Image attached! Don't forget to save.", { id: toastId });
    } catch (error) {
      toast.error("Failed to process image.", { id: toastId });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
        {/* Header Cover */}
        <div className="h-40 bg-gradient-to-r from-violet-600 to-fuchsia-600 relative">
          <div className="absolute -bottom-16 left-8 flex items-end gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full p-1.5 bg-white dark:bg-slate-900 shadow-xl">
                <img
                  src={getAvatar(
                    user?.id,
                    formik.values.avatar || user?.avatar,
                  )}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover bg-gray-50 dark:bg-slate-800 border-2 border-white dark:border-slate-800"
                  onError={(e) => (e.target.src = getAvatar(user?.id, ""))}
                />
              </div>

              <label className="absolute bottom-2 right-2 bg-violet-600 hover:bg-violet-700 p-2.5 rounded-full text-white shadow-lg border-2 border-white dark:border-slate-900 cursor-pointer transition-colors group-hover:scale-110">
                <Camera size={16} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Form Area */}
        <form onSubmit={formik.handleSubmit} className="pt-24 p-8 space-y-6">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              Profile Settings
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Update your personal info and avatar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  name="name"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:focus:border-violet-600 dark:text-white outline-none transition-colors"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="password"
                  name="password"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:focus:border-violet-600 dark:text-white outline-none transition-colors"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                />
              </div>
            </div>

            {/* 🚀 حقل الصورة المدمج (URL أو رفع) */}
            <div className="md:col-span-2 mt-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Avatar URL (Optional)
              </label>
              {formik.values.avatar?.startsWith("data:image") ? (
                <div className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-900/30 border-2 border-violet-100 dark:border-violet-800 rounded-xl">
                  <span className="text-sm font-bold text-violet-700 dark:text-violet-300 flex items-center gap-2">
                    <CheckCircle2 size={18} /> Avatar uploaded from device
                  </span>
                  <button
                    type="button"
                    onClick={() => formik.setFieldValue("avatar", "")}
                    className="text-red-500 hover:text-red-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <ImageIcon
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    name="avatar"
                    placeholder="Paste image URL here..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:focus:border-violet-600 dark:text-white outline-none transition-colors"
                    value={formik.values.avatar}
                    onChange={formik.handleChange}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="flex items-center gap-2 px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 shadow-md shadow-violet-200 dark:shadow-none"
            >
              <Save size={18} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
