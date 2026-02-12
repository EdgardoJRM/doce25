# Doce25 Events - Sistema de Gestión de Eventos

Sistema completo de gestión de eventos para la Fundación Doce25 con registro público, generación de códigos QR, scanner de asistencia y panel administrativo.

## 🏗️ Arquitectura

- **Frontend**: Next.js 14+ (App Router) desplegado en AWS Amplify Hosting
- **Auth**: Amazon Cognito User Pool con grupos `admin` y `staff`
- **Backend**: API Gateway HTTP + AWS Lambda (TypeScript, Node.js 20+)
- **Database**: Amazon DynamoDB
- **Storage**: Amazon S3 (códigos QR y exports)
- **Email**: Amazon SES
- **IaC**: Serverless Framework

## 📁 Estructura del Proyecto

```
/doce25-events
  /apps/web              # Frontend Next.js
  /services/api          # Backend Serverless
  /packages/shared       # Tipos y validadores compartidos
  README.md
  package.json
```

## 🚀 Configuración y Deployment

### Prerrequisitos

- Node.js 20+
- AWS CLI configurado con credenciales
- Cuenta de AWS con permisos para crear recursos (Lambda, DynamoDB, S3, SES, Cognito, API Gateway)

### Paso 1: Instalar Dependencias

```bash
npm install
```

### Paso 2: Configurar Amazon Cognito

1. **Crear User Pool**:
   ```bash
   aws cognito-idp create-user-pool \
     --pool-name doce25-events-users \
     --auto-verified-attributes email \
     --username-attributes email \
     --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true}"
   ```

   Anota el `UserPoolId` (ej: `us-east-1_XXXXXXXXX`)

2. **Crear User Pool Client**:
   ```bash
   aws cognito-idp create-user-pool-client \
     --user-pool-id us-east-1_XXXXXXXXX \
     --client-name doce25-events-client \
     --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
     --generate-secret false
   ```

   Anota el `ClientId`

3. **Crear Grupos**:
   ```bash
   # Grupo admin
   aws cognito-idp create-group \
     --user-pool-id us-east-1_XXXXXXXXX \
     --group-name admin \
     --description "Administrators"

   # Grupo staff
   aws cognito-idp create-group \
     --user-pool-id us-east-1_XXXXXXXXX \
     --group-name staff \
     --description "Staff members"
   ```

4. **Crear Usuario Admin**:
   ```bash
   # Crear usuario
   aws cognito-idp admin-create-user \
     --user-pool-id us-east-1_XXXXXXXXX \
     --username admin@doce25.org \
     --user-attributes Name=email,Value=admin@doce25.org Name=email_verified,Value=true \
     --temporary-password TempPass123! \
     --message-action SUPPRESS

   # Agregar a grupo admin
   aws cognito-idp admin-add-user-to-group \
     --user-pool-id us-east-1_XXXXXXXXX \
     --username admin@doce25.org \
     --group-name admin

   # Establecer password permanente
   aws cognito-idp admin-set-user-password \
     --user-pool-id us-east-1_XXXXXXXXX \
     --username admin@doce25.org \
     --password YourSecurePassword123! \
     --permanent
   ```

### Paso 3: Configurar Amazon SES

1. **Verificar Dominio** (doce25.org):
   ```bash
   aws ses verify-domain-identity --domain doce25.org
   ```

   Sigue las instrucciones para agregar los registros DNS necesarios.

2. **Verificar Email** (mientras el dominio se verifica):
   ```bash
   aws ses verify-email-identity --email-address info@doce25.org
   ```

   Verifica el email haciendo clic en el link que recibes.

3. **Mover a Producción** (opcional, por defecto SES está en sandbox):
   - Ve a AWS Console → SES → Account Dashboard
   - Solicita salir del sandbox mode para poder enviar a cualquier email

### Paso 4: Configurar Variables de Entorno del Backend

Crea el archivo `/services/api/.env`:

```bash
cd services/api
cp env.sample .env
```

Edita `.env`:

```env
AWS_REGION=us-east-1
COGNITO_ISSUER_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=your-cognito-client-id
FROM_EMAIL=info@doce25.org
PUBLIC_BASE_URL=https://events.doce25.org
```

### Paso 5: Desplegar Backend

```bash
cd services/api
npm install
npm run deploy
```

Esto creará:
- DynamoDB Tables (Events, Registrations)
- S3 Bucket (QR codes y exports)
- Lambda Functions
- API Gateway HTTP API

Anota la URL de API Gateway que aparece al final del deployment (Output: `ApiUrl`).

### Paso 6: Configurar Variables de Entorno del Frontend

Crea el archivo `/apps/web/.env.local`:

```bash
cd apps/web
cp env.sample .env.local
```

Edita `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=your-client-id
NEXT_PUBLIC_AWS_REGION=us-east-1
```

### Paso 7: Desplegar Frontend en AWS Amplify

#### Opción A: Desde la Consola de AWS

1. Ve a AWS Amplify Console
2. Click "New app" → "Host web app"
3. Conecta tu repositorio Git (GitHub, GitLab, etc.)
4. Configura el build:
   - Build command: `cd apps/web && npm install && npm run build`
   - Output directory: `apps/web/.next`
