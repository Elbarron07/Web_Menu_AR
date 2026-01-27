// Admin API Client
// Handles all admin API calls to Supabase Edge Functions

import { supabase } from './supabase';
import type { MenuItem } from '../hooks/useMenu';

export interface MenuCategory {
  id: string;
  name: string;
  icon: string | null;
  stroke_rgba: string | null;
  glow_rgba: string | null;
  display_order: number;
  created_at?: string;
}

// Get the Supabase project URL from environment or construct from siteUrl
const getSupabaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (envUrl) return envUrl;
  
  // Fallback: try to extract from siteUrl or use default
  // This is a fallback - should be set in .env
  console.warn('VITE_SUPABASE_URL not set, using fallback');
  return 'https://your-project.supabase.co';
};

const getEdgeFunctionUrl = (functionName: string): string => {
  const supabaseUrl = getSupabaseUrl();
  // Edge Functions are at: https://<project-ref>.supabase.co/functions/v1/<function-name>
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  return `https://${projectRef}.supabase.co/functions/v1/${functionName}`;
};

// Constantes pour la gestion des tokens
const TOKEN_REFRESH_MARGIN_SECONDS = 300; // 5 minutes - marge de sécurité avant expiration

/**
 * Get the current session token for authenticated requests
 * Garantit un token valide et rafraîchi proactivement
 * - Utilise getUser() pour forcer la vérification côté serveur
 * - Rafraîchit proactivement si le token expire dans moins de 5 minutes
 */
async function getAuthToken(): Promise<string | null> {
  try {
    // Étape 1: Vérifier d'abord la session locale pour éviter des appels réseau inutiles
    const { data: { session: localSession } } = await supabase.auth.getSession();
    
    if (!localSession) {
      console.debug('[getAuthToken] Aucune session locale');
      return null;
    }
    
    // Étape 2: Vérifier si le token expire bientôt (marge de 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = localSession.expires_at;
    const timeUntilExpiry = expiresAt ? expiresAt - now : 0;
    
    console.debug('[getAuthToken] Token expire dans', timeUntilExpiry, 'secondes');
    
    // Étape 3: Rafraîchir proactivement si nécessaire
    if (timeUntilExpiry < TOKEN_REFRESH_MARGIN_SECONDS) {
      console.debug('[getAuthToken] Rafraîchissement proactif du token (expire dans moins de 5 min)...');
      
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('[getAuthToken] Erreur lors du rafraîchissement:', {
          message: refreshError.message,
          status: refreshError.status,
        });
        // Ne pas retourner null immédiatement, essayer avec le token actuel s'il est encore valide
        if (timeUntilExpiry > 0 && localSession.access_token) {
          console.warn('[getAuthToken] Utilisation du token existant malgré l\'erreur de rafraîchissement');
          return localSession.access_token;
        }
        return null;
      }
      
      if (refreshData?.session?.access_token) {
        console.debug('[getAuthToken] Token rafraîchi avec succès, nouvelle expiration dans',
          refreshData.session.expires_at ? refreshData.session.expires_at - now : 'inconnu', 'secondes');
        return refreshData.session.access_token;
      }
    }
    
    // Étape 4: Vérifier le token côté serveur avec getUser() pour s'assurer qu'il est valide
    console.debug('[getAuthToken] Vérification du token avec getUser()...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('[getAuthToken] Token invalide côté serveur:', {
        message: userError.message,
        status: userError.status,
      });
      
      // Tenter un rafraîchissement si la vérification échoue
      console.debug('[getAuthToken] Tentative de rafraîchissement après erreur getUser()...');
      const { data: retryRefresh, error: retryError } = await supabase.auth.refreshSession();
      
      if (retryError || !retryRefresh?.session?.access_token) {
        console.error('[getAuthToken] Rafraîchissement échoué:', retryError?.message);
        return null;
      }
      
      console.debug('[getAuthToken] Token récupéré après rafraîchissement');
      return retryRefresh.session.access_token;
    }
    
    if (!user) {
      console.warn('[getAuthToken] Aucun utilisateur trouvé');
      return null;
    }
    
    console.debug('[getAuthToken] Token valide pour:', user.email);
    
    // Récupérer le token à jour après la vérification
    const { data: { session: finalSession } } = await supabase.auth.getSession();
    
    if (!finalSession?.access_token) {
      console.warn('[getAuthToken] Session perdue après vérification');
      return null;
    }
    
    return finalSession.access_token;
  } catch (error) {
    console.error('[getAuthToken] Erreur inattendue:', error);
    return null;
  }
}

