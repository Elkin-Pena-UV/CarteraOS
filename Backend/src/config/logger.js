import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determinar el nivel de log según el entorno
const getLogLevel = () => {
    const env = process.env.NODE_ENV || 'development';
    
    switch (env) {
        case 'production':
            return 'error'; // Solo errores críticos en producción
        case 'test':
            return 'warn'; // Warnings y errores en testing
        case 'development':
        default:
            return 'debug'; // Todo en desarrollo
    }
};

// Formato personalizado para mejor legibilidad
const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Agregar metadata si existe
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
});

// Colores personalizados para consola
const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'cyan',
        http: 'magenta',
        debug: 'gray',
    }
};

winston.addColors(customLevels.colors);

// Configuración de transportes
const transports = [
    // Consola con colores
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            customFormat
        ),
    }),
];

// En producción, agregar archivo de logs
if (process.env.NODE_ENV === 'production') {
    const logsDir = path.join(__dirname, '../../logs');
    
    // Logs de errores
    transports.push(
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );
    
    // Logs combinados (todos los niveles)
    transports.push(
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );
}

// Crear el logger
const logger = winston.createLogger({
    levels: customLevels.levels,
    level: getLogLevel(),
    transports,
    // No salir en excepciones no capturadas
    exitOnError: false,
});

// Método auxiliar para logging de requests HTTP
logger.logRequest = (req, res, duration) => {
    const message = `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - IP: ${req.ip}`;
    
    if (res.statusCode >= 500) {
        logger.error(message);
    } else if (res.statusCode >= 400) {
        logger.warn(message);
    } else if (process.env.NODE_ENV === 'development') {
        logger.http(message);
    }
};

// Método auxiliar para operaciones de base de datos
logger.logDB = (operation, details) => {
    if (process.env.NODE_ENV === 'development') {
        logger.debug(`[DB] ${operation}`, details);
    }
};

// Método auxiliar para operaciones de PDF
logger.logPDF = (operation, details) => {
    if (process.env.NODE_ENV === 'development') {
        logger.debug(`[PDF] ${operation}`, details);
    } else {
        // Solo errores en producción
        if (details?.error) {
            logger.error(`[PDF] ${operation}`, details);
        }
    }
};

// Método auxiliar para notificaciones
logger.logNotification = (type, details) => {
    if (process.env.NODE_ENV === 'development') {
        logger.info(`[NOTIFICATION] ${type}`, details);
    }
};

// Mensaje de inicialización
const envEmoji = process.env.NODE_ENV === 'production' ? '🚀' : '🔧';
logger.info(`${envEmoji} Logger inicializado - Entorno: ${process.env.NODE_ENV || 'development'} - Nivel: ${getLogLevel()}`);

export default logger;
