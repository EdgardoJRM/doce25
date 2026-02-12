# Arquitectura del Sistema - Doce25 Events

## Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIOS                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────────┐      │
│  │ Público  │    │  Staff   │    │  Administradores     │      │
│  └────┬─────┘    └────┬─────┘    └──────────┬───────────┘      │
└───────┼──────────────┼───────────────────────┼──────────────────┘
        │              │                       │
        │              │                       │
        ▼              ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js 14)                          │
│                   AWS Amplify Hosting                            │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐    │
│  │ Páginas    │  │  Auth UI    │  │  QR Scanner          │    │
│  │ Públicas   │  │  (Cognito)  │  │  (ZXing)             │    │
│  └────────────┘  └─────────────┘  └──────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AWS API GATEWAY (HTTP API)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  JWT Authorizer (Cognito)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
┌───────────────────────┐   ┌─────────────────────┐
│  AWS LAMBDA           │   │  AWS LAMBDA         │
│  (Endpoints Públicos) │   │  (Protegidos)       │
│                       │   │                     │
│  - List Events        │   │  - Scan Attendance  │
│  - Get Event          │   │  - Admin Events     │
│  - Register           │   │  - Create/Update    │
└──────────┬────────────┘   └──────────┬──────────┘
           │                           │
           └───────────┬───────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌─────────────┐ ┌────────────┐ ┌────────────┐
│  DynamoDB   │ │     S3     │ │    SES     │
│             │ │            │ │            │
│ - Events    │ │ - QR PNGs  │ │ - Emails   │
│ - Registr.  │ │ - Exports  │ │ - QR Code  │
└─────────────┘ └────────────┘ └────────────┘
```

## Componentes Principales

### 1. Frontend (Next.js 14 App Router)

**Tecnologías:**
- Next.js 14 con App Router
- TypeScript
- Tailwind CSS
- AWS Amplify Auth
- ZXing (QR Scanner)

**Rutas Principales:**
```
/                              # Landing page
/events                        # Lista eventos públicos
/events/[id]                   # Detalle evento
/events/[id]/register          # Wizard de registro (4 pasos)
/events/[id]/success           # Confirmación
/auth/login                    # Login Cognito
/staff/scanner                 # Scanner QR (staff)
/admin/events                  # Panel admin
/admin/events/new              # Crear evento
/admin/events/[id]             # Editar evento
/admin/events/[id]/registrations  # Ver registros
```

**Features:**
- SSR y SSG donde aplique
- Auth guards por grupo (admin/staff)
- Responsive design
- PWA-ready para scanner móvil

### 2. Backend (Serverless Framework)

**Tecnologías:**
- Node.js 20
- TypeScript
- AWS Lambda
- API Gateway HTTP API
- Serverless Framework 3

**Lambdas:**

| Función | Método | Endpoint | Auth | Propósito |
|---------|--------|----------|------|-----------|
| listEvents | GET | `/events` | No | Listar eventos públicos |
| getEvent | GET | `/events/{id}` | No | Detalle de evento |
| registerForEvent | POST | `/events/{id}/register` | No | Registro público |
| scanAttendance | POST | `/attendance/scan` | Staff/Admin | Escanear QR |
| listAdminEvents | GET | `/admin/events` | Admin | Listar todos los eventos |
| createEvent | POST | `/admin/events` | Admin | Crear evento |
| updateEvent | PUT | `/admin/events/{id}` | Admin | Actualizar evento |
| getEventRegistrations | GET | `/admin/events/{id}/registrations` | Admin | Listar registros |
| exportRegistrations | GET | `/admin/events/{id}/export` | Admin | Exportar CSV |
| resendQR | POST | `/admin/events/{id}/resend-qr` | Admin | Reenviar QR |

**Helpers:**
- `lib/dynamodb.ts`: Wrapper de DynamoDB Document Client
- `lib/s3.ts`: Upload y pre-signed URLs
- `lib/ses.ts`: Email templates y envío
- `lib/qrcode.ts`: Generación de QR PNG
- `lib/auth.ts`: Verificación de grupos Cognito
- `lib/response.ts`: Respuestas HTTP estandarizadas

### 3. Base de Datos (DynamoDB)

**Tabla: Events**
```
PK: event_id (String, UUID)

Attributes:
- title (String)
- description (String)
- location (String)
- startDateTime (String, ISO 8601)
- endDateTime (String, ISO 8601)
- capacity (Number)
- status (String: "draft"|"published"|"closed")
- waiverRequired (Boolean)
- waiverVersion (String)
- createdAt (String, ISO 8601)
- updatedAt (String, ISO 8601)
```

**Tabla: Registrations**
```
PK: event_id (String)
SK: email (String)

