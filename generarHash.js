const bcrypt = require('bcryptjs');

async function generar() {
    const hashAdmin = await bcrypt.hash('admin123', 10);
    const hashUser = await bcrypt.hash('usuario123', 10);

    console.log(`UPDATE usuarios SET password_hash = '${hashAdmin}' WHERE username = 'admin';`);
    console.log(`UPDATE usuarios SET password_hash = '${hashUser}' WHERE username = 'usuario';`);
}

generar();
