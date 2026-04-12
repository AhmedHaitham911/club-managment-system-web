import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { User, Lock, Save, ShieldCheck, ImageUp } from "lucide-react";
import { AuthContext } from "../../context/auth-context";
import { api, getErrorMessage, unwrapData } from "../../lib/api";

const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/jpg,image/webp,image/gif";

export default function Profile() {
  const { user, updateUser } = useContext(AuthContext);
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpEnabled, setOtpEnabled] = useState(Boolean(user?.otpEnabled));
  const [otpSetupToken, setOtpSetupToken] = useState("");
  const [otpManualEntryKey, setOtpManualEntryKey] = useState("");
  const [otpAuthUrl, setOtpAuthUrl] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
  const [profileImageUrlInput, setProfileImageUrlInput] = useState(
    user?.profileImageUrl || ""
  );
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [isProfileImageSubmitting, setIsProfileImageSubmitting] = useState(false);

  useEffect(() => {
    setDisplayName(user?.name || "");
    setPhoneNumber(user?.phoneNumber || "");
    setOtpEnabled(Boolean(user?.otpEnabled) || Boolean(otpSetupToken));
    if (user?.otpEnabled) {
      setOtpSetupToken("");
      setOtpManualEntryKey("");
      setOtpAuthUrl("");
      setOtpCode("");
    }
    setProfileImageUrlInput(user?.profileImageUrl || "");
  }, [user, otpSetupToken]);

  useEffect(() => {
    if (!profileImageFile) {
      setProfileImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(profileImageFile);
    setProfileImagePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [profileImageFile]);

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

  const saveOtpSettings = async (e) => {
    e.preventDefault();
    if (isOtpSubmitting) return;

    if (otpEnabled && otpSetupToken && !/^\d{6}$/.test(otpCode.trim())) {
      toast.error("Enter a valid 6-digit authenticator code.");
      return;
    }

    const toastId = toast.loading("Saving OTP settings...");
    setIsOtpSubmitting(true);
    try {
      const payload = { enabled: otpEnabled };
      if (otpEnabled && otpSetupToken) {
        payload.setupToken = otpSetupToken;
        payload.otpCode = otpCode.trim();
      }

      const res = await api.put("/users/me/otp-settings", payload);
      const result = unwrapData(res);
      const updatedUser = result?.user || result;
      const setup = result?.otpSetup;

      updateUser(updatedUser);

      if (setup?.required) {
        setOtpSetupToken(setup.setupToken || "");
        setOtpManualEntryKey(setup.manualEntryKey || "");
        setOtpAuthUrl(setup.otpauthUrl || "");
        toast.success("Authenticator setup started. Add the key to your app and verify with a code.", {
          id: toastId,
        });
      } else {
        setOtpSetupToken("");
        setOtpManualEntryKey("");
        setOtpAuthUrl("");
        setOtpCode("");
        toast.success(`OTP ${updatedUser?.otpEnabled ? "enabled" : "disabled"}.`, {
          id: toastId,
        });
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update OTP settings."), {
        id: toastId,
      });
    } finally {
      setIsOtpSubmitting(false);
    }
  };

  const saveProfileImage = async (e) => {
    e.preventDefault();
    if (isProfileImageSubmitting) return;

    const trimmedUrl = profileImageUrlInput.trim();

    if (!profileImageFile && !trimmedUrl) {
      toast.error("Select an image file or provide an image URL.");
      return;
    }

    const toastId = toast.loading("Updating profile image...");
    setIsProfileImageSubmitting(true);
    try {
      const formData = new FormData();
      if (profileImageFile) {
        formData.append("image", profileImageFile);
      }
      if (trimmedUrl) {
        formData.append("imageUrl", trimmedUrl);
      }

      const res = await api.put("/users/me/profile-image", formData);
      const updated = unwrapData(res);
      updateUser(updated);
      setProfileImageFile(null);
      setProfileImageUrlInput(updated?.profileImageUrl || trimmedUrl);
      toast.success("Profile image updated.", { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update profile image."), {
        id: toastId,
      });
    } finally {
      setIsProfileImageSubmitting(false);
    }
  };

  const onProfileImageFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setProfileImageFile(null);
      return;
    }

    if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
      toast.error("Image size must be 10 MB or less.");
      e.target.value = "";
      setProfileImageFile(null);
      return;
    }

    setProfileImageFile(file);
  };

  const currentAvatar = profileImagePreview || profileImageUrlInput || user?.profileImageUrl || "";

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

      <form
        onSubmit={saveOtpSettings}
        className="p-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
      >
        <h2 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldCheck size={18} /> OTP Security
        </h2>
        <label className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Enable authenticator OTP on login
          </span>
          <input
            type="checkbox"
            checked={otpEnabled}
            onChange={(e) => {
              const next = e.target.checked;
              setOtpEnabled(next);
              if (!next) {
                setOtpSetupToken("");
                setOtpManualEntryKey("");
                setOtpAuthUrl("");
                setOtpCode("");
              }
            }}
            className="h-4 w-4"
          />
        </label>

        {otpEnabled && otpSetupToken && (
          <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900 space-y-3">
            <p className="text-sm text-violet-800 dark:text-violet-200 font-semibold">
              Add this key to your authenticator app, then enter the generated 6-digit code.
            </p>
            <div className="text-xs font-mono break-all p-2 rounded bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200">
              {otpManualEntryKey}
            </div>
            {otpAuthUrl && (
              <a
                href={otpAuthUrl}
                className="text-sm font-bold text-violet-700 dark:text-violet-300 underline"
              >
                Open in authenticator app
              </a>
            )}
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white"
              placeholder="Enter 6-digit code"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isOtpSubmitting}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold disabled:opacity-60"
        >
          {isOtpSubmitting
            ? "Saving..."
            : otpEnabled && otpSetupToken
              ? "Verify And Enable OTP"
              : "Save OTP Settings"}
        </button>
      </form>

      <form
        onSubmit={saveProfileImage}
        className="p-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
      >
        <h2 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
          <ImageUp size={18} /> Profile Image
        </h2>
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt="Profile preview"
            className="w-24 h-24 rounded-full object-cover border border-gray-200 dark:border-slate-700"
          />
        ) : (
          <div className="w-24 h-24 rounded-full border border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center text-xs text-gray-500">
            No Image
          </div>
        )}

        <input
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          onChange={onProfileImageFileChange}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
        />
        <input
          type="url"
          value={profileImageUrlInput}
          onChange={(e) => setProfileImageUrlInput(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
          placeholder="Or paste image URL"
        />
        <button
          type="submit"
          disabled={isProfileImageSubmitting}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-60"
        >
          {isProfileImageSubmitting ? "Uploading..." : "Update Profile Image"}
        </button>
      </form>
    </div>
  );
}
