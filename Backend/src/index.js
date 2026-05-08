import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import carteraRoutes from './routes/carteraRoutes.js';
import facturasRoutes from './routes/facturasRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './config/logger.js'; 
import schedulerService from './services/schedulerService.js';

dotenv.config();

const PORT = process.env.PORT || 8028;
const app = express();

app.set('trust proxy', true);

app.use(cors({ 
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true // 🔧 Permitir envío de cookies de sesión
}));
app.use(express.json({ limit: '10mb' })); // Aumentar límite para firmas base64

// Ruta de salud de la API
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.use('/api/cartera', carteraRoutes);
app.use('/api/facturas', facturasRoutes);


// Middleware para manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ message: 'Error interno del servidor' });
});

app.use(errorHandler);

app.listen(PORT, () => {
    logger.debug(`Servidor corriendo en http://localhost:${PORT}`);
    
    // Manejo de señales para limpieza al cerrar el servidor
    process.on('SIGINT', () => {
        logger.debug('\n🛑 Cerrando servidor...');
        schedulerService.stopAll();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        logger.debug('\n🛑 Cerrando servidor...');
        schedulerService.stopAll();
        process.exit(0);
    });
});
