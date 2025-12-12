import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBoxes, FaExclamationTriangle } from 'react-icons/fa';
import { inventarioAPI } from '../../services/api';
import './Inventario.css';

const Inventario = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [buscar, setBuscar] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('');

    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        categoria: '',
        precio_unitario: 0,
        stock_actual: 0,
        stock_minimo: 0,
        unidad_medida: 'PZA',
        activo: true
    });

    const categorias = ['Filtros', 'Frenos', 'Lubricantes', 'Motor', 'Llantas', 'Suspensión', 'Eléctrico', 'Accesorios'];
    const unidades = ['PZA', 'JGO', 'LT', 'KG', 'MT', 'PAR'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const params = {};
            if (buscar) params.buscar = buscar;
            if (categoriaFiltro) params.categoria = categoriaFiltro;

            const res = await inventarioAPI.getAll(params);
            setItems(res.data.data);
        } catch (error) {
            console.error('Error al cargar inventario:', error);
            alert('Error al cargar inventario');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!loading) loadData();
        }, 500);
        return () => clearTimeout(timer);
    }, [buscar, categoriaFiltro]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await inventarioAPI.update(editingItem.id, formData);
                alert('Item actualizado exitosamente');
            } else {
                await inventarioAPI.create(formData);
                alert('Item creado exitosamente');
            }
            closeModal();
            loadData();
        } catch (error) {
            console.error('Error al guardar item:', error);
            alert('Error al guardar item');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData(item);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este item?')) {
            try {
                await inventarioAPI.delete(id);
                alert('Item eliminado exitosamente');
                loadData();
            } catch (error) {
                console.error('Error al eliminar item:', error);
                alert('Error al eliminar item');
            }
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormData({
            codigo: '',
            nombre: '',
            descripcion: '',
            categoria: '',
            precio_unitario: 0,
            stock_actual: 0,
            stock_minimo: 0,
            unidad_medida: 'PZA',
            activo: true
        });
    };

    const getStockStatus = (item) => {
        if (item.stock_actual === 0) return 'sin-stock';
        if (item.stock_actual <= item.stock_minimo) return 'stock-bajo';
        return 'stock-ok';
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="inventario-page">
            <div className="container">
                <div className="page-header">
                    <h1><FaBoxes /> Inventario</h1>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <FaPlus /> Nuevo Item
                    </button>
                </div>

                {/* Filtros */}
                <div className="filtros-inventario">
                    <div className="search-box">
                        <FaSearch />
                        <input
                            type="text"
                            placeholder="Buscar por código, nombre o descripción..."
                            value={buscar}
                            onChange={(e) => setBuscar(e.target.value)}
                        />
                    </div>
                    <select
                        value={categoriaFiltro}
                        onChange={(e) => setCategoriaFiltro(e.target.value)}
                        className="categoria-filter"
                    >
                        <option value="">Todas las categorías</option>
                        {categorias.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Estadísticas */}
                <div className="stats-inventario">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <FaBoxes />
                        </div>
                        <div className="stat-info">
                            <h3>{items.length}</h3>
                            <p>Total Items</p>
                        </div>
                    </div>
                    <div className="stat-card warning">
                        <div className="stat-icon">
                            <FaExclamationTriangle />
                        </div>
                        <div className="stat-info">
                            <h3>{items.filter(i => i.stock_actual <= i.stock_minimo).length}</h3>
                            <p>Stock Bajo</p>
                        </div>
                    </div>
                    <div className="stat-card success">
                        <div className="stat-icon">
                            <FaBoxes />
                        </div>
                        <div className="stat-info">
                            <h3>{items.reduce((sum, i) => sum + i.stock_actual, 0)}</h3>
                            <p>Unidades Totales</p>
                        </div>
                    </div>
                </div>

                {/* Tabla */}
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Categoría</th>
                                <th>Precio</th>
                                <th>Stock</th>
                                <th>Unidad</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                                        No se encontraron items
                                    </td>
                                </tr>
                            ) : (
                                items.map(item => (
                                    <tr key={item.id} className={getStockStatus(item)}>
                                        <td><strong>{item.codigo}</strong></td>
                                        <td>{item.nombre}</td>
                                        <td>
                                            <span className="categoria-badge">{item.categoria}</span>
                                        </td>
                                        <td><strong>${parseFloat(item.precio_unitario).toFixed(2)}</strong></td>
                                        <td>
                                            <div className="stock-info">
                                                <span className="stock-actual">{item.stock_actual}</span>
                                                <span className="stock-minimo">/ {item.stock_minimo}</span>
                                            </div>
                                        </td>
                                        <td>{item.unidad_medida}</td>
                                        <td>
                                            {item.activo ? (
                                                <span className="badge badge-success">Activo</span>
                                            ) : (
                                                <span className="badge badge-danger">Inactivo</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-icon btn-edit"
                                                    onClick={() => handleEdit(item)}
                                                    title="Editar"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    className="btn-icon btn-delete"
                                                    onClick={() => handleDelete(item.id)}
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

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingItem ? 'Editar Item' : 'Nuevo Item'}</h2>
                            <button className="btn-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>Código *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.codigo}
                                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                                            placeholder="Ej: FILT-001"
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Nombre *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Categoría *</label>
                                        <select
                                            required
                                            value={formData.categoria}
                                            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {categorias.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label>Precio Unitario *</label>
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            min="0"
                                            value={formData.precio_unitario}
                                            onChange={(e) => setFormData({ ...formData, precio_unitario: parseFloat(e.target.value) })}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Stock Actual *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.stock_actual}
                                            onChange={(e) => setFormData({ ...formData, stock_actual: parseInt(e.target.value) })}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Stock Mínimo *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.stock_minimo}
                                            onChange={(e) => setFormData({ ...formData, stock_minimo: parseInt(e.target.value) })}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Unidad de Medida *</label>
                                        <select
                                            required
                                            value={formData.unidad_medida}
                                            onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                                        >
                                            {unidades.map(unidad => (
                                                <option key={unidad} value={unidad}>{unidad}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label>Estado</label>
                                        <select
                                            value={formData.activo}
                                            onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'true' })}
                                        >
                                            <option value="true">Activo</option>
                                            <option value="false">Inactivo</option>
                                        </select>
                                    </div>

                                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                        <label>Descripción</label>
                                        <textarea
                                            rows="3"
                                            value={formData.descripcion}
                                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                            placeholder="Descripción detallada del producto..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingItem ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventario;
