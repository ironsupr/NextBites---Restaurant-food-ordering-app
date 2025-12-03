import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingBag, ShoppingCart, Menu, X, LogOut, User, Shield, Users } from 'lucide-react';
import Button from './Button';
import { cn } from '../utils/cn';

const Navbar = () => {
    const { user, logout, hasPermission } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

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
        <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="bg-primary p-1.5 rounded-lg">
                            <ShoppingBag className="h-6 w-6 text-white" />
                        </div>
                        <span className="font-bold text-xl text-secondary">NextBite</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.filter(link => link.show).map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary",
                                    location.pathname === link.path ? "text-primary" : "text-secondary"
                                )}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* User Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                                    {user.role === 'admin' && <Shield className="h-4 w-4 text-primary" />}
                                    <span className="text-sm font-medium text-secondary">
                                        {user.email.split('@')[0]}
                                    </span>
                                    <span className="text-xs text-gray-500 capitalize px-2 py-0.5 bg-white rounded-full border border-gray-100">
                                        {user.role.replace('_', ' ')}
                                    </span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                                    <LogOut className="h-5 w-5" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link to="/login">
                                    <Button variant="ghost">Login</Button>
                                </Link>
                                <Link to="/register">
                                    <Button>Sign Up</Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white">
                    <div className="px-4 pt-2 pb-4 space-y-1">
                        {navLinks.filter(link => link.show).map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={cn(
                                    "block px-3 py-2 rounded-md text-base font-medium",
                                    location.pathname === link.path
                                        ? "bg-primary/10 text-primary"
                                        : "text-secondary hover:bg-gray-50"
                                )}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        {user ? (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="px-3 flex items-center gap-2 mb-3">
                                    <User className="h-5 w-5 text-gray-400" />
                                    <span className="font-medium text-secondary">{user.email}</span>
                                </div>
                                <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <div className="mt-4 pt-4 border-t border-gray-100 grid gap-2">
                                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-start">Login</Button>
                                </Link>
                                <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                                    <Button className="w-full justify-start">Sign Up</Button>
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
