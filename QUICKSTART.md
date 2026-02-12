# Guía Rápida de Instalación - Doce25 Events

## Setup Rápido (10 minutos)

### 1. Instalar Dependencias
```bash
npm install
cd packages/shared && npm run build && cd ../..
cd services/api && npm install && cd ../..
cd apps/web && npm install && cd ../..
```

### 2. Configurar AWS

Asegúrate de tener AWS CLI configurado:
```bash
aws configure
# Ingresa tus credenciales
```

### 3. Crear Cognito User Pool

```bash
# Variables
POOL_NAME="doce25-events-users"
REGION="us-east-1"

# Crear User Pool
USER_POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name $POOL_NAME \
  --auto-verified-attributes email \
  --username-attributes email \
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true}" \
  --region $REGION \
  --query 'UserPool.Id' \
  --output text)

echo "User Pool ID: $USER_POOL_ID"

# Crear Client
CLIENT_ID=$(aws cognito-idp create-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-name doce25-events-client \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --generate-secret false \
  --region $REGION \
  --query 'UserPoolClient.ClientId' \
  --output text)

echo "Client ID: $CLIENT_ID"

# Crear grupos
aws cognito-idp create-group \
  --user-pool-id $USER_POOL_ID \
  --group-name admin \
  --description "Administrators" \
  --region $REGION

aws cognito-idp create-group \
  --user-pool-id $USER_POOL_ID \
  --group-name staff \
  --description "Staff members" \
  --region $REGION

# Crear usuario admin
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username admin@doce25.org \
  --user-attributes Name=email,Value=admin@doce25.org Name=email_verified,Value=true \
  --temporary-password TempPass123! \
  --message-action SUPPRESS \
  --region $REGION

aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username admin@doce25.org \
  --group-name admin \
  --region $REGION

aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username admin@doce25.org \
  --password Admin123! \
  --permanent \
  --region $REGION

echo "Admin user created: admin@doce25.org / Admin123!"
```

### 4. Configurar SES

```bash
# Verificar email para envíos (sandbox mode)
aws ses verify-email-identity --email-address info@doce25.org --region us-east-1

# También verifica tu email personal para recibir los QRs de prueba
aws ses verify-email-identity --email-address tu-email@gmail.com --region us-east-1
```

**Importante**: Revisa tu email y haz click en los links de verificación.

### 5. Configurar Backend

```bash
cd services/api

# Crear archivo .env
cat > .env << EOF
AWS_REGION=us-east-1
COGNITO_ISSUER_URL=https://cognito-idp.us-east-1.amazonaws.com/$USER_POOL_ID
COGNITO_CLIENT_ID=$CLIENT_ID
FROM_EMAIL=info@doce25.org
PUBLIC_BASE_URL=http://localhost:3000
EOF

# Desplegar
npm run deploy
```

Anota la URL de API que aparece al final (ApiUrl).

### 6. Configurar Frontend

```bash
cd ../apps/web

# Crear archivo .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=$CLIENT_ID
NEXT_PUBLIC_AWS_REGION=us-east-1
EOF
```

Edita `.env.local` y reemplaza `xxxxx` con tu API Gateway URL real.

### 7. Correr en Local

```bash
# Terminal 1 - Backend (opcional, ya está desplegado)
cd services/api
npm run dev

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

Abre http://localhost:3000

### 8. Probar el Sistema

1. **Crear Evento**:
   - Ve a http://localhost:3000/auth/login
   - Login: `admin@doce25.org` / `Admin123!`
   - Ve a "Admin" → "Crear Evento"
   - Completa el formulario
   - Cambia estado a "Publicado"

2. **Registrarse**:
   - Cierra sesión
   - Ve a "Eventos"
   - Selecciona el evento
   - Completa el registro (usa un email verificado en SES)
   - Revisa tu email para el QR

3. **Escanear**:
   - Login como admin o staff
   - Ve a "Scanner"
   - Escanea el QR del email

## Checklist de Verificación

- [ ] Node.js 20+ instalado
- [ ] AWS CLI configurado
- [ ] Cognito User Pool creado
- [ ] Grupos admin/staff creados
- [ ] Usuario admin creado
- [ ] SES emails verificados
- [ ] Backend desplegado
- [ ] Frontend configurado
- [ ] Sistema probado end-to-end

## Problemas Comunes

### "Email not verified" al enviar QR
Verifica el email en SES:
```bash
aws ses list-verified-email-addresses --region us-east-1
```

### "User is not authenticated"
Verifica que el User Pool ID y Client ID estén correctos en ambos `.env` files.

### Frontend no conecta con API
Verifica que `NEXT_PUBLIC_API_BASE_URL` tenga la URL correcta sin trailing slash.

## Siguiente Paso

Lee el [README.md](./README.md) completo para documentación detallada.

## Desplegar a Producción

1. **Configurar dominio personalizado** en Amplify
2. **Sacar SES de sandbox** para enviar a cualquier email
3. **Usar secretos** para passwords (no hardcodear)
4. **Configurar CloudWatch Alarms** para monitoreo
5. **Hacer backup** de DynamoDB

¡Listo! 🎉

