import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import Button from '../components/Button';
import Input from '../components/Input';
import { User, Shield, Mail, MapPin, Plus, X } from 'lucide-react';

const UserManagementPage = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', role: 'team_member', country: 'USA' });
    const [error, setError] = useState('');

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await api.get('/users/');
            return response.data;
        },
    });

    const { data: countries = [] } = useQuery({
        queryKey: ['countries'],
        queryFn: async () => {
            const response = await api.get('/restaurants/countries');
            return response.data;
        },
    });

    const createUserMutation = useMutation({
        mutationFn: async (userData) => {
            await api.post('/users/', userData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            setIsModalOpen(false);
            setNewUser({ email: '', password: '', role: 'team_member', country: 'USA' });
        },
        onError: (err) => {
            setError(err.response?.data?.detail || 'Failed to create user');
        }
    });

    const updateUserRoleMutation = useMutation({
        mutationFn: async ({ userId, role }) => {
            await api.patch(`/users/${userId}`, { role });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
        },
    });

    const updateUserCountryMutation = useMutation({
        mutationFn: async ({ userId, country }) => {
            await api.patch(`/users/${userId}`, { country });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        createUserMutation.mutate(newUser);
    };

    if (isLoading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-foreground">User Management</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted/30 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users?.map((user) => (
                                <tr key={user.id} className="hover:bg-muted/30/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-foreground">{user.email}</div>
                                                <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            className="text-sm border border-border rounded-md px-2 py-1 focus:ring-primary focus:border-primary"
                                            value={user.role}
                                            onChange={(e) => updateUserRoleMutation.mutate({ userId: user.id, role: e.target.value })}
                                            disabled={user.role === 'admin' && user.email === 'admin@nextbite.com'}
                                        >
                                            <option value="team_member">Team Member</option>
                                            <option value="manager">Manager</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            className="text-sm border border-border rounded-md px-2 py-1 focus:ring-primary focus:border-primary"
                                            value={user.country}
                                            onChange={(e) => updateUserCountryMutation.mutate({ userId: user.id, country: e.target.value })}
                                        >
                                            {countries.map((country) => (
                                                <option key={country} value={country}>{country}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-foreground">Add New User</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-muted-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Email"
                                type="email"
                                required
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            />
                            <Input
                                label="Password"
                                type="password"
                                required
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
                                    <select
                                        className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    >
                                        <option value="team_member">Team Member</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Country</label>
                                    <select
                                        className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        value={newUser.country}
                                        onChange={(e) => setNewUser({ ...newUser, country: e.target.value })}
                                    >
                                        <option value="USA">USA</option>
                                        <option value="India">India</option>
                                    </select>
                                </div>
                            </div>

                            {error && (
                                <div className="text-sm text-accent bg-accent/10 p-3 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1" isLoading={createUserMutation.isPending}>
                                    Create User
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementPage;
