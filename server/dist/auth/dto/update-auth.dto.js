"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAuthDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const login_auth_dto_1 = require("./login-auth.dto");
class UpdateAuthDto extends (0, mapped_types_1.PartialType)(login_auth_dto_1.LoginAuthDto) {
}
exports.UpdateAuthDto = UpdateAuthDto;
//# sourceMappingURL=update-auth.dto.js.map