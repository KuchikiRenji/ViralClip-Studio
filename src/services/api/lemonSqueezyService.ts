import { API_KEYS, API_URLS } from '@/constants/apiKeys';

interface CheckoutOptions {
  variantId: string;
  redirectUrl?: string;
  email?: string;
  name?: string;
}

let cachedStoreId: string | null = null;

export const lemonSqueezyService = {
  /**
   * Fetches the first store ID associated with the API key
   */
  async getStoreId(): Promise<string> {
    if (cachedStoreId) return cachedStoreId;

    try {
      const response = await fetch(`${API_URLS.LEMONSQUEEZY}/stores`, {
        headers: {
          'Authorization': `Bearer ${API_KEYS.LEMONSQUEEZY}`,
          'Accept': 'application/vnd.api+json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stores: ${response.status}`);
      }

      const data = await response.json();
      const storeId = data.data?.[0]?.id;

      if (!storeId) {
        throw new Error('No stores found for this API key');
      }

      cachedStoreId = storeId;
      return storeId;
    } catch (error) {
      console.error('Error fetching LemonSqueezy store:', error);
      throw error;
    }
  },

  /**
   * Creates a checkout URL for LemonSqueezy
   */
  async createCheckout(options: CheckoutOptions): Promise<string> {
    try {
      // Ensure we have a store ID
      const storeId = await this.getStoreId();

      const response = await fetch(`${API_URLS.LEMONSQUEEZY}/checkouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'Authorization': `Bearer ${API_KEYS.LEMONSQUEEZY}`,
          'Accept': 'application/vnd.api+json'
        },
        body: JSON.stringify({
          data: {
            type: 'checkouts',
            attributes: {
              checkout_data: {
                email: options.email,
                name: options.name,
              },
              product_options: {
                redirect_url: options.redirectUrl || window.location.origin,
              }
            },
            relationships: {
              store: {
                data: {
                  type: 'stores',
                  id: storeId
                }
              },
              variant: {
                data: {
                  type: 'variants',
                  id: options.variantId
                }
              }
            }
          }
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.errors?.[0]?.detail || `LemonSqueezy API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data.attributes.url;
    } catch (error) {
      console.error('LemonSqueezy checkout error:', error);
      throw error;
    }
  },

  /**
   * Verify a license key or subscription
   */
  async getSubscription(subscriptionId: string) {
     const response = await fetch(`${API_URLS.LEMONSQUEEZY}/subscriptions/${subscriptionId}`, {
        headers: {
          'Authorization': `Bearer ${API_KEYS.LEMONSQUEEZY}`,
          'Accept': 'application/vnd.api+json'
        },
      });
      return response.json();
  }
};

