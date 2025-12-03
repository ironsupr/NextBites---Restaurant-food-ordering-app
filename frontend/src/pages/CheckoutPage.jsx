import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../utils/api';
import Button from '../components/Button';
import { CreditCard, ArrowLeft, Check, ShoppingBag } from 'lucide-react';

const CheckoutPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [error, setError] = useState(null);

    // Fetch order details
    const { data: order, isLoading: orderLoading } = useQuery({
        queryKey: ['order', orderId],
        queryFn: async () => {
            const response = await api.get(`/orders/${orderId}`);
            return response.data;
        },
    });

    // Fetch payment methods
    const { data: paymentMethods = [], isLoading: pmLoading } = useQuery({
        queryKey: ['paymentMethods'],
        queryFn: async () => {
            const response = await api.get('/payment-methods/');
            return response.data;
        },
    });

    // Checkout mutation
    const checkoutMutation = useMutation({
        mutationFn: async (paymentMethodId) => {
            const response = await api.post(`/orders/${orderId}/checkout`, {
                payment_method_id: paymentMethodId
            });
            return response.data;
        },
        onSuccess: () => {
            navigate('/orders');
        },
        onError: (err) => {
            setError(err.response?.data?.detail || 'Checkout failed. Please try again.');
        }
    });

    const handleCheckout = () => {
        if (!selectedPaymentMethod) {
            setError('Please select a payment method');
            return;
        }
        setError(null);
        checkoutMutation.mutate(selectedPaymentMethod);
    };

    if (orderLoading || pmLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-16">
                <h2 className="text-2xl font-bold text-foreground mb-2">Order not found</h2>
                <Link to="/cart">
                    <Button>Go to Cart</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Link to="/cart" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cart
            </Link>

            <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>

            {/* Order Summary */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Order Summary
                </h2>
                <div className="space-y-3 mb-4">
                    {order.order_items?.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                {item.menu_item_name || `Item #${item.menu_item_id}`} x{item.quantity}
                            </span>
                            <span className="font-medium text-foreground">
                                ${(item.price_at_time * item.quantity).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="border-t border-border pt-4 flex justify-between">
                    <span className="text-lg font-semibold text-foreground">Total</span>
                    <span className="text-2xl font-bold text-primary">
                        ${order.total_amount?.toFixed(2) || '0.00'}
                    </span>
                </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Method
                </h2>

                {paymentMethods.length === 0 ? (
                    <div className="text-center py-8 bg-muted/30 rounded-lg">
                        <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">No payment methods available.</p>
                        <Link to="/admin/payments">
                            <Button variant="outline">Add Payment Method</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {paymentMethods.map((pm) => (
                            <button
                                key={pm.id}
                                onClick={() => setSelectedPaymentMethod(pm.id)}
                                className={`w-full p-4 border rounded-xl text-left flex items-center gap-4 transition-all ${
                                    selectedPaymentMethod === pm.id
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                                }`}
                            >
                                <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-foreground capitalize">
                                        {pm.brand} •••• {pm.last4}
                                    </p>
                                    {pm.is_default && (
                                        <span className="text-xs text-primary">Default</span>
                                    )}
                                </div>
                                {selectedPaymentMethod === pm.id && (
                                    <Check className="h-5 w-5 text-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                    {error}
                </div>
            )}

            {/* Checkout Button */}
            <Button
                size="lg"
                className="w-full"
                onClick={handleCheckout}
                disabled={checkoutMutation.isPending || !selectedPaymentMethod}
            >
                {checkoutMutation.isPending ? 'Processing...' : `Pay $${order.total_amount?.toFixed(2) || '0.00'}`}
            </Button>
        </div>
    );
};

export default CheckoutPage;
