import { supabase } from './supabase';
import { logger } from './logger';
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
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        logger.warn('[isAdmin] Erreur session');
        return false;
      }
      
      if (!session) {
        logger.debug('[isAdmin] Aucune session');
        return false;
      }
      
      logger.debug('[isAdmin] Acces accorde');
      return true;
    } catch {
      logger.error('[isAdmin] Erreur');
      return false;
    }
  },

  async getAdminUser(): Promise<AdminUser | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return null;
      }
      
      return {
        id: user.id,
        email: user.email || '',
        role: 'admin',
      };
    } catch {
      logger.error('[getAdminUser] Erreur');
      return null;
    }
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  },
};
