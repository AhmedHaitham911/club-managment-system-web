import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import {
  User, Mail, Lock, Eye, EyeOff, Fingerprint, PartyPopper, Zap, Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

export default function SignUp() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: { fullName: "", studentId: "", email: "", password: "", confirmPassword: "" },
    validationSchema: Yup.object({
      fullName: Yup.string().min(3).required("Tell us your name! 👤"),
      studentId: Yup.string().matches(/^[0-9]+$/).min(5).required("Student ID is required 🎓"),
      email: Yup.string().email().required("We need your email to let you in! 📩"),
      password: Yup.string().min(6).required("You definitely need a password! 🔑"),
      confirmPassword: Yup.string().oneOf([Yup.ref("password"), null]).required("Please confirm your password 🔄"),
    }),
    onSubmit: async (values) => {
      const toastId = toast.loading("Creating your awesome profile...");
      try {
        const checkUser = await axios.get(`http://localhost:5000/users?email=${values.email}`);
        if (checkUser.data.length > 0) {
          toast.error("This email is already registered! 😅", { id: toastId });
          return;
        }
        
        // 🚀 شلنا الهاردكود بتاع كلمة admin، دلوقتي الكل Pending والكل بيستنى موافقة
        const newUser = {
          name: values.fullName,
          studentId: values.studentId,
          email: values.email,
          password: values.password,
          role: "Member", // رتبة مبدئية، الأدمن هيغيرها وهو بيوافق
          status: "Pending" 
        };
        
        await axios.post("http://localhost:5000/users", newUser);
        
        toast.success("Verification email sent! Account is pending Admin approval. 📩", { id: toastId, duration: 5000 });
        navigate("/login");
        
      } catch (error) {
        toast.error("Something went wrong. Try again! 🚫", { id: toastId });
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950 p-4 sm:p-8 font-sans transition-colors duration-300">
      <div className="w-full max-w-6xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] dark:shadow-none border border-white dark:border-slate-800 overflow-hidden flex flex-col md:flex-row-reverse transition-all duration-500">
        
        <div className="hidden md:flex md:w-[45%] bg-gradient-to-bl from-orange-400 via-pink-500 to-violet-600 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-white opacity-10 rounded-full blur-3xl mix-blend-overlay animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-yellow-300 opacity-20 rounded-full blur-3xl mix-blend-overlay"></div>

          <div className="relative z-10 flex justify-end items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">CampusClub.</h1>
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-lg transform rotate-6 hover:rotate-0 transition-transform duration-300">
              <Zap size={32} className="text-yellow-300" fill="currentColor" />
            </div>
          </div>

          <div className="relative z-10 space-y-6 text-right">
            <h2 className="text-5xl font-black leading-tight drop-shadow-sm">
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-yellow-300 to-orange-200">Join the squad!</span> <br />
              Be part of it. ✌️
            </h2>
            <p className="text-lg text-white/90 max-w-md ml-auto font-medium">
              Unlock exclusive events, connect with amazing people, and make your college years unforgettable.
            </p>
          </div>

          <div className="relative z-10 flex justify-end">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20 inline-block">
              <p className="text-sm font-bold flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-300" /> "The best decision I made on campus!"
              </p>
              <p className="text-xs text-white/70 mt-1">- Ahmed, CS Senior</p>
            </div>
          </div>
        </div>

        <div className="w-full md:w-[55%] p-8 sm:p-12 flex flex-col justify-center relative bg-white dark:bg-slate-900 transition-colors">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Claim your spot! 🎟️</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Create an account to dive into the campus life.</p>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-pink-500">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="John Doe"
                    className={`w-full pl-11 pr-4 py-3 rounded-2xl border-2 ${
                      formik.touched.fullName && formik.errors.fullName ? "border-red-400 bg-red-50 dark:bg-red-950/30" : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800"
                    } focus:bg-white dark:focus:bg-slate-900 dark:text-white outline-none transition-all focus:border-pink-500`}
                    value={formik.values.fullName} onChange={formik.handleChange} onBlur={formik.handleBlur}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Student ID</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-pink-500">
                    <Fingerprint size={18} />
                  </div>
                  <input
                    type="text"
                    name="studentId"
                    placeholder="20240012"
                    className={`w-full pl-11 pr-4 py-3 rounded-2xl border-2 ${
                      formik.touched.studentId && formik.errors.studentId ? "border-red-400 bg-red-50 dark:bg-red-950/30" : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800"
                    } focus:bg-white dark:focus:bg-slate-900 dark:text-white outline-none transition-all focus:border-pink-500`}
                    value={formik.values.studentId} onChange={formik.handleChange} onBlur={formik.handleBlur}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Student Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-pink-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="name@campus.edu"
                  className={`w-full pl-11 pr-4 py-3 rounded-2xl border-2 ${
                    formik.touched.email && formik.errors.email ? "border-red-400 bg-red-50 dark:bg-red-950/30" : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800"
                  } focus:bg-white dark:focus:bg-slate-900 dark:text-white outline-none transition-all focus:border-pink-500`}
                  value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-pink-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    className={`w-full pl-11 pr-10 py-3 rounded-2xl border-2 ${
                      formik.touched.password && formik.errors.password ? "border-red-400 bg-red-50 dark:bg-red-950/30" : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800"
                    } focus:bg-white dark:focus:bg-slate-900 dark:text-white outline-none transition-all focus:border-pink-500`}
                    value={formik.values.password} onChange={formik.handleChange} onBlur={formik.handleBlur}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-pink-500">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-pink-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="••••••••"
                    className={`w-full pl-11 pr-10 py-3 rounded-2xl border-2 ${
                      formik.touched.confirmPassword && formik.errors.confirmPassword ? "border-red-400 bg-red-50 dark:bg-red-950/30" : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800"
                    } focus:bg-white dark:focus:bg-slate-900 dark:text-white outline-none transition-all focus:border-pink-500`}
                    value={formik.values.confirmPassword} onChange={formik.handleChange} onBlur={formik.handleBlur}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-pink-500">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={!formik.isValid || formik.isSubmitting} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-black py-4 px-4 rounded-2xl hover:from-pink-600 hover:to-orange-500 transition-all mt-6">
              Create Account <PartyPopper size={20} />
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            Already a member? <Link to="/login" className="font-black text-pink-500 hover:text-orange-400 underline decoration-2 underline-offset-4">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}