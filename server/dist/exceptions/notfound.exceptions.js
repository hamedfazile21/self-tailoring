"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerNotFoundException = void 0;
const common_1 = require("@nestjs/common");
class CustomerNotFoundException extends common_1.HttpException {
    message;
    status;
    data;
    constructor(message, status, data) {
        super(message, status || common_1.HttpStatus.NOT_FOUND);
        this.message = message;
        this.status = status;
        this.data = data;
    }
}
exports.CustomerNotFoundException = CustomerNotFoundException;
//# sourceMappingURL=notfound.exceptions.js.map