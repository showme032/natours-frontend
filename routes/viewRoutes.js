const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// Render tours/tour page
router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview,
);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
// Render login page
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
// Render user account page
router.get('/me', authController.protect, viewController.getAccount);
// Render users bookings
router.get('/my-tours', authController.protect, viewController.getMyTours);

// router.post('/submit-user-data', authController.protect, viewController.updateUserData)

module.exports = router;