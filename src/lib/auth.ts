import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
}

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getCurrentSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async isAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single();
    
    return !error && !!data;
  },

  async getAdminUser(): Promise<AdminUser | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      email: data.email,
      role: data.role,
    };
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  },
};
