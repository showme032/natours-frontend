const mongoose = require('mongoose');

const bookTourSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    require: [true, 'Booking must belongs to some tour'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    require: [true, 'Booking must belongs to an user'],
  },
  price: {
    type: Number,
    required: [true, 'Booking tour must have a price!'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid:{
    type:Boolean ,
    default:true 
  }
});

bookTourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  }).populate({
    path: 'tour',
    select: 'name',
  });

  next();
});

const Booking = mongoose.model('booking',bookTourSchema);

module.exports = Booking ;
