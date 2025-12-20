/**
 * Test local login to see if we can reproduce the Headers.append error
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
// Using the JWT-format anon key like production has
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlseGV1dGVmbm5hZ2tzbWFhZ3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDEwMDksImV4cCI6MjA4MTgxNzAwOX0.gsHM2lsBeSCV2ShzFC7U4WtI5sOFpx8RPlQgI6KLXWo';

console.log('Testing Supabase client creation with JWT anon key...');
console.log('Anon Key (first 50 chars):', supabaseAnonKey.substring(0, 50));

try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Client created successfully');

  // Try to sign in
  console.log('\nTesting signInWithPassword...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'test123'
  });

  if (error) {
    console.log('❌ Sign in error:', error.message);
  } else {
    console.log('✅ Sign in succeeded');
  }
} catch (error) {
  console.error('❌ Fatal error:', error.message);
  console.error('Full error:', error);
}
