#!/bin/bash

# Test script for profile query parameter redirects
# Tests backward compatibility for legacy ?tab=* URLs

echo "Testing Profile Query Parameter Redirects"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000"
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test a redirect
test_redirect() {
  local tab=$1
  local expected=$2

  echo "Testing: ${BASE_URL}/profile?tab=${tab}"

  # Use curl with -L to follow redirects, -s for silent, -o to discard body
  # -w to print redirect URL
  REDIRECT_URL=$(curl -Ls -o /dev/null -w '%{url_effective}' "${BASE_URL}/profile?tab=${tab}")

  if [[ $REDIRECT_URL == *"${expected}"* ]]; then
    echo "✅ PASS: Redirected to ${REDIRECT_URL}"
    ((TESTS_PASSED++))
  else
    echo "❌ FAIL: Expected ${expected}, got ${REDIRECT_URL}"
    ((TESTS_FAILED++))
  fi
  echo ""
}

# Check if server is running
if ! curl -s "${BASE_URL}" > /dev/null 2>&1; then
  echo "❌ ERROR: Development server is not running at ${BASE_URL}"
  echo "Please run 'npm run dev' first"
  exit 1
fi

echo "✓ Server is running at ${BASE_URL}"
echo ""

# Run tests
test_redirect "payment-methods" "/profile/payment-methods"
test_redirect "categories" "/profile/categories"
test_redirect "tags" "/profile/tags"
test_redirect "preferences" "/profile/preferences"
test_redirect "overview" "/profile/overview"

# Test unknown tab (should redirect to overview)
echo "Testing: ${BASE_URL}/profile?tab=unknown"
REDIRECT_URL=$(curl -Ls -o /dev/null -w '%{url_effective}' "${BASE_URL}/profile?tab=unknown")
if [[ $REDIRECT_URL == *"/profile/overview"* ]]; then
  echo "✅ PASS: Unknown tab redirected to ${REDIRECT_URL}"
  ((TESTS_PASSED++))
else
  echo "❌ FAIL: Unknown tab should redirect to /profile/overview, got ${REDIRECT_URL}"
  ((TESTS_FAILED++))
fi
echo ""

# Summary
echo "=========================================="
echo "Test Results:"
echo "Passed: ${TESTS_PASSED}"
echo "Failed: ${TESTS_FAILED}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo "✅ All tests passed!"
  exit 0
else
  echo "❌ Some tests failed"
  exit 1
fi
