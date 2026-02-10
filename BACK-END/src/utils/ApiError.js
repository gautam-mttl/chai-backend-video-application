//THIS IS THE FORMAT OF HOW I WANT TO SEND MY ERROR                    //the ApiError gets thrown , async handler catch block catches it and passes to next(err), which send the err to global errorHandler/ middleware
class ApiError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if( stack) {
            this.stack = stack;
        } else{
            Error.captureStackTrace(this, this.constructor);
        }

    }
}

export {ApiError};