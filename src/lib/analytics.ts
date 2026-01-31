import { supabase } from './supabase';
import { logger } from './logger';

export type AnalyticsEventType = 
  | 'view_3d' 
  | 'add_to_cart' 
  | 'hotspot_click' 
  | 'ar_session_start' 
  | 'ar_session_end';

export interface AnalyticsEvent {
  menu_item_id?: string;
  event_type: AnalyticsEventType;
  session_id?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

class AnalyticsService {
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    const stored = sessionStorage.getItem('analytics_session_id');
    if (stored) return stored;
    
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', newSessionId);
    return newSessionId;
  }

  async track(event: AnalyticsEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          menu_item_id: event.menu_item_id || null,
          event_type: event.event_type,
          session_id: this.sessionId,
          duration: event.duration || null,
          metadata: event.metadata || {},
        });

      if (error) {
        logger.error('[Analytics] Erreur tracking');
      }
    } catch {
      logger.error('[Analytics] Erreur');
    }
  }

  trackView3D(menuItemId: string): void {
    this.track({
      menu_item_id: menuItemId,
      event_type: 'view_3d',
    });
  }

  trackAddToCart(menuItemId: string): void {
    this.track({
      menu_item_id: menuItemId,
      event_type: 'add_to_cart',
    });
  }

  trackHotspotClick(menuItemId: string, hotspotSlot: string): void {
    this.track({
      menu_item_id: menuItemId,
      event_type: 'hotspot_click',
      metadata: { hotspot_slot: hotspotSlot },
    });
  }

  trackARSessionStart(menuItemId: string): void {
    this.track({
      menu_item_id: menuItemId,
      event_type: 'ar_session_start',
    });
  }

  trackARSessionEnd(menuItemId: string, duration: number): void {
    this.track({
      menu_item_id: menuItemId,
      event_type: 'ar_session_end',
      duration,
    });
  }
}

export const analytics = new AnalyticsService();
