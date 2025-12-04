// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import { useSupabaseUser } from './hooks/useSupabaseUser'; // like above
import type { JSX } from 'react';
import Dashboard from './pages/Dashboard';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useSupabaseUser();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user === null) {
    console.log('Hekko');
    
    // not logged in
    return <Navigate to="/auth" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/app" />} />
      </Routes>
    </BrowserRouter>
  );
}
