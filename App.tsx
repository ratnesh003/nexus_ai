import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import ProjectList from './components/ProjectList';
import TransformationView from './components/TransformationView';
import ChatDataView from './components/ChatDataView';
import DashboardView from './components/DashboardView';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import { db } from './services/mockDb';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const user = db.getUser();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      
      <Route path="/projects" element={
          <ProtectedRoute>
              <Layout />
          </ProtectedRoute>
      }>
        <Route index element={<ProjectList />} />
        <Route path=":projectId" element={<ProjectRouteHandler type="transform" />} />
        <Route path=":projectId/chat" element={<ProjectRouteHandler type="chat" />} />
        <Route path=":projectId/dashboard" element={<ProjectRouteHandler type="dashboard" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Helper to extract ID and render correct view
const ProjectRouteHandler: React.FC<{ type: 'transform' | 'chat' | 'dashboard' }> = ({ type }) => {
    const { projectId } = useParams();

    if (!projectId) return <div>Project ID missing</div>;

    switch (type) {
        case 'transform': return <TransformationView projectId={projectId} />;
        case 'chat': return <ChatDataView projectId={projectId} />;
        case 'dashboard': return <DashboardView projectId={projectId} />;
        default: return null;
    }
};

export default App;
