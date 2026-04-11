import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { api, getErrorMessage, unwrapData } from "../../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string().required("Password is required"),
    }),
    onSubmit: async (values) => {
      const toastId = toast.loading("Signing in...");
      try {
        const response = await api.post("/auth/login", values);
        const payload = unwrapData(response);

        if (payload?.requiresOtp) {
          setOtpToken(payload.otpToken);
          toast.success("OTP required. Check your email for the code.", { id: toastId });
          return;
        }

        login(payload.user, payload.token);
        toast.success("Login successful.", { id: toastId });
        navigate("/");
      } catch (error) {
        toast.error(getErrorMessage(error, "Login failed."), { id: toastId });
      }
    },
  });

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Verifying OTP...");
    try {
      const response = await api.post("/auth/login/otp/verify", {
        otpToken,
        otpCode,
      });
      const payload = unwrapData(response);
      login(payload.user, payload.token);
      toast.success("Login successful.", { id: toastId });
      navigate("/");
    } catch (error) {
      toast.error(getErrorMessage(error, "OTP verification failed."), {
        id: toastId,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 p-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Sign In</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Use your Campus Club account credentials.
        </p>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email</label>
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
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full pl-11 pr-11 py-3 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
                placeholder="********"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold"
          >
            Login
          </button>
        </form>

        {otpToken && (
          <form onSubmit={handleOtpVerify} className="mt-6 space-y-3 p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900">
            <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 font-bold text-sm">
              <ShieldCheck size={16} /> OTP Verification
            </div>
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 rounded-xl border-2 border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900 dark:text-white"
              placeholder="Enter 6-digit code"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold"
            >
              Verify OTP
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          New account?{" "}
          <Link to="/signup" className="font-bold text-violet-600 dark:text-violet-400">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