Attributes:
- registration_id (String, UUID)
- fullName (String)
- phone (String, optional)
- ageRange (String)
- gender (String)
- city (String)
- organization (String)
- organizationOther (String, optional)
- waiver (Map):
  - waiverRequired (Boolean)
  - waiverVersion (String)
  - acceptances (Map): s8-s18 (Boolean)
  - signatureName (String)
  - signedDate (String)
  - acceptedAt (String, ISO 8601)
  - ipAddress (String)
  - userAgent (String)
  - minorFields (Map, optional):
    - minorName (String)
    - guardianRelationship (String)
    - guardianPhone (String)
- qr_token (String, UUID)
- qr_s3_key (String)
- scanned (Boolean)
- scannedAt (String, ISO 8601, optional)
- scannedBy (String, email, optional)
- createdAt (String, ISO 8601)
```

**Estrategia de Acceso:**
- GetItem por event_id (Events)
- Query por event_id (Registrations)
- GetItem por event_id + email (Registration específico)
- Scan con FilterExpression para status (solo admin)

### 4. Almacenamiento (S3)

**Bucket: doce25-events-api-assets-{stage}**

```
/qrs/{event_id}/{sha256(email)}.png    # QR codes
/exports/{event_id}/registrations-{timestamp}.csv  # Exports
```

**Seguridad:**
- Bucket privado (no public access)
- Pre-signed URLs con expiración (7 días para QR, 15 min para exports)
- Encryption at rest (AES-256)
- Versioning habilitado (opcional)

### 5. Email (SES)

**From Address:** info@doce25.org

**Templates:**
1. **QR Email**: 
   - Subject: "Confirmación de Registro - {Event Title}"
   - HTML + Text versions
   - Incluye QR inline via pre-signed URL
   - Información del evento
   - Instrucciones

**Configuración:**
- Domain verification para doce25.org
- SPF, DKIM, DMARC configurados
- Production mode (no sandbox)

### 6. Autenticación (Cognito)

**User Pool:**
- Username: email
- Auto-verify email
- Password policy fuerte
- MFA opcional

**Groups:**
- `admin`: Acceso completo
- `staff`: Scanner + lectura eventos

**JWT Claims:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "cognito:groups": ["admin"]
}
```

## Flujos de Datos

### Flujo 1: Registro de Usuario

```
1. Usuario → Frontend: Completa wizard (4 pasos)
2. Frontend → API: POST /events/{id}/register
3. Lambda: Valida datos + waiver
4. Lambda → DynamoDB: Verifica capacidad
5. Lambda: Genera UUID token
6. Lambda: Genera QR PNG con { event_id, email, token }
7. Lambda → S3: Sube QR PNG
8. Lambda → S3: Obtiene pre-signed URL (7 días)
9. Lambda → DynamoDB: Guarda registro
10. Lambda → SES: Envía email con QR
11. Lambda → Frontend: 201 Created
12. Frontend: Redirige a /success
13. Usuario: Recibe email con QR
```

### Flujo 2: Scanner de Asistencia

```
1. Staff → Frontend: Login (Cognito)
2. Frontend: Verifica grupo staff/admin
3. Frontend: Activa cámara (getUserMedia)
4. Usuario: Presenta QR
5. Frontend: Lee QR con ZXing
6. Frontend: Parse JSON { event_id, email, token }
7. Frontend → API: POST /attendance/scan + JWT
8. API: Verifica JWT + grupo
9. Lambda → DynamoDB: Query registration
10. Lambda: Valida token
11. Lambda: Verifica no escaneado antes
12. Lambda → DynamoDB: Update scanned=true, scannedAt, scannedBy
13. Lambda → Frontend: 200 OK + datos participante
14. Frontend: Muestra confirmación verde
```

### Flujo 3: Export CSV

```
1. Admin → Frontend: Click "Exportar"
2. Frontend → API: GET /admin/events/{id}/export + JWT
3. Lambda → DynamoDB: Query all registrations
4. Lambda: Genera CSV con todas las columnas
5. Lambda → S3: Sube CSV
6. Lambda → S3: Pre-signed URL (15 min)
7. Lambda → Frontend: { url, filename }
8. Frontend: Abre URL en nueva pestaña
9. Browser: Descarga CSV
```

## Seguridad

### Capas de Seguridad

1. **Transport**: HTTPS/TLS en todo
2. **Auth**: Cognito JWT en endpoints protegidos
3. **Authorization**: Verificación de grupos (admin/staff)
4. **Input Validation**: Validadores en shared package
5. **Storage**: S3 privado, URLs temporales
6. **Database**: DynamoDB encryption at rest
7. **Logging**: CloudWatch Logs (sin PII)

### Prevención de Ataques

- **SQL Injection**: N/A (NoSQL)
- **XSS**: React escape automático
- **CSRF**: JWT stateless
- **Rate Limiting**: API Gateway throttling
- **DoS**: Lambda concurrency limits
- **Replay Attack**: Token único por registro
- **Double Scanning**: Flag `scanned` en DB

