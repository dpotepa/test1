import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LobbyPage from './pages/LobbyPage';
import SessionPage from './pages/SessionPage';
import HistoryPage from './pages/HistoryPage';
import api from './api/client';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-950">
      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function JoinRedirect() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate(`/login?redirect=/join/${inviteCode}`);
      return;
    }
    api.post(`/sessions/join/${inviteCode}`)
      .then((res) => navigate(`/session/${res.data.id}`))
      .catch(() => navigate('/'));
  }, [user, loading, inviteCode]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-950">
      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/join/:inviteCode" element={<JoinRedirect />} />
          <Route path="/" element={<ProtectedRoute><LobbyPage /></ProtectedRoute>} />
          <Route path="/session/:id" element={<ProtectedRoute><SessionPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        </Routes>
        <Navbar />
      </BrowserRouter>
    </AuthProvider>
  );
}
