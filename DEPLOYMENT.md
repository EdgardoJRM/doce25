# Guía de Deployment - Doce25 Events

## Ambientes

- **dev**: Desarrollo y pruebas
- **prod**: Producción

## Deploy Backend

### Development
```bash
cd services/api
npm run deploy
# Equivalente a: sls deploy --stage dev
```

### Production
```bash
cd services/api
npm run deploy:prod
# Equivalente a: sls deploy --stage prod
```

### Verificar Deploy
```bash
# Ver outputs del stack
sls info --stage prod

# Ver logs en tiempo real
sls logs -f listEvents --tail --stage prod
```

## Deploy Frontend

### AWS Amplify (Recomendado)

1. **Primera vez** (desde AWS Console):
   - Ir a AWS Amplify Console
   - "New app" → "Host web app"
   - Conectar repositorio Git
   - Branch: `main` para prod, `develop` para dev
   - Build settings:
     ```yaml
     version: 1
     applications:
       - appRoot: apps/web
         frontend:
           phases:
             preBuild:
               commands:
                 - npm install
             build:
               commands:
                 - npm run build
           artifacts:
             baseDirectory: .next
             files:
               - '**/*'
           cache:
             paths:
               - node_modules/**/*
     ```
   - Environment variables (agregar todas de `apps/web/env.sample`)
   - Deploy

2. **Deploys subsecuentes**:
   - Push a la rama configurada
   - Amplify detecta cambios y despliega automáticamente

### Manual (Vercel, Netlify, etc.)

```bash
cd apps/web
npm install
npm run build
# Luego seguir instrucciones de la plataforma
```

## Variables de Entorno por Ambiente

### Backend - Dev
```bash
# services/api/.env
AWS_REGION=us-east-1
COGNITO_ISSUER_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_DEVPOOL
COGNITO_CLIENT_ID=dev-client-id
FROM_EMAIL=dev@doce25.org
PUBLIC_BASE_URL=https://dev.events.doce25.org
```

### Backend - Prod
```bash
# services/api/.env.prod
AWS_REGION=us-east-1
COGNITO_ISSUER_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_PRODPOOL
COGNITO_CLIENT_ID=prod-client-id
FROM_EMAIL=info@doce25.org
PUBLIC_BASE_URL=https://events.doce25.org
```

### Frontend - Dev
```bash
NEXT_PUBLIC_API_BASE_URL=https://dev-api.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_DEVPOOL
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=dev-client-id
NEXT_PUBLIC_AWS_REGION=us-east-1
```

### Frontend - Prod
```bash
NEXT_PUBLIC_API_BASE_URL=https://prod-api.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_PRODPOOL
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=prod-client-id
NEXT_PUBLIC_AWS_REGION=us-east-1
```

## CI/CD con GitHub Actions (Opcional)

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: |
          npm install
          cd services/api && npm install
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy Backend
        run: |
          cd services/api
          npm run deploy:prod
        env:
          COGNITO_ISSUER_URL: ${{ secrets.COGNITO_ISSUER_URL }}
          COGNITO_CLIENT_ID: ${{ secrets.COGNITO_CLIENT_ID }}
          FROM_EMAIL: ${{ secrets.FROM_EMAIL }}
          PUBLIC_BASE_URL: ${{ secrets.PUBLIC_BASE_URL }}
```

## Rollback

### Backend
```bash
# Ver deployments anteriores
sls deploy list --stage prod

# Rollback a timestamp específico
sls rollback --timestamp TIMESTAMP --stage prod
```

### Frontend
- En Amplify Console: ir a la app → "Deployments" → seleccionar deploy anterior → "Redeploy this version"

## Monitoring

### CloudWatch Logs
```bash
# Ver logs de una función específica
sls logs -f functionName --stage prod --tail

# Ver errores recientes
aws logs filter-log-events \
  --log-group-name /aws/lambda/doce25-events-api-prod-registerForEvent \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000
```

### CloudWatch Alarms

Crear alarmas para:
- Lambda errors
- API Gateway 4xx/5xx
- DynamoDB throttling

```bash
# Ejemplo: Alarma para errores de Lambda
aws cloudwatch put-metric-alarm \
  --alarm-name doce25-lambda-errors-prod \
  --alarm-description "Lambda errors in production" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=doce25-events-api-prod-registerForEvent
