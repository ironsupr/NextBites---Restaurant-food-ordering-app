import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import Button from '../components/Button';
import { CreditCard, Trash2, Plus } from 'lucide-react';

const PaymentMethodsPage = () => {
    const queryClient = useQueryClient();
    // Note: In a real app, adding payment methods usually requires Stripe Elements
    // For this admin view, we'll just list them and allow deletion

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
            queryClient.invalidateQueries(['paymentMethods']);
        },
    });

    if (isLoading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-secondary">Payment Methods</h1>
                {/* Adding payment methods is done via checkout usually, or a specific add card flow */}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {paymentMethods?.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No payment methods found.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {paymentMethods?.map((pm) => (
                            <div key={pm.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-secondary capitalize">
                                            {pm.brand} •••• {pm.last4}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            ID: {pm.id}
                                        </div>
                                    </div>
                                    {pm.is_default && (
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                            Default
                                        </span>
                                    )}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-400 hover:text-accent"
                                    onClick={() => deleteMutation.mutate(pm.id)}
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentMethodsPage;
