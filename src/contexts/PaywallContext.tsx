import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface PaywallContextType {
  isOpen: boolean;
  showPaywall: (feature?: string, forced?: boolean) => void;
  hidePaywall: () => void;
  featureName: string | null;
  isForced: boolean;
}

const PaywallContext = createContext<PaywallContextType | undefined>(undefined);

export const PaywallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [featureName, setFeatureName] = useState<string | null>(null);
  const [isForced, setIsForced] = useState(false);

  const showPaywall = useCallback((feature?: string, forced: boolean = false) => {
    setFeatureName(feature || null);
    setIsForced(forced);
    setIsOpen(true);
  }, []);

  const hidePaywall = useCallback(() => {
    if (isForced) return;
    setIsOpen(false);
    setFeatureName(null);
    setIsForced(false);
  }, [isForced]);

  useEffect(() => {
    const handleShowPaywall = (event: Event) => {
      const customEvent = event as CustomEvent<{ feature?: string; forced?: boolean }>;
      showPaywall(customEvent.detail?.feature, customEvent.detail?.forced);
    };

    const handleHidePaywallForced = () => {
      setIsOpen(false);
      setFeatureName(null);
      setIsForced(false);
    };

    window.addEventListener('app:show-paywall', handleShowPaywall as EventListener);
    window.addEventListener('app:hide-paywall-forced', handleHidePaywallForced);
    return () => {
      window.removeEventListener('app:show-paywall', handleShowPaywall as EventListener);
      window.removeEventListener('app:hide-paywall-forced', handleHidePaywallForced);
    };
  }, [showPaywall]);

  return (
    <PaywallContext.Provider value={{ isOpen, showPaywall, hidePaywall, featureName, isForced }}>
      {children}
    </PaywallContext.Provider>
  );
};

export const usePaywallContext = () => {
  const context = useContext(PaywallContext);
  if (context === undefined) {
    throw new Error('usePaywallContext must be used within a PaywallProvider');
  }
  return context;
};

