# 🔧 SOLUCIÓN: Habilitar SSR en Amplify para Next.js

## Problema Identificado

```
!! No index.html detected in deploy folder: /codebuild/output/src1238512073/src/doce25/apps/web
```

**Causa:** Amplify está configurado para hosting estático (SPA) pero Next.js 14 requiere SSR (Server-Side Rendering).

## Solución

### Opción 1: Habilitar Web Compute en Amplify Console (RECOMENDADO)

1. **Ve a AWS Amplify Console** → tu app `doce25`

2. **Ve a "Hosting"** → **"Compute"** (o "Platform" en algunas versiones)

3. **Cambia de "Static Web Hosting" a "Web Compute"**
   - Web Compute: Soporta SSR/SSG con Next.js
   - Costo: ~$0.10/GB transferencia + $0.20/GB-hora compute

4. **Configura las opciones:**
   - Framework: **Next.js**
   - Framework version: **Autodetect** (o selecciona 14.x)
   - Build command: `npm run build`
   - Build output directory: `.next`

5. **Guarda y redeploy**

### Opción 2: Exportar Next.js como estático (menos funcionalidad)

Si prefieres hosting estático (más barato pero sin SSR):

1. Modifica `apps/web/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@doce25/shared'],
  reactStrictMode: true,
  output: 'export', // Genera sitio estático
  images: {
    unoptimized: true, // Requerido para export
  },
};

module.exports = nextConfig;
```

2. El problema: **PERDERÁS estas funcionalidades:**
   - Server-Side Rendering (SSR)
   - API Routes (si usas alguna)
   - Incremental Static Regeneration (ISR)
   - Image Optimization
   - Middleware
   - Dynamic Routes con getServerSideProps

⚠️ **No recomiendo esta opción** porque Next.js 14 con App Router está diseñado para SSR.

## Pasos Detallados para Opción 1

### 1. Verificar Configuración de Amplify

En AWS Amplify Console:

**A. Ve a "App settings" → "General"**
   - App name: `doce25`
   - Repository: `EdgardoJRM/doce25`
   - **App root directory:** `apps/web` ✅ (crítico)

**B. Ve a "App settings" → "Build settings"**
   
Verifica que `amplify.yml` sea:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install --legacy-peer-deps
        - cd packages/shared && npm run build && cd ../..
    build:
      commands:
        - cd apps/web && npm run build
  artifacts:
    baseDirectory: apps/web
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - packages/shared/node_modules/**/*
      - packages/shared/dist/**/*
      - apps/web/node_modules/**/*
      - apps/web/.next/cache/**/*
```

**C. Ve a "Hosting" → "Platform" (o "Compute")**
   
⚠️ **ESTE ES EL PASO CRÍTICO:**

Si ves:
- **"Hosting: Static"** → Necesitas cambiar a Web Compute
- **"Hosting: Web Compute"** → Ya está bien, continúa

### 2. Habilitar Web Compute

Si no tienes acceso a cambiar el tipo de hosting en la UI:

**Opción A: Recrear la app con Web Compute**

```bash
# 1. Eliminar app actual (guarda configuración)
# En Amplify Console → App settings → General → Delete app

# 2. Crear nueva app con CLI
aws amplify create-app \
  --name doce25-prod \
  --platform WEB_COMPUTE \
  --region us-east-1

# 3. Conectar GitHub
# Usa la UI de Amplify Console para conectar GitHub
```

**Opción B: Contactar AWS Support**

Si no puedes cambiar el tipo de hosting, contacta AWS Support para que migren la app de Static a Web Compute.

### 3. Variables de Entorno

En **"Environment variables"**:

```
NEXT_PUBLIC_API_BASE_URL=https://gm48tt29h6.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_gHRnw9X0K
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=2jvnhq3jdars6atcoo66knda05
NEXT_PUBLIC_AWS_REGION=us-east-1

# Para Web Compute, también puede ayudar:
AMPLIFY_NEXTJS_EXPERIMENTAL_TRACE=true
```

### 4. Redeploy

Después de habilitar Web Compute:

1. Ve a **"Deployments"**
2. Click **"Redeploy this version"**
3. Espera 5-10 minutos

### 5. Verificación

En los logs, deberías ver:

```
✓ Compiled successfully
✓ Generating static pages
✓ Finalizing page optimization
```

Y al final:

```
✓ Deploying to Web Compute platform
✓ Server started successfully
```

**NO deberías ver:**
```
!! No index.html detected
```

## Verificación Final

1. Accede a: `https://main.d1d9yit3mo0s0r.amplifyapp.com/`
2. Deberías ver la landing page de Doce25
3. Abre DevTools → Network → Verifica que las páginas retornen HTML completo (no 404)

## Si Sigue Sin Funcionar

### Diagnóstico Adicional

1. **Verifica el tipo de hosting actual:**

```bash
aws amplify get-app --app-id d1pk5gmi8ffyu2 --region us-east-1 \
  --query 'app.platform' --output text
```

Debería retornar: `WEB_COMPUTE` (no `WEB`)

2. **Verifica el framework detectado:**

En Amplify Console → App settings → Build settings → Framework

Debe decir: **Next.js - SSR**

3. **Si nada funciona: Opción Nuclear**

Crear nueva app Amplify desde cero con Web Compute:

```bash
# Esto garantiza que se cree con la plataforma correcta
aws amplify create-app \
  --name doce25-prod-v2 \
  --platform WEB_COMPUTE \
  --repository EdgardoJRM/doce25 \
  --oauth-token YOUR_GITHUB_TOKEN \
  --region us-east-1
```

## Costo de Web Compute vs Static

| Tipo | Costo Base | Costo Tráfico | SSR |
|------|-----------|---------------|-----|
| Static Hosting | $0 | $0.15/GB | ❌ |
| Web Compute | $0.20/GB-hora | $0.10/GB | ✅ |

**Estimado para tu uso:**
- 1,000 visitantes/mes
- 2 MB por visita promedio
- **Costo estimado:** $3-5/mes

## Recursos

- [AWS Amplify Web Compute](https://docs.aws.amazon.com/amplify/latest/userguide/deploy-nextjs-app.html)
- [Next.js SSR en Amplify](https://aws.amazon.com/blogs/mobile/host-a-next-js-ssr-app-with-real-time-data-on-aws-amplify/)

---

**Última actualización:** 2026-02-12

