// MongoDB object modelling tool
const mongoose = require('mongoose');
// Environmental variables
const dotenv = require('dotenv');
// Stores the keys:values in process.env
dotenv.config({ path: './config.env' });

// Connect to remote Atlas database stated in config.env
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// Express App
const app = require('./app');

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception. Shutting down...');
  console.log(err.name , err.message);

  process.exit(1);
});

// Connect to cloud mongo-db
mongoose
  .connect(DB)
  .then(() => console.log('Db connection successful!'));

// Connect to local mongo-db
// mongoose.connect(process.env.DATABASE_LOCAL);

// Start listening to requests in app
const port = process.env.PORT || 8000
const server = app.listen(port, () => {
  console.log(`running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name , err.message);
  console.log('Uncaught Rejection. Shutting down...');

  server.close(() => {
    process.exit(1);
  });
});
