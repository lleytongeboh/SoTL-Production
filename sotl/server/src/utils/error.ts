interface ErrorResponse {
    message: string;
    [key: string]: any;
}

export class ErrorWithCode extends Error {
    public readonly responseCode: number;
    public readonly response: ErrorResponse;
    constructor(responseCode: number, response: ErrorResponse) {
        super(response.message);
        this.responseCode = responseCode;
        this.response = response;
    }
}