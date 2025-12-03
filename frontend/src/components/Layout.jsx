import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';

const Layout = () => {
    return (
        <div className="min-h-screen bg-background font-sans text-foreground antialiased">
            <Navbar />
            <main className="container-width py-8">
                <Outlet />
            </main>
        </div>
    );
};

export const ProtectedRoute = ({ requiredPermission }) => {
    const { user, loading, hasPermission } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    console.log('ProtectedRoute check:', { user: !!user, loading, requiredPermission });

    if (!user) {
        console.log('No user, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default Layout;
