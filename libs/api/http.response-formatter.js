function success({ response, data, message = "Success", statusCode = 200 }) {
    return response.status(statusCode).json({
        message: message,
    })
}

function error({ response, error, statusCode = 500 }) {
    return response.status(statusCode).json({
        message: error.message,
    });
}

module.exports = {
    success,
    error
}
