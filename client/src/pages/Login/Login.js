import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';
import './Login.css';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                navigate('/');
            } else {
                setError(data.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Error de conexión. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-icon">
                            <FaUser />
                        </div>
                        <h1>GESTOR DE COMPRAS</h1>
                        <p>Ingrese sus credenciales</p>
                    </div>

                    {error && (
                        <div className="error-message-login">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="input-group-login">
                            <label>
                                <FaUser className="input-icon" />
                                Usuario
                            </label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                placeholder="Ingrese su usuario"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="input-group-login">
                            <label>
                                <FaLock className="input-icon" />
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Ingrese su contraseña"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-login" disabled={loading}>
                            <FaSignInAlt />
                            {loading ? 'Ingresando...' : 'INGRESAR AL SISTEMA'}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>Credenciales de prueba:</p>
                        <p><strong>Usuario:</strong> admin | <strong>Contraseña:</strong> admin123</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
