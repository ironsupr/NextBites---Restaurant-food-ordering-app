import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/Button';
import { ShoppingCart, CreditCard, User, MapPin, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AllCartsPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, hasPermission } = useAuth();
    const [selectedCart, setSelectedCart] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const canCancel = hasPermission('cancel_order');

    // Only admins and managers can access this page
    if (user?.role === 'team_member') {
        return (
            <div className="text-center py-16">
                <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
                <p className="text-muted-foreground">Only admins and managers can view all carts.</p>
            </div>
        );
    }

    // Fetch all carts
    const { data: carts = [], isLoading, refetch } = useQuery({
        queryKey: ['allCarts'],
        queryFn: async () => {
            const response = await api.get('/orders/all-carts');
            return response.data;
        }
    });

    // Fetch users for display
    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            try {
                const response = await api.get('/users/');
                return response.data;
            } catch {
                return [];
            }
        }
    });

    // Fetch restaurants for display
    const { data: restaurants = [] } = useQuery({
        queryKey: ['restaurants'],
        queryFn: async () => {
            const response = await api.get('/restaurants/');
            return response.data;
        }
    });

    // Fetch payment methods for selected cart's user
    const { data: paymentMethods = [] } = useQuery({
        queryKey: ['paymentMethods', selectedCart?.user_id],
        queryFn: async () => {
            if (!selectedCart) return [];
            const response = await api.get(`/payment-methods/?user_id=${selectedCart.user_id}`);
            return response.data;
        },
        enabled: !!selectedCart
    });

    // Checkout mutation
    const checkoutMutation = useMutation({
        mutationFn: async ({ orderId, paymentMethodId }) => {
            const response = await api.post(`/orders/${orderId}/checkout`, {
                payment_method_id: paymentMethodId
            });
            return response.data;
        },
        onSuccess: () => {
            alert('Order checked out successfully!');
            setShowPaymentModal(false);
            setSelectedCart(null);
            refetch();
        },
        onError: (error) => {
            alert(`Checkout failed: ${error.response?.data?.detail || error.message}`);
        }
    });

    // Cancel cart mutation
    const cancelCartMutation = useMutation({
        mutationFn: async (orderId) => {
            await api.delete(`/orders/${orderId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allCarts']);
            refetch();
        },
        onError: (error) => {
            alert(`Cancel failed: ${error.response?.data?.detail || error.message}`);
        }
    });

    const getUserName = (userId) => {
        const u = users.find(u => u.id === userId);
        return u ? u.full_name || u.email : `User #${userId}`;
    };

    const getUserUid = (userId) => {
        const u = users.find(u => u.id === userId);
        return u?.user_uid || `ID: ${userId}`;
    };

    const getRestaurantName = (restaurantId) => {
        const r = restaurants.find(r => r.id === restaurantId);
        return r ? r.name : `Restaurant #${restaurantId}`;
    };

    const filteredCarts = carts.filter(cart => {
        const searchLower = searchTerm.toLowerCase();
        const userName = getUserName(cart.user_id).toLowerCase();
        const userUid = getUserUid(cart.user_id).toLowerCase();
        const restaurantName = getRestaurantName(cart.restaurant_id).toLowerCase();
        const orderId = cart.id.toString();

        return userName.includes(searchLower) ||
               userUid.includes(searchLower) ||
               restaurantName.includes(searchLower) ||
               orderId.includes(searchLower);
    });

    const handleCheckout = (cart) => {
        setSelectedCart(cart);
        setShowPaymentModal(true);
    };

    const handleConfirmCheckout = (paymentMethodId) => {
        checkoutMutation.mutate({
            orderId: selectedCart.id,
            paymentMethodId: paymentMethodId
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold text-foreground">All User Carts</h1>
                
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by user, ID, or restaurant..."
                        className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg leading-5 bg-background placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {filteredCarts.length === 0 ? (
                <div className="text-center py-16 bg-muted/30 rounded-xl">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                        {searchTerm ? 'No matching carts found' : 'No active carts'}
                    </h2>
                    <p className="text-muted-foreground">
                        {searchTerm ? 'Try adjusting your search terms.' : 'No users currently have items in their cart.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredCarts.map((cart) => (
                        <div key={cart.id} className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                            <div className="p-6">
                                {/* Cart Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">{getUserName(cart.user_id)}</h3>
                                            <p className="text-sm text-muted-foreground">{getUserUid(cart.user_id)} • {getRestaurantName(cart.restaurant_id)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-primary">${cart.total_amount?.toFixed(2) || '0.00'}</p>
                                        <p className="text-sm text-muted-foreground">{cart.order_items?.length || 0} items</p>
                                    </div>
                                </div>

                                {/* Cart Items */}
                                <div className="border-t border-border pt-4 mb-4">
                                    <div className="space-y-2">
                                        {cart.order_items?.map((item) => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    {item.menu_item_name || `Item #${item.menu_item_id}`} x{item.quantity}
                                                </span>
                                                <span className="text-gray-900">${(item.price_at_time * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3">
                                    {canCancel && (
                                        <Button
                                            variant="outline"
                                            onClick={() => cancelCartMutation.mutate(cart.id)}
                                            disabled={cancelCartMutation.isPending}
                                            className="flex items-center gap-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Cancel Cart
                                        </Button>
                                    )}
                                    <Button onClick={() => handleCheckout(cart)} className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" />
                                        Checkout for User
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Payment Method Modal */}
            {showPaymentModal && selectedCart && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h2 className="text-xl font-bold text-foreground mb-4">Select Payment Method</h2>
                        <p className="text-muted-foreground mb-4">
                            Checking out cart for {getUserName(selectedCart.user_id)}
                        </p>

                        {paymentMethods.length === 0 ? (
                            <div className="text-center py-8 bg-muted/30 rounded-lg mb-4">
                                <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground">No payment methods found for this user.</p>
                                <p className="text-sm text-muted-foreground mt-1">Add a payment method first.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 mb-4">
                                {paymentMethods.map((pm) => (
                                    <button
                                        key={pm.id}
                                        onClick={() => handleConfirmCheckout(pm.id)}
                                        disabled={checkoutMutation.isPending}
                                        className="w-full p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left flex items-center gap-3"
                                    >
                                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium text-foreground">{pm.brand} •••• {pm.last4}</p>
                                            {pm.is_default && <span className="text-xs text-primary">Default</span>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setSelectedCart(null);
                                }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllCartsPage;
