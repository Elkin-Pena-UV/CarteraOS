import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import cookieParser from 'cookie-parser';
import compression from 'compression';
import carteraRoutes from './routes/carteraRoutes.js';
import facturasRoutes from './routes/facturasRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './config/logger.js'; 
import schedulerService from './services/schedulerService.js';
import adminRoutes from './routes/adminRoutes.js';
import variacionRoutes from './routes/variacionRoutes.js';
import rotacionRoutes from './routes/rotacionRoutes.js';
import exportRoutes   from './routes/exportRoutes.js'
import authRoutes from './routes/authRoutes.js';
import requireAuth from './middleware/auth.js';
import cruceAutRoutes from './routes/cruceAutRoutes.js';
import emailRoutes from './routes/emailRoutes.js'
import carteraAsesorRoutes from './routes/carteraAsesorRoutes.js';
// import carteraAux from './routes/carteraAuxRoutes.js';
// import rotRoutes from './routes/rotRoutes.js';

dotenv.config();

const PORT = process.env.PORT || 8028;
const app = express();

app.set('trust proxy', true);
app.use(compression({
    level: 6,           // Nivel 1-9 (6 es el balance ideal velocidad/tamaño)
    threshold: 1024,    // Solo comprimir respuestas > 1KB
    filter: (req, res) => {
        // No comprimir si el cliente lo pide explícitamente
        if (req.headers['x-no-compression']) {
            return false;
        }
        // Comprimir todo lo demás que sea texto/JSON
        return compression.filter(req, res);
    }
}));

// Permite uno o varios orígenes separados por coma en CORS_ORIGIN.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Sin origin (curl, healthchecks, apps nativas) o en la lista permitida.
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
}));
app.use(cookieParser());
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

app.use('/api/auth', authRoutes);

app.use('/api/cartera', requireAuth , carteraRoutes);
app.use('/api/facturas', requireAuth , facturasRoutes);
app.use('/api/admin', requireAuth , adminRoutes);
app.use('/api/variacion', requireAuth , variacionRoutes);
app.use('/api/rotacion', requireAuth , rotacionRoutes);
app.use('/api/cruce-aut', requireAuth, cruceAutRoutes); 
// app.use('/api/cartera-aux', requireAuth , carteraAux);
// app.use('/api/rot', requireAuth , rotRoutes);
app.use('/api/cartera-asesor', requireAuth, carteraAsesorRoutes);
app.use('/api/export',    exportRoutes);
app.use('/api/email', emailRoutes);


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
