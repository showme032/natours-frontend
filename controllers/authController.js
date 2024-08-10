const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');
const crypto = require('crypto');
// const cookieParser = require('cookie-parser');

// SIGN NEW TOKEN USING USERS ID
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// SEND TOKEN TO CLIENT
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Save it as a cookie
  const cookieOptions = {
    expires: new Date(
      // Convert ie days from config file into milliseconds
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    // Cookie can`t be accessed or modified by browser (just received, stored, sent)
    httpOnly: true,
  };

  // In production, send cookie only via https
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    // Send token to log the user in after creating the account
    token,
    data: {
      user,
    },
  });
};

// SIGN NEW USER UP
exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body); isn't save, user can send anything
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    photo: req.body.photo,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChanged: req.body.passwordChanged,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  // For token, we just need the user id
  createSendToken(newUser, 201, res);
});

// LOG THE USER IN
exports.login = catchAsync(async (req, res, next) => {
  // destructing
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  // this can`t run if no user, so we moved it directly into if statement below
  // const correct = await user.correctPassword(password, user.password);
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything is ok, send token to client
  createSendToken(user, 200, res);
});

// SIGN THE USER OUT
exports.logout = (req, res) => {
  res.clearCookie('jwt');
  // res.cookie('jwt', 'logged-out', {
  //   expires: new Date(Date.now() + 10 * 1000),
  //   httpOnly: true,
  // });
  res.status(200).json({
    status: 'success',
  });
};

// PROTECT ROUTES SO ONLY LOGGED-IN USERS CAN USE THEM
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get the token and check if its there (we send it with http header with req)
  let token;
  // Authenticate based on tokens sent by auth. header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // Or by cookies
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You aren`t logged in. Please log in to continue!', 401),
    );
  }

  // 2) Verification of JWT token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user owning this token doesn\'t exist anymore', 401),
    );
  }

  // 4) Check if the user changed password after token was issued; iat = issued at
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Password was changed recently. Please log in again', 401),
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  // embed user info into request
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendering pages, no errors here
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    // 1) Verify the token
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET,
    );

    // 2) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next();
    }

    // 3) Check if the user changed password after token was issued; iat = issued at
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      console.log('password changed after the token issue');
      return next();
    }

    // ✓ There is a user logged-in, make him accessible to templates
    res.locals.user = currentUser;
    return next();
  }
  next();
});

// RESTRICT SOME ROUTES TO SPECIFIC USERS
// since we cant pass arguments into middleware, we create a wrapper function which returns our middleware function
exports.restrictTo = (...roles) => {
  // It gets access to roles parameter via closure! neat
  return (req, res, next) => {
    // roles: ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Missing permission to perform this task', 403));
    }

    next();
  };
};

// RESET FORGOTTEN PASSWORD
exports.forgotPassword = catchAsync(async (req, res, next) => {
  console.log('Reseting the password...');
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  // 2) Generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to users email

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);

    return next(
      new AppError(
        'There was an error sending the email. Try again later.',
        500,
      ),
    );
  }
});

// RESET PASSWORD
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) Set new password if token isn't expired and the user exists
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update the changedPasswordAt property for the current user

  // 4) Log the user in
  createSendToken(user, 200, res);
});

// ALLOW UPDATING PASSWORD FOR LOGGED IN USERS
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection using id from req and explicitly ask for password
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed password is correct, using asynchronous method we defined
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(
      new AppError('Input password isn`t correct. Please try again', 401),
    );
  }

  // 3) Update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Log the user in by sending JWT
  createSendToken(user, 200, res);
});
