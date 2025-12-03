import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import Button from '../components/Button';
import { ArrowLeft, Plus, ShoppingCart, Check } from 'lucide-react';

const RestaurantDetailPage = () => {
    const { id } = useParams();
    const queryClient = useQueryClient();

    // Fetch restaurant details
    const { data: restaurant, isLoading: restaurantLoading } = useQuery({
        queryKey: ['restaurant', id],
        queryFn: async () => {
            const response = await api.get(`/restaurants/${id}`);
            return response.data;
        }
    });

    // Fetch menu items
    const { data: menuItems = [], isLoading: menuLoading } = useQuery({
        queryKey: ['menuItems', id],
        queryFn: async () => {
            const response = await api.get(`/restaurants/${id}/menu`);
            return response.data;
        }
    });

    // Fetch current cart to check what's already there
    const { data: currentCart, refetch: refetchCart } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const response = await api.get('/orders/');
            // Get carts and find the one for current restaurant, or the most recent one with items
            const carts = response.data.filter(o => o.status === 'cart');
            // Prefer cart for current restaurant
            const restaurantCart = carts.find(c => c.restaurant_id === parseInt(id));
            if (restaurantCart) return restaurantCart;
            // Otherwise get the most recent cart with items
            const cartsWithItems = carts.filter(c => c.order_items && c.order_items.length > 0);
            return cartsWithItems[cartsWithItems.length - 1] || carts[carts.length - 1] || null;
        },
        staleTime: 0
    });

    // Create new cart order
    const createOrderMutation = useMutation({
        mutationFn: async (restaurantId) => {
            const response = await api.post('/orders/', { restaurant_id: restaurantId });
            return response.data;
        },
        onSuccess: async () => {
            await refetchCart();
        }
    });

    // Add item to cart
    const addItemMutation = useMutation({
        mutationFn: async ({ orderId, menuItemId, quantity }) => {
            const response = await api.post(`/orders/${orderId}/items`, {
                menu_item_id: menuItemId,
                quantity: quantity
            });
            return response.data;
        },
        onSuccess: async () => {
            // Refetch cart to update UI
            await refetchCart();
        }
    });

    const handleAddToCart = async (menuItem) => {
        try {
            let orderId = currentCart?.id;

            // If no cart exists or cart is for a different restaurant, create new one
            if (!orderId || (currentCart && currentCart.restaurant_id !== parseInt(id))) {
                console.log('Creating new order for restaurant:', id);
                const newOrder = await createOrderMutation.mutateAsync(parseInt(id));
                orderId = newOrder.id;
                console.log('Created order:', orderId);
            }

            // Add item to cart
            console.log('Adding item to cart:', { orderId, menuItemId: menuItem.id });
            await addItemMutation.mutateAsync({
                orderId: orderId,
                menuItemId: menuItem.id,
                quantity: 1
            });
            console.log('Item added successfully');
        } catch (error) {
            console.error('Error adding to cart:', error);
            console.error('Error response:', error.response?.data);
            alert(`Failed to add item to cart: ${error.response?.data?.detail || error.message}`);
        }
    };

    // Check if item is in cart
    const getItemQuantityInCart = (menuItemId) => {
        if (!currentCart || !currentCart.order_items) return 0;
        const item = currentCart.order_items.find(i => i.menu_item_id === menuItemId);
        return item ? item.quantity : 0;
    };

    const cartItemCount = currentCart?.order_items?.length || 0;

    if (restaurantLoading || menuLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/restaurants" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="h-6 w-6 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-secondary">{restaurant?.name}</h1>
                        <p className="text-gray-500">{restaurant?.cuisine_type} • {restaurant?.address}</p>
                    </div>
                </div>

                {/* Cart Button */}
                <Link to="/cart" className="relative">
                    <Button variant="outline" className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        View Cart
                        {cartItemCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {cartItemCount}
                            </span>
                        )}
                    </Button>
                </Link>
            </div>

            {/* Menu Section */}
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-secondary mb-4">Menu</h2>
            </div>

            {/* Menu Items Grid */}
            {menuItems.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">No menu items available for this restaurant.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map((item) => {
                        const quantityInCart = getItemQuantityInCart(item.id);
                        const isAdding = addItemMutation.isPending;

                        return (
                            <div
                                key={item.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Item Image Placeholder */}
                                <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                    <span className="text-4xl">🍽️</span>
                                </div>

                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-secondary">{item.name}</h3>
                                        <span className="text-primary font-bold">${item.price?.toFixed(2)}</span>
                                    </div>

                                    {item.description && (
                                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{item.description}</p>
                                    )}

                                    <div className="flex items-center justify-between">
                                        {quantityInCart > 0 && (
                                            <span className="text-sm text-green-600 flex items-center gap-1">
                                                <Check className="h-4 w-4" />
                                                {quantityInCart} in cart
                                            </span>
                                        )}
                                        
                                        <Button
                                            size="sm"
                                            onClick={() => handleAddToCart(item)}
                                            disabled={isAdding}
                                            className="ml-auto flex items-center gap-1"
                                        >
                                            <Plus className="h-4 w-4" />
                                            {quantityInCart > 0 ? 'Add More' : 'Add to Cart'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Floating Cart Summary */}
            {cartItemCount > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-secondary text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4">
                    <span className="font-medium">
                        {cartItemCount} item{cartItemCount > 1 ? 's' : ''} in cart
                    </span>
                    <Link to="/cart">
                        <Button size="sm" className="bg-white text-secondary hover:bg-gray-100">
                            View Cart
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default RestaurantDetailPage;
