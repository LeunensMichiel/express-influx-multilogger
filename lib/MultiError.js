//  THROW A CUSTOM ERROR AND ADD IT TO THE MIDDLEWARE
const throwMultilogError = () => {
  return (err, req, res, next) => {
    if (!err) {
      return next();
    }
    res.locals.multiError = {
      errorMessage: err.message,
      errorStack: err.stack,
    };
    next();
  };
};

module.exports = throwMultilogError;
