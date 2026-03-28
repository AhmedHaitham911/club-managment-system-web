import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext'; // 🚀 استدعاء الـ Theme

import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';

import Home from './pages/home/Home';
import Events from './pages/events/Events';
import Members from './pages/members/Members';
import Announcements from './pages/announcements/Announcements';
import Gallery from './pages/gallery/Gallery';
import Profile from './pages/profile/Profile'; // 🚀 استدعاء البروفايل
import AdminChat from './pages/chat/AdminChat'; // 🚀 استدعاء الأدمن شات (اتأكد من مسار الفولدر بتاعك)

import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';

const router = createBrowserRouter([
  { 
    path: '/', 
    element: <MainLayout />, 
    children: [
      { index: true, element: <Home /> }, 
      { path: 'events', element: <Events /> },
      {
        element: <ProtectedRoute />, 
        children: [
          { path: 'members', element: <Members /> },
          { path: 'announcements', element: <Announcements /> },
          { path: 'gallery', element: <Gallery /> },
          { path: 'profile', element: <Profile /> }, // 🚀 المسار الجديد
          { path: 'admin-chat', element: <AdminChat /> }, // 🚀 ضفنا المسار بتاع الشات هنا

        ]
      }
    ]
  },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <SignUp /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function App() {
  return (
    <ThemeProvider> {/* 🚀 غلفنا التطبيق كله بالثيم */}
      <AuthProvider>
        <Toaster position="top-center" />
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}