import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../utils/api';
import Button from '../components/Button';
import { CreditCard, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Form component to handle Stripe Elements
const AddPaymentMethodForm = ({ onSuccess, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [isDefault, setIsDefault] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError(null);

        const { error: submitError } = await elements.submit();
        if (submitError) {
            setError(submitError.message);
            setProcessing(false);
            return;
        }

        const { setupIntent, error: confirmError } = await stripe.confirmSetup({
            elements,
            confirmParams: {
                return_url: window.location.href,
            },
            redirect: 'if_required',
        });

        if (confirmError) {
            setError(confirmError.message);
            setProcessing(false);
        } else {
            // Send the payment method ID to backend
            try {
                const { paymentMethod } = await stripe.retrievePaymentMethod(setupIntent.payment_method);
                
                await api.post('/payment-methods/', {
                    stripe_payment_method_id: paymentMethod.id,
                    last4: paymentMethod.card.last4,
                    brand: paymentMethod.card.brand,
                    is_default: isDefault
                });
                
                onSuccess();
            } catch (err) {
                setError(err.response?.data?.detail || err.message);
                setProcessing(false);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            
            <div className="flex items-center gap-2 mt-4">
                <input
                    type="checkbox"
                    id="isDefault"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700">
                    Set as default payment method
                </label>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}
            
            <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                    Cancel
                </Button>
                <Button type="submit" disabled={!stripe || processing} className="flex-1">
                    {processing ? 'Processing...' : 'Add Card'}
                </Button>
            </div>
        </form>
    );
};

const PaymentMethodsPage = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [showAddModal, setShowAddModal] = useState(false);
    const [stripePromise, setStripePromise] = useState(null);
    const [clientSecret, setClientSecret] = useState('');

    // Fetch Stripe config
    useEffect(() => {
        api.get('/payment-methods/config').then(res => {
            setStripePromise(loadStripe(res.data.publishableKey));
        });
    }, []);

    const { data: paymentMethods, isLoading } = useQuery({
        queryKey: ['paymentMethods'],
        queryFn: async () => {
            const response = await api.get('/payment-methods/');
            return response.data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/payment-methods/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
        },
    });

    const handleAddClick = async () => {
        try {
            const res = await api.post('/payment-methods/setup-intent');
            setClientSecret(res.data.client_secret);
            setShowAddModal(true);
        } catch (error) {
            console.error('Setup intent error:', error);
            alert(`Failed to initialize payment setup: ${error.response?.data?.detail || error.message}`);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-foreground">Payment Methods</h1>
                <Button onClick={handleAddClick} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Payment Method
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                {paymentMethods?.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        No payment methods found.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {paymentMethods?.map((pm) => (
                            <div key={pm.id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-foreground capitalize">
                                            {pm.brand} •••• {pm.last4}
                                        </div>
                                        {pm.is_default && (
                                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-accent"
                                    onClick={() => deleteMutation.mutate(pm.id)}
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Payment Method Modal */}
            {showAddModal && clientSecret && stripePromise && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h2 className="text-xl font-bold text-foreground mb-4">Add Payment Method</h2>
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <AddPaymentMethodForm 
                                onSuccess={() => {
                                    setShowAddModal(false);
                                    queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
                                }}
                                onCancel={() => setShowAddModal(false)}
                            />
                        </Elements>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentMethodsPage;
