// Shared authentication module for Supabase Edge Functions
// Verifies JWT and checks if user is an admin

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthResult {
  userId: string | null;
  isAdmin: boolean;
  error: string | null;
}

export async function verifyAdmin(
  req: Request,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<AuthResult> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { userId: null, isAdmin: false, error: 'Missing or invalid Authorization header' };
    }
    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return { userId: null, isAdmin: false, error: authError?.message || 'Invalid token' };
    }
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();
    if (adminError || !adminUser) {
      return { userId: user.id, isAdmin: false, error: 'User is not an admin' };
    }
    return { userId: user.id, isAdmin: true, error: null };
  } catch (e) {
    return {
      userId: null,
      isAdmin: false,
      error: e instanceof Error ? e.message : 'Authentication error',
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
