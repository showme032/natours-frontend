// module.exports = fn => (req, res, next) => {
//   fn(req, res, next).catch((err) => next(err));
// };

// In order not to use try/catch blocks all over, we can wrap our async function inside of this one here, which will take care of errors, if it's rejected
module.exports = fn => {
  // catchAsync needs to return a fn which can then be assigned elsewhere(ie. creteTour)
  return (req, res, next) => {
    // The function we pass here is async function, so errors don't resolve but reject, hence the catch for catching the error (dw, err is passed into next from catch)
    fn(req, res, next).catch(next);
  };
};