import { HttpException } from '@nestjs/common';
export declare class CustomerNotFoundException extends HttpException {
    message: string;
    status?: number | undefined;
    data?: any | undefined;
    constructor(message: string, status?: number | undefined, data?: any | undefined);
}
