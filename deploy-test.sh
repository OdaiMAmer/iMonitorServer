#!/usr/bin/env bash
# ===========================================
# iMonitorServer - TEST Environment Deployment
# ===========================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ENV_FILE=".env.test"
COMPOSE_FILE="docker-compose.test.yml"
PROJECT_NAME="imonitor-test"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  up        Build and start all services (default)"
    echo "  down      Stop and remove all services"
    echo "  restart   Restart all services"
    echo "  rebuild   Force rebuild and restart all services"
    echo "  logs      Show logs for all services"
    echo "  status    Show status of all services"
    echo "  clean     Stop services and remove volumes (DESTRUCTIVE)"
    echo "  help      Show this help message"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH."
        exit 1
    fi

    if ! docker info &> /dev/null 2>&1; then
        log_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi

    if ! docker compose version &> /dev/null 2>&1; then
        log_error "Docker Compose V2 is not available."
        exit 1
    fi

    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file '$ENV_FILE' not found."
        exit 1
    fi

    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Compose file '$COMPOSE_FILE' not found."
        exit 1
    fi

    log_ok "All prerequisites met."
}

validate_config() {
    log_info "Validating Docker Compose configuration..."
    if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" config --quiet 2>/dev/null; then
        log_ok "Docker Compose configuration is valid."
    else
        log_error "Docker Compose configuration is invalid:"
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" config
        exit 1
    fi
}

cmd_up() {
    check_prerequisites
    validate_config

    log_info "Building and starting TEST environment..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT_NAME" up -d --build

    log_info "Waiting for services to become healthy..."
    local max_wait=120
    local elapsed=0

    while [ $elapsed -lt $max_wait ]; do
        local all_healthy=true

        for service in postgres redis backend frontend; do
            local container="imonitor-test-$service"
            local health
            health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "missing")

            if [ "$health" != "healthy" ]; then
                all_healthy=false
                break
            fi
        done

        if [ "$all_healthy" = true ]; then
            break
        fi

        sleep 5
        elapsed=$((elapsed + 5))
        echo -ne "\r  Waiting... ${elapsed}s / ${max_wait}s"
    done
    echo ""

    if [ $elapsed -ge $max_wait ]; then
        log_warn "Timeout waiting for all services to be healthy. Showing current status:"
        cmd_status
        exit 1
    fi

    log_ok "All services are healthy!"
    echo ""
    echo -e "${GREEN}=======================================${NC}"
    echo -e "${GREEN} iMonitorServer TEST Environment Ready ${NC}"
    echo -e "${GREEN}=======================================${NC}"
    echo ""
    echo -e "  Frontend:   ${BLUE}http://localhost:${FRONTEND_PORT:-8099}${NC}"
    echo -e "  Backend:    ${BLUE}http://localhost:${BACKEND_PORT:-3099}/api/v1/health${NC}"
    echo -e "  PostgreSQL: ${BLUE}localhost:${POSTGRES_PORT:-5440}${NC}"
    echo -e "  Redis:      ${BLUE}localhost:${REDIS_EXPOSED_PORT:-6390}${NC}"
    echo ""
}

cmd_down() {
    log_info "Stopping TEST environment..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT_NAME" down
    log_ok "All services stopped."
}

cmd_restart() {
    log_info "Restarting TEST environment..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT_NAME" restart
    log_ok "All services restarted."
}

cmd_rebuild() {
    log_info "Rebuilding and restarting TEST environment..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT_NAME" down
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT_NAME" up -d --build --force-recreate
    log_ok "All services rebuilt and started."
}

cmd_logs() {
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT_NAME" logs -f --tail=100
}

cmd_status() {
    echo ""
    log_info "Service Status:"
    echo ""
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT_NAME" ps -a
    echo ""

    for service in postgres redis backend frontend; do
        local container="imonitor-test-$service"
        local health
        health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "not running")
        local status_color="$RED"
        [ "$health" = "healthy" ] && status_color="$GREEN"
        [ "$health" = "starting" ] && status_color="$YELLOW"
        printf "  %-12s %b%s%b\n" "$service:" "$status_color" "$health" "$NC"
    done
    echo ""
}

cmd_clean() {
    log_warn "This will stop all services and DELETE all data volumes!"
    read -r -p "Are you sure? (y/N): " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT_NAME" down -v --remove-orphans
        log_ok "All services stopped and volumes removed."
    else
        log_info "Cancelled."
    fi
}

# Main
COMMAND="${1:-up}"

case "$COMMAND" in
    up)       cmd_up ;;
    down)     cmd_down ;;
    restart)  cmd_restart ;;
    rebuild)  cmd_rebuild ;;
    logs)     cmd_logs ;;
    status)   cmd_status ;;
    clean)    cmd_clean ;;
    help|-h)  usage ;;
    *)
        log_error "Unknown command: $COMMAND"
        usage
        exit 1
        ;;
esac
