"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const musicModel_1 = tslib_1.__importDefault(require("../schemas/musicModel"));
async function findById(_id) {
    const doc = await musicModel_1.default.findById(_id);
    return doc;
}
exports.default = findById;
//# sourceMappingURL=findById.js.map