## Escalabilidad

### Límites y Consideraciones

| Componente | Límite Soft | Límite Hard | Costo Marginal |
|------------|-------------|-------------|----------------|
| Lambda Concurrency | 1000 | 1000-10000 | ~$0.20/million |
| DynamoDB RCU/WCU | Auto-scale | Ilimitado | Pay-per-request |
| S3 Objects | Ilimitado | Ilimitado | ~$0.023/GB |
| SES Emails | 50/sec | Aumentable | $0.10/1000 |
| API Gateway | 10,000 rps | Aumentable | $1.00/million |

### Optimizaciones

1. **Frontend**:
   - Static generation para páginas públicas
   - CDN via Amplify
   - Image optimization
   - Code splitting

2. **Backend**:
   - Lambda warm-up (opcional)
   - Connection pooling (reutilizar clientes AWS SDK)
   - Batch operations donde aplique

3. **Database**:
   - Pay-per-request (no capacity planning)
   - Query eficientes (PK+SK)
   - TTL para datos temporales (opcional)

## Monitoreo y Observabilidad

### Métricas Clave

1. **Application**:
   - Registros por día
   - Tasa de conversión (views → registros)
   - Scans exitosos vs errores
   - % Asistencia promedio

2. **System**:
   - Lambda duration y errors
   - API Gateway latency
   - DynamoDB throttling
   - SES bounces y complaints

3. **Business**:
   - Eventos activos
   - Capacidad utilizada
   - Engagement por ciudad/organización

### Dashboards

**CloudWatch Dashboard:**
- Lambda invocations y errors
- API Gateway requests (2xx, 4xx, 5xx)
- DynamoDB consumed capacity
- SES reputation metrics

**Logs Insights Queries:**

```sql
-- Registros por día
fields @timestamp, @message
| filter @message like /Registration/
| stats count() by bin(1d)

-- Errores frecuentes
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by @message
```

## Disaster Recovery

### Estrategia de Backup

1. **DynamoDB**: Point-in-time recovery (35 días)
2. **S3**: Versioning + Lifecycle policies
3. **Code**: Git + tags de release
4. **Cognito**: Export users periodic

### RTO/RPO

- **RTO** (Recovery Time Objective): 1 hora
- **RPO** (Recovery Point Objective): 5 minutos

### Plan de Recuperación

1. Identificar fallo
2. Rollback API Gateway + Lambda (CloudFormation)
3. Restore DynamoDB desde backup
4. Verificar integridad
5. Test end-to-end
6. Comunicar a stakeholders

## Mantenimiento

### Tareas Regulares

- **Diario**: Revisar CloudWatch Alarms
- **Semanal**: Analizar logs de errores
- **Mensual**: Revisar costos y optimizar
- **Trimestral**: Actualizar dependencias
- **Anual**: Disaster recovery drill

### Actualizaciones

1. **Dependencies**: Renovar NPM packages
2. **Runtime**: Actualizar Node.js cuando AWS lo soporte
3. **Features**: Basado en feedback de usuarios

## Costos Proyectados

### Escenario 1: Inicio (100 registros/mes)
- Lambda: Free tier
- DynamoDB: Free tier
- S3: $0.50
- SES: Free tier
- API Gateway: Free tier
- Amplify: $15

**Total: ~$15/mes**

### Escenario 2: Crecimiento (1000 registros/mes)
- Lambda: $2
- DynamoDB: $5
- S3: $3
- SES: $1
- API Gateway: $3
- Amplify: $20

**Total: ~$35/mes**

### Escenario 3: Escala (10,000 registros/mes)
- Lambda: $15
- DynamoDB: $30
- S3: $20
- SES: $10
- API Gateway: $35
- Amplify: $50

**Total: ~$160/mes**

## Mejoras Futuras

### Fase 2 (Q2 2025)
- [ ] PWA completa (offline support)
- [ ] Push notifications (recordatorios)
- [ ] Multi-language support (EN/ES)
- [ ] Analytics dashboard para admins
- [ ] Reportes automáticos por email

### Fase 3 (Q3 2025)
- [ ] Integración con calendario (iCal)
- [ ] Check-in automático (geofencing)
- [ ] Gamification (badges, leaderboard)
- [ ] API pública para partners
- [ ] Mobile apps (React Native)

### Consideraciones Técnicas Futuras
- Migrar a GraphQL (AppSync)
- Agregar ElastiCache para queries frecuentes
- Implementar EventBridge para workflows
- ML para predicción de asistencia
- Blockchain para certificados verificables

---

**Documentación mantenida por:** Equipo Técnico Doce25  
**Última actualización:** 2025-03-09  
**Versión:** 1.0.0

