import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/Button';
import { Trash2, ShoppingBag, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const CartPage = () => {
    const queryClient = useQueryClient();
    const { hasPermission } = useAuth();

    // Check if user can checkout (Admin and Manager only)
    const canCheckout = hasPermission('checkout');

    // Fetch current cart (pending order)
    const { data: cart, isLoading, refetch: refetchCart } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const response = await api.get('/orders/');
            // Get all carts and find the most recent one with items
            const carts = response.data.filter(o => o.status === 'cart');
            const cartsWithItems = carts.filter(c => c.order_items && c.order_items.length > 0);
            // Return the most recent cart with items, or null if none
            return cartsWithItems[cartsWithItems.length - 1] || null;
        },
        staleTime: 0,
        refetchOnMount: true
    });

    // Remove item mutation
    const removeItemMutation = useMutation({
        mutationFn: async ({ orderId, itemId }) => {
            await api.delete(`/orders/${orderId}/items/${itemId}`);
        },
        onSuccess: async () => {
            await refetchCart();
        }
    });

    if (isLoading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>;
    }

    if (!cart || !cart.order_items || cart.order_items.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="h-8 w-8 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-secondary mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
                <Link to="/restaurants">
                    <Button>Browse Restaurants</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-secondary mb-8">Your Cart</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 space-y-6">
                    {cart.order_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <ShoppingBag className="h-6 w-6 text-gray-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-secondary">{item.menu_item_name || `Item #${item.menu_item_id}`}</h3>
                                    <p className="text-sm text-gray-500">${item.price_at_time} x {item.quantity}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <span className="font-medium text-secondary">
                                    ${(item.price_at_time * item.quantity).toFixed(2)}
                                </span>
                                <button
                                    onClick={() => removeItemMutation.mutate({ orderId: cart.id, itemId: item.id })}
                                    className="text-gray-400 hover:text-accent transition-colors"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-gray-50 p-6 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-lg font-medium text-secondary">Total</span>
                        <span className="text-2xl font-bold text-primary">${cart.total_amount?.toFixed(2) || '0.00'}</span>
                    </div>

                    {/* Show warning for Team Members */}
                    {!canCheckout && (
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-yellow-800">Checkout not available</p>
                                <p className="text-sm text-yellow-700">As a Team Member, you cannot checkout orders. Please ask a Manager or Admin to complete this order.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        {canCheckout ? (
                            <Link to={`/checkout/${cart.id}`}>
                                <Button size="lg" className="w-full sm:w-auto">
                                    Proceed to Checkout
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                        ) : (
                            <Button size="lg" className="w-full sm:w-auto" disabled>
                                Checkout Not Allowed
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
