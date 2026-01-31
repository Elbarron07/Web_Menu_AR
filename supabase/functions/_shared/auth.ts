// Shared authentication module for Supabase Edge Functions
// Verifies JWT - accepts any authenticated user as admin
// Version 3.0 - Simplified: all authenticated users have admin access

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthResult {
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
  role: 'admin' | 'super_admin' | null;
  error: string | null;
}

/**
 * Verify that the request comes from an authenticated user
 * Any authenticated user is granted admin access
 * 
 * @param req - The incoming request
 * @param supabaseUrl - Supabase project URL
 * @param supabaseServiceKey - Service role key (bypasses RLS)
 * @returns AuthResult with user info and admin status
 */
export async function verifyAdmin(
  req: Request,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<AuthResult> {
  const startTime = Date.now();
  
  try {
    // Étape 1: Vérifier la présence du header Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.warn('[verifyAdmin] Missing Authorization header');
      return { userId: null, email: null, isAdmin: false, role: null, error: 'Missing Authorization header' };
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.warn('[verifyAdmin] Invalid Authorization header format (expected Bearer token)');
      return { userId: null, email: null, isAdmin: false, role: null, error: 'Invalid Authorization header format' };
    }
    
    // Étape 2: Extraire le token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (!token || token.length < 10) {
      console.warn('[verifyAdmin] Token too short or empty');
      return { userId: null, email: null, isAdmin: false, role: null, error: 'Invalid token format' };
    }
    
    console.debug('[verifyAdmin] Token received, length:', token.length);
    
    // Étape 3: Créer le client Supabase avec service_role pour bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { 
        autoRefreshToken: false, 
        persistSession: false,
      },
    });
    
    // Étape 4: Vérifier et valider le token JWT
    console.debug('[verifyAdmin] Validating JWT token...');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError) {
      const errorInfo = {
        message: authError.message,
        status: authError.status,
        name: authError.name,
      };
      console.error('[verifyAdmin] JWT validation failed:', errorInfo);
      
      // Messages d'erreur plus descriptifs selon le type d'erreur
      let userFriendlyError = 'Invalid or expired token';
      if (authError.message?.includes('expired')) {
        userFriendlyError = 'Token expired. Please refresh your session.';
      } else if (authError.message?.includes('invalid')) {
        userFriendlyError = 'Invalid token. Please login again.';
      }
      
      return { userId: null, email: null, isAdmin: false, role: null, error: userFriendlyError };
    }
    
    if (!user) {
      console.warn('[verifyAdmin] No user found for valid token');
      return { userId: null, email: null, isAdmin: false, role: null, error: 'User not found' };
    }
    
    const elapsedMs = Date.now() - startTime;
    console.info('[verifyAdmin] SUCCESS - User authenticated and granted admin access:', {
      userId: user.id,
      email: user.email,
      emailVerified: user.email_confirmed_at ? true : false,
      verificationTimeMs: elapsedMs,
    });
    
    // Tout utilisateur authentifié est considéré comme admin
    return { 
      userId: user.id, 
      email: user.email || null, 
      isAdmin: true, 
      role: 'admin',
      error: null 
    };
    
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    const errorStack = e instanceof Error ? e.stack : undefined;
    
    console.error('[verifyAdmin] Unexpected exception:', {
      message: errorMessage,
      stack: errorStack,
    });
    
    return {
      userId: null,
      email: null,
      isAdmin: false,
      role: null,
      error: 'Authentication service error. Please try again.',
    };
  }
}

export function corsHeaders(origin?: string | null): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  };
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req.headers.get('origin')),
    });
  }
  return null;
}
