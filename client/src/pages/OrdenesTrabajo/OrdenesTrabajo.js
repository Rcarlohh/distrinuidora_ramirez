import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaFilePdf, FaFilter, FaCar, FaUser, FaTools } from 'react-icons/fa';
import { ordenesTrabajoAPI } from '../../services/api';
import InventarioSelector from '../../components/InventarioSelector/InventarioSelector';
import './OrdenesTrabajo.css';

const OrdenesTrabajo = () => {
    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState('');

    const [formData, setFormData] = useState({
        // Cliente
        nombre_cliente: '',
        direccion: '',
        telefono: '',
        // Vehículo
        no_placas: '',
        modelo: '',
        marca: '',
        anio: '',
        color: '',
        kilometraje: '',
        // Servicio
        descripcion_servicio: '',
        // Personal
        encargado: '',
        ayudante: '',
        tiempo_realizar: '',
        realizo_servicio: '',
        // Entrega
        responsable_entrega: '',
        fecha_entrega: '',
        entrega_llaves: '',
        hora_entrega_unidad: '',
        recibe_unidad: '',
        // Observaciones
        observaciones: '',
        estado: 'En Proceso'
    });

    const [detalles, setDetalles] = useState([
        { cantidad: 1, material_concepto: '' }
    ]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await ordenesTrabajoAPI.getAll();
            setOrdenes(res.data.data);
        } catch (error) {
            console.error('Error al cargar órdenes de trabajo:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                orden: formData,
                detalles: detalles.filter(d => d.material_concepto && d.cantidad > 0)
            };

            await ordenesTrabajoAPI.create(data);
            alert('Orden de trabajo creada exitosamente');
            closeModal();
            loadData();
        } catch (error) {
            console.error('Error al guardar orden:', error);
            alert('Error al guardar orden de trabajo');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta orden de trabajo?')) {
            try {
                await ordenesTrabajoAPI.delete(id);
                alert('Orden eliminada exitosamente');
                loadData();
            } catch (error) {
                console.error('Error al eliminar orden:', error);
                alert('Error al eliminar orden');
            }
        }
    };

    const addDetalle = () => {
        setDetalles([...detalles, { cantidad: 1, material_concepto: '' }]);
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
            numero_orden_trabajo: '',
            nombre_cliente: '',
            direccion: '',
            telefono: '',
            no_placas: '',
            modelo: '',
            marca: '',
            anio: '',
            color: '',
            kilometraje: '',
            descripcion_servicio: '',
            encargado: '',
            ayudante: '',
            tiempo_realizar: '',
            realizo_servicio: '',
            responsable_entrega: '',
            fecha_entrega: '',
            entrega_llaves: '',
            hora_entrega_unidad: '',
            recibe_unidad: '',
            observaciones: '',
            estado: 'Pendiente'
        });
        setDetalles([{ cantidad: 1, material_concepto: '' }]);
    };

    const filteredOrdenes = filtroEstado
        ? ordenes.filter(o => o.estado === filtroEstado)
        : ordenes;

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="ordenes-trabajo-page">
            <div className="container">
                <div className="page-header">
                    <h1>Órdenes de Trabajo</h1>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <FaPlus /> Nueva Orden de Trabajo
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
                                <th>Vehículo</th>
                                <th>Placas</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrdenes.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                        No se encontraron órdenes de trabajo
                                    </td>
                                </tr>
                            ) : (
                                filteredOrdenes.map(orden => (
                                    <tr key={orden.id}>
                                        <td><strong>{orden.numero_orden_trabajo}</strong></td>
                                        <td>{orden.nombre_cliente}</td>
                                        <td>{orden.marca} {orden.modelo}</td>
                                        <td>{orden.no_placas}</td>
                                        <td>
                                            <span className={`badge badge-${orden.estado === 'Entregada' ? 'success' :
                                                orden.estado === 'Completada' ? 'success' :
                                                    orden.estado === 'Pendiente' ? 'warning' :
                                                        'info'
                                                }`}>
                                                {orden.estado}
                                            </span>
                                        </td>
                                        <td>{new Date(orden.created_at).toLocaleDateString('es-MX')}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-icon btn-pdf"
                                                    onClick={() => ordenesTrabajoAPI.downloadPDF(orden.id)}
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
                    <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Nueva Orden de Trabajo</h2>
                            <button className="btn-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {/* Número de Orden */}
                                <div className="section-header">
                                    <FaTools /> INFORMACIÓN DE LA ORDEN
                                </div>
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>No. Orden de Trabajo (Automático)</label>
                                        <input
                                            type="text"
                                            disabled
                                            placeholder="Se generará al guardar"
                                            style={{ backgroundColor: '#f8f9fa' }}
                                        />
                                    </div>
                                </div>

                                {/* Información del Cliente */}
                                <div className="section-header">
                                    <FaUser /> INFORMACIÓN DEL CLIENTE
                                </div>
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>Nombre del Cliente *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.nombre_cliente}
                                            onChange={(e) => setFormData({ ...formData, nombre_cliente: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Teléfono *</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.telefono}
                                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                        <label>Dirección *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.direccion}
                                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Información del Vehículo */}
                                <div className="section-header">
                                    <FaCar /> INFORMACIÓN DEL VEHÍCULO
                                </div>
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>No. Placas *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.no_placas}
                                            onChange={(e) => setFormData({ ...formData, no_placas: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Marca *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.marca}
                                            onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Modelo *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.modelo}
                                            onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Año *</label>
                                        <input
                                            type="text"
                                            required
                                            maxLength="4"
                                            value={formData.anio}
                                            onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Color *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Kilometraje *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.kilometraje}
                                            onChange={(e) => setFormData({ ...formData, kilometraje: e.target.value })}
                                            placeholder="Ej: 50,000 km"
                                        />
                                    </div>
                                </div>

                                {/* Descripción del Servicio */}
                                <div className="section-header">
                                    <FaTools /> DESCRIPCIÓN DEL SERVICIO
                                </div>
                                <div className="input-group">
                                    <label>Descripción del Servicio a Realizar *</label>
                                    <textarea
                                        required
                                        rows="4"
                                        value={formData.descripcion_servicio}
                                        onChange={(e) => setFormData({ ...formData, descripcion_servicio: e.target.value })}
                                        placeholder="Describa detalladamente el servicio a realizar..."
                                    />
                                </div>

                                {/* Materiales/Servicios */}
                                <div className="detalles-section">
                                    <h3>Materiales / Servicios</h3>

                                    <InventarioSelector
                                        onSelect={(item) => {
                                            setDetalles([...detalles, {
                                                cantidad: 1,
                                                material_concepto: item.nombre,
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
                                                placeholder="Cantidad"
                                                min="1"
                                                value={detalle.cantidad}
                                                onChange={(e) => updateDetalle(index, 'cantidad', parseInt(e.target.value) || 0)}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Material / Concepto"
                                                value={detalle.material_concepto}
                                                onChange={(e) => updateDetalle(index, 'material_concepto', e.target.value)}
                                                style={{ flex: 2 }}
                                            />
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

                                {/* Personal */}
                                <div className="section-header">
                                    PERSONAL Y TIEMPO
                                </div>
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>Encargado *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.encargado}
                                            onChange={(e) => setFormData({ ...formData, encargado: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Ayudante</label>
                                        <input
                                            type="text"
                                            value={formData.ayudante}
                                            onChange={(e) => setFormData({ ...formData, ayudante: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Tiempo en Realizar</label>
                                        <input
                                            type="text"
                                            value={formData.tiempo_realizar}
                                            onChange={(e) => setFormData({ ...formData, tiempo_realizar: e.target.value })}
                                            placeholder="Ej: 2 horas"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Realizó Servicio</label>
                                        <input
                                            type="text"
                                            value={formData.realizo_servicio}
                                            onChange={(e) => setFormData({ ...formData, realizo_servicio: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Entrega */}
                                <div className="section-header">
                                    INFORMACIÓN DE ENTREGA
                                </div>
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>Responsable de Entrega</label>
                                        <input
                                            type="text"
                                            value={formData.responsable_entrega}
                                            onChange={(e) => setFormData({ ...formData, responsable_entrega: e.target.value })}
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
                                        <label>Hora de Entrega</label>
                                        <input
                                            type="time"
                                            value={formData.hora_entrega_unidad}
                                            onChange={(e) => setFormData({ ...formData, hora_entrega_unidad: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Entrega de Llaves</label>
                                        <select
                                            value={formData.entrega_llaves}
                                            onChange={(e) => setFormData({ ...formData, entrega_llaves: e.target.value })}
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="Sí">Sí</option>
                                            <option value="No">No</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>Recibe Unidad</label>
                                        <input
                                            type="text"
                                            value={formData.recibe_unidad}
                                            onChange={(e) => setFormData({ ...formData, recibe_unidad: e.target.value })}
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
                                </div>

                                {/* Observaciones */}
                                <div className="input-group">
                                    <label>Observaciones</label>
                                    <textarea
                                        rows="3"
                                        value={formData.observaciones}
                                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                        placeholder="Observaciones adicionales..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Guardar Orden de Trabajo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdenesTrabajo;
