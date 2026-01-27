export const API_KEYS = {
  OPENAI: '',
  ANTHROPIC: '',
  ELEVENLABS: '',
  LEMONSQUEEZY: '',
  RUNWAY: '',
  SQUARE: {
    APP_ID: 'sandbox-sq0idb-dMIn6zpMOMzBVF9SL_AM6Q',
    LOCATION_ID: 'LKXHQZGTCYFT4',
    ACCESS_TOKEN: '',
  },
  APIFY: '',
} as const;

export const API_URLS = {
  OPENAI: 'https://api.openai.com/v1',
  ANTHROPIC: 'https://api.anthropic.com/v1',
  ELEVENLABS: 'https://api.elevenlabs.io/v1',
  LEMONSQUEEZY: 'https://api.lemonsqueezy.com/v1',
  RUNWAY: 'https://api.dev.runwayml.com/v1',
  APIFY: 'https://api.apify.com',
} as const;

// Supabase configuration - uses environment variables if available, otherwise falls back to hardcoded values
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://edmmbwiifjmruhzvlgnh.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbW1id2lpZmptcnVoenZsZ25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMDA2MTcsImV4cCI6MjA3OTc3NjYxN30.IDoFwQ-6MVQIJkgMC06Jip2P89pUFPjBQVzz3aQGS4E';

// App URL for email redirects (use production URL or current origin for local dev)
export const APP_URL = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://zitro.ai');

export const SUPABASE_CONFIG = {
  URL: SUPABASE_URL,
  ANON_KEY: SUPABASE_ANON_KEY,
} as const;

export const DISCORD_URL = '';
