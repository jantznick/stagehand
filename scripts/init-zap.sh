#!/bin/bash

echo "🚀 Starting ZAP daemon..."

# Set JVM options for better memory management
export JAVA_OPTS="-Xmx2g -Xms512m -XX:+UseG1GC -XX:+UnlockExperimentalVMOptions -XX:+UseStringDeduplication"

# Start ZAP daemon with verbose logging
zap.sh -daemon -host 0.0.0.0 -port 8080 \
    -config api.addrs.addr.name=.* \
    -config api.addrs.addr.regex=true \
    -config api.disablekey=true \
    -config log4j.logger.root=INFO \
    -config log4j.logger.org.zaproxy.addon.spider=DEBUG \
    -config log4j.logger.org.zaproxy.zap.extension.ascan=DEBUG &

ZAP_PID=$!
echo "📍 ZAP daemon started with PID: $ZAP_PID"

# Function to check if ZAP is ready
check_zap_ready() {
    curl -s -f "http://localhost:8080/JSON/core/view/version/" > /dev/null 2>&1
    return $?
}

# Wait for ZAP to be ready (with timeout)
echo "⏳ Waiting for ZAP to initialize..."
TIMEOUT=60
COUNTER=0

while ! check_zap_ready; do
    if [ $COUNTER -ge $TIMEOUT ]; then
        echo "❌ ZAP failed to start within $TIMEOUT seconds"
        break
    fi
    
    echo "⏳ ZAP not ready yet... ($COUNTER/$TIMEOUT)"
    sleep 2
    COUNTER=$((COUNTER + 2))
done

if check_zap_ready; then
    echo "✅ ZAP is ready!"
    
    # Try to create persistent session (but don't fail if it doesn't work)
    echo "🗄️ Creating persistent session..."
    if curl -s -f "http://localhost:8080/JSON/core/action/newSession/?name=persistent_session&overwrite=true" > /dev/null 2>&1; then
        echo "✅ Persistent session created successfully"
    else
        echo "⚠️ Failed to create persistent session, continuing anyway..."
    fi
else
    echo "⚠️ ZAP may not be fully ready, but continuing..."
fi

echo "🎯 ZAP initialization complete! Keeping daemon running..."

# Keep the script alive and monitor ZAP process
MONITOR_COUNT=0
while kill -0 "$ZAP_PID" 2>/dev/null; do
    # Log memory usage every minute
    if [ $((MONITOR_COUNT % 6)) -eq 0 ]; then
        echo "📊 ZAP Status Check ($(date)):"
        if command -v ps >/dev/null 2>&1; then
            ps -p "$ZAP_PID" -o pid,ppid,vsz,rss,pcpu,pmem,cmd --no-headers 2>/dev/null || echo "  Could not get process stats"
        fi
        echo "  ZAP container uptime: $(ps -p "$ZAP_PID" -o etime --no-headers 2>/dev/null || echo 'N/A')"
    fi
    MONITOR_COUNT=$((MONITOR_COUNT + 1))
    sleep 10
done

echo "💀 ZAP daemon has stopped"
# Print final status
echo "🔍 Final ZAP process status:"
echo "  Exit reason: Process no longer running (PID $ZAP_PID)"
echo "  Check 'docker logs stagehand-zap' for detailed logs"
exit 1 