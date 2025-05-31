#!/bin/bash

# FinSphere Platform End-to-End Test Script
# This script tests all implemented features

echo "🚀 Starting FinSphere Platform End-to-End Tests"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Helper function to test API endpoints
test_endpoint() {
    local name="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    local expected_status="$5"
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$url")
    else
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
    fi
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED (Expected: $expected_status, Got: $response)${NC}"
        echo -e "${YELLOW}Response:${NC} $(cat /tmp/response.json)"
        ((FAILED++))
    fi
}

# Check if backend is running
echo -e "${BLUE}🔍 Checking Backend Server...${NC}"
if curl -s http://localhost:5000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend server is running on port 5000${NC}"
else
    echo -e "${RED}❌ Backend server is not running. Please start it first.${NC}"
    exit 1
fi

# Check if frontend is running
echo -e "${BLUE}🔍 Checking Frontend Server...${NC}"
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Frontend server is running on port 3000${NC}"
else
    echo -e "${YELLOW}⚠️ Frontend server might not be running on port 3000${NC}"
fi

echo ""
echo -e "${BLUE}🧪 Running API Tests...${NC}"

# Test 1: Health Check
test_endpoint "Health Check" "http://localhost:5000/health" "GET" "" "200"

# Test 2: Protected route without token
test_endpoint "Protected Route (No Token)" "http://localhost:5000/api/v1/users" "GET" "" "401"

# Test 3: Invalid endpoint
test_endpoint "Invalid Endpoint" "http://localhost:5000/api/v1/nonexistent" "GET" "" "404"

# Test 4: User registration validation
test_endpoint "Registration Validation" "http://localhost:5000/api/v1/auth/register" "POST" '{"email":"invalid-email"}' "400"

# Test 5: CORS Headers
echo -n "Testing CORS Headers... "
cors_response=$(curl -s -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS http://localhost:5000/api/v1/auth/register -I)
if echo "$cors_response" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}🔌 Testing Socket.IO Connection...${NC}"

# Test Socket.IO connection
echo -n "Testing Socket.IO endpoint... "
if curl -s "http://localhost:5000/socket.io/?EIO=4&transport=polling" > /dev/null; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}📁 Testing File Upload Endpoints...${NC}"

# Test upload endpoints
test_endpoint "Upload Avatar (No Auth)" "http://localhost:5000/api/v1/upload/avatar" "POST" "" "401"
test_endpoint "Upload Cover (No Auth)" "http://localhost:5000/api/v1/upload/cover" "POST" "" "401"
test_endpoint "Upload KYC Document (No Auth)" "http://localhost:5000/api/v1/upload/kyc-document" "POST" '{"documentType":"identity"}' "401"

echo ""
echo -e "${BLUE}💬 Testing Message Endpoints...${NC}"

# Test message endpoints
test_endpoint "Get Conversations (No Auth)" "http://localhost:5000/api/v1/messages/conversations" "GET" "" "401"
test_endpoint "Send Message (No Auth)" "http://localhost:5000/api/v1/messages" "POST" '{"recipient":"someUserId","content":"Hello"}' "401"

echo ""
echo -e "${BLUE}👥 Testing Social Features...${NC}"

# Test social endpoints
test_endpoint "Get Feed (No Auth)" "http://localhost:5000/api/v1/feed" "GET" "" "401"
test_endpoint "Follow User (No Auth)" "http://localhost:5000/api/v1/follow/123" "POST" "" "401"

echo ""
echo -e "${BLUE}💰 Testing Financial Features...${NC}"

# Test savings endpoints
test_endpoint "Get Savings (No Auth)" "http://localhost:5000/api/v1/savings" "GET" "" "401"
test_endpoint "Get Loans (No Auth)" "http://localhost:5000/api/v1/loans" "GET" "" "401"

echo ""
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo "=================================="
echo -e "${GREEN}✅ Tests Passed: $PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $FAILED${NC}"
echo -e "${BLUE}📝 Total Tests: $((PASSED + FAILED))${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! FinSphere platform is working correctly.${NC}"
    echo ""
    echo -e "${BLUE}🌐 Access URLs:${NC}"
    echo -e "Frontend: ${YELLOW}http://localhost:3000${NC}"
    echo -e "Backend API: ${YELLOW}http://localhost:5000${NC}"
    echo -e "Real-time Chat Test: ${YELLOW}file:///$(pwd)/test-realtime-chat.html${NC}"
    echo ""
    echo -e "${BLUE}🧪 Next Steps:${NC}"
    echo "1. Test user registration and login in the frontend"
    echo "2. Test real-time chat functionality"
    echo "3. Test file upload features"
    echo "4. Test Material You theming"
    echo "5. Test mobile responsiveness"
else
    echo ""
    echo -e "${YELLOW}⚠️ Some tests failed. Please review the errors above.${NC}"
fi

# Clean up
rm -f /tmp/response.json

echo ""
echo -e "${BLUE}🏁 Testing completed at $(date)${NC}"
