const { validationResult } = require('express-validator');

/**
 * Validates request schema and returns formatted 400 Bad Request if errors exist
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed on input parameters.',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
}

module.exports = {
  validate
};

