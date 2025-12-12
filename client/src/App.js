import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login/Login';
import Home from './pages/Home/Home';
import Proveedores from './pages/Proveedores/Proveedores';
import Ordenes from './pages/Ordenes/Ordenes';
import Facturas from './pages/Facturas/Facturas';
import OrdenesTrabajo from './pages/OrdenesTrabajo/OrdenesTrabajo';
import Inventario from './pages/Inventario/Inventario';
import './index.css';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/*" element={
                        <ProtectedRoute>
                            <Navbar />
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/proveedores" element={<Proveedores />} />
                                <Route path="/ordenes" element={<Ordenes />} />
                                <Route path="/facturas" element={<Facturas />} />
                                <Route path="/ordenes-trabajo" element={<OrdenesTrabajo />} />
                                <Route path="/inventario" element={<Inventario />} />
                            </Routes>
                        </ProtectedRoute>
                    } />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
