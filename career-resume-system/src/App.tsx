import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AppLayout from '@/components/layout/AppLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Assessment from '@/pages/Assessment';
import AssessmentQuiz from '@/pages/AssessmentQuiz';
import AssessmentReport from '@/pages/AssessmentReport';
import ResumeList from '@/pages/ResumeList';
import ResumeEditor from '@/pages/ResumeEditor';
import Career from '@/pages/Career';
import AIAssistant from '@/pages/AIAssistant';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/assessment/:type" element={<AssessmentQuiz />} />
          <Route path="/assessment/:type/report" element={<AssessmentReport />} />
          <Route path="/resumes" element={<ResumeList />} />
          <Route path="/resumes/:id" element={<ResumeEditor />} />
          <Route path="/career" element={<Career />} />
          <Route path="/assistant" element={<AIAssistant />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
