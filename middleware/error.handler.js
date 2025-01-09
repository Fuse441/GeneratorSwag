const ResponseFormatter = require('../libs/api/http.response-formatter');

const ErrorHandler = (error, req, res, next) => {
    switch (error.name) {
        case 'ValidationError':
            return ResponseFormatter.error({
                response: res,
                error: error,
                statusCode: 417
            });
        default:
            return ResponseFormatter.error({
                response: res,
                error: {
                    message: error.message
                },
                statusCode: 500
            });
    }
}

module.exports = {
    ErrorHandler
}
