# 🔧 SOLUCIÓN: Error 404 en Amplify

## Problema
```
GET https://main.d1d9yit3mo0s0r.amplifyapp.com/ net::ERR_HTTP_RESPONSE_CODE_FAILURE 404
```

## Causa
Amplify no está detectando correctamente el app root directory para el monorepo.

## Solución Paso a Paso

### 1. Configurar App Root Directory en Amplify Console

**IMPORTANTE:** Esto es CRÍTICO para que funcione.

1. Ve a **AWS Amplify Console**
2. Selecciona tu app `doce25`
3. Ve a **"App settings"** → **"General"**
4. Busca la sección **"App root directory"**
5. Cambia de `/` (raíz) a: **`apps/web`**
6. Click **"Save"**

### 2. Verificar Build Settings

1. Ve a **"Build settings"**
2. Verifica que el archivo `amplify.yml` esté detectado
3. Si no está, haz click en **"Edit"** y pega este contenido:

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

### 3. Verificar Variables de Entorno

En **"Environment variables"**, asegúrate de tener:

```
NEXT_PUBLIC_API_BASE_URL=https://gm48tt29h6.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_gHRnw9X0K
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=2jvnhq3jdars6atcoo66knda05
NEXT_PUBLIC_AWS_REGION=us-east-1
```

### 4. Redeploy

1. Ve a **"Deployments"**
2. Click en el último deployment
3. Click **"Redeploy this version"**
4. O simplemente haz un nuevo push a `main` y Amplify detectará el cambio

### 5. Verificar Logs del Build

Después del redeploy, revisa los logs:

1. Ve a **"Deployments"** → Click en el deployment activo
2. Revisa la fase **"build"**
3. Busca líneas como:
   ```
   ✓ Compiled successfully
   ✓ Generating static pages
   ```
4. Verifica que no haya errores

### 6. Verificar Artifacts

En los logs del build, busca:
```
# Completed phase: build
# Starting phase: postBuild
```

Y verifica que los artifacts se estén generando correctamente.

## Si Sigue Sin Funcionar

### Opción A: Verificar que Next.js esté detectado

Amplify debería detectar automáticamente Next.js. Si no lo hace:

1. Ve a **"Build settings"**
2. Verifica que el **"Build image"** sea compatible con Node.js 20
3. Si no, cambia a una versión más reciente

### Opción B: Usar Custom Build Image

En **"Build settings"** → **"Build image settings"**, selecciona:
- **"Amazon Linux 2023"** con Node.js 20

### Opción C: Verificar Estructura de Archivos

Después del build, en los logs deberías ver:
```
# Completed phase: build
# Starting phase: postBuild
```

Y los artifacts deberían incluir:
- `.next/` directory
- `public/` directory
- `package.json`
- `node_modules/`

## Verificación Final

Después de configurar el **App root directory** como `apps/web` y hacer redeploy:

1. Espera a que el build termine (5-10 minutos)
2. Ve a la URL: `https://main.d1d9yit3mo0s0r.amplifyapp.com/`
3. Deberías ver la landing page de Doce25

## Comandos de Debugging

Si necesitas ver qué está pasando, en los logs del build busca:

```bash
# Ver estructura de directorios después del build
ls -la apps/web/

# Verificar que .next existe
ls -la apps/web/.next/

# Verificar artifacts
ls -la apps/web/.next/static/
```

## Contacto

Si después de seguir estos pasos sigue dando 404, comparte:
1. Screenshot de "App settings" → "General" mostrando el "App root directory"
2. Logs completos del build (fase build y postBuild)
3. Screenshot de "Build settings" mostrando el amplify.yml

---

**Última actualización:** 2025-03-09

