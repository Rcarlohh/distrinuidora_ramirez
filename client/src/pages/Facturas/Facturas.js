import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaFilePdf, FaFilter } from 'react-icons/fa';
import { facturasAPI, proveedoresAPI, ordenesAPI } from '../../services/api';
import InventarioSelector from '../../components/InventarioSelector/InventarioSelector';
import '../Ordenes/Ordenes.css';

const Facturas = () => {
    const [facturas, setFacturas] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState('');

    const [formData, setFormData] = useState({
        orden_id: '',
        nombre_cliente: '',
        rfc_cliente: '',
        direccion_cliente: '',
        telefono_cliente: '',
        fecha_factura: new Date().toISOString().split('T')[0],
        fecha_vencimiento: '',
        estado: 'Completada',
        metodo_pago: '',
        notas: ''
    });

    const [detalles, setDetalles] = useState([
        { cantidad: 1, descripcion: '', precio_unitario: 0 }
    ]);

    useEffect(() => {
        loadData();
    }, []);

    // Cargar detalles de la orden cuando se selecciona una orden
    useEffect(() => {
        if (formData.orden_id) {
            loadOrdenDetalles(formData.orden_id);
        }
    }, [formData.orden_id]);

    // Calcular fecha de vencimiento automáticamente (30 días después de la fecha de factura)
    useEffect(() => {
        if (formData.fecha_factura) {
            const fechaFactura = new Date(formData.fecha_factura);
            fechaFactura.setDate(fechaFactura.getDate() + 30);
            const fechaVencimiento = fechaFactura.toISOString().split('T')[0];
            setFormData(prev => ({ ...prev, fecha_vencimiento: fechaVencimiento }));
        }
    }, [formData.fecha_factura]);

    const loadOrdenDetalles = async (ordenId) => {
        try {
            const res = await ordenesAPI.getById(ordenId);
            if (res.data.success && res.data.data) {
                const orden = res.data.data;

                // Cargar datos del cliente desde la orden
                setFormData(prev => ({
                    ...prev,
                    nombre_cliente: orden.nombre_cliente || '',
                    rfc_cliente: orden.rfc_cliente || '',
                    metodo_pago: orden.metodo_pago || ''
                }));

                // Convertir los detalles de la orden a formato de factura
                if (orden.detalles) {
                    const detallesOrden = orden.detalles.map(detalle => ({
                        cantidad: detalle.cantidad,
                        descripcion: detalle.material_servicio,
                        precio_unitario: detalle.precio_unitario,
                        inventario_id: detalle.inventario_id
                    }));
                    setDetalles(detallesOrden);
                }
            }
        } catch (error) {
            console.error('Error al cargar detalles de la orden:', error);
        }
    };

    const loadData = async () => {
        try {
            const [facturasRes, proveedoresRes, ordenesRes] = await Promise.all([
                facturasAPI.getAll(),
                proveedoresAPI.getAll(),
                ordenesAPI.getAll()
            ]);
            setFacturas(facturasRes.data.data);
            setProveedores(proveedoresRes.data.data);
            setOrdenes(ordenesRes.data.data);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                factura: formData,
                detalles: detalles.filter(d => d.descripcion && d.cantidad > 0)
            };

            await facturasAPI.create(data);
            alert('Factura creada exitosamente');
            closeModal();
            loadData();
        } catch (error) {
            console.error('Error al guardar factura:', error);
            alert('Error al guardar factura');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta factura?')) {
            try {
                await facturasAPI.delete(id);
                alert('Factura eliminada exitosamente');
                loadData();
            } catch (error) {
                console.error('Error al eliminar factura:', error);
                alert('Error al eliminar factura');
            }
        }
    };

    const addDetalle = () => {
        setDetalles([...detalles, { cantidad: 1, descripcion: '', precio_unitario: 0 }]);
    };

    const removeDetalle = (index) => {
        setDetalles(detalles.filter((_, i) => i !== index));
    };

    const updateDetalle = (index, field, value) => {
        const newDetalles = [...detalles];
        newDetalles[index][field] = value;
        setDetalles(newDetalles);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData({
            orden_id: '',
            nombre_cliente: '',
            rfc_cliente: '',
            direccion_cliente: '',
            telefono_cliente: '',
            fecha_factura: new Date().toISOString().split('T')[0],
            fecha_vencimiento: '',
            estado: 'Completada',
            metodo_pago: '',
            notas: ''
        });
        setDetalles([{ cantidad: 1, descripcion: '', precio_unitario: 0 }]);
    };

    const filteredFacturas = filtroEstado
        ? facturas.filter(f => f.estado === filtroEstado)
        : facturas;

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="ordenes-page">
            <div className="container">
                <div className="page-header">
                    <h1>Facturas</h1>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <FaPlus /> Nueva Factura
                    </button>
                </div>

                <div className="filter-bar">
                    <FaFilter />
                    <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                        <option value="">Todos los estados</option>
                        <option value="En Proceso">En Proceso</option>
                        <option value="Completada">Completada</option>
                    </select>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>No. Factura</th>
                                <th>Cliente</th>
                                <th>Fecha</th>
                                <th>Vencimiento</th>
                                <th>Estado</th>
                                <th>Total</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFacturas.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                        No se encontraron facturas
                                    </td>
                                </tr>
                            ) : (
                                filteredFacturas.map(factura => (
                                    <tr key={factura.id}>
                                        <td><strong>{factura.numero_factura}</strong></td>
                                        <td>{factura.nombre_cliente || factura.proveedor || '-'}</td>
                                        <td>{new Date(factura.fecha_factura).toLocaleDateString('es-MX')}</td>
                                        <td>{factura.fecha_vencimiento ? new Date(factura.fecha_vencimiento).toLocaleDateString('es-MX') : '-'}</td>
                                        <td>
                                            <span className={`badge badge-${factura.estado === 'Pagada' ? 'success' :
                                                factura.estado === 'Pendiente' ? 'warning' :
                                                    factura.estado === 'Vencida' ? 'danger' : 'info'
                                                }`}>
                                                {factura.estado}
                                            </span>
                                        </td>
                                        <td><strong>${parseFloat(factura.total || 0).toFixed(2)}</strong></td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-icon btn-pdf"
                                                    onClick={() => facturasAPI.downloadPDF(factura.id)}
                                                    title="Descargar PDF"
                                                >
                                                    <FaFilePdf />
                                                </button>
                                                <button
                                                    className="btn-icon btn-delete"
                                                    onClick={() => handleDelete(factura.id)}
                                                    title="Eliminar"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Nueva Factura</h2>
                            <button className="btn-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>No. Factura (Automático)</label>
                                        <input
                                            type="text"
                                            disabled
                                            placeholder="Se generará al guardar"
                                            style={{ backgroundColor: '#f8f9fa' }}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Seleccionar Venta/Ticket *</label>
                                        <select
                                            required
                                            value={formData.orden_id}
                                            onChange={(e) => setFormData({ ...formData, orden_id: e.target.value })}
                                            autoFocus
                                        >
                                            <option value="">Seleccionar venta...</option>
                                            {ordenes
                                                .sort((a, b) => new Date(b.fecha_orden) - new Date(a.fecha_orden))
                                                .map(orden => (
                                                    <option key={orden.id} value={orden.id}>
                                                        {orden.numero_orden} - {orden.nombre_cliente || 'Sin nombre'} - ${parseFloat(orden.total || 0).toFixed(2)}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                        <small>Selecciona la venta para facturar (ordenadas por más recientes)</small>
                                    </div>

                                    <div className="input-group">
                                        <label>Cliente</label>
                                        <input
                                            type="text"
                                            disabled
                                            value={formData.nombre_cliente}
                                            style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}
                                            placeholder="Se cargará automáticamente"
                                        />
                                        <small>Cargado desde la venta</small>
                                    </div>

                                    <div className="input-group">
                                        <label>RFC del Cliente</label>
                                        <input
                                            type="text"
                                            disabled
                                            value={formData.rfc_cliente}
                                            style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}
                                            placeholder="Se cargará automáticamente"
                                        />
                                        <small>Cargado desde la venta</small>
                                    </div>

                                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                        <label>Dirección del Cliente *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.direccion_cliente}
                                            onChange={(e) => setFormData({ ...formData, direccion_cliente: e.target.value })}
                                            placeholder="Ej: Calle Principal #123, Col. Centro"
                                        />
                                        <small>Dirección completa para la factura</small>
                                    </div>

                                    <div className="input-group">
                                        <label>Teléfono del Cliente</label>
                                        <input
                                            type="text"
                                            value={formData.telefono_cliente}
                                            onChange={(e) => setFormData({ ...formData, telefono_cliente: e.target.value })}
                                            placeholder="Ej: 55 1234 5678"
                                        />
                                        <small>Teléfono de contacto</small>
                                    </div>

                                    <div className="input-group">
                                        <label>Fecha de Factura</label>
                                        <input
                                            type="date"
                                            disabled
                                            value={formData.fecha_factura}
                                            style={{ backgroundColor: '#f8f9fa' }}
                                        />
                                        <small>Fecha automática</small>
                                    </div>

                                    <div className="input-group">
                                        <label>Fecha de Vencimiento</label>
                                        <input
                                            type="date"
                                            disabled
                                            value={formData.fecha_vencimiento}
                                            style={{ backgroundColor: '#f8f9fa' }}
                                        />
                                        <small>30 días automáticos</small>
                                    </div>

                                    <div className="input-group">
                                        <label>Método de Pago</label>
                                        <input
                                            type="text"
                                            disabled
                                            value={formData.metodo_pago}
                                            style={{ backgroundColor: '#f8f9fa' }}
                                            placeholder="Se cargará automáticamente"
                                        />
                                        <small>Cargado desde la venta</small>
                                    </div>

                                    <div className="input-group">
                                        <label>Estado</label>
                                        <select
                                            value={formData.estado}
                                            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                        >
                                            <option value="En Proceso">En Proceso</option>
                                            <option value="Completada">Completada</option>
                                        </select>
                                    </div>

                                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                        <label>Notas / Observaciones</label>
                                        <textarea
                                            value={formData.notas}
                                            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                            placeholder="Notas adicionales para la factura..."
                                            rows="2"
                                        />
                                    </div>
                                </div>

                                <div className="detalles-section">
                                    <h3>📋 Productos de la Factura</h3>
                                    <p style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '15px' }}>
                                        ℹ️ Los productos se cargan automáticamente desde la venta seleccionada. No es necesario agregar productos manualmente.
                                    </p>

                                    {detalles.map((detalle, index) => (
                                        <div key={index} className="detalle-row">
                                            <input
                                                type="number"
                                                placeholder="Cant."
                                                min="1"
                                                value={detalle.cantidad}
                                                onChange={(e) => updateDetalle(index, 'cantidad', parseInt(e.target.value) || 0)}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Descripción"
                                                value={detalle.descripcion}
                                                onChange={(e) => updateDetalle(index, 'descripcion', e.target.value)}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Precio"
                                                step="0.01"
                                                min="0"
                                                value={detalle.precio_unitario}
                                                onChange={(e) => updateDetalle(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                                            />
                                            <span className="detalle-total">
                                                ${(detalle.cantidad * detalle.precio_unitario).toFixed(2)}
                                            </span>
                                            {detalles.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn-icon btn-delete"
                                                    onClick={() => removeDetalle(index)}
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Guardar Factura
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Facturas;
