import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { User, Lock, Save } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { api, getErrorMessage, unwrapData } from "../../lib/api";

export default function Profile() {
  const { user, updateUser } = useContext(AuthContext);
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    setDisplayName(user?.name || "");
    setPhoneNumber(user?.phoneNumber || "");
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Saving profile...");
    try {
      const res = await api.put("/users/me", {
        displayName,
        phoneNumber: phoneNumber || undefined,
      });
      const updated = unwrapData(res);
      updateUser(updated);
      toast.success("Profile updated.", { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save profile."), { id: toastId });
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Enter current and new password.");
      return;
    }

    const toastId = toast.loading("Updating password...");
    try {
      await api.put("/users/me/password", {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password updated.", { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update password."), {
        id: toastId,
      });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white">Profile</h1>

      <form onSubmit={saveProfile} className="p-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <h2 className="font-black text-lg text-gray-900 dark:text-white">Account Info</h2>
        <div className="relative">
          <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
            placeholder="Display name"
          />
        </div>
        <input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
          placeholder="Phone number"
        />
        <button type="submit" className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold flex items-center gap-2">
          <Save size={16} /> Save Profile
        </button>
      </form>

      <form onSubmit={savePassword} className="p-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <h2 className="font-black text-lg text-gray-900 dark:text-white">Change Password</h2>
        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
            placeholder="Current password"
          />
        </div>
        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
            placeholder="New password"
          />
        </div>
        <button type="submit" className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold">
          Update Password
        </button>
      </form>
    </div>
  );
}
