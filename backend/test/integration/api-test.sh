#!/bin/bash
# API Integration Test Script

BASE_URL="http://localhost:3002/api/v1"
TOKEN=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "=== Agent Task System - Integration Tests ==="
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Health check returned 200"
else
    echo -e "${RED}✗ FAIL${NC} - Expected 200, got $HTTP_CODE"
fi
echo ""

# Test 2: User Registration
echo "Test 2: User Registration"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"integration-$(date +%s)@example.com\",\"password\":\"Test123!@#\",\"name\":\"Integration Test\"}")

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.accessToken // empty')

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ PASS${NC} - User registered, token received"
else
    echo -e "${RED}✗ FAIL${NC} - Registration failed"
    echo "$REGISTER_RESPONSE" | jq '.'
fi
echo ""

if [ -z "$TOKEN" ]; then
    echo "Cannot proceed without token. Exiting."
    exit 1
fi

# Test 3: Create Task with Progress
echo "Test 3: Create Task with Progress=50"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Integration Test Task","progress":50,"priority":"high"}')

TASK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id // empty')
PROGRESS=$(echo "$CREATE_RESPONSE" | jq -r '.data.progress // empty')

if [ "$PROGRESS" = "50" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Task created with progress=50"
else
    echo -e "${RED}✗ FAIL${NC} - Expected progress=50, got $PROGRESS"
    echo "$CREATE_RESPONSE" | jq '.'
fi
echo ""

# Test 4: Update Task Progress
echo "Test 4: Update Task Progress to 75"
UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/tasks/$TASK_ID/progress" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"progress":75}')

NEW_PROGRESS=$(echo "$UPDATE_RESPONSE" | jq -r '.data.progress // empty')

if [ "$NEW_PROGRESS" = "75" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Progress updated to 75"
else
    echo -e "${RED}✗ FAIL${NC} - Expected progress=75, got $NEW_PROGRESS"
fi
echo ""

# Test 5: XSS Protection
echo "Test 5: XSS Protection"
XSS_RESPONSE=$(curl -s -X POST "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"<script>alert(1)</script>Test","description":"<img src=x onerror=alert(1)>"}')

XSS_TITLE=$(echo "$XSS_RESPONSE" | jq -r '.data.title // empty')

if [[ "$XSS_TITLE" == *"&lt;script"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} - XSS payload sanitized"
else
    echo -e "${RED}✗ FAIL${NC} - XSS payload not sanitized properly"
    echo "Title: $XSS_TITLE"
fi
echo ""

# Test 6: Boundary Validation
echo "Test 6: Boundary Validation (progress=150)"
INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Invalid Task","progress":150}')

HTTP_CODE=$(echo "$INVALID_RESPONSE" | jq -r '.statusCode // empty')

if [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Invalid progress rejected (400)"
else
    echo -e "${RED}✗ FAIL${NC} - Expected 400, got $HTTP_CODE"
fi
echo ""

# Test 7: Performance Check
echo "Test 7: Performance Check (10 concurrent requests)"
START_TIME=$(date +%s%N)

for i in {1..10}; do
    curl -s -X GET "$BASE_URL/tasks" \
      -H "Authorization: Bearer $TOKEN" > /dev/null &
done
wait

END_TIME=$(date +%s%N)
ELAPSED=$(( ($END_TIME - $START_TIME) / 1000000 ))
AVG_TIME=$(( $ELAPSED / 10 ))

if [ $AVG_TIME -lt 200 ]; then
    echo -e "${GREEN}✓ PASS${NC} - Average response time: ${AVG_TIME}ms (target: <200ms)"
else
    echo -e "${RED}✗ FAIL${NC} - Average response time: ${AVG_TIME}ms (exceeds 200ms)"
fi
echo ""

echo "=== Integration Test Complete ==="
