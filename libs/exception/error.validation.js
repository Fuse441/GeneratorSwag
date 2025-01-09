export class ValidationError extends Error {
    constructor({ statusCode = 417, message = "Expectation Failed", details = [] }) {
        super(message);
        this.name = "ValidationError";
        this.statusCode = statusCode;
        this.details = details;
        this.message = message;
    }
}
