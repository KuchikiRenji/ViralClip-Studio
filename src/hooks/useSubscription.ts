import { useState, useEffect, useCallback } from 'react';
import { supabase, SUPABASE_CONFIGURED, invokeEdgeFunction } from '../lib/supabase';
import { useAuth } from './useAuth';

type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused' | 'incomplete';

interface SubscriptionPlan {
  id: string;
  name: 'beginner' | 'pro' | 'premium';
  stripe_price_id: string | null;
  price_monthly: number;
  credits_monthly: number;
  storage_limit_gb: number;
  max_video_duration_minutes: number;
  max_export_quality: '720p' | '1080p' | '4k';
  features: {
    transcription: boolean;
    script_generation: boolean;
    text_to_speech: boolean;
    voice_clone: boolean;
    image_generation: boolean;
    video_export: boolean;
    watermark: boolean;
    priority_processing: boolean;
    api_access: boolean;
    max_projects: number;
    max_voice_profiles: number;
  };
}

interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  plan: SubscriptionPlan;
}

interface SubscriptionState {
  subscription: UserSubscription | null;
  plans: SubscriptionPlan[];
  loading: boolean;
  error: Error | null;
}

export function useSubscription() {
  const { user, profile } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscription: null,
    plans: [],
    loading: false, // Start as false - don't block navigation, fetch in background
    error: null,
  });

  const fetchSubscription = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    let data, error;
    
    // Try fetching with nested plan data first
    const result = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', user.id)
      .maybeSingle();
    
    data = result.data;
    error = result.error;

    // If nested query fails with 406, try fetching separately
    if (error && error.code === '406') {
      console.warn('Nested subscription query failed, fetching separately:', error);
      const subResult = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (subResult.data && !subResult.error) {
        const planResult = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', subResult.data.plan_id)
          .single();
        
        if (planResult.data && !planResult.error) {
          data = { ...subResult.data, plan: planResult.data };
          error = null;
        } else {
          error = planResult.error;
        }
      } else {
        error = subResult.error;
      }
    }

    if (error) {
      console.error('Error fetching subscription:', error);
      setState(prev => ({ 
        ...prev, 
        error: new Error(error.message),
        loading: false 
      }));
      return;
    }

    if (!data) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    const planData = data.plan as unknown as {
      id: string;
      name: string;
      stripe_price_id: string | null;
      price_monthly: number | null;
      credits_monthly: number;
      storage_limit_gb: number;
      max_video_duration_minutes: number | null;
      max_export_quality: string | null;
      features: unknown;
    };

    const parseFeatures = (features: unknown): SubscriptionPlan['features'] => {
      if (!features || typeof features !== 'object') {
        return {
          transcription: false,
          script_generation: false,
          text_to_speech: false,
          voice_clone: false,
          image_generation: false,
          video_export: false,
          watermark: false,
          priority_processing: false,
          api_access: false,
          max_projects: 0,
          max_voice_profiles: 0,
        };
      }
      const f = features as Record<string, unknown>;
      return {
        transcription: Boolean(f.transcription),
        script_generation: Boolean(f.script_generation),
        text_to_speech: Boolean(f.text_to_speech),
        voice_clone: Boolean(f.voice_clone),
        image_generation: Boolean(f.image_generation),
        video_export: Boolean(f.video_export),
        watermark: Boolean(f.watermark),
        priority_processing: Boolean(f.priority_processing),
        api_access: Boolean(f.api_access),
        max_projects: typeof f.max_projects === 'number' ? f.max_projects : 0,
        max_voice_profiles: typeof f.max_voice_profiles === 'number' ? f.max_voice_profiles : 0,
      };
    };

    const plan: SubscriptionPlan = {
      id: planData.id,
      name: planData.name as 'beginner' | 'pro' | 'premium',
      stripe_price_id: planData.stripe_price_id,
      price_monthly: planData.price_monthly !== null ? Number(planData.price_monthly) : 0,
      credits_monthly: planData.credits_monthly,
      storage_limit_gb: planData.storage_limit_gb,
      max_video_duration_minutes: planData.max_video_duration_minutes ?? 0,
      max_export_quality: (planData.max_export_quality as '720p' | '1080p' | '4k') ?? '1080p',
      features: parseFeatures(planData.features),
    };

    const subscription: UserSubscription = {
      id: data.id,
      user_id: data.user_id,
      plan_id: data.plan_id,
      stripe_subscription_id: data.stripe_subscription_id,
      stripe_customer_id: data.stripe_customer_id,
      status: data.status as SubscriptionStatus,
      current_period_start: data.current_period_start,
      current_period_end: data.current_period_end,
      cancel_at_period_end: data.cancel_at_period_end ?? false,
      plan,
    };
    
    setState(prev => ({ 
      ...prev, 
      subscription, 
      loading: false 
    }));
  }, [user]);

  const fetchPlans = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) {
      return;
    }
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (!error && data) {
      const parseFeatures = (features: unknown): SubscriptionPlan['features'] => {
        if (!features || typeof features !== 'object') {
          return {
            transcription: false,
            script_generation: false,
            text_to_speech: false,
            voice_clone: false,
            image_generation: false,
            video_export: false,
            watermark: false,
            priority_processing: false,
            api_access: false,
            max_projects: 0,
            max_voice_profiles: 0,
          };
        }
        const f = features as Record<string, unknown>;
        return {
          transcription: Boolean(f.transcription),
          script_generation: Boolean(f.script_generation),
          text_to_speech: Boolean(f.text_to_speech),
          voice_clone: Boolean(f.voice_clone),
          image_generation: Boolean(f.image_generation),
          video_export: Boolean(f.video_export),
          watermark: Boolean(f.watermark),
          priority_processing: Boolean(f.priority_processing),
          api_access: Boolean(f.api_access),
          max_projects: typeof f.max_projects === 'number' ? f.max_projects : 0,
          max_voice_profiles: typeof f.max_voice_profiles === 'number' ? f.max_voice_profiles : 0,
        };
      };

      const plans: SubscriptionPlan[] = data.map(item => ({
        id: item.id,
        name: item.name as 'beginner' | 'pro' | 'premium',
        stripe_price_id: item.stripe_price_id,
        price_monthly: item.price_monthly !== null ? Number(item.price_monthly) : 0,
        credits_monthly: item.credits_monthly,
        storage_limit_gb: item.storage_limit_gb,
        max_video_duration_minutes: item.max_video_duration_minutes ?? 0,
        max_export_quality: (item.max_export_quality as '720p' | '1080p' | '4k') ?? '1080p',
        features: parseFeatures(item.features),
      }));

      setState(prev => ({ 
        ...prev, 
        plans
      }));
    }
  }, []);

  useEffect(() => {
    // Fetch subscription and plans in background - don't block anything
    // Set loading to false immediately if no user
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }
    
    // Fetch in background - non-blocking
    fetchSubscription();
    fetchPlans();
  }, [fetchSubscription, fetchPlans, user]);

  const createCheckoutSession = useCallback(async (planName: 'pro' | 'premium') => {
    if (!SUPABASE_CONFIGURED) {
      return { error: new Error('Subscriptions unavailable') };
    }
    if (!user) {
      return { error: new Error('Not authenticated') };
    }

    const plan = state.plans.find(p => p.name === planName);
    if (!plan?.stripe_price_id) {
      return { error: new Error('Plan not found or not available for purchase') };
    }

    try {
      const result = await invokeEdgeFunction<{ url: string }>('create-checkout', {
        price_id: plan.stripe_price_id,
        success_url: `${window.location.origin}/pricing?success=true`,
        cancel_url: `${window.location.origin}/pricing?canceled=true`,
      });

      return { url: result.url };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Checkout failed') };
    }
  }, [user, state.plans]);

  const createPortalSession = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) {
      return { error: new Error('Subscriptions unavailable') };
    }
    if (!user || !state.subscription?.stripe_customer_id) {
      return { error: new Error('No active subscription') };
    }

    try {
      const result = await invokeEdgeFunction<{ url: string }>('create-portal', {
        return_url: `${window.location.origin}/profile`,
      });

      return { url: result.url };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Portal session failed') };
    }
  }, [user, state.subscription]);

  const cancelSubscription = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) {
      return { error: new Error('Subscriptions unavailable') };
    }
    if (!state.subscription?.stripe_subscription_id) {
      return { error: new Error('No active subscription to cancel') };
    }

    try {
      await invokeEdgeFunction('cancel-subscription', {
        subscription_id: state.subscription.stripe_subscription_id,
      });

      await fetchSubscription();
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Cancellation failed') };
    }
  }, [state.subscription, fetchSubscription]);

  const hasFeature = useCallback((feature: keyof SubscriptionPlan['features']): boolean => {
    const featureValue = state.subscription?.plan?.features?.[feature];
    return typeof featureValue === 'boolean' ? featureValue : false;
  }, [state.subscription]);

  const canExportQuality = useCallback((quality: '720p' | '1080p' | '4k'): boolean => {
    const maxQuality = state.subscription?.plan?.max_export_quality ?? '1080p';
    const qualityOrder = ['720p', '1080p', '4k'];
    return qualityOrder.indexOf(quality) <= qualityOrder.indexOf(maxQuality);
  }, [state.subscription]);

  const getDaysUntilRenewal = useCallback((): number | null => {
    if (!state.subscription?.current_period_end) return null;
    
    const endDate = new Date(state.subscription.current_period_end);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [state.subscription]);

  return {
    ...state,
    plan: state.subscription?.plan ?? null,
    planName: state.subscription?.plan?.name ?? 'beginner',
    isActive: state.subscription?.status === 'active' || profile?.is_admin === true,
    isPro: state.subscription?.plan?.name === 'pro' || profile?.is_admin === true,
    isEnterprise: state.subscription?.plan?.name === 'premium' || profile?.is_admin === true,
    hasFeature: (feature: keyof SubscriptionPlan['features']): boolean => {
      if (profile?.is_admin) return true;
      const featureValue = state.subscription?.plan?.features?.[feature];
      return typeof featureValue === 'boolean' ? featureValue : false;
    },
    canExportQuality: (quality: '720p' | '1080p' | '4k'): boolean => {
      if (profile?.is_admin) return true;
      const maxQuality = state.subscription?.plan?.max_export_quality ?? '1080p';
      const qualityOrder = ['720p', '1080p', '4k'];
      return qualityOrder.indexOf(quality) <= qualityOrder.indexOf(maxQuality);
    },
    getDaysUntilRenewal,
    createCheckoutSession,
    createPortalSession,
    cancelSubscription,
    refresh: fetchSubscription,
  };
}
