import { useState, useEffect } from 'react';
import { authService, type AdminUser } from '../../lib/auth';
import type { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          const admin = await authService.isAdmin();
          setIsAdmin(admin);

          if (admin) {
            const adminData = await authService.getAdminUser();
            setAdminUser(adminData);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      setUser(user);
      if (user) {
        const admin = await authService.isAdmin();
        setIsAdmin(admin);
        if (admin) {
          const adminData = await authService.getAdminUser();
          setAdminUser(adminData);
        }
      } else {
        setIsAdmin(false);
        setAdminUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const data = await authService.signIn(email, password);
    const admin = await authService.isAdmin();
    setIsAdmin(admin);
    if (admin) {
      const adminData = await authService.getAdminUser();
      setAdminUser(adminData);
    }
    return data;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setAdminUser(null);
    setIsAdmin(false);
  };

  return {
    user,
    adminUser,
    isAdmin,
    loading,
    signIn,
    signOut,
  };
};
