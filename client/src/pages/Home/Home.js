import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTruck, FaFileInvoice, FaShoppingCart, FaChartLine } from 'react-icons/fa';
import { ordenesAPI, facturasAPI, proveedoresAPI } from '../../services/api';
import './Home.css';

const Home = () => {
    const [stats, setStats] = useState({
        ordenes: 0,
        facturas: 0,
        proveedores: 0,
        ordenesPendientes: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [ordenesRes, facturasRes, proveedoresRes] = await Promise.all([
                ordenesAPI.getAll(),
                facturasAPI.getAll(),
                proveedoresAPI.getAll()
            ]);

            const ordenesPendientes = ordenesRes.data.data.filter(o => o.estado === 'Pendiente').length;

            setStats({
                ordenes: ordenesRes.data.count,
                facturas: facturasRes.data.count,
                proveedores: proveedoresRes.data.count,
                ordenesPendientes
            });
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="home">
            <div className="container">
                <div className="home-header">
                    <h1>Sistema de Gestión de Compras</h1>
                    <p>Administra tus órdenes de compra, facturas y proveedores de manera eficiente</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card stat-primary">
                        <div className="stat-icon">
                            <FaShoppingCart />
                        </div>
                        <div className="stat-content">
                            <h3>{stats.ordenes}</h3>
                            <p>Órdenes de Compra</p>
                            <span className="stat-badge">{stats.ordenesPendientes} Pendientes</span>
                        </div>
                    </div>

                    <div className="stat-card stat-success">
                        <div className="stat-icon">
                            <FaFileInvoice />
                        </div>
                        <div className="stat-content">
                            <h3>{stats.facturas}</h3>
                            <p>Facturas</p>
                        </div>
                    </div>

                    <div className="stat-card stat-info">
                        <div className="stat-icon">
                            <FaTruck />
                        </div>
                        <div className="stat-content">
                            <h3>{stats.proveedores}</h3>
                            <p>Proveedores</p>
                        </div>
                    </div>

                    <div className="stat-card stat-warning">
                        <div className="stat-icon">
                            <FaChartLine />
                        </div>
                        <div className="stat-content">
                            <h3>100%</h3>
                            <p>Sistema Operativo</p>
                        </div>
                    </div>
                </div>

                <div className="quick-actions">
                    <h2>Acciones Rápidas</h2>
                    <div className="actions-grid">
                        <Link to="/ordenes" className="action-card">
                            <FaShoppingCart className="action-icon" />
                            <h3>Nueva Orden</h3>
                            <p>Crear una nueva orden de compra</p>
                        </Link>

                        <Link to="/facturas" className="action-card">
                            <FaFileInvoice className="action-icon" />
                            <h3>Nueva Factura</h3>
                            <p>Registrar una nueva factura</p>
                        </Link>

                        <Link to="/proveedores" className="action-card">
                            <FaTruck className="action-icon" />
                            <h3>Proveedores</h3>
                            <p>Gestionar proveedores</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
