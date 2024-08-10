const Review = require('./../models/reviewsModel');
const factory = require('./handlerFactory');
// const catchAsync = require('./../utils/catchAsync');
// const APIFeatures = require('./../utils/apiFeatures');
// const AppError = require('./../utils/appError');

exports.setTourUserIds = (req, res, next) => {
  // if no tour id in body, allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

// CREATE a review
exports.createReview = factory.createOne(Review);
// GET a review
exports.getReview = factory.getOne(Review);
// GET all reviews
exports.getAllReviews = factory.getAll(Review)
// UPDATE a review
exports.updateReview = factory.updateOne(Review);
// DELETE a review
exports.deleteReview = factory.deleteOne(Review);
