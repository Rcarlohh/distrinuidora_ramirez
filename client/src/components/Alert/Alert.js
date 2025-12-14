import React from 'react';
import './Alert.css';

const Alert = ({ type = 'info', message, onClose, autoClose = true }) => {
    React.useEffect(() => {
        if (autoClose && onClose) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [autoClose, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            case 'info':
            default:
                return 'ℹ️';
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'success':
                return '¡Éxito!';
            case 'error':
                return 'Error';
            case 'warning':
                return 'Advertencia';
            case 'info':
            default:
                return 'Información';
        }
    };

    return (
        <div className={`alert-modern alert-${type}`}>
            <div className="alert-icon">{getIcon()}</div>
            <div className="alert-content">
                <div className="alert-title">{getTitle()}</div>
                <div className="alert-message">{message}</div>
            </div>
            {onClose && (
                <button className="alert-close" onClick={onClose}>
                    ×
                </button>
            )}
        </div>
    );
};

export default Alert;
