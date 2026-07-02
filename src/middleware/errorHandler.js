const multer = require('multer');
const { fail } = require('../utils/apiResponse');

function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    return fail(res, 400, 'UPLOAD_ERROR', err.message);
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return fail(res, 409, 'DUPLICATE', 'This record already exists');
  }

  console.error(err);
  const statusCode = err.statusCode || 500;
  return fail(res, statusCode, err.code || 'INTERNAL_ERROR', err.message || 'Something went wrong');
}

module.exports = errorHandler;
