const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');

// Define mongoose schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      // Built-in validator
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      // Also built-in validators
      maxLength: [40, 'Name must have less than 40 characters'],
      minLength: [10, 'Name must have more than 10 characters'],
      // Imported validator from external library, just specify a function to be used
      // validate: [validator.isAlpha, 'Tour name can only contain letters'],
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      // Short notation
      required: [true, 'A tour must have a difficulty'],
      // For this long notation
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty can be: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be higher than 1'],
      max: [5, 'Rating mus be less than 5'],
      set: val => Math.round(val * 10) / 10 // Round to 1 decimal place
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      // Custom validator
      validate: {
        validator: function (val) {
          // this keyword works only when creating a new document :/
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) can`t be higher than regular price',
      },
    },
    summary: {
      type: 'String',
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String], // A string of images
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON to specify geospatial data, typeschema defined on subfields instead of this obj
      type: {
        type: String,
        default: 'Point',
        // allow only 'Point' for startLocation
        enum: ['Point'],
      },
      // Expect an array of numbers
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // Reference guides related to this data *mongomagic*
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index tour fields
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
// TODO: GPT WHY WE INDEX THIS STUFF? Geospatial index
tourSchema.index({ startLocation: '2dsphere' })

// Virtual properties
tourSchema.virtual('durationWeeks').get(function () {
  return (this.duration / 7).toFixed(2);
});

// Virtual populate in order to access reviews from tours, without actually embedding docs into schema itself (keeping it 'off' database)
tourSchema.virtual('reviews', {
  ref: 'Review',
  // Field where the reference is made in the other doc (tour name in review doc)
  foreignField: 'tour',
  // Which field is exactly referenced in that other doc (we referenced _id of tour)
  localField: '_id',
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChanged',
  });

  next();
});

// Document middleware: runs only  before .save() & .create(), and not ie. insertMany()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Query middleware
// tourSchema.pre('find', function (next) {}
// This one's used as regex matches every hook starting with find: findById, findOne,...
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs) {
  console.log(`Query took: ${Date.now() - this.start}ms`);
  // console.log(docs);
});

// Aggregation Middleware
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

// Create a model which uses the schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
