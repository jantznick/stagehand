import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/useAuthStore';
import SuperAdminPage from './pages/SuperAdminPage';
import SuperAdminLoginPage from './pages/SuperAdminLoginPage';
import './index.css';

const AdminApp = () => {
    const { user, isSuperAdmin } = useAuthStore();

    // A simple private route for the admin context
    const PrivateRoute = ({ children }) => {
        if (!user) return <Navigate to="/login" />;
        // Add an extra check for isSuperAdmin for added security on the client side.
        if (!isSuperAdmin) return <Navigate to="/login" />;
        return children;
    };

    return (
        <Routes>
            <Route path="/login" element={user && isSuperAdmin ? <Navigate to="/" /> : <SuperAdminLoginPage />} />
            <Route 
                path="/" 
                element={
                    <PrivateRoute>
                        <SuperAdminPage />
                    </PrivateRoute>
                } 
            />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
        <AdminApp />
    </Router>
  </React.StrictMode>
);
