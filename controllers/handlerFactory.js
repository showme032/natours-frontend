const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

// DELETE any one of docs for argumented model
exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that  id', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

// UPDATE any one of docs for argumented model
exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      // runs the validators defined in model schema
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with submited  id', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

// CREATE any one of docs for argumented model
exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { data: doc },
    });
  });

// GET any one of docs for argumented model
exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    // Populate with ie. reviews (name of field) if required
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with submited  id', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { data: doc },
    });
  });

// GET all of the docs for argumented model
exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // Allow nested GET reviews on tour (reasonable hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // Create new APIFeatures obj, passing in a mongoose query object(Tour.find) & calling methods on it. Apply filter if one given
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // after query we call explain
    const doc = await features.query;

    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: { data: doc },
    });
  });
