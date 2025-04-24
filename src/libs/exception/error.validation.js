class ValidationError extends Error {
    constructor({ statusCode = 400, message = "Bad Request", details = [] }) {
        super(message);
        this.name = "ValidationError";
        this.statusCode = statusCode;
        this.details = details;
        this.message = message;
    }
}

module.exports = {
    ValidationError
}
