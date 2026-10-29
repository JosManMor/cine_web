#!/usr/bin/env bash
set -euo pipefail

TIMEOUT="${1:-120}"
INTERVAL=5
ELAPSED=0
SERVICES=("cine_app" "cine_apache" "cine_mysql" "cine_redis")

echo "Waiting for containers to be healthy (timeout: ${TIMEOUT}s)..."

while [[ "$ELAPSED" -lt "$TIMEOUT" ]]; do
  ALL_HEALTHY=true
  for svc in "${SERVICES[@]}"; do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$svc" 2>/dev/null || echo "missing")
    if [[ "$STATUS" != "healthy" ]]; then
      ALL_HEALTHY=false
      echo "  [$svc] status: $STATUS (${ELAPSED}s elapsed)" >&2
      break
    fi
  done

  if [[ "$ALL_HEALTHY" == true ]]; then
    echo "All containers healthy after ${ELAPSED}s."
    exit 0
  fi

  sleep "$INTERVAL"
  ELAPSED=$((ELAPSED + INTERVAL))
done

echo "ERROR: Timed out after ${TIMEOUT}s waiting for healthy containers." >&2
echo "Final container states:" >&2
for svc in "${SERVICES[@]}"; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$svc" 2>/dev/null || echo "missing")
  echo "  $svc: $STATUS" >&2
done
exit 1
