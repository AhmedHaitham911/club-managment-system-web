import { useContext, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthContext } from "../context/auth-context";

export default function ProtectedRoute() {
  const { user, authReady } = useContext(AuthContext);

  useEffect(() => {
    if (authReady && !user) {
      toast.error("You need to sign in to view this page.", {
        id: "auth-guard",
      });
    }
  }, [authReady, user]);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          Checking session...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
