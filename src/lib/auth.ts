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
    try {
      // Récupérer la session pour vérifier si l'utilisateur est authentifié
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('[isAdmin] Erreur getSession:', sessionError.message);
        return false;
      }
      
      if (!session) {
        console.debug('[isAdmin] Aucune session active');
        return false;
      }
      
      // Tout utilisateur authentifié est considéré comme admin
      console.info('[isAdmin] Utilisateur authentifié, accès admin accordé:', session.user.email);
      return true;
    } catch (error) {
      console.error('[isAdmin] Erreur inattendue:', error);
      return false;
    }
  },

  async getAdminUser(): Promise<AdminUser | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return null;
      }
      
      // Tout utilisateur authentifié est considéré comme admin
      return {
        id: user.id,
        email: user.email || '',
        role: 'admin',
      };
    } catch (error) {
      console.error('Erreur inattendue lors de la récupération des données admin:', error);
      return null;
    }
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  },
};