```

## Database Migrations

Para cambios en estructura de DynamoDB:

1. **Agregar índices**:
   - Actualizar `serverless.yml`
   - Desplegar con `sls deploy`
   - DynamoDB agregará el índice automáticamente

2. **Cambios breaking**:
   - Crear migración manual con script
   - Backup de datos primero
   - Ejecutar migración
   - Desplegar código nuevo

## Backup y Restore

### DynamoDB Backup
```bash
# Activar backups continuos
aws dynamodb update-continuous-backups \
  --table-name doce25-events-api-events-prod \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

# Crear backup on-demand
aws dynamodb create-backup \
  --table-name doce25-events-api-events-prod \
  --backup-name events-backup-$(date +%Y%m%d)
```

### S3 Backup
```bash
# Activar versionado
aws s3api put-bucket-versioning \
  --bucket doce25-events-api-assets-prod \
  --versioning-configuration Status=Enabled

# Replicación cross-region (opcional)
aws s3api put-bucket-replication \
  --bucket doce25-events-api-assets-prod \
  --replication-configuration file://replication.json
```

## Costos Estimados

### Stack Básico (bajo uso)
- **Lambda**: $0.20/mes (Free tier: 1M requests)
- **DynamoDB**: $1.25/mes (Free tier: 25GB, 25 write/read units)
- **S3**: $0.50/mes (~1000 QR codes)
- **SES**: $0.10/mes (Free tier: 62,000 emails/month)
- **API Gateway**: $3.50/mes (Free tier: 1M requests)
- **Amplify Hosting**: $15/mes (50GB ancho de banda)

**Total estimado**: ~$20-25/mes

### Alto tráfico (10,000 registros/mes)
- **Lambda**: $5/mes
- **DynamoDB**: $10/mes
- **S3**: $5/mes
- **SES**: $1/mes
- **API Gateway**: $35/mes
- **Amplify**: $30/mes

**Total estimado**: ~$85/mes

## Security Checklist

- [ ] SES fuera de sandbox mode
- [ ] Cognito password policy fuerte
- [ ] S3 bucket privado (no public access)
- [ ] API Gateway rate limiting configurado
- [ ] CloudWatch Logs retention configurado (no indefinido)
- [ ] IAM roles con least privilege
- [ ] Secrets en AWS Secrets Manager (no en código)
- [ ] HTTPS/TLS everywhere
- [ ] DynamoDB encryption at rest habilitado

## Post-Deploy Verification

```bash
# 1. Health check del API
curl https://your-api.execute-api.us-east-1.amazonaws.com/events

# 2. Verificar Cognito
aws cognito-idp list-users --user-pool-id us-east-1_XXXXX --limit 1

# 3. Verificar DynamoDB
aws dynamodb describe-table --table-name doce25-events-api-events-prod

# 4. Verificar S3
aws s3 ls s3://doce25-events-api-assets-prod/

# 5. Test completo
# - Crear evento como admin
# - Registrarse como usuario
# - Verificar recepción de QR
# - Escanear QR como staff
```

## Troubleshooting Deploy

### Error: "Stack already exists"
```bash
# Ver estado del stack
aws cloudformation describe-stacks --stack-name doce25-events-api-prod

# Si está en ROLLBACK_COMPLETE, eliminar y redesplegar
sls remove --stage prod
sls deploy --stage prod
```

### Error: "Rate exceeded"
AWS tiene límites de rate en creación de recursos. Espera unos minutos y reintenta.

### Error: "Insufficient permissions"
Verifica que tu usuario/role de AWS tenga permisos para:
- CloudFormation
- Lambda
- DynamoDB
- S3
- API Gateway
- IAM (para crear roles)
- CloudWatch Logs

## Soporte

Para problemas de deployment:
1. Revisa logs: `sls logs -f functionName --tail`
2. Verifica variables de entorno
3. Consulta documentación de Serverless Framework
4. Contacta: info@doce25.org

