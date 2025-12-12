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
        proveedor_id: '',
        fecha_orden: new Date().toISOString().split('T')[0],
        fecha_entrega: '',
        estado: 'En Proceso',
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
            const data = {
                orden: formData,
                detalles: detalles.filter(d => d.material_servicio && d.cantidad > 0)
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
            numero_orden: '',
            proveedor_id: '',
            fecha_orden: new Date().toISOString().split('T')[0],
            fecha_entrega: '',
            estado: 'Pendiente',
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
                    <h1>Órdenes de Compra</h1>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <FaPlus /> Nueva Orden
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
                                <th>Proveedor</th>
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
                                        <td>{orden.proveedor}</td>
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
                            <h2>Nueva Orden de Compra</h2>
                            <button className="btn-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>No. Orden (Automático)</label>
                                        <input
                                            type="text"
                                            disabled
                                            placeholder="Se generará al guardar"
                                            style={{ backgroundColor: '#f8f9fa' }}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Proveedor *</label>
                                        <select
                                            required
                                            value={formData.proveedor_id}
                                            onChange={(e) => setFormData({ ...formData, proveedor_id: e.target.value })}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {proveedores.map(p => (
                                                <option key={p.id} value={p.id}>{p.nombre_social}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label>Fecha de Orden *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.fecha_orden}
                                            onChange={(e) => setFormData({ ...formData, fecha_orden: e.target.value })}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Fecha de Entrega</label>
                                        <input
                                            type="date"
                                            value={formData.fecha_entrega}
                                            onChange={(e) => setFormData({ ...formData, fecha_entrega: e.target.value })}
                                        />
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
                                        <label>Notas</label>
                                        <textarea
                                            value={formData.notas}
                                            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="detalles-section">
                                    {/* Sección de Detalles con Selector de Inventario */}
                                    <h3>Detalles de la Orden</h3>

                                    <InventarioSelector
                                        onSelect={(item) => {
                                            setDetalles([...detalles, {
                                                cantidad: 1,
                                                material_servicio: item.nombre,
                                                precio_unitario: item.precio_unitario,
                                                inventario_id: item.id,
                                                codigo: item.codigo
                                            }]);
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
                                    Guardar Orden
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
