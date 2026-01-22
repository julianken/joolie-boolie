#!/usr/bin/env node
/**
 * verify-oauth-sdk.mjs
 *
 * Verifies that Supabase OAuth 2.1 SDK methods exist and are callable.
 * Tests the methods we'll use in Phase 2 implementation.
 */

import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from platform-hub .env.local
const envPath = join(__dirname, '../apps/platform-hub/.env.local');
let envContent;
try {
  envContent = readFileSync(envPath, 'utf-8');
} catch (error) {
  console.error('❌ Error: Cannot read .env.local file at', envPath);
  console.error('   Please ensure apps/platform-hub/.env.local exists');
  process.exit(1);
}

// Parse environment variables
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗');
  process.exit(1);
}

console.log('🔍 Supabase OAuth SDK Verification');
console.log('=====================================\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Role Key:', serviceRoleKey.substring(0, 20) + '...\n');

// Create Supabase client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('📋 Checking SDK method availability...\n');

// Check if OAuth methods exist
const checks = [
  {
    name: 'supabase.auth.oauth',
    path: 'auth.oauth',
    exists: !!supabase.auth.oauth
  },
  {
    name: 'supabase.auth.oauth.getAuthorizationDetails',
    path: 'auth.oauth.getAuthorizationDetails',
    exists: typeof supabase.auth.oauth?.getAuthorizationDetails === 'function'
  },
  {
    name: 'supabase.auth.oauth.approveAuthorization',
    path: 'auth.oauth.approveAuthorization',
    exists: typeof supabase.auth.oauth?.approveAuthorization === 'function'
  },
  {
    name: 'supabase.auth.oauth.denyAuthorization',
    path: 'auth.oauth.denyAuthorization',
    exists: typeof supabase.auth.oauth?.denyAuthorization === 'function'
  }
];

let allPassed = true;

checks.forEach(check => {
  const status = check.exists ? '✅ FOUND' : '❌ MISSING';
  console.log(`${status}: ${check.name}`);
  if (!check.exists) {
    allPassed = false;
  }
});

console.log('');

if (!allPassed) {
  console.error('❌ SDK Verification Failed');
  console.error('   Some OAuth methods are missing from the Supabase SDK.');
  console.error('   This may indicate:');
  console.error('   1. Outdated @supabase/supabase-js version (need v2.45.0+)');
  console.error('   2. OAuth 2.1 server not enabled in Supabase Dashboard');
  console.error('   3. Project tier does not support OAuth server');
  console.error('');
  console.error('   Next steps:');
  console.error('   - Check @supabase/supabase-js version: npm list @supabase/supabase-js');
  console.error('   - Verify OAuth server is enabled in Supabase Dashboard');
  console.error('   - Review Phase 1 completion status');
  process.exit(1);
}

console.log('✅ All OAuth SDK methods found!\n');

// Test method signatures with mock authorization_id
console.log('📋 Testing method signatures...\n');

console.log('Testing getAuthorizationDetails with mock ID...');
try {
  const mockAuthId = 'test-authorization-id-12345';
  const result = await supabase.auth.oauth.getAuthorizationDetails(mockAuthId);

  // We expect this to fail (invalid ID), but we're checking the response structure
  if (result.error) {
    console.log('   ✅ Method callable - returns { data, error } structure');
    console.log(`   📝 Error response: ${result.error.message}`);
    console.log('   ℹ️  This is expected for a mock authorization ID');
  } else if (result.data) {
    console.log('   ⚠️  Unexpected: Got data for mock ID');
    console.log('   📝 Data structure:', Object.keys(result.data));
  }
} catch (error) {
  console.error('   ❌ Method threw exception:', error.message);
  allPassed = false;
}

console.log('');

// Check if we can see the structure
console.log('📋 Method Structure Analysis...\n');
console.log('getAuthorizationDetails signature:');
console.log('  - Type:', typeof supabase.auth.oauth.getAuthorizationDetails);
console.log('  - Length (params):', supabase.auth.oauth.getAuthorizationDetails.length);

console.log('\napproveAuthorization signature:');
console.log('  - Type:', typeof supabase.auth.oauth.approveAuthorization);
console.log('  - Length (params):', supabase.auth.oauth.approveAuthorization.length);

console.log('\ndenyAuthorization signature:');
console.log('  - Type:', typeof supabase.auth.oauth.denyAuthorization);
console.log('  - Length (params):', supabase.auth.oauth.denyAuthorization.length);

console.log('');

if (allPassed) {
  console.log('=====================================');
  console.log('✅ SDK Verification PASSED');
  console.log('=====================================\n');
  console.log('Phase 2 can proceed with implementation.');
  console.log('All required Supabase OAuth methods are available.\n');
  process.exit(0);
} else {
  console.log('=====================================');
  console.log('❌ SDK Verification FAILED');
  console.log('=====================================\n');
  console.log('Please resolve the issues above before proceeding.\n');
  process.exit(1);
}
