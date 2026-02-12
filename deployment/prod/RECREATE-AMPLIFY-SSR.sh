#!/bin/bash
# Script para recrear Amplify app con SSR habilitado

echo "🔧 Recreando Amplify app con Next.js SSR support"
echo ""
echo "IMPORTANTE: Este script eliminará la app actual y creará una nueva"
echo "La URL cambió de main.d1d9yit3mo0s0r.amplifyapp.com a una nueva"
echo ""
read -p "¿Continuar? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

# Variables
APP_NAME="doce25-events"
REGION="us-east-1"
REPO="EdgardoJRM/doce25"
BRANCH="main"

echo "📋 Paso 1: Obtener info de app actual..."
aws amplify get-app --app-id d1pk5gmi8ffyu2 --region $REGION > /tmp/amplify-old-config.json
echo "✅ Configuración guardada en /tmp/amplify-old-config.json"

echo ""
echo "🗑️  Paso 2: Eliminar app actual (esto NO elimina el repo de GitHub)"
read -p "Confirmar eliminación de app d1pk5gmi8ffyu2? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    aws amplify delete-app --app-id d1pk5gmi8ffyu2 --region $REGION
    echo "✅ App eliminada"
fi

echo ""
echo "⏳ Esperando 10 segundos..."
sleep 10

echo ""
echo "🆕 Paso 3: Crear nueva app con WEB_COMPUTE (SSR)"
echo "NOTA: Necesitarás conectar GitHub manualmente después"

# Crear app
NEW_APP_ID=$(aws amplify create-app \
  --name "$APP_NAME" \
  --platform WEB_COMPUTE \
  --region $REGION \
  --query 'app.appId' \
  --output text)

echo "✅ Nueva app creada: $NEW_APP_ID"
echo ""

echo "📝 Paso 4: Guardar nueva App ID"
echo "APP_ID=$NEW_APP_ID" > /tmp/amplify-new-app-id.txt
echo "✅ Guardado en /tmp/amplify-new-app-id.txt"

echo ""
echo "🔗 Paso 5: AHORA ve a la consola de Amplify para conectar GitHub:"
echo ""
echo "   https://console.aws.amazon.com/amplify/home?region=$REGION#/$NEW_APP_ID"
echo ""
echo "   1. Click en 'Connect branch'"
echo "   2. Selecciona GitHub"
echo "   3. Autoriza AWS Amplify"
echo "   4. Selecciona repo: $REPO"
echo "   5. Selecciona branch: $BRANCH"
echo "   6. En 'App root directory' pon: apps/web"
echo "   7. Click 'Next' y sigue el wizard"
echo ""
echo "✅ Script completado"

