import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaDownload, FaFilter, FaFileUpload, FaEye, FaEdit } from 'react-icons/fa';
import { facturasAPI } from '../../services/api';
import '../Ordenes/Ordenes.css';
import './Facturas.css';

const Facturas = () => {
    const [facturas, setFacturas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [formData, setFormData] = useState({
        nombre_documento: '',
        proveedor: '',
        numero_factura: '',
        fecha_factura: new Date().toISOString().split('T')[0],
        monto: '',
        notas: '',
        estado: 'En Proceso'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await facturasAPI.getAll();
            setFacturas(res.data.data || []);
        } catch (error) {
            console.error('Error al cargar facturas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            // Crear preview para imágenes
            if (file.type.startsWith('image/')) {
                setPreviewUrl(URL.createObjectURL(file));
            } else {
                setPreviewUrl(null);
            }
            // Auto-llenar nombre del documento
            if (!formData.nombre_documento) {
                setFormData(prev => ({ ...prev, nombre_documento: file.name }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = new FormData();

            // Agregar datos del formulario
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key]);
            });

            // Agregar archivo si existe
            if (selectedFile) {
                submitData.append('archivo', selectedFile);
            }

            if (editingId) {
                await facturasAPI.update(editingId, submitData);
                alert('Factura actualizada exitosamente');
            } else {
                await facturasAPI.create(submitData);
                alert('Factura cargada exitosamente');
            }

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

    const handleEdit = (factura) => {
        setEditingId(factura.id);
        setFormData({
            nombre_documento: factura.nombre_documento || '',
            proveedor: factura.proveedor || '',
            numero_factura: factura.numero_factura || '',
            fecha_factura: factura.fecha_factura || new Date().toISOString().split('T')[0],
            monto: factura.monto || '',
            notas: factura.notas || '',
            estado: factura.estado || 'En Proceso'
        });
        setShowModal(true);
    };

    const handleDownload = async (factura) => {
        if (factura.archivo_url) {
            window.open(factura.archivo_url, '_blank');
        } else {
            alert('Esta factura no tiene archivo adjunto');
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        setFormData({
            nombre_documento: '',
            proveedor: '',
            numero_factura: '',
            fecha_factura: new Date().toISOString().split('T')[0],
            monto: '',
            notas: '',
            estado: 'En Proceso'
        });
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
                    <h1>📁 Carga de Facturas</h1>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <FaPlus /> Cargar Factura
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
                                <th>Nombre</th>
                                <th>No. Factura</th>
                                <th>Proveedor</th>
                                <th>Fecha</th>
                                <th>Monto</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFacturas.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                        No se encontraron facturas cargadas
                                    </td>
                                </tr>
                            ) : (
                                filteredFacturas.map(factura => (
                                    <tr key={factura.id}>
                                        <td><strong>{factura.nombre_documento || 'Sin nombre'}</strong></td>
                                        <td>{factura.numero_factura || '-'}</td>
                                        <td>{factura.proveedor || '-'}</td>
                                        <td>{factura.fecha_factura ? new Date(factura.fecha_factura).toLocaleDateString('es-MX') : '-'}</td>
                                        <td>{factura.monto ? `$${parseFloat(factura.monto).toFixed(2)}` : '-'}</td>
                                        <td>
                                            <span className={`badge badge-${factura.estado === 'Completada' ? 'success' : 'info'}`}>
                                                {factura.estado}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                {factura.archivo_url && (
                                                    <button
                                                        className="btn-icon btn-pdf"
                                                        onClick={() => handleDownload(factura)}
                                                        title="Ver/Descargar"
                                                    >
                                                        <FaDownload />
                                                    </button>
                                                )}
                                                <button
                                                    className="btn-icon btn-edit"
                                                    onClick={() => handleEdit(factura)}
                                                    title="Editar"
                                                >
                                                    <FaEdit />
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
                            <h2>{editingId ? '✏️ Editar Factura' : '📁 Cargar Nueva Factura'}</h2>
                            <button className="btn-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {/* Área de carga de archivo */}
                                <div className="upload-area">
                                    <input
                                        type="file"
                                        id="archivo"
                                        accept=".pdf,.jpg,.jpeg,.png,.xml"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="archivo" className="upload-label">
                                        <FaFileUpload className="upload-icon" />
                                        <span>{selectedFile ? selectedFile.name : 'Clic para seleccionar archivo (PDF, Imagen o XML)'}</span>
                                    </label>
                                    {previewUrl && (
                                        <div className="preview-container">
                                            <img src={previewUrl} alt="Preview" className="preview-image" />
                                        </div>
                                    )}
                                </div>

                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>Nombre del Documento *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.nombre_documento}
                                            onChange={(e) => setFormData({ ...formData, nombre_documento: e.target.value })}
                                            placeholder="Ej: Factura proveedor ABC"
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Número de Factura</label>
                                        <input
                                            type="text"
                                            value={formData.numero_factura}
                                            onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
                                            placeholder="Ej: F-2024-001"
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Proveedor</label>
                                        <input
                                            type="text"
                                            value={formData.proveedor}
                                            onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                                            placeholder="Nombre del proveedor"
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Fecha de Factura</label>
                                        <input
                                            type="date"
                                            value={formData.fecha_factura}
                                            onChange={(e) => setFormData({ ...formData, fecha_factura: e.target.value })}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Monto</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.monto}
                                            onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                                            placeholder="0.00"
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
                                        <label>Notas / Observaciones</label>
                                        <textarea
                                            value={formData.notas}
                                            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                            placeholder="Notas adicionales sobre la factura..."
                                            rows="2"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? '💾 Actualizar' : '📤 Cargar Factura'}
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
