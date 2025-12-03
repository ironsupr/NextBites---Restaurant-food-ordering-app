import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Layout, { ProtectedRoute } from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RestaurantsPage from './pages/RestaurantsPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import CheckoutPage from './pages/CheckoutPage';
import UserManagementPage from './pages/UserManagementPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import AllCartsPage from './pages/AllCartsPage';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        {/* Protected Routes */}
                        <Route element={<Layout />}>
                            <Route path="/" element={<Navigate to="/restaurants" replace />} />
                            <Route path="/restaurants" element={<RestaurantsPage />} />
                            <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />

                            <Route element={<ProtectedRoute />}>
                                <Route path="/orders" element={<OrdersPage />} />
                                <Route path="/cart" element={<CartPage />} />
                                <Route path="/checkout/:orderId" element={<CheckoutPage />} />
                            </Route>

                            <Route element={<ProtectedRoute requiredPermission="checkout" />}>
                                <Route path="/admin/carts" element={<AllCartsPage />} />
                            </Route>

                            <Route element={<ProtectedRoute requiredPermission="manage_users" />}>
                                <Route path="/admin/users" element={<UserManagementPage />} />
                            </Route>

                            <Route element={<ProtectedRoute requiredPermission="update_payment" />}>
                                <Route path="/admin/payments" element={<PaymentMethodsPage />} />
                            </Route>
                        </Route>
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
