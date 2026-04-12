import { Link } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { MailCheck } from "lucide-react";
import { api, getErrorMessage } from "../../lib/api";

export default function RequestVerificationEmail() {
  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Email is required"),
    }),
    onSubmit: async (values) => {
      const toastId = toast.loading("Sending verification email...");
      try {
        await api.post("/auth/verify-email/request", { email: values.email });
        toast.success(
          "If this email exists, a verification email has been sent.",
          { id: toastId }
        );
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to request verification email."), {
          id: toastId,
        });
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 p-8">
        <div className="flex items-center gap-3 mb-2">
          <MailCheck className="text-violet-600" size={24} />
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            Resend Verification
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Request a new email verification link for your account.
        </p>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
            placeholder="student240001@bue.edu.eg"
          />

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold"
          >
            Send Verification Email
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
