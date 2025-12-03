import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const LocationContext = createContext(null);

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};

export const LocationProvider = ({ children }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    
    // Only admins can select locations, others use their assigned country
    const [selectedLocation, setSelectedLocation] = useState(() => {
        if (isAdmin) {
            return localStorage.getItem('nextbite_location') || null;
        }
        return null; // Non-admins don't get to choose
    });

    // Fetch available countries (only meaningful for admins)
    const { data: countries = [], isLoading: countriesLoading } = useQuery({
        queryKey: ['countries'],
        queryFn: async () => {
            const response = await api.get('/restaurants/countries');
            return response.data;
        },
        enabled: !!user, // Only fetch when logged in
        staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    });

    // For admins, sync with localStorage
    useEffect(() => {
        if (isAdmin) {
            if (selectedLocation) {
                localStorage.setItem('nextbite_location', selectedLocation);
            } else {
                localStorage.removeItem('nextbite_location');
            }
        }
    }, [selectedLocation, isAdmin]);

    // Reset location when user changes
    useEffect(() => {
        if (!isAdmin) {
            setSelectedLocation(null);
        }
    }, [user, isAdmin]);

    const changeLocation = (location) => {
        if (isAdmin) {
            setSelectedLocation(location);
        }
    };

    const clearLocation = () => {
        if (isAdmin) {
            setSelectedLocation(null);
        }
    };

    // The effective location for display purposes
    const effectiveLocation = isAdmin ? selectedLocation : user?.country;

    const value = {
        selectedLocation,        // What admin has selected (null for non-admins)
        effectiveLocation,       // The actual location being used
        userCountry: user?.country,
        countries,
        countriesLoading,
        isAdmin,
        changeLocation,
        clearLocation,
    };

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
};

export default LocationContext;
