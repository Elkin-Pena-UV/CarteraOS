import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la base de datos SQL Server
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: false, // true para Azure
    trustServerCertificate: true, // necesario para entornos locales
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Crear un pool de conexiones
const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('✅ Conectado a SQL Server (CarteraOS)');
    return pool;
  })
  .catch(err => {
    console.error('❌ Error al conectar a la base de datos:', err);
    throw err;
  });

export { sql, poolPromise };
