import React, { useState } from 'react';
import { Link, useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { ShoppingBag, ShoppingCart, Menu, X, LogOut, User, Shield, ChevronDown, MapPin, Globe, Check } from 'lucide-react';
import Button from './Button';
import { cn } from '../utils/cn';

const Navbar = () => {
    const { user, logout, hasPermission } = useAuth();
    const routerLocation = useRouterLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLocationOpen, setIsLocationOpen] = useState(false);
    
    const { selectedLocation, countries, changeLocation, clearLocation, isAdmin, userCountry } = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        { name: 'Restaurants', path: '/restaurants', show: true },
        { name: 'Cart', path: '/cart', show: !!user, icon: ShoppingCart },
        { name: 'My Orders', path: '/orders', show: !!user },
        { name: 'All Carts', path: '/admin/carts', show: hasPermission('checkout') },
        { name: 'Users', path: '/admin/users', show: hasPermission('manage_users') },
        { name: 'Payments', path: '/admin/payments', show: hasPermission('update_payment') },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all duration-300">
            <div className="container-width flex h-20 items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 group">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-primary/20 rounded-xl rotate-3 group-hover:rotate-6 transition-transform duration-300"></div>
                        <div className="relative bg-primary text-primary-foreground p-2.5 rounded-xl shadow-lg shadow-primary/20 group-hover:-translate-y-0.5 transition-transform duration-300">
                            <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-xl tracking-tight text-foreground leading-none">NextBite</span>
                        <span className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase mt-0.5">Gourmet Delivery</span>
                    </div>
                </Link>

                {/* Location Selector - Desktop (Admin Only) OR Location Badge (Non-Admin) */}
                {isAdmin ? (
                    <div className="hidden md:block relative">
                        <button
                            onClick={() => setIsLocationOpen(!isLocationOpen)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors"
                        >
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">
                                {selectedLocation || 'All Locations'}
                            </span>
                            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isLocationOpen && "rotate-180")} />
                        </button>
                        
                        {isLocationOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsLocationOpen(false)} />
                                <div className="absolute top-full mt-2 left-0 w-48 bg-card rounded-xl shadow-lg border border-border z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <button
                                        onClick={() => { clearLocation(); setIsLocationOpen(false); }}
                                        className={cn(
                                            "w-full px-4 py-2.5 text-left text-sm font-medium flex items-center gap-3 hover:bg-secondary transition-colors",
                                            !selectedLocation && "text-primary"
                                        )}
                                    >
                                        <Globe className="h-4 w-4" />
                                        All Locations
                                        {!selectedLocation && <Check className="h-4 w-4 ml-auto" />}
                                    </button>
                                    <div className="h-px bg-border my-1" />
                                    {countries.map((country) => (
                                        <button
                                            key={country}
                                            onClick={() => { changeLocation(country); setIsLocationOpen(false); }}
                                            className={cn(
                                                "w-full px-4 py-2.5 text-left text-sm font-medium flex items-center gap-3 hover:bg-secondary transition-colors",
                                                selectedLocation === country && "text-primary"
                                            )}
                                        >
                                            <MapPin className="h-4 w-4" />
                                            {country}
                                            {selectedLocation === country && <Check className="h-4 w-4 ml-auto" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ) : userCountry ? (
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">{userCountry}</span>
                    </div>
                ) : null}

                {/* Desktop Navigation - Centered Pill Design */}
                <div className="hidden md:flex items-center bg-secondary/50 p-1.5 rounded-full border border-border/50 backdrop-blur-sm">
                    {navLinks.filter(link => link.show).map((link) => {
                        const isActive = routerLocation.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={cn(
                                    "relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-300",
                                    isActive 
                                        ? "text-primary-foreground bg-primary shadow-md shadow-primary/20" 
                                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                )}
                            >
                                {link.name}
                            </Link>
                        );
                    })}
                </div>

                {/* User Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-3 pl-2 pr-1 py-1 bg-card border border-border/50 rounded-full shadow-sm hover:shadow-md transition-all duration-300 group">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                {user.full_name ? user.full_name[0].toUpperCase() : user.email[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col mr-2">
                                <span className="text-xs font-semibold text-foreground leading-none">
                                    {user.full_name || user.email.split('@')[0]}
                                </span>
                                <span className="text-[10px] text-muted-foreground capitalize leading-none mt-1">
                                    {user.role.replace('_', ' ')}
                                </span>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={handleLogout} 
                                className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                                title="Logout"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Log in
                            </Link>
                            <Link to="/register">
                                <Button className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                                    Sign Up
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                    <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="rounded-full">
                        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl animate-in slide-in-from-top-5 duration-200">
                    <div className="px-4 pt-4 pb-6 space-y-2">
                        {/* Mobile Location - Admin gets selector, others get badge */}
                        {isAdmin ? (
                            <div className="mb-4 pb-4 border-b border-border/50">
                                <p className="text-xs font-medium text-muted-foreground mb-2 px-4">SELECT LOCATION</p>
                                <div className="flex flex-wrap gap-2 px-4">
                                    <button
                                        onClick={() => { clearLocation(); }}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5",
                                            !selectedLocation 
                                                ? "bg-primary text-primary-foreground" 
                                                : "bg-secondary text-foreground hover:bg-secondary/80"
                                        )}
                                    >
                                        <Globe className="h-3.5 w-3.5" />
                                        All
                                    </button>
                                    {countries.map((country) => (
                                        <button
                                            key={country}
                                            onClick={() => { changeLocation(country); }}
                                            className={cn(
                                                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5",
                                                selectedLocation === country 
                                                    ? "bg-primary text-primary-foreground" 
                                                    : "bg-secondary text-foreground hover:bg-secondary/80"
                                            )}
                                        >
                                            <MapPin className="h-3.5 w-3.5" />
                                            {country}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : userCountry ? (
                            <div className="mb-4 pb-4 border-b border-border/50">
                                <p className="text-xs font-medium text-muted-foreground mb-2 px-4">YOUR LOCATION</p>
                                <div className="px-4">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-medium text-primary">{userCountry}</span>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        
                        {navLinks.filter(link => link.show).map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={cn(
                                    "flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all",
                                    routerLocation.pathname === link.path
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                {link.icon && <link.icon className="h-5 w-5 mr-3" />}
                                {link.name}
                            </Link>
                        ))}
                        {user ? (
                            <div className="mt-6 pt-6 border-t border-border/50">
                                <div className="flex items-center gap-3 px-4 mb-4">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {user.full_name ? user.full_name[0].toUpperCase() : user.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-foreground">{user.full_name || user.email}</div>
                                        <div className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</div>
                                    </div>
                                </div>
                                <Button variant="destructive" className="w-full justify-center rounded-xl" onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <div className="mt-6 pt-6 border-t border-border/50 space-y-3">
                                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-center rounded-xl">Log in</Button>
                                </Link>
                                <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                                    <Button className="w-full justify-center rounded-xl shadow-lg shadow-primary/20">Sign Up</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
