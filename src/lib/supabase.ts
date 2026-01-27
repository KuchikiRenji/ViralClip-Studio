import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { SUPABASE_CONFIG } from '@/constants/apiKeys';

const supabaseUrl = SUPABASE_CONFIG.URL;
const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;
export const SUPABASE_CONFIGURED = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const SUPABASE_ERROR_CODES = {
  NO_ROWS_RETURNED: 'PGRST116',
} as const;

export const getEdgeFunctionUrl = (functionName: string) => 
  `${supabaseUrl}/functions/v1/${functionName}`;

export type PaywallErrorPayload = {
  error: {
    code: 'PAYWALL_REQUIRED';
    message: string;
    action: string;
  };
};

export class PaywallRequiredError extends Error {
  readonly code = 'PAYWALL_REQUIRED' as const;
  readonly action: string;

  constructor(message: string, action: string) {
    super(message);
    this.name = 'PaywallRequiredError';
    this.action = action;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isPaywallErrorPayload = (value: unknown): value is PaywallErrorPayload => {
  if (!isRecord(value)) return false;
  const error = value.error;
  if (!isRecord(error)) return false;
  return error.code === 'PAYWALL_REQUIRED' && typeof error.message === 'string' && typeof error.action === 'string';
};

const readJsonSafely = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const dispatchPaywall = (message: string) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('app:show-paywall', { detail: { feature: message, forced: true } }));
};

