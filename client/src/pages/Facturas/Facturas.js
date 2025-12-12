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
        proveedor_id: '',
        orden_id: '',
        fecha_factura: new Date().toISOString().split('T')[0],
        fecha_vencimiento: '',
        estado: 'En Proceso',
        metodo_pago: '',
        notas: ''
    });

    const [detalles, setDetalles] = useState([
        { cantidad: 1, descripcion: '', precio_unitario: 0 }
    ]);

    useEffect(() => {
        loadData();
    }, []);

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
            numero_factura: '',
            proveedor_id: '',
            orden_id: '',
            fecha_factura: new Date().toISOString().split('T')[0],
            fecha_vencimiento: '',
            estado: 'Pendiente',
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
                                <th>Proveedor</th>
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
                                        <td>{factura.proveedor}</td>
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
                                        <label>Orden de Compra</label>
                                        <select
                                            value={formData.orden_id}
                                            onChange={(e) => setFormData({ ...formData, orden_id: e.target.value })}
                                        >
                                            <option value="">Ninguna</option>
                                            {ordenes.map(o => (
                                                <option key={o.id} value={o.id}>{o.numero_orden}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label>Fecha de Factura *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.fecha_factura}
                                            onChange={(e) => setFormData({ ...formData, fecha_factura: e.target.value })}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Fecha de Vencimiento</label>
                                        <input
                                            type="date"
                                            value={formData.fecha_vencimiento}
                                            onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
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

                                    <div className="input-group">
                                        <label>Método de Pago</label>
                                        <input
                                            type="text"
                                            value={formData.metodo_pago}
                                            onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                                            placeholder="Ej: Transferencia, Efectivo..."
                                        />
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
                                    <h3>Detalles de la Factura</h3>

                                    <InventarioSelector
                                        onSelect={(item) => {
                                            setDetalles([...detalles, {
                                                cantidad: 1,
                                                descripcion: item.nombre,
                                                precio_unitario: item.precio_unitario,
                                                inventario_id: item.id
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