5. Agrega las variables de entorno en Amplify Console
6. Despliega

#### Opción B: Desarrollo Local

```bash
cd apps/web
npm install
npm run dev
```

Abre http://localhost:3000

### Paso 8: Configurar Dominio Personalizado (Opcional)

1. En Amplify Console, ve a "Domain management"
2. Agrega `events.doce25.org`
3. Actualiza los registros DNS según las instrucciones
4. Actualiza `PUBLIC_BASE_URL` en el backend si es necesario

## 📖 Uso del Sistema

### Para Usuarios Públicos

1. **Ver Eventos**: Navega a `/events`
2. **Registrarse**: 
   - Selecciona un evento
   - Completa el wizard de registro (4 pasos):
     - Información personal
     - Aceptar relevo de responsabilidad
     - Firma digital
     - Confirmar
   - Recibe QR por email **como attachment PNG** (sin expiración)
3. **Asistir al Evento**: Presenta el QR en tu dispositivo o impreso

> **💡 Nota Importante sobre QR**: El código QR se envía como archivo adjunto PNG en el email. No tiene fecha de expiración, por lo que el usuario puede guardarlo en su dispositivo o imprimirlo con meses de anticipación. El QR permanece válido hasta que el evento finalice.

### Para Staff

1. **Iniciar Sesión**: `/auth/login`
2. **Scanner**: `/staff/scanner`
   - Activa la cámara
   - Escanea código QR del participante
   - Sistema verifica y registra asistencia
   - Previene doble escaneo

### Para Administradores

1. **Panel Admin**: `/admin/events`
2. **Crear Evento**: Click "Crear Evento"
   - Completa formulario
   - Estado inicial: "Borrador"
   - Cambia a "Publicado" para hacerlo visible
3. **Ver Registros**: Click "Registros" en cualquier evento
   - Ver lista completa
   - Buscar por email
   - Ver estadísticas de asistencia
   - Exportar CSV
   - Reenviar QR a participantes
4. **Editar Evento**: Click "Editar"
   - Modificar información
   - Cambiar estado (draft/published/closed)

## 🔒 Seguridad y Legal

### Relevo de Responsabilidad (Waiver)

El sistema guarda evidencia completa de aceptación:
- `waiverVersion`: Versión del documento
- `acceptances`: Aceptación por sección (s8-s18)
- `signatureName`: Nombre typed como firma
- `signedDate`: Fecha de firma
- `acceptedAt`: Timestamp ISO del servidor
- `ipAddress`: IP del cliente
- `userAgent`: Navegador/dispositivo
- Para menores: `minorFields` con datos del tutor

### Datos Sensibles

- Passwords en Cognito (bcrypt)
- Tokens JWT para autenticación
- S3 bucket privado (URLs pre-firmadas temporales)
- DynamoDB con encryption at rest

## 🧪 Testing

### Test Local del Backend

```bash
cd services/api
npm run dev  # Serverless Offline en puerto 3001
```

### Test del Frontend

```bash
cd apps/web
npm run dev  # Next.js dev en puerto 3000
```

## 📊 Monitoreo y Logs

Ver logs de Lambda:

```bash
cd services/api
sls logs -f functionName --tail
```

Ver logs en CloudWatch:
- AWS Console → CloudWatch → Log Groups
- Busca por `/aws/lambda/doce25-events-api-*`

## 🛠️ Mantenimiento

### Backup de DynamoDB

Configurar backups automáticos:
```bash
aws dynamodb update-continuous-backups \
  --table-name doce25-events-api-events-dev \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

### Actualizar Backend

```bash
cd services/api
npm run deploy
```

### Actualizar Frontend

Si usas Amplify con Git, simplemente haz push:
```bash
git push origin main
```

## 📝 Scripts Útiles

```bash
# Raíz del proyecto
npm run dev:web          # Correr frontend
npm run dev:api          # Correr backend local
npm run deploy:api       # Desplegar backend
npm run lint             # Linting
npm run format           # Format código

# Backend
cd services/api
npm run deploy           # Deploy a dev
npm run deploy:prod      # Deploy a prod
npm run remove           # Eliminar stack

# Frontend
cd apps/web
npm run dev              # Dev server
npm run build            # Build producción
npm run start            # Start producción
```

## 🐛 Troubleshooting

### Error: "Cannot find module @doce25/shared"

```bash
cd packages/shared
npm install
npm run build
cd ../..
npm install
```

### Error: SES "Email address not verified"

Verifica el email o dominio en SES antes de enviar:
```bash
aws ses verify-email-identity --email-address info@doce25.org
```

### Error: Cognito "User is not authorized"

Verifica que el usuario esté en el grupo correcto:
```bash
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username admin@doce25.org
```

### Error: API Gateway 403

Verifica que el token JWT esté correcto y que `COGNITO_ISSUER_URL` y `COGNITO_CLIENT_ID` estén bien configurados en el serverless.yml.

## 📞 Soporte

Para preguntas o soporte técnico:
- Email: info@doce25.org
- Web: https://doce25.org

## 📄 Licencia

Copyright © 2025 Doce25 (Tortuga Club PR, Inc.)

---

**Construido con ❤️ para Doce25**

