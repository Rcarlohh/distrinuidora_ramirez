const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');

class PDFGenerator {
    constructor() {
        this.uploadsDir = path.join(__dirname, '..', 'uploads', 'pdfs');
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
        this.emisorData = null;
    }

    // Cargar datos del emisor desde la base de datos
    async loadEmisorData() {
        if (this.emisorData) return this.emisorData;

        try {
            const { data, error } = await supabase
                .from('configuracion_emisor')
                .select('*')
                .limit(1)
                .single();

            if (error) throw error;
            this.emisorData = data;
            return data;
        } catch (error) {
            console.error('Error al cargar datos del emisor:', error);
            // Datos por defecto si no se encuentran en la BD
            this.emisorData = {
                nombre_comercial: 'REFACCIONARIA RAMÍREZ',
                razon_social: 'REFACCIONARIA AUTOMOTRIZ RAMIREZ',
                rfc: 'RARXXXXXXXX',
                direccion: 'CARR. JILOTEPEC - CORRALES KM. 75, OJO DE AGUA, EDO. MÉXICO',
                telefono1: '55 1917 3964',
                telefono2: '77 3227 9793',
                email: 'refaccionaria.60@hotmail.com',
                slogan: 'VENTA DE REFACCIONES DE MUELLES Y SUSPENSIONES EN EQUIPO PESADO Y SERVICIO DE TALLER'
            };
            return this.emisorData;
        }
    }

    // Encabezado profesional con logo y datos de la empresa
    async addProfessionalHeader(doc, tipoDocumento, numeroDocumento, fecha) {
        const emisor = await this.loadEmisorData();

        // Fondo del encabezado
        doc.rect(0, 0, 612, 140)
            .fill('#f8f9fa');

        // Logo circular (placeholder - puedes agregar tu logo real)
        doc.circle(80, 70, 35)
            .lineWidth(3)
            .stroke('#2c3e50');

        doc.fontSize(24)
            .fillColor('#2c3e50')
            .font('Helvetica-Bold')
            .text('RR', 63, 60);

        // Nombre de la empresa
        doc.fontSize(16)
            .fillColor('#2c3e50')
            .font('Helvetica-Bold')
            .text(emisor.nombre_comercial, 130, 35);

        // Slogan
        doc.fontSize(8)
            .fillColor('#34495e')
            .font('Helvetica')
            .text(emisor.slogan, 130, 55, { width: 300 });

        // Dirección y contacto
        doc.fontSize(7)
            .fillColor('#7f8c8d')
            .text(emisor.direccion, 130, 75, { width: 300 })
            .text(`CEL.: ${emisor.telefono1} - ${emisor.telefono2} E-MAIL: ${emisor.email}`, 130, 90, { width: 300 });

        // Cuadro de información del documento (derecha)
        doc.rect(450, 30, 130, 80)
            .lineWidth(2)
            .stroke('#e74c3c');

        doc.fontSize(10)
            .fillColor('#e74c3c')
            .font('Helvetica-Bold')
            .text(tipoDocumento, 455, 40, { width: 120, align: 'center' });

        doc.fontSize(14)
            .fillColor('#2c3e50')
            .font('Helvetica-Bold')
            .text(numeroDocumento, 455, 60, { width: 120, align: 'center' });

        doc.fontSize(8)
            .fillColor('#7f8c8d')
            .font('Helvetica')
            .text('FECHA', 455, 85, { width: 120, align: 'center' });

        const fechaFormateada = this.formatDateShort(fecha);
        doc.fontSize(9)
            .fillColor('#2c3e50')
            .font('Helvetica-Bold')
            .text(fechaFormateada, 455, 95, { width: 120, align: 'center' });

        // Línea divisoria
        doc.moveTo(40, 145)
            .lineTo(572, 145)
            .lineWidth(2)
            .stroke('#e74c3c');

        return 160; // Retorna la posición Y donde continuar
    }

    // Pie de página profesional
    addProfessionalFooter(doc) {
        const pageHeight = 792; // Altura de página carta
        const footerY = pageHeight - 100;

        // Línea superior del footer
        doc.moveTo(40, footerY)
            .lineTo(572, footerY)
            .lineWidth(1)
            .stroke('#bdc3c7');

        // Texto de términos y condiciones
        doc.fontSize(7)
            .fillColor('#34495e')
            .font('Helvetica')
            .text(
                'La cantidad de $ que este pagare reconozco deber y pagaré incondicionalmente a la orden del acreedor en la fecha de vencimiento arriba indicada en esta ciudad. ' +
                'Este pagare es mercantil y está regido por la Ley General de Títulos y Operaciones de Crédito en su artículo 173. Para fines de y demás relativos.',
                50,
                footerY + 10,
                { width: 512, align: 'justify', lineGap: 2 }
            );

        // Sección de firma
        doc.fontSize(8)
            .fillColor('#2c3e50')
            .font('Helvetica-Bold')
            .text('FIRMA DE CONFORMIDAD', 50, footerY + 50, { width: 250, align: 'center' });

        // Línea para firma
        doc.moveTo(80, footerY + 70)
            .lineTo(270, footerY + 70)
            .lineWidth(1)
            .stroke('#7f8c8d');

        // Totales en el footer (lado derecho)
        doc.fontSize(7)
            .fillColor('#7f8c8d')
            .font('Helvetica')
            .text('TOTAL $', 350, footerY + 50, { width: 100 });

        doc.fontSize(7)
            .text('IVA $', 350, footerY + 65, { width: 100 });
    }

