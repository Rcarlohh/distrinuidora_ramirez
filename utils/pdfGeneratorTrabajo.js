const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGeneratorTrabajo {
    async generarOrdenTrabajo(orden, detalles) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 30,
                    size: 'LETTER'
                });
                const filename = `orden-trabajo-${orden.numero_orden_trabajo}-${Date.now()}.pdf`;
                const filepath = path.join(__dirname, '../uploads/pdfs', filename);

                const dir = path.dirname(filepath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);

                const M = 30; // Margin
                const W = 552; // Width
                let y = 20;

                // ========== HEADER ==========
                const logoPath = path.join(__dirname, '../client/public/img/logo.png');
                if (fs.existsSync(logoPath)) {
                    doc.image(logoPath, M, y, { width: 80 });
                }

                // Título empresa (a la derecha del logo)
                doc.font('Helvetica-Bold').fontSize(11);
                doc.text('VENTA DE REFACCIONES DE MUELLES Y SUSPENSIONES', M + 95, y + 18);
                doc.fontSize(10);
                doc.text('EN EQUIPO PESADO Y, SERVICIO DE TALLER', M + 95, y + 32);

                // Box orden/fecha (extremo derecho)
                doc.rect(M + 420, y + 10, 132, 45).stroke();
                doc.fontSize(9);
                doc.text('ORDEN:', M + 425, y + 18);
                doc.font('Helvetica').text(orden.numero_orden_trabajo || '', M + 470, y + 18);
                doc.font('Helvetica-Bold').text('FECHA:', M + 425, y + 34);
                doc.font('Helvetica').text(orden.created_at ? new Date(orden.created_at).toLocaleDateString('es-MX') : '', M + 470, y + 34);

                y = 100; // Bajamos para dar espacio al logo grande

                // ========== SECCIÓN INGRESO ==========
                doc.rect(M, y, W, 55).stroke();

                // Row 1: Fecha, Hora, Unidad, Placas
                doc.font('Helvetica-Bold').fontSize(8);
                const row1Y = y + 8;
                doc.text('FECHA INGRESO:', M + 5, row1Y);
                this.drawUnderlineField(doc, M + 75, row1Y, 70, orden.fecha_ingreso || '');

                doc.text('HORA:', M + 155, row1Y);
                this.drawUnderlineField(doc, M + 180, row1Y, 55, orden.hora_ingreso || '');

                doc.text('NO. UNIDAD:', M + 250, row1Y);
                this.drawUnderlineField(doc, M + 305, row1Y, 60, orden.no_unidad || '');

                doc.text('NO. PLACAS:', M + 380, row1Y);
                this.drawUnderlineField(doc, M + 435, row1Y, 80, orden.no_placas || '');

                // Row 2: Operador
                const row2Y = y + 23;
                doc.text('NOMBRE DE OPERADOR:', M + 5, row2Y);
                this.drawUnderlineField(doc, M + 110, row2Y, 200, orden.nombre_operador || '');

                doc.text('TEL:', M + 380, row2Y);
                this.drawUnderlineField(doc, M + 400, row2Y, 115, orden.telefono_operador || '');

                // Row 3: Dueño
                const row3Y = y + 38;
                doc.text('DUEÑO DEL CAMIÓN/MÁQUINA:', M + 5, row3Y);
                this.drawUnderlineField(doc, M + 135, row3Y, 175, orden.nombre_dueno || '');

                doc.text('TEL:', M + 380, row3Y);
                this.drawUnderlineField(doc, M + 400, row3Y, 115, orden.telefono_dueno || '');

                y += 60;

                // ========== SECCIÓN RECIBE UNIDAD ==========
                doc.rect(M, y, W, 20).stroke();
                const recY = y + 6;
                doc.text('NOMBRE DE QUIEN RECIBE UNIDAD:', M + 5, recY);
                this.drawUnderlineField(doc, M + 155, recY, 180, orden.nombre_recibe_unidad || '');

                doc.text('RECIBE LLAVES:', M + 380, recY);
                doc.font('Helvetica');
                const siCheck = orden.recibe_llaves === 'Sí' ? 'X' : ' ';
                const noCheck = orden.recibe_llaves === 'No' ? 'X' : ' ';
                doc.text(`SI [${siCheck}]  NO [${noCheck}]`, M + 450, recY);

                y += 25;

                // ========== TABLA DESCRIPCIÓN / MATERIALES ==========
                const tableH = 140;
                const col1 = 300; // Descripción
                const col2 = 50;  // Cantidad
                const col3 = W - col1 - col2; // Material

                // Header de tabla
                doc.rect(M, y, col1, 15).fillAndStroke('#1a1a1a', '#000');
                doc.rect(M + col1, y, col2, 15).fillAndStroke('#1a1a1a', '#000');
                doc.rect(M + col1 + col2, y, col3, 15).fillAndStroke('#1a1a1a', '#000');

                doc.fillColor('#FFF').font('Helvetica-Bold').fontSize(8);
                doc.text('DESCRIPCIÓN DE SERVICIO A REALIZAR', M + 5, y + 4);
                doc.text('CANT', M + col1 + 10, y + 4);
                doc.text('MATERIAL SOLICITADO', M + col1 + col2 + 5, y + 4);
                doc.fillColor('#000');

                y += 15;
                const tableContentY = y;

                // Cuerpo de tabla
                doc.rect(M, y, col1, tableH).stroke();
                doc.rect(M + col1, y, col2, tableH).stroke();
                doc.rect(M + col1 + col2, y, col3, tableH).stroke();

                // Contenido descripción
                doc.font('Helvetica').fontSize(8);
                if (orden.descripcion_servicio) {
                    doc.text(orden.descripcion_servicio, M + 5, y + 5, {
                        width: col1 - 10,
                        height: tableH - 10,
                        lineGap: 2
                    });
                }

                // Contenido materiales (líneas)
                const rowHeight = 12;
                const maxItems = Math.floor((tableH - 5) / rowHeight);

                if (detalles && detalles.length > 0) {
                    detalles.slice(0, maxItems).forEach((det, i) => {
                        const itemY = y + 5 + (i * rowHeight);
                        doc.text(det.cantidad.toString(), M + col1 + 5, itemY, { width: col2 - 10, align: 'center' });
                        doc.text((det.material_concepto || '').substring(0, 30), M + col1 + col2 + 5, itemY, { width: col3 - 10 });

                        // Línea separadora
                        if (i < maxItems - 1) {
                            doc.strokeColor('#DDD').lineWidth(0.3);
                            doc.moveTo(M + col1, itemY + rowHeight - 2).lineTo(M + W, itemY + rowHeight - 2).stroke();
                            doc.strokeColor('#000').lineWidth(1);
                        }
                    });
                }

                y += tableH + 5;

                // ========== REALIZÓ SERVICIO ==========
                doc.rect(M, y, W, 35).stroke();
                doc.font('Helvetica-Bold').fontSize(9);
                doc.rect(M, y, W, 12).fillAndStroke('#E31C25', '#000');
                doc.fillColor('#FFF').text('REALIZÓ SERVICIO', M + 230, y + 2);
                doc.fillColor('#000');

                y += 15;
                doc.fontSize(8);
                doc.text('ENCARGADO:', M + 5, y);
                this.drawUnderlineField(doc, M + 60, y, 130, orden.encargado || '');

                doc.text('AYUDANTE:', M + 200, y);
                this.drawUnderlineField(doc, M + 250, y, 130, orden.ayudante || '');

                doc.text('TIEMPO:', M + 395, y);
                this.drawUnderlineField(doc, M + 430, y, 85, orden.tiempo_realizar || '');

                y += 25;

                // ========== ENTREGA DE SERVICIO ==========
                doc.rect(M, y, W, 45).stroke();
                doc.rect(M, y, W, 12).fillAndStroke('#E31C25', '#000');
                doc.fillColor('#FFF').font('Helvetica-Bold').fontSize(9);
                doc.text('ENTREGA DE SERVICIO', M + 220, y + 2);
                doc.fillColor('#000');

                y += 15;
                doc.fontSize(8);
                doc.text('RESPONSABLE DE ENTREGAR Y SUPERVISAR LA UNIDAD:', M + 5, y);
                this.drawUnderlineField(doc, M + 245, y, 270, orden.responsable_entrega || '');

                y += 15;
                doc.text('FECHA:', M + 5, y);
                this.drawUnderlineField(doc, M + 38, y, 70, orden.fecha_entrega || '');

                doc.text('HORA:', M + 120, y);
                this.drawUnderlineField(doc, M + 148, y, 50, orden.hora_entrega_unidad || '');

                doc.text('ENTREGA LLAVES:', M + 210, y);
                const entSi = orden.entrega_llaves === 'Sí' ? 'X' : ' ';
                const entNo = orden.entrega_llaves === 'No' ? 'X' : ' ';
                doc.font('Helvetica').text(`SI [${entSi}]  NO [${entNo}]`, M + 290, y);

                doc.font('Helvetica-Bold').text('RECIBE UNIDAD:', M + 380, y);
                this.drawUnderlineField(doc, M + 450, y, 65, orden.recibe_unidad || '');

                y += 20;

                // ========== OBSERVACIONES ==========
                doc.rect(M, y, W, 50).stroke();
                doc.rect(M, y, W, 12).fillAndStroke('#333', '#000');
                doc.fillColor('#FFF').font('Helvetica-Bold').fontSize(9);
                doc.text('OBSERVACIONES', M + 240, y + 2);
                doc.fillColor('#000');

                y += 15;
                doc.font('Helvetica').fontSize(8);
                if (orden.observaciones) {
                    doc.text(orden.observaciones, M + 5, y, { width: W - 10, height: 30 });
                }

                // ========== FOOTER ==========
                doc.fontSize(7).fillColor('#888');
                doc.text(
                    `Documento generado el ${new Date().toLocaleDateString('es-MX')} a las ${new Date().toLocaleTimeString('es-MX')}`,
                    M, 740, { width: W, align: 'center' }
                );

                doc.end();

                stream.on('finish', () => resolve({ filepath, filename }));
                stream.on('error', reject);

            } catch (error) {
                reject(error);
            }
        });
    }

    drawUnderlineField(doc, x, y, width, value) {
        doc.font('Helvetica').fontSize(8);
        doc.text(value, x, y, { width: width });
        doc.strokeColor('#000').lineWidth(0.5);
        doc.moveTo(x, y + 9).lineTo(x + width, y + 9).stroke();
    }
}

module.exports = new PDFGeneratorTrabajo();
