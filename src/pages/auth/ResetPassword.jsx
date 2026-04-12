import { Link, useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Lock, RefreshCw } from "lucide-react";
import { api, getErrorMessage } from "../../lib/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const formik = useFormik({
    initialValues: { newPassword: "", confirmPassword: "" },
    validationSchema: Yup.object({
      newPassword: Yup.string().min(8, "Must be at least 8 characters").required("New password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword")], "Passwords must match")
        .required("Confirm password is required"),
    }),
    onSubmit: async (values, helpers) => {
      if (!token) {
        toast.error("Reset token is missing from URL.");
        return;
      }

      const toastId = toast.loading("Resetting password...");
      try {
        await api.post("/auth/reset-password", {
          token,
          newPassword: values.newPassword,
        });
        toast.success("Password reset successful. You can login now.", { id: toastId });
        helpers.resetForm();
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to reset password."), {
          id: toastId,
        });
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 p-8">
        <div className="flex items-center gap-3 mb-2">
          <RefreshCw className="text-violet-600" size={24} />
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            Reset Password
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Set a new password for your account.
        </p>

        {!token && (
          <div className="mb-4 p-3 rounded-xl border border-red-100 bg-red-50 text-red-700 text-sm font-semibold">
            This reset link is invalid because the token is missing.
          </div>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              name="newPassword"
              value={formik.values.newPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
              placeholder="New password"
            />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              name="confirmPassword"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={!token}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold disabled:opacity-60"
          >
            Reset Password
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Back to{" "}
          <Link to="/login" className="font-bold text-violet-600 dark:text-violet-400">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
