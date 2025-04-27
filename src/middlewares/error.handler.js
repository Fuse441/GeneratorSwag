const ResponseFormatter = require('../../src/libs/api/http.response-formatter');

const ErrorHandler = (error, req, res, next) => {



    switch (error.name) {
        default :
            return ResponseFormatter.error({
                response: res,
                error: error,
                statusCode: error.statusCode,
                detail : error.details
            });

    }
}

module.exports = {
    ErrorHandler
}
