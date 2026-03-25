#!/bin/bash
set -euo pipefail

COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"
PROJECT="imonitor-prod"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found. Copy .env.production.example and fill in values."
  exit 1
fi

case "${1:-help}" in
  up)
    echo "Starting production services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT" up -d --build
    echo "Waiting for health checks..."
    sleep 10
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT" ps
    ;;
  down)
    echo "Stopping production services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT" down
    ;;
  restart)
    echo "Restarting production services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT" restart
    ;;
  status)
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT" ps -a
    ;;
  logs)
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT" logs -f --tail=100 "${2:-}"
    ;;
  backup)
    echo "Running database backup..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT" --profile backup run --rm db-backup
    ;;
  clean)
    echo "WARNING: This will remove all production data!"
    read -p "Type 'yes-delete-production-data' to confirm: " confirm
    if [ "$confirm" = "yes-delete-production-data" ]; then
      docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT" down -v
      echo "Production environment destroyed."
    else
      echo "Cancelled."
    fi
    ;;
  *)
    echo "Usage: $0 {up|down|restart|status|logs|backup|clean}"
    echo ""
    echo "  up       - Build and start all services"
    echo "  down     - Stop all services"
    echo "  restart  - Restart all services"
    echo "  status   - Show service status"
    echo "  logs     - Follow service logs (optional: service name)"
    echo "  backup   - Run database backup"
    echo "  clean    - DESTROY all production data (requires confirmation)"
    ;;
esac
