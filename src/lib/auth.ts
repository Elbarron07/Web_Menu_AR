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
      // D'abord récupérer la session pour s'assurer que le token est disponible
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('[isAdmin] Erreur getSession:', sessionError.message);
        return false;
      }
      
      if (!session) {
        console.debug('[isAdmin] Aucune session active');
        return false;
      }
      
      console.debug('[isAdmin] Session trouvée, user:', session.user?.id, session.user?.email);
      
      // Utiliser la fonction RPC is_admin() qui a SECURITY DEFINER
      // Cette fonction contourne les problèmes RLS
      const { data: isAdminResult, error: rpcError } = await supabase.rpc('is_admin', {
        user_id: session.user.id
      });
      
      if (rpcError) {
        console.warn('[isAdmin] Erreur RPC is_admin:', {
          error: rpcError.message,
          code: rpcError.code,
          details: rpcError.details,
          hint: rpcError.hint,
        });
        
        // Fallback: essayer avec une requête directe
        console.debug('[isAdmin] Fallback vers requête directe...');
        const { data: directData, error: directError } = await supabase
          .from('admin_users')
          .select('id, role')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (directError) {
          console.warn('[isAdmin] Erreur requête directe:', directError.message);
          return false;
        }
        
        const isAdmin = !!directData;
        console.debug('[isAdmin] Résultat fallback:', { isAdmin, data: directData });
        return isAdmin;
      }
      
      const isAdmin = isAdminResult === true;
      console.debug('[isAdmin] Résultat RPC:', { isAdmin, rawResult: isAdminResult });
      
      if (isAdmin) {
        console.info('[isAdmin] Utilisateur vérifié comme admin:', session.user.email);
      } else {
        console.warn('[isAdmin] Utilisateur NON admin:', session.user.email);
      }
      
      return isAdmin;
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
      
      // Avec la nouvelle politique RLS, les admins peuvent lire leur propre enregistrement
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        // Log détaillé pour diagnostiquer les problèmes RLS
        console.warn('Erreur lors de la récupération des données admin:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          userId: user.id,
        });
        return null;
      }
      
      if (!data) {
        return null;
      }
      
      return {
        id: data.id,
        email: data.email,
        role: data.role,
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
