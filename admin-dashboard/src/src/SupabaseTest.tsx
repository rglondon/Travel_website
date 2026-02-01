/**
 * Supabase Connection Test
 * This runs in the browser to test Supabase connectivity
 */

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export const SupabaseTest: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('Testing Supabase connection...');
  const [galleryCount, setGalleryCount] = useState<number | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

      console.log('🔍 Testing Supabase connection...');
      console.log('URL:', supabaseUrl);
      console.log('Key:', supabaseKey?.substring(0, 20) + '...');

      if (!supabaseUrl || !supabaseKey) {
        setStatus('error');
        setMessage('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
        return;
      }

      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Test connection by fetching galleries
        const { data, error } = await supabase
          .from('galleries')
          .select('id', { count: 'exact' })
          .eq('is_active', true);

        if (error) {
          console.error('Supabase error:', error);
          setStatus('error');
          setMessage(`Error: ${error.message}`);
        } else {
          console.log('✅ Supabase connected successfully!');
          console.log('Galleries found:', data?.length || 0);
          setStatus('success');
          setMessage('Connected to Supabase!');
          setGalleryCount(data?.length || 0);
        }
      } catch (err: unknown) {
        const error = err as { message?: string };
        console.error('Connection error:', err);
        setStatus('error');
        setMessage(`Connection failed: ${error?.message || 'Unknown error'}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ 
      padding: '24px', 
      fontFamily: "'IBM Plex Mono', monospace",
      maxWidth: '600px',
      margin: '0 auto',
    }}>
      <h2 style={{ marginBottom: '16px' }}>Supabase Connection Test</h2>
      
      <div style={{ 
        padding: '16px', 
        background: status === 'checking' ? '#FFF3CD' : status === 'success' ? '#D4EDDA' : '#F8D7DA',
        border: '1px solid',
        borderColor: status === 'checking' ? '#FFEEBA' : status === 'success' ? '#C3E6CB' : '#F5C6CB',
        marginBottom: '16px',
      }}>
        <strong>Status:</strong> {status.toUpperCase()}
        <br />
        <strong>Message:</strong> {message}
        {galleryCount !== null && (
          <>
            <br />
            <strong>Galleries in database:</strong> {galleryCount}
          </>
        )}
      </div>

      <div style={{ fontSize: '12px', color: '#666' }}>
        <p><strong>Environment:</strong></p>
        <code>VITE_SUPABASE_URL = {import.meta.env?.VITE_SUPABASE_URL || 'NOT SET'}</code>
        <br />
        <code>VITE_SUPABASE_ANON_KEY = {import.meta.env?.VITE_SUPABASE_ANON_KEY ? '***' + import.meta.env.VITE_SUPABASE_ANON_KEY.slice(-10) : 'NOT SET'}</code>
      </div>
    </div>
  );
};

export default SupabaseTest;
