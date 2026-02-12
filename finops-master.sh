#!/bin/bash

################################################################################
# AWS FinOps Master Script
# Orquesta todas las fases de optimización de costos
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log_info() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_section() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} ${CYAN}$1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

show_menu() {
    clear
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           AWS FINOPS OPTIMIZATION - MENU PRINCIPAL         ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "  ${GREEN}1)${NC} 🔍 Ejecutar Auditoría Completa"
    echo "  ${GREEN}2)${NC} ✅ Fase 1: Quick Wins Seguros (Retención Logs)"
    echo "  ${GREEN}3)${NC} 🔎 Verificar Recursos Unknown/Zombies"
    echo "  ${GREEN}4)${NC} 📊 Ver Análisis Completo (FINOPS-ANALYSIS.md)"
    echo "  ${GREEN}5)${NC} 📋 Ver Quick Start Guide"
    echo "  ${GREEN}6)${NC} 🔄 Rollback Fase 1"
    echo "  ${GREEN}7)${NC} 📈 Ver Resumen de Costos Actuales"
    echo "  ${GREEN}0)${NC} 🚪 Salir"
    echo ""
    echo -n "Selecciona una opción: "
}

run_audit() {
    log_section "EJECUTANDO AUDITORÍA COMPLETA"
    
    if [ ! -f "./audit.sh" ]; then
        log_error "audit.sh no encontrado"
        return 1
    fi
    
    log_info "Ejecutando auditoría..."
    ./audit.sh
    
    log_info "✓ Auditoría completada. Revisa ./aws-audit/"
    read -p "Presiona Enter para continuar..."
}

run_phase1() {
    log_section "FASE 1: QUICK WINS SEGUROS"
    
    if [ ! -f "./phase1-quick-wins.sh" ]; then
        log_error "phase1-quick-wins.sh no encontrado"
        return 1
    fi
    
    log_info "Ejecutando quick wins (retención de logs)..."
    echo ""
    ./phase1-quick-wins.sh
    
    log_info "✓ Fase 1 completada"
    read -p "Presiona Enter para continuar..."
}

verify_unknown() {
    log_section "VERIFICANDO RECURSOS UNKNOWN/ZOMBIES"
    
    if [ ! -f "./verify-unknown.sh" ]; then
        log_error "verify-unknown.sh no encontrado"
        return 1
    fi
    
    log_info "Ejecutando verificación..."
    echo ""
    ./verify-unknown.sh
    
    log_info "✓ Verificación completada. Revisa verification-report-*.txt"
    read -p "Presiona Enter para continuar..."
}

show_analysis() {
    log_section "ANÁLISIS COMPLETO"
    
    if [ ! -f "./FINOPS-ANALYSIS.md" ]; then
        log_error "FINOPS-ANALYSIS.md no encontrado"
        return 1
    fi
    
    if command -v less &> /dev/null; then
        less FINOPS-ANALYSIS.md
    elif command -v more &> /dev/null; then
        more FINOPS-ANALYSIS.md
    else
        cat FINOPS-ANALYSIS.md
    fi
}

show_quickstart() {
    log_section "QUICK START GUIDE"
    
    if [ ! -f "./QUICK-START-FINOPS.md" ]; then
        log_error "QUICK-START-FINOPS.md no encontrado"
        return 1
    fi
    
    if command -v less &> /dev/null; then
        less QUICK-START-FINOPS.md
    elif command -v more &> /dev/null; then
        more QUICK-START-FINOPS.md
    else
        cat QUICK-START-FINOPS.md
    fi
}

rollback_phase1() {
    log_section "ROLLBACK FASE 1"
    
    if [ ! -f "./rollback-phase1.sh" ]; then
        log_error "rollback-phase1.sh no encontrado"
        log_warn "Creando script de rollback..."
        
        cat > rollback-phase1.sh << 'EOF'
#!/bin/bash
# ROLLBACK: Extender retención a 365 días

echo "ROLLBACK: Extendiendo retención a 365 días..."

for log in $(aws logs describe-log-groups --query 'logGroups[*].logGroupName' --output text); do
    aws logs put-retention-policy --log-group-name "$log" --retention-in-days 365
done

echo "Rollback completado"
EOF
        chmod +x rollback-phase1.sh
    fi
    
    echo "Este script extenderá la retención de TODOS los logs a 365 días."
    read -p "¿Continuar con rollback? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./rollback-phase1.sh
        log_info "✓ Rollback completado"
    else
        log_warn "Rollback cancelado"
    fi
    
    read -p "Presiona Enter para continuar..."
}

show_cost_summary() {
    log_section "RESUMEN DE COSTOS ACTUALES"
    
    echo "Obteniendo costos últimos 30 días..."
    echo ""
    
    # Intentar obtener costos
    if aws ce get-cost-and-usage \
        --time-period Start=$(date -u -v-30d +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
        --granularity MONTHLY \
        --metrics BlendedCost \
        --group-by Type=DIMENSION,Key=SERVICE \
        --query 'ResultsByTime[0].Groups[*].[Keys[0],Metrics.BlendedCost.Amount]' \
        --output table 2>/dev/null; then
        
        echo ""
        log_info "✓ Costos obtenidos"
    else
        log_error "Error obteniendo costos. Verifica permisos AWS CLI."
    fi
    
    echo ""
    echo "Top 5 servicios por costo:"
    echo ""
    
    # Mostrar top 5
    aws ce get-cost-and-usage \
        --time-period Start=$(date -u -v-30d +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
        --granularity MONTHLY \
        --metrics BlendedCost \
        --group-by Type=DIMENSION,Key=SERVICE \
        --query 'ResultsByTime[0].Groups[*].[Keys[0],Metrics.BlendedCost.Amount]' \
        --output text 2>/dev/null | \
        sort -k2 -rn | head -5 | \
        awk '{printf "  %-40s $%s\n", $1, $2}'
    
    echo ""
    read -p "Presiona Enter para continuar..."
}

# Main loop
while true; do
    show_menu
    read choice
    
    case $choice in
        1)
            run_audit
            ;;
        2)
            run_phase1
            ;;
        3)
            verify_unknown
            ;;
        4)
            show_analysis
            ;;
        5)
            show_quickstart
            ;;
        6)
            rollback_phase1
            ;;
        7)
            show_cost_summary
            ;;
        0)
            log_info "Saliendo..."
            exit 0
            ;;
        *)
            log_error "Opción inválida"
            sleep 1
            ;;
    esac
done


