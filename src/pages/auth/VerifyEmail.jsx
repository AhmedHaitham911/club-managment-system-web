import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { api, getErrorMessage } from "../../lib/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing from the link.");
        return;
      }

      try {
        const response = await api.post("/auth/verify-email/confirm", { token });
        setStatus("success");
        setMessage(
          response?.data?.message ||
            "Email verified successfully. Wait for admin approval before logging in."
        );
      } catch (error) {
        setStatus("error");
        setMessage(
          getErrorMessage(error, "Email verification failed. The link may be invalid or expired.")
        );
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 p-8 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              Verifying Email
            </h1>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              Email Verified
            </h1>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-10 w-10 text-red-600" />
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              Verification Failed
            </h1>
          </div>
        )}

        <p className="mt-4 text-gray-600 dark:text-gray-300">{message}</p>

        <div className="mt-8">
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold"
          >
            Go to Login
          </Link>
        </div>
        {status === "error" && (
          <div className="mt-3">
            <Link
              to="/resend-verification"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-bold"
            >
              Request New Verification Link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
