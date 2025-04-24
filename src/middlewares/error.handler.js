const ResponseFormatter = require('../../src/libs/api/http.response-formatter');

const ErrorHandler = (error, req, res, next) => {

    switch (error.name) {
        case 'ValidationError':
            return ResponseFormatter.error({
                response: res,
                error: error,
                statusCode: error.statusCode,
                detail : error.details
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
