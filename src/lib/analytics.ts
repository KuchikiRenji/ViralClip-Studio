import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useAnalytics = () => {
  const { user } = useAuth();

  const trackEvent = async (eventName: string, props: Record<string, any> = {}) => {
    try {
      await supabase.from('analytics_events').insert({
        user_id: user?.id || null,
        session_id: getSessionId(),
        event_name: eventName,
        path: window.location.pathname,
        referrer: document.referrer,
        props,
      });
    } catch (err) {
      console.error('Failed to track event', err);
    }
  };

  return { trackEvent };
};

// Fallback UUID generator for non-secure contexts
const generateUUID = (): string => {
  // Try crypto.randomUUID first (available in secure contexts)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback: Generate UUID v4-like string
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper to get/set session ID
const getSessionId = () => {
  let sid = sessionStorage.getItem('zitro_sid');
  if (!sid) {
    sid = generateUUID();
    sessionStorage.setItem('zitro_sid', sid);
  }
  return sid;
};

// Component to track page views
export const AnalyticsListener = () => {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    // Track initial page view
    trackEvent('page_view');

    // Simple history listener for SPA navigation
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      trackEvent('page_view');
    };

    window.addEventListener('popstate', () => trackEvent('page_view'));

    return () => {
      history.pushState = originalPushState;
      window.removeEventListener('popstate', () => trackEvent('page_view'));
    };
  }, []);

  return null;
};

