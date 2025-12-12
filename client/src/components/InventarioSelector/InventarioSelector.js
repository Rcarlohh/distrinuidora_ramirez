import React, { useState, useEffect } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { inventarioAPI } from '../../services/api';
import './InventarioSelector.css';

const InventarioSelector = ({ onSelect }) => {
    const [items, setItems] = useState([]);
    const [buscar, setBuscar] = useState('');
    const [mostrar, setMostrar] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (buscar.length >= 2) {
            const timer = setTimeout(() => {
                loadItems();
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setItems([]);
            setMostrar(false);
        }
    }, [buscar]);

    const loadItems = async () => {
        setLoading(true);
        try {
            const res = await inventarioAPI.getAll({ buscar, activo: true });
            setItems(res.data.data);
            setMostrar(true);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item) => {
        onSelect({
            material_servicio: item.nombre,
            precio_unitario: item.precio_unitario,
            cantidad: 1,
            inventario_id: item.id,
            stock_disponible: item.stock_actual,
            codigo: item.codigo
        });
        setBuscar('');
        setMostrar(false);
        setItems([]);
    };

    return (
        <div className="inventario-selector">
            <div className="search-inventario">
                <FaSearch />
                <input
                    type="text"
                    placeholder="🔍 Buscar en inventario (código o nombre)..."
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                    onFocus={() => buscar.length >= 2 && setMostrar(true)}
                />
                {buscar && (
                    <button
                        type="button"
                        className="btn-clear"
                        onClick={() => {
                            setBuscar('');
                            setMostrar(false);
                            setItems([]);
                        }}
                    >
                        <FaTimes />
                    </button>
                )}
            </div>

            {mostrar && (
                <div className="resultados-inventario">
                    {loading ? (
                        <div className="loading-items">Buscando...</div>
                    ) : items.length > 0 ? (
                        items.map(item => (
                            <div
                                key={item.id}
                                className="item-resultado"
                                onClick={() => handleSelect(item)}
                            >
                                <div className="item-info">
                                    <strong>{item.codigo}</strong> - {item.nombre}
                                </div>
                                <div className="item-detalles">
                                    <span className="precio">${parseFloat(item.precio_unitario).toFixed(2)}</span>
                                    <span className={`stock ${item.stock_actual <= item.stock_minimo ? 'stock-bajo' : ''}`}>
                                        Stock: {item.stock_actual} {item.unidad_medida}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-resultados">
                            No se encontraron items
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InventarioSelector;
