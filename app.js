const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimiter = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require(`./routes/userRoutes`);
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes')
const viewRouter = require('./routes/viewRoutes');

const app = express();

// MOUNT FEATURES
app.use(cors());

// Let express know which template engine we're going to use. Most common are supported out of box
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARE
// All the static assets wil automatically be served from this directory
app.use(express.static(path.join(__dirname, 'public')));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set security HTTP header, allow external sources
app.use(helmet({ contentSecurityPolicy: false }));

// Data sanitization against XSS
app.use(xss());

// Data sanitization against NoSQL query injection
// noinspection JSCheckFunctionSignatures
app.use(mongoSanitize());

// User cookie parser
app.use(cookieParser());

//& LIMIT THE UPCOMING REQUEST
const limiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 60 mins minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 60 minutes)
  message: 'Too many requests from this ip, please try again in an hour!',
});

// on /api routes
app.use('/api', limiter);

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'average',
      'difficulty',
      'duration',
      'maxGroupSize',
      'price',
      'ratingsQuality',
    ],
  }),
);

app.use((req, res, next) => {
  req.reqTime = new Date().toString();
  // console.log(req.cookies)
  next();
});

// Body parser
app.use(express.json({ limit: '10kb' }));

// Parse data coming in url-encoded form (ie. submitted form data)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// MOUNT ROUTERS
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings' , bookingRouter);

// If it reaches this middleware, means none we defined was requested
app.all('*', (req, res, next) => {
  next(
    new AppError(`Can't find ${req.url}`, 404)
  );
});

// Global error handling
app.use(globalErrorHandler);

module.exports = app;
