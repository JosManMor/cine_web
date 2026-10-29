#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.yml"
TIMEOUT=180

while getopts "f:" opt; do
  case "$opt" in
    f) COMPOSE_FILE="$OPTARG" ;;
    *) echo "Usage: $0 [-f <compose-file>]" >&2; exit 1 ;;
  esac
done

echo "Waiting for all services in ${COMPOSE_FILE} to be healthy (timeout: ${TIMEOUT}s)..."

elapsed=0
while [ "$elapsed" -lt "$TIMEOUT" ]; do
  all_healthy=true

  # Get health status of every service that defines a healthcheck
  while IFS= read -r line; do
    service=$(echo "$line" | awk '{print $1}')
    health=$(echo "$line" | awk '{print $2}')

    if [ "$health" != "healthy" ]; then
      all_healthy=false
      break
    fi
  done < <(docker compose -f "$COMPOSE_FILE" ps --format '{{.Service}} {{.Health}}' 2>/dev/null | grep -v '^$' | grep -v '\-$')

  if $all_healthy; then
    echo "All services healthy after ${elapsed}s."
    exit 0
  fi

  sleep 5
  elapsed=$((elapsed + 5))
done

echo "Timeout after ${TIMEOUT}s — not all services healthy:" >&2
docker compose -f "$COMPOSE_FILE" ps >&2
exit 1