/**
 * Make an authenticated request to an Edge Function
 * Inclut un système de retry automatique sur erreur 401
 * @param functionName - Nom de la Edge Function
 * @param options - Options fetch
 * @param isRetry - Indique si c'est un retry (usage interne)
 */
async function apiRequest<T>(
  functionName: string,
  options: RequestInit = {},
  isRetry: boolean = false
): Promise<T> {
  const token = await getAuthToken();
  if (!token) {
    console.error(`[apiRequest] Pas de token pour ${functionName}`);
    throw new Error('Not authenticated');
  }

  const url = getEdgeFunctionUrl(functionName);
  console.debug(`[apiRequest] Requête vers ${functionName}`, { 
    url, 
    hasToken: !!token,
    isRetry 
  });
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // Gestion des erreurs 401 avec retry automatique
  if (response.status === 401 && !isRetry) {
    console.warn(`[apiRequest] Erreur 401 pour ${functionName}, tentative de rafraîchissement...`);
    
    // Forcer le rafraîchissement du token
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error('[apiRequest] Échec du rafraîchissement:', refreshError.message);
      throw new Error('Session expired. Please login again.');
    }
    
    if (refreshData?.session?.access_token) {
      console.debug('[apiRequest] Token rafraîchi, retry de la requête...');
      // Retry avec le nouveau token (isRetry=true pour éviter boucle infinie)
      return apiRequest<T>(functionName, options, true);
    }
    
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: errorText };
    }
    
    console.error(`[apiRequest] Erreur ${response.status} pour ${functionName}:`, {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
      isRetry,
    });
    
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Categories API
// ============================================================================

export const adminCategoriesApi = {
  async getCategories(): Promise<MenuCategory[]> {
    return apiRequest<MenuCategory[]>('admin-categories', { method: 'GET' });
  },

  async createCategory(category: {
    name: string;
    icon?: string;
    stroke_rgba?: string;
    glow_rgba?: string;
    display_order?: number;
  }): Promise<{ success: boolean; category: MenuCategory }> {
    return apiRequest('admin-categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  },

  async updateCategory(
    id: string,
    updates: Partial<Pick<MenuCategory, 'name' | 'icon' | 'stroke_rgba' | 'glow_rgba' | 'display_order'>>
  ): Promise<{ success: boolean }> {
    return apiRequest('admin-categories', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...updates }),
    });
  },

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    return apiRequest('admin-categories', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  },
};

// ============================================================================
// Menu API
// ============================================================================