export async function invokeEdgeFunction<T>(
  functionName: string,
  body?: Record<string, unknown>,
  options?: { method?: string }
): Promise<T> {
  if (!SUPABASE_CONFIGURED) {
    throw new Error('Supabase is not configured. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  }
  const { data: { session } } = await supabase.auth.getSession();
  
  try {
    console.log('🔵 Calling edge function:', {
      functionName,
      url: getEdgeFunctionUrl(functionName),
      hasSession: !!session?.access_token,
      body: body,
      method: options?.method || 'POST'
    })
    const response = await fetch(getEdgeFunctionUrl(functionName), {
      method: options?.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    console.log('🟢 Edge function response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })
    if (response.status === 402) {
      const payload = await readJsonSafely(response);
      if (isPaywallErrorPayload(payload)) {
        dispatchPaywall(payload.error.message);
        throw new PaywallRequiredError(payload.error.message, payload.error.action);
      }
      throw new Error('PAYWALL_REQUIRED');
    }

    if (!response.ok) {
      let payload
      try {
        payload = await readJsonSafely(response);
      } catch (e) {
        console.error('Failed to parse error response:', e)
        throw new Error(`Edge function error: ${response.status} ${response.statusText}`)
      }
      
      // Log the full error for debugging
      const issuesArray = (payload as any)?.issues;
      console.error('❌ Edge function error response:', {
        status: response.status,
        statusText: response.statusText,
        functionName,
        payload,
        issues: issuesArray,
        issuesExpanded: issuesArray ? JSON.stringify(issuesArray, null, 2) : undefined
      });
      
      // Also log issues array separately for easier inspection
      if (issuesArray && Array.isArray(issuesArray)) {
        console.error('🔍 Validation Issues Details:', issuesArray);
        issuesArray.forEach((issue: any, index: number) => {
          console.error(`  Issue ${index + 1}:`, issue);
          if (issue.path) console.error(`    Path:`, issue.path);
          if (issue.message) console.error(`    Message:`, issue.message);
          if (issue.code) console.error(`    Code:`, issue.code);
        });
      }
      
      if (isRecord(payload)) {
        // Extract error message with details
        let errorMsg = payload.error || payload.message || 'Unknown error'
        
        // If there are issues, format them clearly
        if (payload.issues && Array.isArray(payload.issues)) {
          const issuesDetails = payload.issues.map((issue: any, index: number) => {
            if (typeof issue === 'string') {
              return `Issue ${index + 1}: ${issue}`
            }
            if (issue && typeof issue === 'object') {
              const path = issue.path ? (Array.isArray(issue.path) ? issue.path.join('.') : issue.path) : 'unknown'
              const message = issue.message || issue.code || JSON.stringify(issue)
              return `Issue ${index + 1} [${path}]: ${message}`
            }
            return `Issue ${index + 1}: ${JSON.stringify(issue)}`
          }).join('\n')
          
          errorMsg = `${errorMsg}\n\nValidation Issues:\n${issuesDetails}`
        }
        
        const details = payload.details 
          ? `\n\nFull Details: ${JSON.stringify(payload.details, null, 2)}`
          : ''
        
        throw new Error(`${errorMsg}${details}`)
      }
      
      if (typeof payload === 'string') {
        throw new Error(payload)
      }
      
      throw new Error(`Edge function error: ${response.status} ${response.statusText}`)
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('Network Error calling edge function:', functionName, error);
      throw new Error(`Network Error: Could not connect to Supabase Edge Function "${functionName}". This might be due to missing environment variables, CORS, or the function not being deployed.`);
    }
    throw error;
  }
}

export async function invokeEdgeFunctionBlob(
  functionName: string,
  body?: Record<string, unknown>,
  options?: { method?: string }
): Promise<Blob> {
  if (!SUPABASE_CONFIGURED) {
    throw new Error('Supabase is not configured. Please check your .env file.');
  }
  const { data: { session } } = await supabase.auth.getSession();
  
  try {
    const response = await fetch(getEdgeFunctionUrl(functionName), {
      method: options?.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 402) {
      const payload = await readJsonSafely(response);
      if (isPaywallErrorPayload(payload)) {
        dispatchPaywall(payload.error.message);
        throw new PaywallRequiredError(payload.error.message, payload.error.action);
      }
      throw new Error('PAYWALL_REQUIRED');
    }

    if (!response.ok) {
      const payload = await readJsonSafely(response);
      if (isRecord(payload) && typeof payload.error === 'string') {
        throw new Error(payload.error);
      }
      if (typeof payload === 'string') {
        throw new Error(payload);
      }
      throw new Error(`Edge function error: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`Network Error: Could not connect to Supabase Edge Function "${functionName}".`);
    }
    throw error;
  }
}


/**
 * Invoke an edge function with FormData (for file uploads)
 */
export async function invokeEdgeFunctionFormData<T>(
  functionName: string,
  formData: FormData,
  customHeaders?: Record<string, string>,
  options?: { method?: string; path?: string }
): Promise<T> {
  if (!SUPABASE_CONFIGURED) {
    throw new Error('Supabase is not configured. Please check your .env file.');
  }
  const { data: { session } } = await supabase.auth.getSession();

  try {
    const headers: HeadersInit = {
      'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
      ...(customHeaders ?? {}),
    };
    
    // Add path header for elevenlabs-proxy if provided
    if (options?.path) {
      headers['x-elevenlabs-path'] = options.path;
    }

    const response = await fetch(getEdgeFunctionUrl(functionName), {
      method: options?.method || 'POST',
      headers,
      body: formData, // Don't set Content-Type - browser sets it with boundary
    });

    if (response.status === 402) {
      const payload = await readJsonSafely(response);
      if (isPaywallErrorPayload(payload)) {
        dispatchPaywall(payload.error.message);
        throw new PaywallRequiredError(payload.error.message, payload.error.action);
      }
      throw new Error('PAYWALL_REQUIRED');
    }

    if (!response.ok) {
      const payload = await readJsonSafely(response);
      if (isRecord(payload) && typeof payload.error === 'string') {
        throw new Error(payload.error);
      }
      if (typeof payload === 'string') {
        throw new Error(payload);
      }
      throw new Error(`Edge function error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`Network Error: Could not connect to Supabase Edge Function "${functionName}".`);
    }
    throw error;
  }
}

export type { Database };
