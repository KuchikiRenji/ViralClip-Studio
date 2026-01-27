import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { useCallback } from 'react';
import { usePaywallContext } from '../contexts/PaywallContext';

export function usePaywall() {
  const { user, profile, loading } = useAuth();
  const { isActive } = useSubscription();
  const { showPaywall } = usePaywallContext();

  const navigateToPricing = useCallback(() => {
    window.dispatchEvent(new CustomEvent('app:navigate', { 
      detail: { view: 'pricing', search: '?reason=paywall' } 
    }));
  }, []);

  const requireSubscription = useCallback((featureName?: string): boolean => {
    // Step 1: Wait for auth to finish loading before making decisions
    if (loading) {
      console.log('⏳ Auth still loading, deferring subscription check...');
      return false;
    }

    // Step 2: Check if user is authenticated (has valid session/token)
    if (!user) {
      console.log('🔒 User not authenticated, redirecting to login...');
      // User is not logged in - navigate to login page WITHOUT paywall reason
      // This ensures user returns to home after login, not pricing page
      window.dispatchEvent(new CustomEvent('app:navigate', { 
        detail: { view: 'login', search: '' } 
      }));
      return false;
    }

    // Step 3: User is authenticated - check subscription status
    if (!isActive && !profile?.is_admin) {
      console.log('💳 User needs subscription, showing paywall...');
      // User is logged in but doesn't have active subscription - show paywall/pricing
      showPaywall(featureName);
      return false;
    }

    // Step 4: User is authenticated and has active subscription - allow access
    console.log('✅ User authorized, allowing feature access');
    return true;
  }, [user, loading, isActive, showPaywall, profile?.is_admin]);

  return {
    isBlocked: !user || (!isActive && !profile?.is_admin),
    requireSubscription,
    navigateToPricing,
    showPaywall,
  };
}

