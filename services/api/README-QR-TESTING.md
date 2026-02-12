# Testing del Sistema de QR con Attachments

## 🧪 Guía de Testing Rápido

### Prerequisitos

1. AWS credentials configuradas
2. SES configurado (al menos un email verificado)
3. Node.js 20+ instalado
4. Dependencies instaladas: `npm install`

### Test 1: Email con Attachment (Local)

**Objetivo:** Validar que SES envía correctamente emails con QR attachment.

```bash
cd services/api

# Asegurar que .env existe con FROM_EMAIL y AWS_REGION
cat > .env << EOF
AWS_REGION=us-east-1
FROM_EMAIL=info@doce25.org
EOF

# Ejecutar test
node test-email-attachment.js tu-email@ejemplo.com
```

**Checklist de Validación:**

- [ ] Script ejecuta sin errores
- [ ] Consola muestra "Email enviado exitosamente"
- [ ] Email llega a bandeja (revisar spam si no aparece)
- [ ] Email incluye attachment "qr-code.png"
- [ ] Attachment se puede descargar
- [ ] PNG es válido (se abre en visor de imágenes)
- [ ] QR es legible (scanea con app de QR reader)

### Test 2: MIME Format Validation

**Objetivo:** Verificar que el formato MIME del email es correcto.

```bash
# Ver raw email en Gmail:
# 1. Abre el email recibido
# 2. Click en los 3 puntos (⋮)
# 3. "Show original"
# 4. Buscar estas líneas:

Content-Type: multipart/mixed; boundary="----=_Part_"
...
Content-Type: image/png; name="qr-code.png"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="qr-code.png"
```

**Validación:**

- [ ] Tiene `multipart/mixed` boundary
- [ ] Tiene `multipart/alternative` para HTML/text
- [ ] Attachment tiene `Content-Type: image/png`
- [ ] Attachment tiene `Content-Disposition: attachment`
- [ ] Base64 encoding presente

### Test 3: Diferentes Clientes Email

**Objetivo:** Confirmar compatibility cross-platform.

**Test en:**

- [ ] Gmail Web
- [ ] Gmail iOS App
- [ ] Gmail Android App
- [ ] Apple Mail (iPhone)
- [ ] Apple Mail (Mac)
- [ ] Outlook Web
- [ ] Outlook Desktop
- [ ] Yahoo Mail
- [ ] ProtonMail (si aplica)

**Verificar en cada uno:**
- Attachment visible
- Puede descargar PNG
- PNG se abre correctamente
- Tamaño correcto (~10-20 KB)

### Test 4: QR Functionality

**Objetivo:** Validar que el QR funciona end-to-end.

```bash
# 1. Recibir email de test
# 2. Descargar qr-code.png del attachment
# 3. Abrir PNG en dispositivo móvil
# 4. Usar cualquier QR scanner app
# 5. Debe mostrar JSON:
{
  "event_id": "test-event-123",
  "email": "tu-email@ejemplo.com",
  "token": "test-token-456"
}
```

**Validación:**

- [ ] QR scanea correctamente
- [ ] JSON es válido
- [ ] Contiene event_id, email, token
- [ ] No hay artifacts visuales en el QR

### Test 5: Integration Test (Con Backend)

**Objetivo:** Test completo del flujo con backend desplegado.

```bash
# 1. Deploy backend
cd services/api
npm run deploy

# 2. Crear evento via admin panel

# 3. Registrarse como usuario
# POST /events/{eventId}/register

# 4. Verificar email
```

**Checklist:**

- [ ] Email llega en <30 segundos
- [ ] Attachment qr-code.png presente
- [ ] QR contiene event_id correcto
- [ ] QR contiene email correcto
- [ ] QR contiene token único
- [ ] Token coincide con DB (verificar en DynamoDB)

### Test 6: Resend QR (Admin)

**Objetivo:** Validar reenvío de QR desde admin panel.

```bash
# 1. Login como admin
# 2. Ir a /admin/events/{eventId}/registrations
# 3. Click "Reenviar QR" en cualquier registro
# 4. Verificar email
```

**Validación:**

- [ ] Email llega con attachment
- [ ] QR es el mismo que el original
- [ ] Funciona al scanear
- [ ] No se crea nuevo token (usar mismo QR)

### Test 7: Error Handling

**Objetivo:** Validar que el fallback funciona si falla el attachment.

**Simular error:**

```javascript
// En ses.ts, temporalmente lanzar error:
async sendEmailWithAttachment(params) {
  throw new Error('Simulated attachment failure');
}
```

**Validación:**

- [ ] Email fallback se envía sin crash
- [ ] Email indica que hubo error con QR
- [ ] Instrucciones de contacto presentes
- [ ] Lambda no falla (200 response)

### Test 8: Load Test (Opcional)

**Objetivo:** Validar performance con múltiples registros.

```bash
# Crear 50 registros simultáneos
for i in {1..50}; do
  curl -X POST https://api.com/events/{id}/register \
    -d "{\"email\":\"test$i@example.com\", ...}" &
done
wait

# Verificar:
# - Todos los emails llegaron
# - Todos tienen attachment
# - Latencia aceptable (<5s por email)
```

## 🐛 Troubleshooting

### Email no llega

**Causas comunes:**

1. Email no verificado en SES (sandbox mode)
   ```bash
   aws ses list-verified-email-addresses
   ```

2. SES region incorrecta
   ```bash
   # Verificar en .env:
   AWS_REGION=us-east-1
   ```

3. IAM permissions insuficientes
   ```bash
   # Policy necesaria:
   ses:SendEmail
   ses:SendRawEmail
   ```

### Attachment no aparece

**Debug:**

1. Ver raw email (Gmail → Show Original)
2. Buscar `Content-Type: image/png`
3. Verificar que base64 no esté corrupto
4. Probar en otro cliente email

### QR no scanea

**Verificar:**

1. PNG no está corrupto
   ```bash
   file qr-code.png
   # Debe decir: PNG image data, 400 x 400
   ```

2. JSON dentro del QR es válido
   ```bash
   # Usar zxing o similar para decodificar
   ```

3. QR tiene suficiente contraste
4. Imagen no está comprimida/pixelada

### SendRawEmailCommand falla

**Error común:**

```
InvalidParameterValue: Missing final '@domain'
```

**Solución:**

Verificar formato FROM_EMAIL en headers:
```javascript
rawEmail += `From: Doce25 <info@doce25.org>\r\n`;
```

## 📊 Métricas de Éxito

### Performance

- **Latencia email:** <500ms (objetivo)
- **Tasa éxito SES:** >99%
- **Attachment size:** 10-20 KB
- **Email total size:** <50 KB

### Funcionalidad

- **QR scan rate:** 100% legible
- **Email delivery:** >98%
- **Attachment present:** 100%
- **Cross-client compat:** >95%

## ✅ Sign-off Checklist

Antes de marcar como completado:

- [ ] Test 1 (local) pasado
- [ ] Test 2 (MIME) validado
- [ ] Test 3 (clientes) en al menos 3 clientes
- [ ] Test 4 (QR functionality) OK
- [ ] Test 5 (integration) end-to-end funcional
- [ ] Test 6 (resend) funcional
- [ ] Test 7 (fallback) implementado y testeado
- [ ] Test 8 (load - opcional) pasado
- [ ] Documentation revisada
- [ ] Deploy a producción exitoso
- [ ] Post-deploy smoke test OK

---

**Responsable:** DevOps Engineer  
**Última actualización:** 2025-03-09  
**Status:** Ready for Production Testing

