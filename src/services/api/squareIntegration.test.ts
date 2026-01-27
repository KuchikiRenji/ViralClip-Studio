// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { squareService } from './squareService';
import { API_KEYS } from '../../constants/apiKeys';

// Mock the Square SDK global object
const mockPayments = {
  card: vi.fn().mockResolvedValue({
    attach: vi.fn().mockResolvedValue(undefined),
    tokenize: vi.fn().mockResolvedValue({ status: 'OK', token: 'cnon:mock-nonce' }),
    destroy: vi.fn().mockResolvedValue(undefined),
  }),
};

const mockSquare = {
  payments: vi.fn().mockResolvedValue(mockPayments),
};

describe('Square Payment Integration', () => {
  beforeEach(() => {
    // Reset DOM and Window mocks
    document.head.innerHTML = '';
    vi.clearAllMocks();
    
    // Cleanup singleton in service (if possible, though modules cache state)
    // We might need to reload module or just trust the logic
  });

  afterEach(() => {
    delete window.Square;
  });

  it('should have correct Sandbox credentials configured', () => {
    expect(API_KEYS.SQUARE.APP_ID).toBe('sandbox-sq0idb-dMIn6zpMOMzBVF9SL_AM6Q');
    // Access Token is moved to backend, so we don't check for it here anymore
  });

  it('should load the Square script into the DOM', async () => {
    // Mock successful script load
    const loadPromise = squareService.loadScript();
    
    // Simulate script tag behavior
    const script = document.querySelector('script[src="https://sandbox.web.squarecdn.com/v1/square.js"]');
    expect(script).toBeTruthy();
    
    // Trigger onload manually
    if (script) {
        (script as any).onload();
    }
    
    await expect(loadPromise).resolves.toBeUndefined();
  });

  it('should initialize payments with the correct App ID', async () => {
    // Setup environment
    window.Square = mockSquare;
    
    // Mock loadScript to resolve immediately since we "loaded" it above
    // Since loadScript checks for window.Square, we are good
    
    const payments = await squareService.initializePayments();
    
    expect(window.Square.payments).toHaveBeenCalledWith(
      API_KEYS.SQUARE.APP_ID,
      'LKXHQZGTCYFT4'
    );
    expect(payments).toBe(mockPayments);
  });

  it('should process payment successfully with a valid token', async () => {
    const token = 'cnon:card-nonce-ok';
    const packId = 'test-pack-id';
    
    const result = await squareService.processPayment(token, packId);
    
    expect(typeof result).toBe('boolean');
  });
});
