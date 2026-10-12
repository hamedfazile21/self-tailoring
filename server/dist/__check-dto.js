"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const update_customer_dto_1 = require("./src/customers/dto/update-customer.dto");
const run = (label, payload) => {
    const dto = (0, class_transformer_1.plainToInstance)(update_customer_dto_1.UpdateCustomerDto, payload);
    const errors = (0, class_validator_1.validateSync)(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
    });
    const flat = errors.flatMap((e) => [
        ...Object.values(e.constraints ?? {}),
        ...(e.children ?? []).flatMap((c) => Object.values(c.constraints ?? {})),
    ]);
    console.log(`\n[${label}] errors=${errors.length}`);
    flat.forEach((m) => console.log('   -', m));
    console.log('   kept:', JSON.stringify(dto));
};
const full = {
    length: 100, shoulder: 45, sleeve_length: 60, chest: 95,
    cuff: 22, pants_length: 102, collar: 40, hem: 20, name: 'summer suit',
};
run('details only', { name: 'Ali', phone: '09120000000', status: 'active' });
run('details + full measurement', { name: 'Ali', measurement: full });
run('measurement without the optional pair', {
    measurement: { length: 100, shoulder: 45, sleeve_length: 60, chest: 95, cuff: 22, pants_length: 102 },
});
run('measurement missing a required field', {
    measurement: { shoulder: 45, sleeve_length: 60, chest: 95, cuff: 22, pants_length: 102 },
});
run('measurement with a stray key', { measurement: { ...full, sabotage: 'x' } });
run('string where a number belongs', { measurement: { ...full, chest: 'ninety' } });
run('customer_id smuggled in', { measurement: { ...full, customer_id: 99 } });
//# sourceMappingURL=__check-dto.js.map