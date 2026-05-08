import logger from '../config/logger.js';

const errorHandler = (err, req, res, next) => {
  logger.error(`[${req.method}] ${req.url} - ${err.message}`);

  res.status(err.status || 500).json({
    ok: false,
    message: err.message || 'Error interno del servidor',
  });
};

export default errorHandler;