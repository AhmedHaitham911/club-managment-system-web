import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { Mail, Lock, Eye, EyeOff, Rocket, Zap, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Oops! That doesn't look like a valid email 😅")
        .required("We need your email to let you in! 📩"),
      password: Yup.string().required("Don't forget your password! 🔑"),
    }),
    onSubmit: async (values) => {
      const toastId = toast.loading("Verifying credentials...");
      try {
        const response = await axios.get(
          `http://localhost:5000/users?email=${values.email}&password=${values.password}`
        );
        const usersFound = response.data;

        if (usersFound.length > 0) {
          const loggedInUser = usersFound[0];
          
          // 🚀 الحماية: لو الأكونت Pending نمنعه من الدخول
          if (loggedInUser.status === "Pending") {
            toast.error("Account pending Admin approval. Check your email! ⏳", { id: toastId });
            return;
          }

          const dummyToken = "jwt_token_" + loggedInUser.id;
          login(loggedInUser, dummyToken);
          toast.success(`Welcome back, ${loggedInUser.name}! 🎉`, { id: toastId });
          navigate("/");
        } else {
          toast.error("Invalid email or password! Please sign up first. 🚫", { id: toastId });
        }
      } catch (error) {
        toast.error("Server error. Please try again later. 🔌", { id: toastId });
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950 p-4 sm:p-8 font-sans transition-colors duration-300">
      <div className="w-full max-w-5xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] dark:shadow-none border border-white dark:border-slate-800 overflow-hidden flex flex-col md:flex-row transition-all duration-500">
        
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-500 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-white opacity-10 rounded-full blur-3xl mix-blend-overlay animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-yellow-300 opacity-20 rounded-full blur-3xl mix-blend-overlay"></div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-lg transform -rotate-6 hover:rotate-0 transition-transform duration-300">
              <Zap size={32} className="text-yellow-300" fill="currentColor" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">
              CampusClub.
            </h1>
          </div>

          <div className="relative z-10 space-y-6">
            <h2 className="text-5xl font-black leading-tight drop-shadow-sm">
              Level up your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-200">
                campus life! 🚀
              </span>
            </h2>
            <p className="text-lg text-white/90 max-w-md leading-relaxed font-medium">
              Join the ultimate student hub. Discover awesome events, connect
              with your peers, and make unforgettable memories.
            </p>
          </div>

          <div className="relative z-10">
            <p className="text-sm font-bold text-white/80 mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-300" /> Join 500+ active students
            </p>
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-fuchsia-500 bg-gray-200 overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer shadow-lg">
                  <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="Student" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center relative bg-white dark:bg-slate-900 transition-colors">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
              What's up! 👋
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Ready to catch up on the latest campus buzz?
            </p>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Student Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-600 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="name@campus.edu"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 ${
                    formik.touched.email && formik.errors.email
                      ? "border-red-400 focus:border-red-500 bg-red-50 dark:bg-red-950/30"
                      : "border-gray-100 dark:border-slate-700 focus:border-violet-500 bg-gray-50 dark:bg-slate-800"
                  } focus:bg-white dark:focus:bg-slate-900 dark:text-white outline-none transition-all duration-300 focus:-translate-y-1 focus:shadow-lg`}
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="mt-2 text-sm font-medium text-red-500 flex items-center gap-1 animate-bounce">
                  {formik.errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-600 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border-2 ${
                    formik.touched.password && formik.errors.password
                      ? "border-red-400 focus:border-red-500 bg-red-50 dark:bg-red-950/30"
                      : "border-gray-100 dark:border-slate-700 focus:border-violet-500 bg-gray-50 dark:bg-slate-800"
                  } focus:bg-white dark:focus:bg-slate-900 dark:text-white outline-none transition-all duration-300 focus:-translate-y-1 focus:shadow-lg`}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-violet-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <a href="#" className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:text-fuchsia-500 transition-colors">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={!formik.isValid || formik.isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-black py-4 px-4 rounded-2xl hover:from-violet-700 hover:to-fuchsia-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-fuchsia-500/30 dark:hover:shadow-fuchsia-900/30 disabled:opacity-70 mt-4"
            >
              Let's Go! <Rocket size={20} />
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            New to the campus?{" "}
            <Link to="/signup" className="font-black text-violet-600 dark:text-violet-400 hover:text-fuchsia-500 underline decoration-2 underline-offset-4">
              Join the club
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}