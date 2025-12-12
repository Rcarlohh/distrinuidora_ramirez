# Sistema de Gestión de Facturas y Remisiones

Este es un sistema completo para la gestión de un taller o negocio, que incluye:
- **Órdenes de Compra**
- **Facturación**
- **Órdenes de Trabajo**
- **Inventario**

## 🚀 Características

- **Gestión de Inventario:** Control de stock, alertas de bajo stock, y catálogo de productos/servicios.
- **Flujo Automatizado:** Los números de documentos (Facturas, Órdenes) se generan automáticamente.
- **Reducción de Stock:** Al crear facturas u órdenes de trabajo, el stock se descuenta automáticamente.
- **Seguridad:** Acceso protegido por contraseña y roles.
- **Generación de PDF:** Creación automática de documentos en PDF para imprimir o enviar.

## 🛠️ Instalación y Uso

### Requisitos Previa
- Node.js instalado.
- Cuenta en Supabase (Base de datos PostgreSQL).

### Configuración
1. Configura las variables de entorno en un archivo `.env` en la raíz (ver `server.js` para referencias).
2. Ejecuta los scripts SQL ubicados en la raíz para crear la estructura de base de datos.

### Ejecutar
1. **Backend:**
   ```bash
   node server.js
   ```
2. **Frontend:**
   ```bash
   cd client
   npm start
   ```

## 📄 Documentación Adicional
- Consulta `ESTADO_FINAL.md` para ver los detalles de la última actualización.
- Consulta `API_EXAMPLES.md` para ejemplos de uso de la API.
