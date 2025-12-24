import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaFilePdf, FaFilter } from 'react-icons/fa';
import { ordenesAPI, proveedoresAPI } from '../../services/api';
import InventarioSelector from '../../components/InventarioSelector/InventarioSelector';
import './Ordenes.css';

const Ordenes = () => {
    const [ordenes, setOrdenes] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingOrden, setEditingOrden] = useState(null);
    const [filtroEstado, setFiltroEstado] = useState('');

    const [formData, setFormData] = useState({
        nombre_cliente: '',
        rfc_cliente: '',
        fecha_orden: new Date().toISOString().split('T')[0],
        metodo_pago: 'Efectivo',
        requiere_factura: false,
        estado: 'Completada',
        notas: ''
    });

    const [detalles, setDetalles] = useState([
        { cantidad: 1, material_servicio: '', precio_unitario: 0 }
    ]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [ordenesRes, proveedoresRes] = await Promise.all([
                ordenesAPI.getAll(),
                proveedoresAPI.getAll()
            ]);
            setOrdenes(ordenesRes.data.data);
            setProveedores(proveedoresRes.data.data);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const detallesFiltrados = detalles.filter(d => d.material_servicio && d.cantidad > 0);

            // Debug: verificar que inventario_id existe
            console.log('📦 Detalles a enviar:', detallesFiltrados);
            console.log('📦 Inventario IDs:', detallesFiltrados.map(d => d.inventario_id));

            const data = {
                orden: formData,
                detalles: detallesFiltrados
            };

            if (editingOrden) {
                await ordenesAPI.update(editingOrden.id, formData);
                alert('Orden actualizada exitosamente');
            } else {
                await ordenesAPI.create(data);
                alert('Orden creada exitosamente');
            }
            closeModal();
            loadData();
        } catch (error) {
            console.error('Error al guardar orden:', error);
            alert('Error al guardar orden');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta orden?')) {
            try {
                await ordenesAPI.delete(id);
                alert('Orden eliminada exitosamente');
                loadData();
            } catch (error) {
                console.error('Error al eliminar orden:', error);
                alert('Error al eliminar orden');
            }
        }
    };

    const addDetalle = () => {
        setDetalles([...detalles, { cantidad: 1, material_servicio: '', precio_unitario: 0 }]);
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
        setEditingOrden(null);
        setFormData({
            nombre_cliente: '',
            rfc_cliente: '',
            fecha_orden: new Date().toISOString().split('T')[0],
            metodo_pago: 'Efectivo',
            requiere_factura: false,
            estado: 'Completada',
            notas: ''
        });
        setDetalles([{ cantidad: 1, material_servicio: '', precio_unitario: 0 }]);
    };

    const filteredOrdenes = filtroEstado
        ? ordenes.filter(o => o.estado === filtroEstado)
        : ordenes;

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="ordenes-page">
            <div className="container">
                <div className="page-header">
                    <h1>💰 Ventas / Tickets</h1>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <FaPlus /> Nueva Venta
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
                                <th>No. Orden</th>
                                <th>Cliente</th>
                                <th>Fecha</th>
                                <th>Entrega</th>
                                <th>Estado</th>
                                <th>Total</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrdenes.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                        No se encontraron órdenes
                                    </td>
                                </tr>
                            ) : (
                                filteredOrdenes.map(orden => (
                                    <tr key={orden.id}>
                                        <td><strong>{orden.numero_orden}</strong></td>
                                        <td>{orden.nombre_cliente || orden.proveedor || '-'}</td>
                                        <td>{new Date(orden.fecha_orden).toLocaleDateString('es-MX')}</td>
                                        <td>{orden.fecha_entrega ? new Date(orden.fecha_entrega).toLocaleDateString('es-MX') : '-'}</td>
                                        <td>
                                            <span className={`badge badge-${orden.estado === 'Completada' ? 'success' :
                                                orden.estado === 'Pendiente' ? 'warning' :
                                                    orden.estado === 'En Proceso' ? 'info' :
                                                        'danger'
                                                }`}>
                                                {orden.estado}
                                            </span>
                                        </td>
                                        <td><strong>${parseFloat(orden.total || 0).toFixed(2)}</strong></td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-icon btn-pdf"
                                                    onClick={() => ordenesAPI.downloadPDF(orden.id)}
                                                    title="Descargar PDF"
                                                >
                                                    <FaFilePdf />
                                                </button>
                                                <button
                                                    className="btn-icon btn-delete"
                                                    onClick={() => handleDelete(orden.id)}
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
                            <h2>💰 Nueva Venta / Ticket</h2>
                            <button className="btn-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>No. Ticket (Automático)</label>
                                        <input
                                            type="text"
                                            disabled
                                            placeholder="Se generará al guardar"
                                            style={{ backgroundColor: '#1A1A1A', color: '#6B7280' }}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Fecha</label>
                                        <input
                                            type="date"
                                            disabled
                                            value={formData.fecha_orden}
                                            style={{ backgroundColor: '#1A1A1A', fontWeight: 'bold', color: '#6B7280' }}
                                        />
                                        <small>Fecha automática</small>
                                    </div>

                                    <div className="input-group">
                                        <label>Nombre del Cliente *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.nombre_cliente}
                                            onChange={(e) => setFormData({ ...formData, nombre_cliente: e.target.value })}
                                            placeholder="Ej: Juan Pérez"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>RFC (Opcional)</label>
                                        <input
                                            type="text"
                                            value={formData.rfc_cliente}
                                            onChange={(e) => setFormData({ ...formData, rfc_cliente: e.target.value.toUpperCase() })}
                                            placeholder="Solo si requiere factura"
                                            maxLength="13"
                                        />
                                        <small>Dejar vacío si no requiere factura</small>
                                    </div>

                                    <div className="input-group">
                                        <label>Método de Pago *</label>
                                        <select
                                            required
                                            value={formData.metodo_pago}
                                            onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                                        >
                                            <option value="Efectivo">💵 Efectivo</option>
                                            <option value="Tarjeta">💳 Tarjeta</option>
                                            <option value="Transferencia">🏦 Transferencia</option>
                                            <option value="Cheque">📝 Cheque</option>
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.requiere_factura}
                                                onChange={(e) => setFormData({ ...formData, requiere_factura: e.target.checked })}
                                                style={{ marginRight: '8px' }}
                                            />
                                            ¿Requiere Factura?
                                        </label>
                                        <small>Marca si el cliente necesita factura</small>
                                    </div>

                                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                        <label>Notas / Observaciones</label>
                                        <textarea
                                            value={formData.notas}
                                            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                            placeholder="Notas adicionales sobre la venta..."
                                            rows="2"
                                        />
                                    </div>
                                </div>

                                <div className="detalles-section">
                                    {/* Sección de Detalles con Selector de Inventario */}
                                    <h3>🛒 Productos de la Venta</h3>

                                    <InventarioSelector
                                        onSelect={(item) => {
                                            // El InventarioSelector ya envía el objeto completo con material_servicio
                                            setDetalles([...detalles, item]);
                                        }}
                                    />

                                    <div className="detalles-header">
                                        <button type="button" className="btn btn-secondary" onClick={addDetalle}>
                                            <FaPlus /> Agregar Ítem Manual
                                        </button>
                                    </div>

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
                                                placeholder="Material/Servicio"
                                                value={detalle.material_servicio}
                                                onChange={(e) => updateDetalle(index, 'material_servicio', e.target.value)}
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
                                    💾 Guardar Venta
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ordenes;