    // Generar PDF de Orden de Compra
    async generarOrdenCompra(orden, detalles, proveedor) {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
                const filename = `OC_${orden.numero_orden}_${Date.now()}.pdf`;
                const filepath = path.join(this.uploadsDir, filename);
                const stream = fs.createWriteStream(filepath);

                doc.pipe(stream);

                // Encabezado profesional
                let currentY = await this.addProfessionalHeader(
                    doc,
                    'ORDEN DE COMPRA',
                    orden.numero_orden,
                    orden.fecha_orden
                );

                // Información del cliente
                doc.fontSize(10)
                    .fillColor('#2c3e50')
                    .font('Helvetica-Bold')
                    .text('CLIENTE:', 50, currentY);

                currentY += 20;

                // Usar datos del cliente desde la orden
                const nombreCliente = orden.nombre_cliente || proveedor?.nombre_social || '';
                const rfcCliente = orden.rfc_cliente || proveedor?.rfc || '';
                const telefonoCliente = proveedor?.telefono || '';

                let lineY = currentY;

                // Solo mostrar campos que tengan datos
                if (nombreCliente) {
                    doc.fontSize(9)
                        .fillColor('#000000')
                        .font('Helvetica')
                        .text(`Nombre: ${nombreCliente}`, 50, lineY);
                    lineY += 15;
                }

                if (rfcCliente) {
                    doc.text(`RFC: ${rfcCliente}`, 50, lineY);
                    lineY += 15;
                }

                if (telefonoCliente) {
                    doc.text(`Teléfono: ${telefonoCliente}`, 50, lineY);
                    lineY += 15;
                }

                // Información adicional (derecha)
                if (orden.metodo_pago) {
                    doc.text(`Método de Pago: ${orden.metodo_pago}`, 350, currentY);
                }
                doc.text(`Estado: ${orden.estado}`, 350, currentY + 15);

                currentY += 80;

                // Tabla de detalles
                this.generateCompactTable(doc, currentY, detalles, 'orden');

                // Totales
                const totalesY = currentY + 40 + (detalles.length * 22);
                this.addCompactTotales(doc, totalesY, orden);

                // Notas
                if (orden.notas) {
                    doc.fontSize(8)
                        .fillColor('#2c3e50')
                        .font('Helvetica-Bold')
                        .text('NOTAS:', 50, totalesY + 80)
                        .fontSize(8)
                        .fillColor('#000000')
                        .font('Helvetica')
                        .text(orden.notas, 50, totalesY + 95, { width: 500 });
                }

                // Footer profesional
                this.addProfessionalFooter(doc);

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
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
                const filename = `FAC_${factura.numero_factura}_${Date.now()}.pdf`;
                const filepath = path.join(this.uploadsDir, filename);
                const stream = fs.createWriteStream(filepath);

                doc.pipe(stream);

                // Encabezado profesional
                let currentY = await this.addProfessionalHeader(
                    doc,
                    'FACTURA',
                    factura.numero_factura,
                    factura.fecha_factura
                );

                // Información del cliente
                doc.fontSize(10)
                    .fillColor('#2c3e50')
                    .font('Helvetica-Bold')
                    .text('CLIENTE:', 50, currentY);

                currentY += 20;

                // Usar datos del cliente desde la factura
                const nombreCliente = factura.nombre_cliente || proveedor?.nombre_social || '';
                const rfcCliente = factura.rfc_cliente || proveedor?.rfc || '';
                const direccionCliente = factura.direccion_cliente || proveedor?.direccion || '';
                const telefonoCliente = factura.telefono_cliente || proveedor?.telefono || '';

                let lineY = currentY;

                // Solo mostrar campos que tengan datos
                if (nombreCliente) {
                    doc.fontSize(9)
                        .fillColor('#000000')
                        .font('Helvetica')
                        .text(`Nombre: ${nombreCliente}`, 50, lineY);
                    lineY += 15;
                }

                if (rfcCliente) {
                    doc.text(`RFC: ${rfcCliente}`, 50, lineY);
                    lineY += 15;
                }

                if (direccionCliente) {
                    doc.text(`Dirección: ${direccionCliente}`, 50, lineY);
                    lineY += 15;
                }

                if (telefonoCliente) {
                    doc.text(`Teléfono: ${telefonoCliente}`, 50, lineY);
                    lineY += 15;
                }

                // Información adicional (derecha)
                if (factura.fecha_vencimiento) {
                    doc.fillColor('#e74c3c')
                        .font('Helvetica-Bold')
                        .text(`Vencimiento: ${this.formatDateShort(factura.fecha_vencimiento)}`, 350, currentY);
                }

                doc.fillColor('#000000')
                    .font('Helvetica')
                    .text(`Estado: ${factura.estado}`, 350, currentY + 15);

                if (factura.metodo_pago) {
                    doc.text(`Método de Pago: ${factura.metodo_pago}`, 350, currentY + 30);
                }

                if (orden) {
                    doc.text(`Orden: ${orden.numero_orden}`, 350, currentY + 45);
                }

                currentY += 80;

                // Tabla de detalles
                this.generateCompactTable(doc, currentY, detalles, 'factura');

                // Totales
                const totalesY = currentY + 40 + (detalles.length * 22);
                this.addCompactTotales(doc, totalesY, factura);

                // Notas
                if (factura.notas) {
                    doc.fontSize(8)
                        .fillColor('#2c3e50')
                        .font('Helvetica-Bold')
                        .text('NOTAS:', 50, totalesY + 80)
                        .fontSize(8)
                        .fillColor('#000000')
                        .font('Helvetica')
                        .text(factura.notas, 50, totalesY + 95, { width: 500 });
                }

                // Footer profesional
                this.addProfessionalFooter(doc);

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

    // Tabla compacta y profesional
    generateCompactTable(doc, y, detalles, tipo) {
        const headers = ['CANT.', 'DESCRIPCIÓN', 'PRECIO UNIT.', 'IMPORTE'];
        const colWidths = [50, 300, 90, 92];
        const startX = 40;

        // Headers con fondo
        doc.fontSize(9)
            .fillColor('#ffffff')
            .rect(startX, y, 532, 22)
            .fill('#34495e');

        doc.fillColor('#ffffff')
            .font('Helvetica-Bold');

        headers.forEach((header, i) => {
            const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.text(header, x + 5, y + 6, { width: colWidths[i] - 10 });
        });

        // Rows
        let currentY = y + 22;
        doc.fillColor('#000000')
            .font('Helvetica');

        detalles.forEach((detalle, index) => {
            const rowY = currentY + (index * 22);

            // Alternar colores de fila
            if (index % 2 === 0) {
                doc.rect(startX, rowY, 532, 22)
                    .fill('#f8f9fa');
            }

            const descripcion = detalle.material_servicio || detalle.descripcion || 'N/A';

            doc.fillColor('#000000')
                .fontSize(8)
                .text(detalle.cantidad, startX + 5, rowY + 6, { width: 40, align: 'center' })
                .text(descripcion, startX + 55, rowY + 6, { width: 290 })
                .text(`$${parseFloat(detalle.precio_unitario || 0).toFixed(2)}`, startX + 350, rowY + 6, { width: 80, align: 'right' })
                .text(`$${parseFloat(detalle.importe || 0).toFixed(2)}`, startX + 440, rowY + 6, { width: 82, align: 'right' });
        });

        // Línea final de tabla
        const finalY = currentY + (detalles.length * 22);
        doc.moveTo(startX, finalY)
            .lineTo(startX + 532, finalY)
            .lineWidth(1)
            .stroke('#34495e');
    }

    // Totales compactos
    addCompactTotales(doc, y, data) {
        const x = 380;
        const boxWidth = 192;

        // Fondo de totales
        doc.rect(x, y, boxWidth, 70)
            .lineWidth(1)
            .stroke('#bdc3c7');

        doc.fontSize(9)
            .fillColor('#000000')
            .font('Helvetica')
            .text('Subtotal:', x + 10, y + 10)
            .text(`$${parseFloat(data.subtotal || 0).toFixed(2)}`, x + 10, y + 10, { width: boxWidth - 20, align: 'right' })
            .text('IVA (16%):', x + 10, y + 28)
            .text(`$${parseFloat(data.iva || 0).toFixed(2)}`, x + 10, y + 28, { width: boxWidth - 20, align: 'right' });

        // Total con fondo
        doc.rect(x, y + 46, boxWidth, 24)
            .fill('#34495e');

        doc.fontSize(11)
            .fillColor('#ffffff')
            .font('Helvetica-Bold')
            .text('TOTAL:', x + 10, y + 52)
            .text(`$${parseFloat(data.total || 0).toFixed(2)}`, x + 10, y + 52, { width: boxWidth - 20, align: 'right' });
    }

    // Formatear fecha corta
    formatDateShort(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Formatear fecha larga
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
