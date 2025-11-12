#!/bin/bash

# Get the client ID from the database
echo "🔍 Fetching client ID..."

# We'll use the API to initialize tasks
# First, let's check what clients exist by looking at the URL
echo ""
echo "📋 Instructions:"
echo "1. Look at your browser URL on the client detail page"
echo "2. It should look like: http://localhost:3000/dashboard/clients/[some-uuid]"
echo "3. Copy everything after '/clients/' (the UUID)"
echo ""
echo "Then run this command with your client ID:"
echo ""
echo "curl -X POST http://localhost:3000/api/automation/initialize-tasks \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"clientId\": \"YOUR-CLIENT-ID-HERE\"}'"
echo ""
