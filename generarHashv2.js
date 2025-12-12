const bcrypt = require('bcryptjs');
const fs = require('fs');

async function generar() {
    const hashAdmin = await bcrypt.hash('admin123', 10);
    const hashUser = await bcrypt.hash('usuario123', 10);

    const content = `UPDATE usuarios SET password_hash = '${hashAdmin}' WHERE username = 'admin';\nUPDATE usuarios SET password_hash = '${hashUser}' WHERE username = 'usuario';`;

    fs.writeFileSync('FIX_PASSWORDS_UTF8.sql', content, 'utf8');
    console.log('Archivo creado.');
}

generar();
