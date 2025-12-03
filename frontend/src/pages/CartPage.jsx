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

    // Fetch current cart (user can only have one)
    const { data: cart, isLoading, refetch: refetchCart } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const response = await api.get('/orders/');
            return response.data.find(o => o.status === 'cart') || null;
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
                <div className="mx-auto h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-8">Looks like you haven't added anything yet.</p>
                <Link to="/restaurants">
                    <Button>Browse Restaurants</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-8">Your Cart</h1>

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 space-y-6">
                    {cart.order_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-4 border-b border-border last:border-0">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                                    <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">{item.menu_item_name || `Item #${item.menu_item_id}`}</h3>
                                    <p className="text-sm text-muted-foreground">${item.price_at_time} x {item.quantity}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <span className="font-medium text-foreground">
                                    ${(item.price_at_time * item.quantity).toFixed(2)}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItemMutation.mutate({ orderId: cart.id, itemId: item.id })}
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-muted/30 p-6 border-t border-border">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-lg font-medium text-foreground">Total</span>
                        <span className="text-2xl font-bold text-primary">${cart.total_amount?.toFixed(2) || '0.00'}</span>
                    </div>

                    {/* Show warning for Team Members */}
                    {!canCheckout && (
                        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-800">Checkout not available</p>
                                <p className="text-sm text-amber-700">As a Team Member, you cannot checkout orders. Please ask a Manager or Admin to complete this order.</p>
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
