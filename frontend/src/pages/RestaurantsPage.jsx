import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { MapPin, ArrowRight, Search, Star, Clock, Globe } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useLocation } from '../contexts/LocationContext';

const RestaurantsPage = () => {
    const { selectedLocation, effectiveLocation, isAdmin } = useLocation();
    
    // For admins, use selectedLocation to filter. For others, backend auto-filters by their country
    const { data: restaurants, isLoading, error } = useQuery({
        queryKey: ['restaurants', selectedLocation],
        queryFn: async () => {
            // Only admins can pass the country filter
            const params = isAdmin && selectedLocation ? `?country=${encodeURIComponent(selectedLocation)}` : '';
            const response = await api.get(`/restaurants/${params}`);
            return response.data;
        },
    });

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="h-64 bg-muted rounded-3xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-80 bg-muted rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                    <MapPin className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Oops! Something went wrong</h2>
                <p className="text-muted-foreground">Failed to load restaurants. Please try again later.</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-12">
            {/* Hero Section */}
            <section className="relative rounded-3xl overflow-hidden bg-slate-900 text-white shadow-xl">
                <div className="absolute inset-0">
                    <img 
                        src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80" 
                        alt="Restaurant dining" 
                        className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-transparent" />
                </div>
                <div className="relative z-10 px-8 py-16 md:py-24 max-w-2xl">
                    {effectiveLocation && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/20 backdrop-blur-md rounded-full text-primary text-sm font-medium mb-4 border border-primary/30">
                            <MapPin className="h-4 w-4" />
                            {isAdmin ? `Viewing: ${effectiveLocation}` : `Your location: ${effectiveLocation}`}
                        </div>
                    )}
                    {isAdmin && !selectedLocation && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium mb-4 border border-white/30">
                            <Globe className="h-4 w-4" />
                            Viewing all locations
                        </div>
                    )}
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                        Order & Dine,<br />
                        <span className="text-primary">your way.</span>
                    </h1>
                    <p className="text-lg text-slate-200 mb-8 max-w-lg">
                        Browse our menu, place your order ahead, and enjoy your meal without the wait. Dine-in, takeaway, or pickup — you choose.
                    </p>
                    
                    <div className="flex gap-2 max-w-md bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20">
                        <div className="flex-1 flex items-center px-4">
                            <Search className="h-5 w-5 text-slate-300 mr-3" />
                            <input 
                                type="text" 
                                placeholder="Search for dishes or restaurants..." 
                                className="bg-transparent border-none outline-none text-white placeholder:text-slate-400 w-full"
                            />
                        </div>
                        <Button size="lg" className="rounded-full px-8">
                            Search
                        </Button>
                    </div>
                </div>
            </section>

            {/* Categories (Visual Only) */}
            <section>
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-bold text-foreground">Categories</h2>
                    <a href="#" className="text-primary font-medium hover:underline">View all</a>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {[
                        { name: 'Burger', icon: '🍔' },
                        { name: 'Pizza', icon: '🍕' },
                        { name: 'Asian', icon: '🍜' },
                        { name: 'Mexican', icon: '🌮' },
                        { name: 'Healthy', icon: '🥗' },
                        { name: 'Dessert', icon: '🍰' },
                        { name: 'Drinks', icon: '🥤' },
                    ].map((cat) => (
                        <button key={cat.name} className="flex flex-col items-center gap-3 min-w-[100px] p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors border border-transparent hover:border-border group">
                            <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{cat.icon}</span>
                            <span className="font-medium text-sm text-foreground">{cat.name}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Restaurants Grid */}
            <section>
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">
                            {effectiveLocation ? `Restaurants in ${effectiveLocation}` : 'All Restaurants'}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {restaurants?.length || 0} restaurant{restaurants?.length !== 1 ? 's' : ''} available
                        </p>
                    </div>
                </div>
                
                {restaurants?.length === 0 ? (
                    <div className="text-center py-16 bg-muted/30 rounded-2xl">
                        <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">No restaurants found</h3>
                        <p className="text-muted-foreground">
                            {effectiveLocation 
                                ? `No restaurants available in ${effectiveLocation} at the moment.`
                                : 'No restaurants available at the moment.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {restaurants?.map((restaurant) => (
                        <Link key={restaurant.id} to={`/restaurants/${restaurant.id}`} className="group block">
                            <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                                <div className="relative h-56 overflow-hidden">
                                    <img
                                        src={restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
                                        alt={restaurant.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm text-foreground">
                                        <Clock className="h-3.5 w-3.5 text-primary" />
                                        Open Now
                                    </div>
                                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-white flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-primary" />
                                        {restaurant.country}
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{restaurant.name}</h3>
                                        <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                                            <Star className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600" />
                                            <span className="text-xs font-bold text-emerald-700">4.8</span>
                                        </div>
                                    </div>
                                    
                                    <p className="text-muted-foreground text-sm mb-6 line-clamp-2 flex-1">
                                        {restaurant.description}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                        <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
                                            $$ • Dine-in & Takeaway
                                        </span>
                                        <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            Order Now <ArrowRight className="h-4 w-4" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default RestaurantsPage;
