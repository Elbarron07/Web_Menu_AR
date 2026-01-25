// Admin API Client
// Handles all admin API calls to Supabase Edge Functions

import { supabase } from './supabase';
import type { MenuItem } from '../hooks/useMenu';

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

/**
 * Get the current session token for authenticated requests
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Make an authenticated request to an Edge Function
 */
async function apiRequest<T>(
  functionName: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const url = getEdgeFunctionUrl(functionName);
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Menu API
// ============================================================================

export const adminMenuApi = {
  /**
   * Get all menu items with variants and hotspots
   */
  async getMenu(): Promise<MenuItem[]> {
    return apiRequest<MenuItem[]>('admin-menu', {
      method: 'GET',
    });
  },

  /**
   * Create a new menu item
   */
  async createMenuItem(item: Partial<MenuItem> & { id: string }): Promise<{ success: boolean; item: any }> {
    return apiRequest('admin-menu', {
      method: 'POST',
      body: JSON.stringify({
        id: item.id,
        name: item.name,
        category: item.category,
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
   * Update a menu item
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
        category: item.category,
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
   */
  async getAnalytics(days: number = 7): Promise<AnalyticsData> {
    const url = getEdgeFunctionUrl('admin-analytics') + `?days=${days}`;
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
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
   */
  async getSessions(days: number = 30, search?: string): Promise<SessionsData> {
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

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
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
  settings: adminSettingsApi,
  analytics: adminAnalyticsApi,
  sessions: adminSessionsApi,
  upload: adminUploadApi,
};
