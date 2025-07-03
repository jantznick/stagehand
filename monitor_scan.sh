#!/bin/bash

# ZAP Scan Monitor - Shows real-time scanning activity
SCAN_ID=${1:-0}
ZAP_URL="http://localhost:8080"

echo "🔍 ZAP Scan Monitor - Real-time scanning activity"
echo "================================================"
echo "Monitoring scan ID: $SCAN_ID"
echo "ZAP URL: $ZAP_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to get scan status
get_scan_status() {
    curl -s "$ZAP_URL/JSON/ascan/view/status/?scanId=$SCAN_ID" | jq -r '.status // "N/A"'
}

# Function to get active plugins
get_active_plugins() {
    curl -s "$ZAP_URL/JSON/ascan/view/scanProgress/?scanId=$SCAN_ID" | \
    jq -r '.scanProgress[1].HostProcess[]? | select(.Plugin[3] == "50%" or .Plugin[3] == "Running" or (.Plugin[3] | test("^[0-9]+%$"))) | 
    "  🔬 " + .Plugin[0] + " (" + .Plugin[3] + ") - " + .Plugin[4] + " tests"'
}

# Function to get completed plugins with findings
get_completed_plugins() {
    curl -s "$ZAP_URL/JSON/ascan/view/scanProgress/?scanId=$SCAN_ID" | \
    jq -r '.scanProgress[1].HostProcess[]? | select(.Plugin[3] == "Complete") | 
    if (.Plugin[6] | tonumber) > 0 then
        "  🚨 " + .Plugin[0] + " - " + .Plugin[6] + " issues found!"
    else
        "  ✅ " + .Plugin[0] + " - Clean (" + .Plugin[4] + " tests)"
    end'
}

# Function to get current alerts/findings
get_alerts() {
    curl -s "$ZAP_URL/JSON/core/view/alerts/" | \
    jq -r '.alerts[]? | "  🔴 " + .alert + " - " + .url + " (Risk: " + .risk + ")"'
}

# Function to get URLs being tested
get_urls_in_scope() {
    curl -s "$ZAP_URL/JSON/core/view/urls/" | \
    jq -r '.urls[]? | "  📄 " + .' | head -10
}

# Main monitoring loop
while true; do
    clear
    echo -e "${CYAN}🔍 ZAP Scan Monitor - Real-time scanning activity${NC}"
    echo "================================================"
    echo -e "${BLUE}Monitoring scan ID: $SCAN_ID${NC}"
    echo -e "${BLUE}ZAP URL: $ZAP_URL${NC}"
    echo ""
    
    # Get overall scan status
    STATUS=$(get_scan_status)
    if [ "$STATUS" = "100" ]; then
        echo -e "${GREEN}✅ Scan Status: COMPLETE${NC}"
    elif [ "$STATUS" = "N/A" ] || [ "$STATUS" = "null" ]; then
        echo -e "${RED}❌ Scan Status: NOT FOUND or COMPLETE${NC}"
        echo "Scan may have finished or doesn't exist."
        break
    else
        echo -e "${YELLOW}⏳ Scan Status: ${STATUS}% complete${NC}"
    fi
    echo ""
    
    # Show active plugins
    echo -e "${PURPLE}🔬 CURRENTLY TESTING:${NC}"
    ACTIVE=$(get_active_plugins)
    if [ -z "$ACTIVE" ]; then
        echo "  No active tests running"
    else
        echo "$ACTIVE"
    fi
    echo ""
    
    # Show completed plugins
    echo -e "${GREEN}✅ COMPLETED TESTS:${NC}"
    COMPLETED=$(get_completed_plugins)
    if [ -z "$COMPLETED" ]; then
        echo "  No tests completed yet"
    else
        echo "$COMPLETED" | tail -5  # Show last 5 completed
    fi
    echo ""
    
    # Show any security findings
    echo -e "${RED}🚨 SECURITY FINDINGS:${NC}"
    ALERTS=$(get_alerts)
    if [ -z "$ALERTS" ]; then
        echo "  No security issues found yet"
    else
        echo "$ALERTS"
    fi
    echo ""
    
    # Show URLs in scope
    echo -e "${CYAN}📄 URLS IN SCOPE (sample):${NC}"
    URLS=$(get_urls_in_scope)
    if [ -z "$URLS" ]; then
        echo "  No URLs found"
    else
        echo "$URLS"
    fi
    echo ""
    
    echo -e "${BLUE}Press Ctrl+C to stop monitoring${NC}"
    echo "Last updated: $(date)"
    
    # Exit if scan is complete
    if [ "$STATUS" = "100" ]; then
        echo ""
        echo -e "${GREEN}🎉 Scan completed! Final results above.${NC}"
        break
    fi
    
    sleep 3
done 