#!/bin/bash

# Wait for ZAP to be ready
echo "Waiting for ZAP to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8080/JSON/core/view/version/ > /dev/null 2>&1; then
        echo "ZAP is ready!"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

# Create a persistent session
echo "Creating persistent ZAP session..."
curl -s "http://localhost:8080/JSON/core/action/newSession/?name=persistent_session&overwrite=true" > /dev/null

# Verify session was created
SESSION_RESPONSE=$(curl -s "http://localhost:8080/JSON/core/view/sessionLocation/")
if echo "$SESSION_RESPONSE" | grep -q "sessionLocation"; then
    echo "✅ Persistent session created successfully"
    echo "Session response: $SESSION_RESPONSE"
else
    echo "❌ Failed to create persistent session"
    echo "Response: $SESSION_RESPONSE"
    exit 1
fi

echo "ZAP initialization complete!" 