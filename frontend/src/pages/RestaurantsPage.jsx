import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { MapPin, ArrowRight } from 'lucide-react';
import Button from '../components/Button';

const RestaurantsPage = () => {
    const { data: restaurants, isLoading, error } = useQuery({
        queryKey: ['restaurants'],
        queryFn: async () => {
            const response = await api.get('/restaurants/');
            return response.data;
        },
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-80 bg-gray-100 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-accent">Failed to load restaurants. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-secondary">Restaurants</h1>
                <div className="text-sm text-gray-500">
                    Showing {restaurants?.length} restaurants
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants?.map((restaurant) => (
                    <div key={restaurant.id} className="card group">
                        <div className="relative h-48 overflow-hidden">
                            <img
                                src={restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
                                alt={restaurant.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-secondary flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-primary" />
                                {restaurant.country}
                            </div>
                        </div>

                        <div className="p-5">
                            <h3 className="text-xl font-bold text-secondary mb-2">{restaurant.name}</h3>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                {restaurant.description}
                            </p>

                            <Link to={`/restaurants/${restaurant.id}`}>
                                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white group-hover:border-primary">
                                    View Menu
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RestaurantsPage;
