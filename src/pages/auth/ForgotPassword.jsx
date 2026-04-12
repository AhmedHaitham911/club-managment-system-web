import { Link } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Mail, KeyRound } from "lucide-react";
import { api, getErrorMessage } from "../../lib/api";

export default function ForgotPassword() {
  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Email is required"),
    }),
    onSubmit: async (values, helpers) => {
      const toastId = toast.loading("Sending reset link...");
      try {
        await api.post("/auth/forgot-password", { email: values.email });
        toast.success(
          "If this email exists, a reset link has been sent.",
          { id: toastId }
        );
        helpers.resetForm();
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to request password reset."), {
          id: toastId,
        });
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 p-8">
        <div className="flex items-center gap-3 mb-2">
          <KeyRound className="text-violet-600" size={24} />
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            Forgot Password
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Enter your account email to receive a password reset link.
        </p>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
              placeholder="student240001@bue.edu.eg"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold"
          >
            Send Reset Link
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
