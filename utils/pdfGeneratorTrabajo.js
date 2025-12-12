const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGeneratorTrabajo {
    async generarOrdenTrabajo(orden, detalles) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
                const filename = `orden-trabajo-${orden.numero_orden_trabajo}-${Date.now()}.pdf`;
                const filepath = path.join(__dirname, '../uploads/pdfs', filename);

                // Asegurar que el directorio existe
                const dir = path.dirname(filepath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);

                // Header
                this.addHeader(doc, 'ORDEN DE TRABAJO');

                // Información de la orden
                doc.moveDown();
                doc.fontSize(12).font('Helvetica-Bold');
                doc.text(`No. Orden: ${orden.numero_orden_trabajo}`, { align: 'right' });
                doc.text(`Fecha: ${new Date(orden.created_at).toLocaleDateString('es-MX')}`, { align: 'right' });
                doc.moveDown();

                // Información del Cliente
                doc.fontSize(14).font('Helvetica-Bold');
                doc.fillColor('#2c3e50');
                doc.text('INFORMACIÓN DEL CLIENTE', { underline: true });
                doc.moveDown(0.5);

                doc.fontSize(11).font('Helvetica');
                doc.fillColor('#000000');
                doc.text(`Cliente: ${orden.nombre_cliente}`);
                doc.text(`Dirección: ${orden.direccion}`);
                doc.text(`Teléfono: ${orden.telefono}`);
                doc.moveDown();

                // Información del Vehículo
                doc.fontSize(14).font('Helvetica-Bold');
                doc.fillColor('#2c3e50');
                doc.text('INFORMACIÓN DEL VEHÍCULO', { underline: true });
                doc.moveDown(0.5);

                doc.fontSize(11).font('Helvetica');
                doc.fillColor('#000000');

                const vehiculoInfo = [
                    { label: 'Placas:', value: orden.no_placas },
                    { label: 'Marca:', value: orden.marca },
                    { label: 'Modelo:', value: orden.modelo },
                    { label: 'Año:', value: orden.anio },
                    { label: 'Color:', value: orden.color },
                    { label: 'Kilometraje:', value: orden.kilometraje }
                ];

                let y = doc.y;
                const columnWidth = 250;

                vehiculoInfo.forEach((item, index) => {
                    if (index % 2 === 0) {
                        doc.text(`${item.label} ${item.value}`, 50, y);
                    } else {
                        doc.text(`${item.label} ${item.value}`, 50 + columnWidth, y);
                        y += 15;
                    }
                });

                doc.moveDown(2);

                // Descripción del Servicio
                doc.fontSize(14).font('Helvetica-Bold');
                doc.fillColor('#2c3e50');
                doc.text('DESCRIPCIÓN DEL SERVICIO', { underline: true });
                doc.moveDown(0.5);

                doc.fontSize(11).font('Helvetica');
                doc.fillColor('#000000');
                doc.text(orden.descripcion_servicio, { align: 'justify' });
                doc.moveDown();

                // Tabla de Materiales/Servicios
                if (detalles && detalles.length > 0) {
                    doc.fontSize(14).font('Helvetica-Bold');
                    doc.fillColor('#2c3e50');
                    doc.text('MATERIALES / SERVICIOS', { underline: true });
                    doc.moveDown(0.5);

                    this.addDetallesTable(doc, detalles);
                    doc.moveDown();
                }

                // Información del Personal
                doc.fontSize(14).font('Helvetica-Bold');
                doc.fillColor('#2c3e50');
                doc.text('INFORMACIÓN DEL SERVICIO', { underline: true });
                doc.moveDown(0.5);

                doc.fontSize(11).font('Helvetica');
                doc.fillColor('#000000');
                doc.text(`Encargado: ${orden.encargado}`);
                if (orden.ayudante) doc.text(`Ayudante: ${orden.ayudante}`);
                if (orden.tiempo_realizar) doc.text(`Tiempo estimado: ${orden.tiempo_realizar}`);
                if (orden.realizo_servicio) doc.text(`Realizó servicio: ${orden.realizo_servicio}`);
                doc.moveDown();

                // Información de Entrega
                if (orden.fecha_entrega || orden.responsable_entrega) {
                    doc.fontSize(14).font('Helvetica-Bold');
                    doc.fillColor('#2c3e50');
                    doc.text('INFORMACIÓN DE ENTREGA', { underline: true });
                    doc.moveDown(0.5);

                    doc.fontSize(11).font('Helvetica');
                    doc.fillColor('#000000');
                    if (orden.responsable_entrega) doc.text(`Responsable: ${orden.responsable_entrega}`);
                    if (orden.fecha_entrega) doc.text(`Fecha de entrega: ${new Date(orden.fecha_entrega).toLocaleDateString('es-MX')}`);
                    if (orden.hora_entrega_unidad) doc.text(`Hora de entrega: ${orden.hora_entrega_unidad}`);
                    if (orden.entrega_llaves) doc.text(`Entrega de llaves: ${orden.entrega_llaves}`);
                    if (orden.recibe_unidad) doc.text(`Recibe unidad: ${orden.recibe_unidad}`);
                    doc.moveDown();
                }

                // Observaciones
                if (orden.observaciones) {
                    doc.fontSize(14).font('Helvetica-Bold');
                    doc.fillColor('#2c3e50');
                    doc.text('OBSERVACIONES', { underline: true });
                    doc.moveDown(0.5);

                    doc.fontSize(11).font('Helvetica');
                    doc.fillColor('#000000');
                    doc.text(orden.observaciones, { align: 'justify' });
                    doc.moveDown();
                }

                // Estado
                doc.moveDown();
                doc.fontSize(12).font('Helvetica-Bold');
                doc.fillColor('#e74c3c');
                doc.text(`ESTADO: ${orden.estado}`, { align: 'center' });

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

    addHeader(doc, title) {
        doc.fontSize(20).font('Helvetica-Bold');
        doc.fillColor('#2c3e50');
        doc.text(title, { align: 'center' });
        doc.moveDown(0.5);

        doc.strokeColor('#e74c3c');
        doc.lineWidth(2);
        doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
        doc.moveDown();
    }

    addDetallesTable(doc, detalles) {
        const tableTop = doc.y;
        const itemHeight = 25;

        // Headers
        doc.fontSize(11).font('Helvetica-Bold');
        doc.fillColor('#ffffff');
        doc.rect(50, tableTop, 512, 25).fill('#2c3e50');

        doc.text('CANT', 60, tableTop + 7, { width: 60, align: 'center' });
        doc.text('MATERIAL / CONCEPTO', 130, tableTop + 7, { width: 400, align: 'left' });

        // Rows
        doc.fillColor('#000000');
        doc.font('Helvetica');

        detalles.forEach((detalle, index) => {
            const y = tableTop + (index + 1) * itemHeight;

            // Alternar color de fondo
            if (index % 2 === 0) {
                doc.rect(50, y, 512, itemHeight).fill('#f8f9fa');
            }

            doc.fillColor('#000000');
            doc.text(detalle.cantidad.toString(), 60, y + 7, { width: 60, align: 'center' });
            doc.text(detalle.material_concepto, 130, y + 7, { width: 400, align: 'left' });
        });

        doc.moveDown(detalles.length + 1);
    }

    addFooter(doc) {
        const bottom = 50;
        doc.fontSize(9).font('Helvetica');
        doc.fillColor('#7f8c8d');
        doc.text(
            `Generado el ${new Date().toLocaleDateString('es-MX')} a las ${new Date().toLocaleTimeString('es-MX')}`,
            50,
            doc.page.height - bottom,
            { align: 'center' }
        );
    }
}

module.exports = new PDFGeneratorTrabajo();
