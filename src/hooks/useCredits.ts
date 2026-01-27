import { useState, useEffect, useCallback } from 'react';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';
import { useAuth } from './useAuth';

interface UserCredits {
  id: string;
  user_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  last_reset_at: string;
  next_reset_at: string;
}

interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'credit' | 'debit' | 'reset' | 'bonus' | 'refund';
  feature: string | null;
  description: string | null;
  balance_after: number;
  created_at: string;
}

interface CreditsState {
  credits: UserCredits | null;
  transactions: CreditTransaction[];
  loading: boolean;
  error: Error | null;
}

export function useCredits() {
  const { user } = useAuth();
  const [state, setState] = useState<CreditsState>({
    credits: null,
    transactions: [],
    loading: false, // Start as false - don't block, fetch in background
    error: null,
  });

  const fetchCredits = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        setState(prev => ({ 
          ...prev, 
          credits: { id: '', user_id: user.id, balance: 1000, lifetime_earned: 1000, lifetime_spent: 0, last_reset_at: '', next_reset_at: '' },
          loading: false 
        }));
        return;
      }
      if (error.code === 'PGRST116') {
        setState(prev => ({ 
          ...prev, 
          credits: { id: '', user_id: user.id, balance: 1000, lifetime_earned: 1000, lifetime_spent: 0, last_reset_at: '', next_reset_at: '' },
          loading: false 
        }));
        return;
      }
      setState(prev => ({ 
        ...prev, 
        error: new Error(error.message), 
        loading: false 
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      credits: data as UserCredits, 
      loading: false 
    }));
  }, [user]);

  const fetchTransactions = useCallback(async (limit = 20) => {
    if (!SUPABASE_CONFIGURED) return;
    if (!user) return;

    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        setState(prev => ({ ...prev, transactions: [] }));
      }
      return;
    }

    setState(prev => ({ 
      ...prev, 
      transactions: data as CreditTransaction[] 
    }));
  }, [user]);

  useEffect(() => {
    // Fetch credits and transactions in background - don't block navigation
    // If no user, don't fetch
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }
    
    // Fetch in background - non-blocking
    fetchCredits();
    fetchTransactions();
  }, [fetchCredits, fetchTransactions, user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('credits-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setState(prev => ({ 
              ...prev, 
              credits: payload.new as UserCredits 
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'credit_transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setState(prev => ({
              ...prev,
              transactions: [payload.new as CreditTransaction, ...prev.transactions].slice(0, 20),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const checkCanAfford = useCallback((amount: number): boolean => {
    return (state.credits?.balance ?? 0) >= amount;
  }, [state.credits]);

  const getTimeUntilReset = useCallback((): number | null => {
    if (!state.credits?.next_reset_at) return null;
    
    const resetDate = new Date(state.credits.next_reset_at);
    const now = new Date();
    return Math.max(0, resetDate.getTime() - now.getTime());
  }, [state.credits]);

  const formatCredits = useCallback((amount: number): string => {
    return new Intl.NumberFormat().format(amount);
  }, []);

  return {
    ...state,
    balance: state.credits?.balance ?? 0,
    checkCanAfford,
    getTimeUntilReset,
    formatCredits,
    refresh: fetchCredits,
    refreshTransactions: fetchTransactions,
  };
}
