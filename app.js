const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// MOUNT FEATURES
// Let express know which template engine we're going to use. Most common are supported out of box
app.set('view engine', 'pug');
// and where views(templates) are located, using path.join here because of relativity
app.set('views', path.join(__dirname, 'views'));


// 1) GLOBAL MIDDLEWARE
// All the static assets wil automatically be served from this directory
app.use(express.static(path.join(__dirname, 'public')));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set security HTTP header, allow external sources
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'base-uri': ['self'],
        'script-src': ['\'self\'', 'https://cdnjs.cloudflare.com/', 'https://api.mapbox.com', 'https://js.stripe.com/v3/', 'ws://localhost:52441/'],
        'default-src': ['\'self\'', 'https://*.mapbox.com', 'ws://127.0.0.1:*/', 'https://js.stripe.com/v3/', 'ws://localhost:52441/'],
        'workerSrc': ['\'self\'', 'blob:'],
      },
    },
  }),
);
// Data sanitization against XSS
app.use(xss());

// Body parser, reading data from body into req.body
app.use(
  express.json({
    limit: '10kb',
  }),
);
// Parse data coming in url-encoded form (ie. submitted form data)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// User cookie parser
app.use(cookieParser());


// Data sanitization against NoSQL query injection
// noinspection JSCheckFunctionSignatures
app.use(mongoSanitize());

// Limit requests from an ip
const limiter = rateLimit({
  max: 100,
  windowMS: 60 * 60 * 1000,
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

// MOUNT ROUTERS
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// If it reaches this middleware, means none we defined was requested
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.url}`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
