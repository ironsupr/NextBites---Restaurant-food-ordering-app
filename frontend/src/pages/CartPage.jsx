import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/Button';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const CartPage = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Fetch current cart (pending order)
    const { data: cart, isLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            // In a real app, we'd have a specific endpoint for "current cart"
            // For now, we'll fetch all orders and find the one with status 'cart'
            const response = await api.get('/orders');
            return response.data.find(o => o.status === 'cart');
        },
    });

    // Remove item mutation
    const removeItemMutation = useMutation({
        mutationFn: async ({ orderId, itemId }) => {
            await api.delete(`/orders/${orderId}/items/${itemId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['cart']);
        },
    });

    if (isLoading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
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
                    {cart.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                        src={item.menu_item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                                        alt={item.menu_item.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-medium text-secondary">{item.menu_item.name}</h3>
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
                        <span className="text-2xl font-bold text-primary">${cart.total_amount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-end">
                        <Link to={`/checkout/${cart.id}`}>
                            <Button size="lg" className="w-full sm:w-auto">
                                Proceed to Checkout
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
