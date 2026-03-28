  import { useContext } from "react";
  import { Navigate, Outlet } from "react-router-dom";
  import { AuthContext } from "../context/AuthContext"; // اتأكد من مسار الكونتكست
  import toast from "react-hot-toast";

  export default function ProtectedRoute() {
    const { user } = useContext(AuthContext);

    if (!user) {
      // تأخير بسيط للرسالة عشان تظهر مع تغيير الصفحة
      setTimeout(() => {
        toast.error("You need to sign in to view this page! 🔒", {
          id: "auth-guard",
        });
      }, 100);

      return <Navigate to="/login" replace />;
    }

    return <Outlet />;
  }
