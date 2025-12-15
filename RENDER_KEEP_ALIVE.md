# 🚀 CONFIGURACIÓN PARA RENDER

## ✅ KEEP-ALIVE IMPLEMENTADO

Se ha agregado un sistema automático de **Keep-Alive** para evitar que Render apague el servidor por inactividad.

---

## 🎯 ¿QUÉ HACE?

El sistema hace un **ping automático** cada 14 minutos al endpoint `/api/health` para mantener el servidor activo.

**Características:**
- ✅ Se activa automáticamente en producción
- ✅ Ping cada 14 minutos (Render apaga después de 15 min)
- ✅ Logs en consola de cada ping
- ✅ Manejo de errores incluido
- ✅ No afecta el rendimiento

---

## 📝 VARIABLES DE ENTORNO NECESARIAS

Agrega estas variables en tu dashboard de Render:

### **1. NODE_ENV**
```
NODE_ENV=production
```

### **2. RENDER_EXTERNAL_URL**
```
RENDER_EXTERNAL_URL=https://tu-app.onrender.com
```
*Reemplaza con la URL real de tu app en Render*

### **3. RENDER** (Opcional)
```
RENDER=true
```
*Render la agrega automáticamente*

---

## 🔧 CONFIGURACIÓN EN RENDER

### **Paso 1: Variables de Entorno**

1. Ve a tu dashboard de Render
2. Selecciona tu servicio
3. Ve a **"Environment"**
4. Agrega las variables:

```env
NODE_ENV=production
RENDER_EXTERNAL_URL=https://tu-app.onrender.com
SUPABASE_URL=tu_supabase_url
SUPABASE_KEY=tu_supabase_key
PORT=5000
CACHE_TTL=300
```

### **Paso 2: Configuración del Servicio**

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
node server.js
```

**Instance Type:**
- Free (para desarrollo)
- Starter (para producción)

---

## 📊 CÓMO FUNCIONA

### **Flujo del Keep-Alive:**

```
1. Servidor inicia en Render
   ↓
2. Detecta que está en producción (NODE_ENV=production)
   ↓
3. Activa el Keep-Alive automático
   ↓
4. Cada 14 minutos:
   - Hace GET a https://tu-app.onrender.com/api/health
   - Registra el resultado en logs
   ↓
5. Render ve actividad y NO apaga el servidor
```

### **Logs que verás:**

```bash
🔄 Keep-Alive activado para Render
   Ping cada 14 minutos a: https://tu-app.onrender.com/api/health
══════════════════════════════════════════════════════════

✅ Keep-Alive ping exitoso - 10:30:45
✅ Keep-Alive ping exitoso - 10:44:45
✅ Keep-Alive ping exitoso - 10:58:45
```

---

## ⚠️ IMPORTANTE

### **Limitaciones del Plan Free de Render:**

1. **Spin Down después de 15 minutos de inactividad**
   - ✅ El Keep-Alive evita esto
   - ✅ Ping cada 14 minutos mantiene el servidor activo

2. **750 horas gratis al mes**
   - ⚠️ Con Keep-Alive, el servidor estará activo 24/7
   - ⚠️ Esto consume las 750 horas en ~31 días
   - 💡 Considera upgradar a plan de pago si necesitas 100% uptime

3. **Primera petición lenta después de spin down**
   - ✅ Con Keep-Alive, esto no ocurre
   - ✅ El servidor siempre está activo y responde rápido

---

## 🎛️ OPCIONES DE CONFIGURACIÓN

### **Cambiar intervalo de ping:**

En `server.js`, línea 131:
```javascript
const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; // 14 minutos
```

**Opciones:**
- `10 * 60 * 1000` = 10 minutos (más seguro)
- `14 * 60 * 1000` = 14 minutos (recomendado)
- `5 * 60 * 1000` = 5 minutos (muy frecuente, no recomendado)

### **Desactivar Keep-Alive:**

Opción 1 - Cambiar NODE_ENV:
```env
NODE_ENV=development
```

Opción 2 - Comentar el código:
```javascript
// if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
//     ... código del keep-alive
// }
```

---

## 🔍 VERIFICACIÓN

### **1. Verificar que está activo:**

Revisa los logs de Render:
```bash
🔄 Keep-Alive activado para Render
```

### **2. Verificar pings:**

Cada 14 minutos deberías ver:
```bash
✅ Keep-Alive ping exitoso - HH:MM:SS
```

### **3. Verificar que el servidor no se apaga:**

- Espera 20 minutos sin hacer peticiones
- El servidor debería seguir respondiendo inmediatamente
- Sin el mensaje "Starting service..."

---

## 🆘 TROUBLESHOOTING

### **El servidor sigue apagándose:**

**Problema:** Keep-Alive no está activo

**Solución:**
1. Verifica que `NODE_ENV=production` esté configurado
2. Verifica que `RENDER_EXTERNAL_URL` sea correcto
3. Revisa los logs para ver si hay errores

### **Error: "ECONNREFUSED"**

**Problema:** La URL del servidor es incorrecta

**Solución:**
```env
RENDER_EXTERNAL_URL=https://tu-app-correcta.onrender.com
```

### **Muchos pings en los logs:**

**Problema:** Intervalo muy corto

**Solución:**
Aumenta el intervalo a 14 minutos (recomendado)

---

## 💡 ALTERNATIVAS

### **Opción 1: Servicio Externo (UptimeRobot)**

1. Crea cuenta en [UptimeRobot](https://uptimerobot.com)
2. Agrega monitor HTTP(s)
3. URL: `https://tu-app.onrender.com/api/health`
4. Intervalo: 5 minutos
5. ✅ Gratis y confiable

### **Opción 2: Cron Job (cron-job.org)**

1. Crea cuenta en [cron-job.org](https://cron-job.org)
2. Crea nuevo cron job
3. URL: `https://tu-app.onrender.com/api/health`
4. Intervalo: */14 * * * * (cada 14 minutos)
5. ✅ Gratis y simple

### **Opción 3: GitHub Actions**

```yaml
name: Keep Alive
on:
  schedule:
    - cron: '*/14 * * * *'
jobs:
  keep-alive:
    runs-on: ubuntu-latest
    steps:
      - name: Ping server
        run: curl https://tu-app.onrender.com/api/health
```

---

## 📊 COMPARATIVA

| Método | Pros | Contras |
|--------|------|---------|
| **Keep-Alive Interno** | ✅ Automático<br>✅ Sin dependencias<br>✅ Fácil | ⚠️ Consume recursos del servidor |
| **UptimeRobot** | ✅ Externo<br>✅ Monitoreo incluido<br>✅ Gratis | ⚠️ Requiere cuenta externa |
| **Cron Job** | ✅ Externo<br>✅ Flexible<br>✅ Gratis | ⚠️ Requiere configuración |
| **GitHub Actions** | ✅ Integrado con repo<br>✅ Gratis | ⚠️ Requiere GitHub |

---

## ✅ RECOMENDACIÓN

**Para Desarrollo:**
- ✅ Usa el Keep-Alive interno (ya implementado)
- ✅ Simple y funciona bien

**Para Producción:**
- ✅ Usa el Keep-Alive interno + UptimeRobot
- ✅ Redundancia y monitoreo
- ✅ Notificaciones si el servidor cae

---

## 🎉 RESULTADO

Con el Keep-Alive implementado:
- ✅ **Sin spin down** en Render
- ✅ **Respuestas rápidas** siempre
- ✅ **Mejor experiencia** de usuario
- ✅ **Sin configuración** adicional necesaria

**¡Tu servidor estará siempre activo y listo!** 🚀
