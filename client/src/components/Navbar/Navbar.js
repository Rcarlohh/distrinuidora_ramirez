import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaTruck, FaFileInvoice, FaUsers, FaTools, FaBoxes } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <img src="/img/logo.png" alt="Refaccionaria Ramírez" />
                    <span>REFACCIONARIA RAMÍREZ</span>
                </Link>

                <ul className="navbar-menu">
                    <li className="navbar-item">
                        <Link to="/" className={`navbar-link ${isActive('/')}`}>
                            <FaHome />
                            <span>Inicio</span>
                        </Link>
                    </li>
                    <li className="navbar-item">
                        <Link to="/proveedores" className={`navbar-link ${isActive('/proveedores')}`}>
                            <FaTruck />
                            <span>Proveedores</span>
                        </Link>
                    </li>
                    <li className="navbar-item">
                        <Link to="/ordenes" className={`navbar-link ${isActive('/ordenes')}`}>
                            <FaUsers />
                            <span>Órdenes de Compra</span>
                        </Link>
                    </li>
                    <li className="navbar-item">
                        <Link to="/facturas" className={`navbar-link ${isActive('/facturas')}`}>
                            <FaFileInvoice />
                            <span>Facturas</span>
                        </Link>
                    </li>
                    <li className="navbar-item">
                        <Link to="/ordenes-trabajo" className={`navbar-link ${isActive('/ordenes-trabajo')}`}>
                            <FaTools />
                            <span>Órdenes de Trabajo</span>
                        </Link>
                    </li>
                    <li className="navbar-item">
                        <Link to="/inventario" className={`navbar-link ${isActive('/inventario')}`}>
                            <FaBoxes />
                            <span>Inventario</span>
                        </Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
