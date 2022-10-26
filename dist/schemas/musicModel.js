"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mongoose_1 = tslib_1.__importDefault(require("mongoose"));
const musicSchema = new mongoose_1.default.Schema({
    _id: String,
    musicChannel: String,
    playingMessage: String,
});
const model = mongoose_1.default.model('musicData', musicSchema, 'musicData');
exports.default = model;
//# sourceMappingURL=musicModel.js.map