const NodeCache = require('node-cache');

// Cache con TTL de 5 minutos por defecto
const cache = new NodeCache({
    stdTTL: parseInt(process.env.CACHE_TTL) || 300,
    checkperiod: 60,
    useClones: false // Mejor rendimiento
});

// Middleware de caché
const cacheMiddleware = (duration) => {
    return (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }

        const key = `__express__${req.originalUrl || req.url}`;
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            console.log(`✓ Cache HIT: ${key}`);
            return res.json(cachedResponse);
        }

        console.log(`✗ Cache MISS: ${key}`);
        res.originalJson = res.json;
        res.json = (body) => {
            cache.set(key, body, duration || parseInt(process.env.CACHE_TTL) || 300);
            res.originalJson(body);
        };
        next();
    };
};

// Invalidar caché por patrón
const invalidateCache = (pattern) => {
    const keys = cache.keys();
    const keysToDelete = keys.filter(key => key.includes(pattern));
    keysToDelete.forEach(key => cache.del(key));
    console.log(`🗑️  Invalidated ${keysToDelete.length} cache entries matching: ${pattern}`);
};

// Limpiar todo el caché
const clearCache = () => {
    cache.flushAll();
    console.log('🗑️  Cache cleared');
};

module.exports = {
    cache,
    cacheMiddleware,
    invalidateCache,
    clearCache
};
