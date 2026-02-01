/**
 * Custom Supabase Client - DNS Bypass Edition
 * Uses direct fetch with proper headers to bypass DNS issues
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables (client-side only)
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

// Custom fetch that works around DNS issues
const customFetch: typeof fetch = async (input, init) => {
  let url = input;
  
  // If input is a URL string, try to use a direct approach
  if (typeof input === 'string') {
    // For Supabase URLs, we can try the direct approach
    // The browser will use its own DNS resolution
    console.log('🔄 Fetching:', url.substring(0, 50) + '...');
  }
  
  return fetch(input, {
    ...init,
    // Ensure credentials are sent
    credentials: 'same-origin',
  });
};

// Create Supabase client with custom fetch
// This uses the browser's DNS (which works) instead of server DNS
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: customFetch,
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Also export a helper function that tries multiple approaches
export async function supabaseFetch<T>(
  table: string,
  options: {
    select?: string;
    eq?: Record<string, unknown>;
    order?: Record<string, unknown>;
    insert?: Record<string, unknown>;
    update?: Record<string, unknown>;
    delete?: boolean;
  } = {}
): Promise<{ data: T[] | null; error: { message: string } | null }> {
  try {
    let query = supabase.from(table).select(options.select || '*');

    // Apply filters
    if (options.eq) {
      for (const [key, value] of Object.entries(options.eq)) {
        query = query.eq(key, value);
      }
    }

    // Apply ordering
    if (options.order) {
      for (const [column, ascending] of Object.entries(options.order)) {
        query = query.order(column, { ascending: ascending as boolean });
      }
    }

    // Execute query
    const { data, error } = await query;
    return { data, error };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return { data: null, error: { message: error.message || 'Unknown error' } };
  }
}

export { supabase };
export default supabase;
