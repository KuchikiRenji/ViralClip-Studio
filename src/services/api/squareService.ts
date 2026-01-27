import { API_KEYS } from '../../constants/apiKeys';
import { invokeEdgeFunction } from '../../lib/supabase';

const SQUARE_SCRIPT_URL = API_KEYS.SQUARE.APP_ID.startsWith('sandbox-')
  ? 'https://sandbox.web.squarecdn.com/v1/square.js'
  : 'https://web.squarecdn.com/v1/square.js';

export type SquareTokenizeResult =
  | { status: 'OK'; token: string }
  | { status: string; token?: string; errors?: Array<{ message?: string }> };

export interface SquareCard {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<SquareTokenizeResult>;
  destroy: () => Promise<void>;
}

interface SquarePayments {
  card: () => Promise<SquareCard>;
}

interface SquareSdk {
  payments: (appId: string, locationId: string) => Promise<SquarePayments>;
}

declare global {
  interface Window {
    Square?: SquareSdk;
  }
}

let paymentsInstance: SquarePayments | null = null;

export const squareService = {
  loadScript: (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Square) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = SQUARE_SCRIPT_URL;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Square Web Payments SDK'));
      document.head.appendChild(script);
    });
  },

  initializePayments: async (): Promise<SquarePayments> => {
    await squareService.loadScript();
    
    if (!paymentsInstance) {
      if (!window.Square) {
        throw new Error('Square SDK not loaded');
      }

      paymentsInstance = await window.Square.payments(API_KEYS.SQUARE.APP_ID, API_KEYS.SQUARE.LOCATION_ID);
    }
    return paymentsInstance;
  },

  processPayment: async (token: string, packId: string): Promise<boolean> => {
    try {
      const data = await invokeEdgeFunction<{ success: boolean; error?: string }>('square-create-payment', {
        nonce: token,
        pack_id: packId
      });

      if (data?.error) throw new Error(data.error);
      
      return data?.success || false;
    } catch (err) {
      return false;
    }
  }
};
