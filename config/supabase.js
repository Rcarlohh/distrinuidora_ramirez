const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan las credenciales de Supabase en las variables de entorno');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    },
    db: {
        schema: 'public'
    },
    global: {
        headers: {
            'x-application-name': 'gestor-compras'
        }
    }
});

module.exports = supabase;
