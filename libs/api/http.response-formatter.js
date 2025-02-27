function success({ response, data, message = "Success", statusCode = 200 }) {
    return response.status(statusCode).json({
        message: message,
    })
}

function error({ response, error, statusCode = 500,detail = ""}) {
    return response.status(statusCode).json({
        message: error.message,
        detail: detail
    });
}

module.exports = {
    success,
    error
}
