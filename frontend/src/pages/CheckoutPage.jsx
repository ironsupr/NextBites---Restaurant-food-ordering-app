import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../utils/api';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';

// Initialize Stripe (use your publishable key)
const stripePromise = loadStripe('pk_test_51O...'); // Replace with actual key from env

const CheckoutForm = ({ orderId, totalAmount }) => {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const { user } = useAuth();

    // Fetch payment methods (for admin/manager who might have saved cards)
    // For this demo, we'll just use a new card via Elements

    const checkoutMutation = useMutation({
        mutationFn: async (paymentMethodId) => {
            await api.post(`/orders/${orderId}/checkout`, {
                payment_method_id: paymentMethodId
            });
        },
        onSuccess: () => {
            navigate('/orders');
        },
        onError: (err) => {
            setError(err.response?.data?.detail || 'Payment failed');
            setProcessing(false);
        }
    });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);
        setError(null);

        if (!stripe || !elements) {
            return;
        }

        const cardElement = elements.getElement(CardElement);

        // Create Payment Method
        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
        });

        if (error) {
            setError(error.message);
            setProcessing(false);
        } else {
            // In a real app, we'd save this payment method to backend first
            // For now, we'll assume the backend can handle the raw stripe ID 
            // or we need to create a PaymentMethod record first.
            // Based on backend implementation:
            // POST /payment-methods/ needs { stripe_payment_method_id, last4, brand }

            try {
                // 1. Save payment method to backend
                const pmResponse = await api.post('/payment-methods/', {
                    stripe_payment_method_id: paymentMethod.id,
                    last4: paymentMethod.card.last4,
                    brand: paymentMethod.card.brand,
                    is_default: true
                });

                const backendPmId = pmResponse.data.id;

                // 2. Checkout with backend ID
                checkoutMutation.mutate(backendPmId);

            } catch (err) {
                setError('Failed to save payment method');
                setProcessing(false);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                            },
                            invalid: {
                                color: '#9e2146',
                            },
                        },
                    }}
                />
            </div>

            {error && (
                <div className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">
                    {error}
                </div>
            )}

            <Button
                type="submit"
                disabled={!stripe || processing}
                isLoading={processing}
                className="w-full"
                size="lg"
            >
                Pay ${totalAmount.toFixed(2)}
            </Button>
        </form>
    );
};

const CheckoutPage = () => {
    const { orderId } = useParams();
    const { data: order, isLoading } = useQuery({
        queryKey: ['order', orderId],
        queryFn: async () => {
            const response = await api.get(`/orders/${orderId}`);
            return response.data;
        },
    });

    if (isLoading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6">Checkout</h1>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-border mb-6">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-muted-foreground">Order Total</span>
                    <span className="text-2xl font-bold text-primary">${order.total_amount.toFixed(2)}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                    Order #{order.id} • {order.items.length} items
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-border">
                <h2 className="text-lg font-medium text-foreground mb-4">Payment Details</h2>
                <Elements stripe={stripePromise}>
                    <CheckoutForm orderId={order.id} totalAmount={order.total_amount} />
                </Elements>
            </div>
        </div>
    );
};

export default CheckoutPage;
