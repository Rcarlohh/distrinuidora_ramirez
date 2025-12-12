# 📋 INSTRUCCIONES DE IMPLEMENTACIÓN EN SUPABASE

## Paso 1: Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Inicia sesión o crea una cuenta
3. Clic en "New Project"
4. Completa los datos:
   - **Name**: Gestor de Compras
   - **Database Password**: (guarda esta contraseña)
   - **Region**: Selecciona la más cercana
5. Espera a que el proyecto se cree (2-3 minutos)

## Paso 2: Ejecutar el Schema SQL

1. En tu proyecto de Supabase, ve al menú lateral
2. Clic en "SQL Editor"
3. Clic en "New Query"
4. Copia TODO el contenido del archivo `DATABASE_SCHEMA.sql`
5. Pégalo en el editor
6. Clic en "Run" (o presiona Ctrl+Enter)
7. Espera a que termine (verás "Success" en verde)

## Paso 3: Verificar las Tablas

1. Ve a "Table Editor" en el menú lateral
2. Deberías ver las siguientes tablas:
   - proveedores
   - ordenes_compra
   - orden_detalles
   - facturas
   - factura_detalles

3. Verifica que haya datos de ejemplo:
   - Clic en "proveedores"
   - Deberías ver 3 proveedores de ejemplo

## Paso 4: Obtener las Credenciales

1. Ve a "Settings" (⚙️) en el menú lateral
2. Clic en "API"
3. Copia los siguientes valores:

   **Project URL**:
   ```
   https://oipswljzrgudvkytlsxc.supabase.co
   ```

   **anon/public key**:
   ```
   sb_publishable_-yFx8OI2_PeZCo_hCXwCHw_RuX32ibu
   ```

4. Estas credenciales ya están en tu archivo `.env`

## Paso 5: Configurar RLS (Opcional)

Si quieres seguridad a nivel de fila:

1. Ve a "Authentication" > "Policies"
2. Para cada tabla, puedes crear políticas
3. Por ahora, puedes dejarlo sin RLS para desarrollo

## Paso 6: Probar la Conexión

1. Asegúrate de que el backend esté corriendo:
   ```bash
   npm run dev
   ```

2. Abre tu navegador en:
   ```
   http://localhost:5000/api/health
   ```

3. Deberías ver:
   ```json
   {
     "success": true,
     "message": "API funcionando correctamente",
     "timestamp": "...",
     "uptime": ...
   }
   ```

4. Prueba los proveedores:
   ```
   http://localhost:5000/api/proveedores
   ```

5. Deberías ver los 3 proveedores de ejemplo

## ✅ Verificación Final

Marca cada item cuando lo completes:

- [ ] Proyecto creado en Supabase
- [ ] Schema SQL ejecutado correctamente
- [ ] Tablas visibles en Table Editor
- [ ] Datos de ejemplo cargados
- [ ] Credenciales copiadas
- [ ] Backend conectado exitosamente
- [ ] Endpoint de proveedores funciona

## 🎉 ¡Listo!

Tu base de datos está configurada y lista para usar.

## 🔧 Troubleshooting

### Error: "relation already exists"
- Esto significa que ya ejecutaste el schema antes
- Puedes ignorarlo o eliminar las tablas y volver a ejecutar

### Error: "permission denied"
- Verifica que estés usando la API key correcta
- Asegúrate de usar la "anon/public" key, no la "service_role"

### No veo los datos de ejemplo
- Ejecuta solo la sección de "DATOS DE EJEMPLO" del SQL
- O créalos manualmente desde el Table Editor

### El backend no se conecta
- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de que no haya espacios extra
- Reinicia el servidor backend

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del backend
2. Verifica la consola del navegador
3. Consulta la documentación de Supabase: https://supabase.com/docs
