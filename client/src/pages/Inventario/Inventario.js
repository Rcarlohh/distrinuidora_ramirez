import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBoxes, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import { inventarioAPI } from '../../services/api';
import { useAlert } from '../../hooks/useAlert';
import Alert from '../../components/Alert/Alert';
import './Inventario.css';

const Inventario = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [buscar, setBuscar] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('');
    const { alerts, success, error, warning, removeAlert } = useAlert();

    const [formData, setFormData] = useState({
        codigo: '',
        numero_parte: '',
        nombre: '',
        descripcion: '',
        categoria: '',
        marca: '',
        modelo_aplicacion: '',
        especificacion: '',
        precio_unitario: 0,
        stock_actual: 0,
        stock_minimo: 0,
        unidad_medida: 'PZA',
        clave_producto_sat: '25172500',
        clave_unidad_sat: 'H87',
        objeto_impuesto: '02',
        tasa_iva: 0.16,
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
        } catch (err) {
            console.error('Error al cargar inventario:', err);
            error('No se pudo cargar el inventario');
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
                success('✅ Producto actualizado correctamente');
            } else {
                await inventarioAPI.create(formData);
                success('✅ Producto creado correctamente');
            }
            closeModal();
            loadData();
        } catch (err) {
            console.error('Error al guardar item:', err);
            error('❌ No se pudo guardar el producto');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData(item);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este producto?')) {
            try {
                await inventarioAPI.delete(id);
                success('🗑️ Producto eliminado correctamente');
                loadData();
            } catch (err) {
                console.error('Error al eliminar item:', err);
                error('❌ No se pudo eliminar el producto');
            }
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormData({
            codigo: '',
            numero_parte: '',
            nombre: '',
            descripcion: '',
            categoria: '',
            marca: '',
            modelo_aplicacion: '',
            especificacion: '',
            precio_unitario: 0,
            stock_actual: 0,
            stock_minimo: 0,
            unidad_medida: 'PZA',
            clave_producto_sat: '25172500',
            clave_unidad_sat: 'H87',
            objeto_impuesto: '02',
            tasa_iva: 0.16,
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
            {/* Contenedor de Alertas */}
            <div className="alerts-container">
                {alerts.map(alert => (
                    <Alert
                        key={alert.id}
                        type={alert.type}
                        message={alert.message}
                        onClose={() => removeAlert(alert.id)}
                    />
                ))}
            </div>

            <div className="container">
                <div className="page-header">
                    <h1><FaBoxes /> Inventario</h1>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={loadData}
                            title="Actualizar inventario"
                        >
                            <FaSync /> Actualizar
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <FaPlus /> Nuevo Producto
                        </button>
                    </div>
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
                                            <strong className="stock-numero">{item.stock_actual}</strong>
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
                    <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingItem ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <button className="btn-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {/* Sección 1: Identificación */}
                                <div className="form-section">
                                    <h3 className="section-title">📋 Identificación del Producto</h3>
                                    <div className="form-grid-compact">
                                        <div className="input-group">
                                            <label>Código Interno (SKU) *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.codigo}
                                                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                                                placeholder="Ej: FIL-JET-01"
                                            />
                                            <small>Tu código para inventario</small>
                                        </div>

                                        <div className="input-group">
                                            <label>Número de Parte (Fabricante)</label>
                                            <input
                                                type="text"
                                                value={formData.numero_parte}
                                                onChange={(e) => setFormData({ ...formData, numero_parte: e.target.value.toUpperCase() })}
                                                placeholder="Ej: PH3593A"
                                            />
                                            <small>Código del fabricante</small>
                                        </div>

                                        <div className="input-group">
                                            <label>Marca</label>
                                            <input
                                                type="text"
                                                value={formData.marca}
                                                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                                                placeholder="Ej: FRAM, KYB, Mobil"
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
                                    </div>

                                    <div className="input-group">
                                        <label>Nombre del Producto *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            placeholder="Ej: Amortiguador Delantero KYB"
                                        />
                                        <small>Nombre claro y descriptivo</small>
                                    </div>

                                    <div className="input-group">
                                        <label>Modelo/Aplicación</label>
                                        <input
                                            type="text"
                                            value={formData.modelo_aplicacion}
                                            onChange={(e) => setFormData({ ...formData, modelo_aplicacion: e.target.value })}
                                            placeholder="Ej: Nissan Versa 2015-2019"
                                        />
                                        <small>Vehículo o equipo al que aplica</small>
                                    </div>

                                    <div className="input-group">
                                        <label>Descripción Completa</label>
                                        <textarea
                                            rows="2"
                                            value={formData.descripcion}
                                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                            placeholder="Descripción detallada del producto..."
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Especificaciones Técnicas</label>
                                        <textarea
                                            rows="2"
                                            value={formData.especificacion}
                                            onChange={(e) => setFormData({ ...formData, especificacion: e.target.value })}
                                            placeholder="Ej: Gas, montaje delantero, incluye kit de montaje"
                                        />
                                    </div>
                                </div>

                                {/* Sección 2: Clasificación SAT */}
                                <div className="form-section">
                                    <h3 className="section-title">🏛️ Clasificación SAT (Obligatorio para Facturación)</h3>
                                    <div className="form-grid-compact">
                                        <div className="input-group">
                                            <label>Clave Producto SAT *</label>
                                            <select
                                                required
                                                value={formData.clave_producto_sat}
                                                onChange={(e) => setFormData({ ...formData, clave_producto_sat: e.target.value })}
                                            >
                                                <option value="25172500">25172500 - Repuestos para automóviles</option>
                                                <option value="15121501">15121501 - Aceite de motor</option>
                                                <option value="26111700">26111700 - Baterías y generadores</option>
                                                <option value="78181500">78181500 - Servicios de mantenimiento</option>
                                            </select>
                                            <small>Clave de 8 dígitos del SAT</small>
                                        </div>

                                        <div className="input-group">
                                            <label>Clave Unidad SAT *</label>
                                            <select
                                                required
                                                value={formData.clave_unidad_sat}
                                                onChange={(e) => setFormData({ ...formData, clave_unidad_sat: e.target.value })}
                                            >
                                                <option value="H87">H87 - Pieza</option>
                                                <option value="LTR">LTR - Litro</option>
                                                <option value="E48">E48 - Unidad de servicio</option>
                                                <option value="KGM">KGM - Kilogramo</option>
                                                <option value="MTR">MTR - Metro</option>
                                            </select>
                                        </div>

                                        <div className="input-group">
                                            <label>Objeto de Impuesto *</label>
                                            <select
                                                required
                                                value={formData.objeto_impuesto}
                                                onChange={(e) => setFormData({ ...formData, objeto_impuesto: e.target.value })}
                                            >
                                                <option value="02">02 - Sí objeto de impuesto</option>
                                                <option value="01">01 - No objeto de impuesto</option>
                                            </select>
                                        </div>

                                        <div className="input-group">
                                            <label>Tasa IVA *</label>
                                            <select
                                                required
                                                value={formData.tasa_iva}
                                                onChange={(e) => setFormData({ ...formData, tasa_iva: parseFloat(e.target.value) })}
                                            >
                                                <option value="0.16">16% - IVA General</option>
                                                <option value="0.08">8% - IVA Frontera</option>
                                                <option value="0.00">0% - Exento</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Sección 3: Precios e Inventario */}
                                <div className="form-section">
                                    <h3 className="section-title">💰 Precios e Inventario</h3>
                                    <div className="form-grid-compact">
                                        <div className="input-group">
                                            <label>Precio Unitario (Sin IVA) *</label>
                                            <input
                                                type="number"
                                                required
                                                step="0.01"
                                                min="0"
                                                value={formData.precio_unitario}
                                                onChange={(e) => setFormData({ ...formData, precio_unitario: parseFloat(e.target.value) })}
                                            />
                                            <small>Precio base sin impuestos</small>
                                        </div>

                                        <div className="input-group">
                                            <label>Precio con IVA</label>
                                            <input
                                                type="text"
                                                disabled
                                                value={`$${(formData.precio_unitario * (1 + formData.tasa_iva)).toFixed(2)}`}
                                                style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}
                                            />
                                            <small>Precio final al público</small>
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
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingItem ? 'Actualizar Producto' : 'Guardar Producto'}
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
