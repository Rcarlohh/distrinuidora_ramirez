import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { proveedoresAPI } from '../../services/api';
import './Proveedores.css';

const Proveedores = () => {
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProveedor, setEditingProveedor] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        nombre_social: '',
        rfc: '',
        tipo_cliente: '',
        direccion: '',
        contacto: '',
        telefono: '',
        email: ''
    });

    useEffect(() => {
        loadProveedores();
    }, []);

    const loadProveedores = async () => {
        try {
            const response = await proveedoresAPI.getAll();
            setProveedores(response.data.data);
        } catch (error) {
            console.error('Error al cargar proveedores:', error);
            alert('Error al cargar proveedores');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProveedor) {
                await proveedoresAPI.update(editingProveedor.id, formData);
                alert('Proveedor actualizado exitosamente');
            } else {
                await proveedoresAPI.create(formData);
                alert('Proveedor creado exitosamente');
            }
            closeModal();
            loadProveedores();
        } catch (error) {
            console.error('Error al guardar proveedor:', error);
            alert('Error al guardar proveedor');
        }
    };

    const handleEdit = (proveedor) => {
        setEditingProveedor(proveedor);
        setFormData(proveedor);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este proveedor?')) {
            try {
                await proveedoresAPI.delete(id);
                alert('Proveedor eliminado exitosamente');
                loadProveedores();
            } catch (error) {
                console.error('Error al eliminar proveedor:', error);
                alert('Error al eliminar proveedor');
            }
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProveedor(null);
        setFormData({
            nombre_social: '',
            rfc: '',
            tipo_cliente: '',
            direccion: '',
            contacto: '',
            telefono: '',
            email: ''
        });
    };

    const filteredProveedores = proveedores.filter(p =>
        p.nombre_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.rfc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contacto?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="proveedores-page">
            <div className="container">
                <div className="page-header">
                    <h1>Proveedores</h1>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <FaPlus /> Nuevo Proveedor
                    </button>
                </div>

                <div className="search-bar">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, RFC o contacto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre Social</th>
                                <th>RFC</th>
                                <th>Tipo</th>
                                <th>Contacto</th>
                                <th>Teléfono</th>
                                <th>Email</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProveedores.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                        No se encontraron proveedores
                                    </td>
                                </tr>
                            ) : (
                                filteredProveedores.map(proveedor => (
                                    <tr key={proveedor.id}>
                                        <td><strong>{proveedor.nombre_social}</strong></td>
                                        <td>{proveedor.rfc}</td>
                                        <td>{proveedor.tipo_cliente}</td>
                                        <td>{proveedor.contacto}</td>
                                        <td>{proveedor.telefono}</td>
                                        <td>{proveedor.email}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-icon btn-edit"
                                                    onClick={() => handleEdit(proveedor)}
                                                    title="Editar"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    className="btn-icon btn-delete"
                                                    onClick={() => handleDelete(proveedor.id)}
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
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
                            <button className="btn-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>Nombre Social *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.nombre_social}
                                            onChange={(e) => setFormData({ ...formData, nombre_social: e.target.value })}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>RFC</label>
                                        <input
                                            type="text"
                                            value={formData.rfc}
                                            onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Tipo de Cliente</label>
                                        <input
                                            type="text"
                                            value={formData.tipo_cliente}
                                            onChange={(e) => setFormData({ ...formData, tipo_cliente: e.target.value })}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Contacto</label>
                                        <input
                                            type="text"
                                            value={formData.contacto}
                                            onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Teléfono</label>
                                        <input
                                            type="tel"
                                            value={formData.telefono}
                                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>

                                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                        <label>Dirección</label>
                                        <textarea
                                            value={formData.direccion}
                                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingProveedor ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Proveedores;
