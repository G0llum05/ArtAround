function errorHandler(err, req, res, next) {
  const nodeEnv = process.env.NODE_ENV || 'production';
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      // Non in produzione verranno aggiunte le righe di errore (stack trace)
      message: err.message || 'Internal Server Error',
      ...(nodeEnv !== 'production' && { stack: err.stack })
    }
  });
}

module.exports = errorHandler;
