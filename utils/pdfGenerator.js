const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
    constructor() {
        this.uploadsDir = path.join(__dirname, '..', 'uploads', 'pdfs');
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
    }

    // Generar PDF de Orden de Compra
    async generarOrdenCompra(orden, detalles, proveedor) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
                const filename = `OC_${orden.numero_orden}_${Date.now()}.pdf`;
                const filepath = path.join(this.uploadsDir, filename);
                const stream = fs.createWriteStream(filepath);

                doc.pipe(stream);

                // Header
                this.addHeader(doc, 'ORDEN DE COMPRA');

                // Logo placeholder (puedes agregar tu logo aquí)
                doc.fontSize(20)
                    .fillColor('#2c3e50')
                    .text('GESTOR DE COMPRAS', 50, 50);

                // Información de la orden
                doc.fontSize(10)
                    .fillColor('#000000')
                    .text(`No. Orden: ${orden.numero_orden}`, 400, 50)
                    .text(`Fecha: ${this.formatDate(orden.fecha_orden)}`, 400, 65)
                    .text(`Estado: ${orden.estado}`, 400, 80);

                // Línea divisoria
                doc.moveTo(50, 110)
                    .lineTo(562, 110)
                    .stroke();

                // Información del proveedor
                doc.fontSize(12)
                    .fillColor('#2c3e50')
                    .text('PROVEEDOR', 50, 130);

                doc.fontSize(10)
                    .fillColor('#000000')
                    .text(`Nombre: ${proveedor?.nombre_social || 'N/A'}`, 50, 150)
                    .text(`RFC: ${proveedor?.rfc || 'N/A'}`, 50, 165)
                    .text(`Contacto: ${proveedor?.contacto || 'N/A'}`, 50, 180)
                    .text(`Teléfono: ${proveedor?.telefono || 'N/A'}`, 50, 195);

                // Fecha de entrega
                if (orden.fecha_entrega) {
                    doc.text(`Fecha de Entrega: ${this.formatDate(orden.fecha_entrega)}`, 350, 150);
                }

                // Tabla de detalles
                const tableTop = 240;
                this.generateTable(doc, tableTop, detalles);

                // Totales
                const totalesY = tableTop + 40 + (detalles.length * 25);
                this.addTotales(doc, totalesY, orden);

                // Notas
                if (orden.notas) {
                    doc.fontSize(10)
                        .text('Notas:', 50, totalesY + 100)
                        .fontSize(9)
                        .text(orden.notas, 50, totalesY + 115, { width: 500 });
                }

                // Footer
                this.addFooter(doc);

                doc.end();

                stream.on('finish', () => {
                    resolve({ filepath, filename });
                });

                stream.on('error', reject);

            } catch (error) {
                reject(error);
            }
        });
    }

    // Generar PDF de Factura
    async generarFactura(factura, detalles, proveedor, orden) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
                const filename = `FAC_${factura.numero_factura}_${Date.now()}.pdf`;
                const filepath = path.join(this.uploadsDir, filename);
                const stream = fs.createWriteStream(filepath);

                doc.pipe(stream);

                // Header
                this.addHeader(doc, 'FACTURA');

                doc.fontSize(20)
                    .fillColor('#c0392b')
                    .text('FACTURA', 50, 50);

                // Información de la factura
                doc.fontSize(10)
                    .fillColor('#000000')
                    .text(`No. Factura: ${factura.numero_factura}`, 400, 50)
                    .text(`Fecha: ${this.formatDate(factura.fecha_factura)}`, 400, 65)
                    .text(`Estado: ${factura.estado}`, 400, 80);

                if (orden) {
                    doc.text(`Orden: ${orden.numero_orden}`, 400, 95);
                }

                // Línea divisoria
                doc.moveTo(50, 110)
                    .lineTo(562, 110)
                    .stroke();

                // Información del proveedor
                doc.fontSize(12)
                    .fillColor('#2c3e50')
                    .text('PROVEEDOR', 50, 130);

                doc.fontSize(10)
                    .fillColor('#000000')
                    .text(`Nombre: ${proveedor?.nombre_social || 'N/A'}`, 50, 150)
                    .text(`RFC: ${proveedor?.rfc || 'N/A'}`, 50, 165)
                    .text(`Contacto: ${proveedor?.contacto || 'N/A'}`, 50, 180);

                // Fecha de vencimiento
                if (factura.fecha_vencimiento) {
                    doc.fontSize(10)
                        .fillColor('#c0392b')
                        .text(`Vencimiento: ${this.formatDate(factura.fecha_vencimiento)}`, 350, 150);
                }

                // Método de pago
                if (factura.metodo_pago) {
                    doc.fillColor('#000000')
                        .text(`Método de Pago: ${factura.metodo_pago}`, 350, 165);
                }

                // Tabla de detalles
                const tableTop = 220;
                this.generateFacturaTable(doc, tableTop, detalles);

                // Totales
                const totalesY = tableTop + 40 + (detalles.length * 25);
                this.addTotales(doc, totalesY, factura);

                // Notas
                if (factura.notas) {
                    doc.fontSize(10)
                        .text('Notas:', 50, totalesY + 100)
                        .fontSize(9)
                        .text(factura.notas, 50, totalesY + 115, { width: 500 });
                }

                // Footer
                this.addFooter(doc);

                doc.end();

                stream.on('finish', () => {
                    resolve({ filepath, filename });
                });

                stream.on('error', reject);

            } catch (error) {
                reject(error);
            }
        });
    }

    // Tabla para orden de compra
    generateTable(doc, y, detalles) {
        const headers = ['Cant.', 'Material/Servicio', 'P. Unitario', 'Importe'];
        const colWidths = [60, 280, 100, 100];
        const startX = 50;

        // Headers
        doc.fontSize(10)
            .fillColor('#ffffff')
            .rect(startX, y, 512, 25)
            .fill('#34495e');

        doc.fillColor('#ffffff');
        headers.forEach((header, i) => {
            const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.text(header, x + 5, y + 7, { width: colWidths[i] - 10 });
        });

        // Rows
        let currentY = y + 25;
        doc.fillColor('#000000');

        detalles.forEach((detalle, index) => {
            const rowY = currentY + (index * 25);

            // Alternar colores de fila
            if (index % 2 === 0) {
                doc.rect(startX, rowY, 512, 25)
                    .fill('#ecf0f1');
            }

            doc.fillColor('#000000')
                .fontSize(9)
                .text(detalle.cantidad, startX + 5, rowY + 7, { width: 50 })
                .text(detalle.material_servicio || detalle.descripcion, startX + 65, rowY + 7, { width: 270 })
                .text(`$${parseFloat(detalle.precio_unitario).toFixed(2)}`, startX + 345, rowY + 7, { width: 90 })
                .text(`$${parseFloat(detalle.importe).toFixed(2)}`, startX + 445, rowY + 7, { width: 90 });
        });
    }

    // Tabla para factura
    generateFacturaTable(doc, y, detalles) {
        this.generateTable(doc, y, detalles);
    }

    // Agregar totales
    addTotales(doc, y, data) {
        const x = 400;

        doc.fontSize(10)
            .fillColor('#000000')
            .text('Subtotal:', x, y)
            .text(`$${parseFloat(data.subtotal || 0).toFixed(2)}`, x + 100, y, { align: 'right' })
            .text('IVA (16%):', x, y + 20)
            .text(`$${parseFloat(data.iva || 0).toFixed(2)}`, x + 100, y + 20, { align: 'right' });

        doc.fontSize(12)
            .fillColor('#2c3e50')
            .text('TOTAL:', x, y + 45)
            .text(`$${parseFloat(data.total || 0).toFixed(2)}`, x + 100, y + 45, { align: 'right' });
    }

    // Header del documento
    addHeader(doc, title) {
        // Puedes personalizar esto con tu logo
    }

    // Footer del documento
    addFooter(doc) {
        const bottomY = 720;
        doc.fontSize(8)
            .fillColor('#7f8c8d')
            .text(
                'Este documento fue generado electrónicamente por el Sistema de Gestión de Compras',
                50,
                bottomY,
                { align: 'center', width: 512 }
            )
            .text(
                `Generado: ${new Date().toLocaleString('es-MX')}`,
                50,
                bottomY + 15,
                { align: 'center', width: 512 }
            );
    }

    // Formatear fecha
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

module.exports = new PDFGenerator();
