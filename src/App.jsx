import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

import Home from "./pages/home/Home";
import Events from "./pages/events/Events";
import Members from "./pages/members/Members";
import Announcements from "./pages/announcements/Announcements";
import Gallery from "./pages/gallery/Gallery";
import Profile from "./pages/profile/Profile";
import AdminChat from "./pages/chat/AdminChat";

import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <Home /> },
          { path: "events", element: <Events /> },
          { path: "members", element: <Members /> },
          { path: "announcements", element: <Announcements /> },
          { path: "gallery", element: <Gallery /> },
          { path: "profile", element: <Profile /> },
          { path: "admin-chat", element: <AdminChat /> },
        ],
      },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <SignUp /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-center" />
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}