export const adminMenuApi = {
  /**
   * Get all menu items with variants, hotspots, and category
   */
  async getMenu(): Promise<MenuItem[]> {
    return apiRequest<MenuItem[]>('admin-menu', {
      method: 'GET',
    });
  },

  /**
   * Create a new menu item (categoryId required)
   */
  async createMenuItem(item: Partial<MenuItem> & { id: string; categoryId: string }): Promise<{ success: boolean; item: any }> {
    return apiRequest('admin-menu', {
      method: 'POST',
      body: JSON.stringify({
        id: item.id,
        name: item.name,
        categoryId: item.categoryId,
        shortDesc: item.shortDesc,
        fullDesc: item.fullDesc,
        price: item.price,
        image2D: item.image2D,
        modelUrl: item.modelUrl,
        dimensions: item.dimensions,
        nutrition: item.nutrition,
        variants: item.variants || [],
        hotspots: item.hotspots || [],
      }),
    });
  },

  /**
   * Update a menu item (categoryId optional)
   */
  async updateMenuItem(
    id: string,
    item: Partial<MenuItem>
  ): Promise<{ success: boolean }> {
    return apiRequest('admin-menu', {
      method: 'PATCH',
      body: JSON.stringify({
        id,
        name: item.name,
        categoryId: item.categoryId,
        shortDesc: item.shortDesc,
        fullDesc: item.fullDesc,
        price: item.price,
        image2D: item.image2D,
        modelUrl: item.modelUrl,
        dimensions: item.dimensions,
        nutrition: item.nutrition,
        variants: item.variants || [],
        hotspots: item.hotspots || [],
      }),
    });
  },

  /**
   * Delete a menu item
   */
  async deleteMenuItem(id: string): Promise<{ success: boolean }> {
    return apiRequest('admin-menu', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  },
};

// ============================================================================
// Settings API
// ============================================================================

export const adminSettingsApi = {
  /**
   * Get restaurant settings
   */
  async getSettings(): Promise<{
    id?: string;
    name?: string;
    logo_url?: string;
    theme_color?: string;
    qr_code_base_url?: string;
  }> {
    return apiRequest('admin-settings', {
      method: 'GET',
    });
  },

  /**
   * Update restaurant settings
   */
  async updateSettings(settings: {
    name: string;
    logo_url?: string;
    theme_color?: string;
    qr_code_base_url?: string;
  }): Promise<any> {
    return apiRequest('admin-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};

// ============================================================================
// Analytics API
// ============================================================================

export interface AnalyticsData {
  totalViews: number;
  totalCarts: number;
  avgEngagement: number;
  topItems: Array<{
    menu_item_id: string;
    name: string;
    views: number;
    carts: number;
    conversionRate: number;
  }>;
  eventsByType: Array<{
    event_type: string;
    count: number;
  }>;
  eventsByDay: Array<{
    date: string;
    views: number;
    carts: number;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    menu_item_id: string | null;
    menu_item_name: string | null;
    created_at: string;
    session_id: string | null;
  }>;
}

export const adminAnalyticsApi = {
  /**
   * Get analytics data for a given number of days
   * Inclut retry automatique sur 401
   */
  async getAnalytics(days: number = 7, isRetry: boolean = false): Promise<AnalyticsData> {
    const url = getEdgeFunctionUrl('admin-analytics') + `?days=${days}`;
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');
    
    console.debug('[getAnalytics] Requête analytics', { days, isRetry });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Retry sur 401
    if (response.status === 401 && !isRetry) {
      console.warn('[getAnalytics] Erreur 401, tentative de rafraîchissement...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData?.session) {
        throw new Error('Session expired. Please login again.');
      }
      
      console.debug('[getAnalytics] Token rafraîchi, retry...');
      return this.getAnalytics(days, true);
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[getAnalytics] Erreur:', { status: response.status, error });
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  },
};

// ============================================================================
// Sessions API (Customer Tracking)
// ============================================================================

export interface Session {
  session_id: string;
  views: number;
  carts: number;
  interactions: number;
  first_seen: string;
  last_seen: string;
  total_events: number;
  conversion_rate: number;
  status: 'active' | 'inactive';
  days_since_last_seen: number;
}

export interface SessionsData {
  sessions: Session[];
  stats: {
    totalSessions: number;
    activeSessions: number;
    avgOrders: number;
    retentionRate: number;
  };
  engagementByDay: Array<{
    day: string;
    views: number;
    interactions: number;
  }>;
}

export const adminSessionsApi = {
  /**
   * Get sessions data (customers) for a given number of days
   * Inclut retry automatique sur 401
   */
  async getSessions(days: number = 30, search?: string, isRetry: boolean = false): Promise<SessionsData> {
    const params = new URLSearchParams();
    params.set('days', days.toString());
    if (search) {
      params.set('search', search);
    }

    const url = getEdgeFunctionUrl('admin-sessions');
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    console.debug('[getSessions] Requête sessions', { days, search, isRetry });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Retry sur 401
    if (response.status === 401 && !isRetry) {
      console.warn('[getSessions] Erreur 401, tentative de rafraîchissement...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData?.session) {
        throw new Error('Session expired. Please login again.');
      }
      
      console.debug('[getSessions] Token rafraîchi, retry...');
      return this.getSessions(days, search, true);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[getSessions] Erreur:', { status: response.status, error });
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },
};

// ============================================================================
// Upload API
// ============================================================================

export const adminUploadApi = {
  /**
   * Get a signed URL for file upload
   */
  async getUploadUrl(bucket: string, path: string, fileType?: string): Promise<{
    signedUrl: string;
    path: string;
    token: string;
  }> {
    return apiRequest('admin-upload-url', {
      method: 'POST',
      body: JSON.stringify({ bucket, path, fileType }),
    });
  },
};

// ============================================================================
// Combined API export
// ============================================================================

export const adminApi = {
  menu: adminMenuApi,
  categories: adminCategoriesApi,
  settings: adminSettingsApi,
  analytics: adminAnalyticsApi,
  sessions: adminSessionsApi,
  upload: adminUploadApi,
};
