// Configuración de API URL
// Detecta automáticamente si estás en desarrollo o producción
// Puedes configurar REACT_APP_API_URL en .env para usar una IP específica

const getApiUrl = () => {
    // Si hay variable de entorno, úsala
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }

    // En desarrollo, usa localhost
    if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:5000/api';
    }

    // En producción, usa la misma IP del frontend
    return `${window.location.protocol}//${window.location.hostname}:5000/api`;
};

export const API_URL = getApiUrl();

export default API_URL;
