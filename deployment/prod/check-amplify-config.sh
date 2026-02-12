#!/bin/bash
# Script para verificar configuración de Amplify

APP_ID="d1pk5gmi8ffyu2"
REGION="us-east-1"

echo "🔍 Verificando configuración de Amplify..."
echo ""

# Verificar tipo de plataforma
echo "📋 Tipo de plataforma actual:"
PLATFORM=$(aws amplify get-app --app-id $APP_ID --region $REGION \
  --query 'app.platform' --output text 2>/dev/null)

if [ "$PLATFORM" = "WEB_COMPUTE" ]; then
  echo "✅ WEB_COMPUTE (SSR habilitado) - CORRECTO"
elif [ "$PLATFORM" = "WEB" ]; then
  echo "❌ WEB (Static Hosting) - NECESITA CAMBIO A WEB_COMPUTE"
else
  echo "⚠️  Plataforma: $PLATFORM"
fi

echo ""
echo "📋 App root directory configurado:"
# Esto requiere verificar en la consola manualmente
echo "   Ve a: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
echo "   App settings → General → App root directory"
echo "   Debe decir: apps/web"
echo ""

echo "📋 Build settings:"
aws amplify get-app --app-id $APP_ID --region $REGION \
  --query 'app.buildSpec' --output text 2>/dev/null | head -5

echo ""
echo "✅ Verificación completada"

