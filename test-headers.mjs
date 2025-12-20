// Test if "Bearer TOKEN" is a valid header value in Node.js
console.log('Testing Headers.append with Bearer token...');

try {
  const headers = new Headers();
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlseGV1dGVmbm5hZ2tzbWFhZ3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDEwMDksImV4cCI6MjA4MTgxNzAwOX0.gsHM2lsBeSCV2ShzFC7U4WtI5sOFpx8RPlQgI6KLXWo';

  // Test 1: Set Authorization header (should work)
  headers.append('Authorization', `Bearer ${token}`);
  console.log('✅ Authorization header works:', headers.get('Authorization').substring(0, 30) + '...');

  // Test 2: Set cookie value with Bearer token (should fail?)
  const headers2 = new Headers();
  headers2.append('Set-Cookie', `Bearer ${token}`);
  console.log('✅ Set-Cookie with Bearer works?:', headers2.get('Set-Cookie').substring(0, 30) + '...');

  // Test 3: Append  value directly (what the error shows)
  const headers3 = new Headers();
  headers3.append('Cookie', `Bearer ${token}`);
  console.log('✅ Cookie with Bearer works?:', headers3.get('Cookie').substring(0, 30) + '...');

} catch (error) {
  console.error('❌ Error:', error.message);
}
