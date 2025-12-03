import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import Button from '../components/Button';
import Input from '../components/Input';
import { CreditCard, Trash2, Plus, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PaymentMethodsPage = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [cardLast4, setCardLast4] = useState('');
    const [cardBrand, setCardBrand] = useState('visa');
    const [isDefault, setIsDefault] = useState(false);

    // Fetch users for admin
    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await api.get('/users/');
            return response.data;
        },
        enabled: isAdmin
    });

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

    const addMutation = useMutation({
        mutationFn: async (data) => {
            const response = await api.post('/payment-methods/', data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
            setShowAddModal(false);
            if (data.length > 1) {
                alert(`Payment method added for ${data.length} users!`);
            }
            resetForm();
        },
        onError: (error) => {
            alert(`Failed to add payment method: ${error.response?.data?.detail || error.message}`);
        }
    });

    const resetForm = () => {
        setSelectedUserId('');
        setCardLast4('');
        setCardBrand('visa');
        setIsDefault(false);
    };

    const handleAddPaymentMethod = (e) => {
        e.preventDefault();
        if (!cardLast4 || cardLast4.length !== 4) {
            alert('Please enter the last 4 digits of the card');
            return;
        }

        addMutation.mutate({
            stripe_payment_method_id: `pm_simulated_${Date.now()}`,
            last4: cardLast4,
            brand: cardBrand,
            is_default: isDefault,
            user_id: selectedUserId ? parseInt(selectedUserId) : undefined
        });
    };

    if (isLoading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-foreground">Payment Methods</h1>
                {isAdmin && (
                    <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Payment Method
                    </Button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                {paymentMethods?.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        No payment methods found.
                        {isAdmin && <p className="mt-2 text-sm">Click "Add Payment Method" to create one for a user.</p>}
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
                                        <div className="text-sm text-muted-foreground">
                                            User ID: {pm.user_id}
                                        </div>
                                    </div>
                                    {pm.is_default && (
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                            Default
                                        </span>
                                    )}
                                </div>

                                {isAdmin && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-accent"
                                        onClick={() => deleteMutation.mutate(pm.id)}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Payment Method Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h2 className="text-xl font-bold text-foreground mb-4">Add Payment Method</h2>
                        
                        <form onSubmit={handleAddPaymentMethod} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select User
                                </label>
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                                    <option value="">-- My Account --</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.full_name || u.email} ({u.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Card Brand
                                </label>
                                <select
                                    value={cardBrand}
                                    onChange={(e) => setCardBrand(e.target.value)}
                                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                                    <option value="visa">Visa</option>
                                    <option value="mastercard">Mastercard</option>
                                    <option value="amex">American Express</option>
                                    <option value="discover">Discover</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last 4 Digits
                                </label>
                                <Input
                                    type="text"
                                    maxLength={4}
                                    pattern="[0-9]{4}"
                                    placeholder="1234"
                                    value={cardLast4}
                                    onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-2">
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

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={addMutation.isPending}
                                    className="flex-1"
                                >
                                    {addMutation.isPending ? 'Adding...' : 'Add Payment Method'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentMethodsPage;
