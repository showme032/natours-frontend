const AppError = require('./../utils/appError');

// DEFINE VARIOUS ERRORS LIKELY TO OCCUR
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Duplicate object in database handler
const handleDuplicateErrorDB = err => {
  const value = err.keyValue.name;
  const message = `A document with name '${value}' already exists`;
  return new AppError(message, 400);
};

// Failed validation handler
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(e => e.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// JWT Token errors
const handleJWTError = err =>
  new AppError('Invalid token. Please log in again', 401);

const handleExpiredToken = err =>
  new AppError('Session expired. Please log in again', 401);

// SEPARATE HANDLING FOR DEVELOPMENT/PRODUCTION ERRORS
const sendErrorDev = (err, req, res) => {
  // TODO: fortify originalUrl
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // RENDERED PAGE
  console.error('Error: ', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong...',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    // Operational (trusted) error - send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // Programming or other unknown errors shouldn't leak details to usres
    // 1) Log the error
    console.error('Error: ', err);
    // 2) Send generalized message
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
  // RENDERED PAGE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong...',
      msg: err.message,
    });
  }
  // Programming or other unknown errors shouldn't leak details to usres
  // 1) Log the error
  console.error('Error: ', err);
  // 2) Send generalized message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong...',
    msg: 'Please try again later!',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err }; // Usual object copying, but errors have a quirk :S
    error.message = err.message;

    if (err.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    if (err.code === 11000) {
      error = handleDuplicateErrorDB(error);
    }
    if (err.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError(error);
    }
    if (err.name === 'TokenExpiredError') {
      error = handleExpiredToken(error);
    }

    sendErrorProd(error, req, res);
  }
};