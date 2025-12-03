import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import Button from '../components/Button';
import { ArrowLeft, Plus, ShoppingCart, Check, Star, MapPin, Clock, Info, ShoppingBag } from 'lucide-react';
import { cn } from '../utils/cn';

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

    // Fetch current cart
    const { data: currentCart, refetch: refetchCart } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const response = await api.get('/orders/');
            // User can only have one cart
            return response.data.find(o => o.status === 'cart') || null;
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

            // If cart is for a different restaurant, confirm before clearing
            if (currentCart && currentCart.restaurant_id !== parseInt(id)) {
                const confirmed = window.confirm(
                    'You have items from another restaurant in your cart. Adding items from this restaurant will clear your current cart. Continue?'
                );
                if (!confirmed) return;
            }

            // If no cart exists or cart is for a different restaurant, create new one
            if (!orderId || (currentCart && currentCart.restaurant_id !== parseInt(id))) {
                const newOrder = await createOrderMutation.mutateAsync(parseInt(id));
                orderId = newOrder.id;
            }

            // Add item to cart
            await addItemMutation.mutateAsync({
                orderId: orderId,
                menuItemId: menuItem.id,
                quantity: 1
            });
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert(`Failed to add item to cart: ${error.response?.data?.detail || error.message}`);
        }
    };

    // Check if item is in cart
    const getItemQuantityInCart = (menuItemId) => {
        if (!currentCart || !currentCart.order_items) return 0;
        const item = currentCart.order_items.find(i => i.menu_item_id === menuItemId);
        return item ? item.quantity : 0;
    };

    if (restaurantLoading || menuLoading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-80 bg-muted rounded-3xl w-full" />
                <div className="space-y-4">
                    <div className="h-8 bg-muted rounded w-1/3" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-40 bg-muted rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!restaurant) return <div className="text-center py-20">Restaurant not found</div>;

    return (
        <div className="-mt-8">
            {/* Restaurant Header */}
            <div className="relative h-[400px] rounded-3xl overflow-hidden mb-10 shadow-2xl">
                <img
                    src={restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600'}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                <div className="absolute top-6 left-6 z-10">
                    <Link to="/restaurants">
                        <Button variant="secondary" size="sm" className="rounded-full bg-white/20 backdrop-blur-md border-white/10 text-white hover:bg-white/30">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                    </Link>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-4">{restaurant.name}</h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm md:text-base font-medium text-slate-200">
                                    <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" /> 4.8 (500+)
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-primary" /> {restaurant.address}, {restaurant.city}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-4 w-4 text-primary" /> 20-30 min
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Info className="h-4 w-4 text-primary" /> $$ • {restaurant.country} Cuisine
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                {currentCart && currentCart.restaurant_id === parseInt(id) && (
                                    <Link to="/cart">
                                        <Button className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                                            <ShoppingCart className="h-4 w-4 mr-2" />
                                            View Cart ({currentCart.order_items?.length || 0})
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Menu Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                        <ShoppingBag className="h-6 w-6 text-primary" />
                        Menu
                    </h2>
                    
                    <div className="grid grid-cols-1 gap-6">
                        {menuItems?.map((item) => {
                            const quantity = getItemQuantityInCart(item.id);
                            return (
                                <div key={item.id} className="group bg-card hover:bg-secondary/30 border border-border rounded-2xl p-4 flex gap-4 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                                    <div className="h-32 w-32 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
                                        <img 
                                            src={item.image_url || `https://source.unsplash.com/400x400/?food,${item.name.replace(' ', '')}`} 
                                            alt={item.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'; }}
                                        />
                                    </div>
                                    
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{item.name}</h3>
                                                <span className="text-lg font-bold text-primary">${item.price}</span>
                                            </div>
                                            <p className="text-muted-foreground text-sm line-clamp-2 mb-2">{item.description}</p>
                                        </div>
                                        
                                        <div className="flex justify-end items-center gap-3">
                                            {quantity > 0 && (
                                                <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1">
                                                    <Check className="h-3 w-3" /> {quantity} in cart
                                                </span>
                                            )}
                                            <Button 
                                                size="sm" 
                                                onClick={() => handleAddToCart(item)}
                                                disabled={addItemMutation.isPending}
                                                className="rounded-full px-6 shadow-sm group-hover:shadow-md transition-all"
                                            >
                                                {addItemMutation.isPending ? 'Adding...' : (
                                                    <>Add <Plus className="ml-2 h-4 w-4" /></>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantDetailPage;
