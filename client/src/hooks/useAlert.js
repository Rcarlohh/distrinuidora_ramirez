import { useState, useCallback } from 'react';

export const useAlert = () => {
    const [alerts, setAlerts] = useState([]);

    const showAlert = useCallback((type, message) => {
        const id = Date.now();
        const newAlert = { id, type, message };

        setAlerts(prev => [...prev, newAlert]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            setAlerts(prev => prev.filter(alert => alert.id !== id));
        }, 5000);
    }, []);

    const success = useCallback((message) => {
        showAlert('success', message);
    }, [showAlert]);

    const error = useCallback((message) => {
        showAlert('error', message);
    }, [showAlert]);

    const warning = useCallback((message) => {
        showAlert('warning', message);
    }, [showAlert]);

    const info = useCallback((message) => {
        showAlert('info', message);
    }, [showAlert]);

    const removeAlert = useCallback((id) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, []);

    return {
        alerts,
        success,
        error,
        warning,
        info,
        removeAlert
    };
};
