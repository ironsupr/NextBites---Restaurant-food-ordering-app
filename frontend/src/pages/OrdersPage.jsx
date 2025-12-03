import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { Clock, CheckCircle, XCircle, ShoppingBag, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';

const OrdersPage = () => {
    const queryClient = useQueryClient();
    const { hasPermission } = useAuth();
    const canCancel = hasPermission('cancel_order');

    const { data: orders, isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const response = await api.get('/orders/');
            // Filter out 'cart' status orders
            return response.data.filter(o => o.status !== 'cart').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        },
    });

    // Cancel order mutation
    const cancelOrderMutation = useMutation({
        mutationFn: async (orderId) => {
            await api.delete(`/orders/${orderId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['orders']);
        },
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-100 text-emerald-700';
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'cancelled': return 'bg-rose-100 text-rose-700';
            default: return 'bg-muted text-gray-700';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="h-4 w-4" />;
            case 'pending': return <Clock className="h-4 w-4" />;
            case 'cancelled': return <XCircle className="h-4 w-4" />;
            default: return <ShoppingBag className="h-4 w-4" />;
        }
    };

    const canCancelOrder = (order) => {
        // Can only cancel pending orders and if user has permission
        return canCancel && order.status === 'pending';
    };

    if (isLoading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-8">My Orders</h1>

            {!orders || orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-border">
                    <p className="text-muted-foreground">No past orders found.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                            <div className="p-6">
                                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-bold text-lg text-foreground">Order #{order.id}</span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div>
                                            <span className="block text-2xl font-bold text-primary">${order.total_amount?.toFixed(2) || '0.00'}</span>
                                            <span className="text-sm text-muted-foreground">{order.order_items?.length || 0} items</span>
                                        </div>
                                        {canCancelOrder(order) && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                                                onClick={() => cancelOrderMutation.mutate(order.id)}
                                                disabled={cancelOrderMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-border pt-4">
                                    <div className="space-y-3">
                                        {order.order_items?.map((item) => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    {item.quantity}x {item.menu_item_name || `Item #${item.menu_item_id}`}
                                                </span>
                                                <span className="font-medium text-foreground">
                                                    ${(item.price_at_time * item.quantity).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
