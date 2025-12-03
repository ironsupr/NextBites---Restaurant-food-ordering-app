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
        <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md shadow-sm border-b border-border/50">
            <div className="container-width flex h-16 items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="bg-primary p-2 rounded-full group-hover:bg-primary/90 transition-colors shadow-sm">
                        <ShoppingBag className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-foreground">NextBite</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-6">
                    {navLinks.filter(link => link.show).map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                location.pathname === link.path ? "text-primary" : "text-muted-foreground"
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
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full border border-border">
                                {user.role === 'admin' && <Shield className="h-4 w-4 text-primary" />}
                                <span className="text-sm font-medium">
                                    {user.email.split('@')[0]}
                                </span>
                                <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 bg-background rounded-full border border-border">
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

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t bg-background">
                    <div className="px-4 pt-2 pb-4 space-y-1">
                        {navLinks.filter(link => link.show).map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={cn(
                                    "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                                    location.pathname === link.path
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                {link.name}
                            </Link>
                        ))}
                        {user ? (
                            <div className="mt-4 pt-4 border-t border-border">
                                <div className="flex items-center gap-2 px-3 mb-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium">{user.email}</div>
                                        <div className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</div>
                                    </div>
                                </div>
                                <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <div className="mt-4 pt-4 border-t border-border space-y-2">
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
