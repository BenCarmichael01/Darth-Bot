"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsert = void 0;
const tslib_1 = require("tslib");
const musicModel_1 = tslib_1.__importDefault(require("../schemas/musicModel"));
async function upsert({ _id, musicChannel, playingMessage, }) {
    try {
        const doc = await musicModel_1.default.findOneAndUpdate({
            _id,
        }, {
            _id,
            musicChannel,
            playingMessage,
        }, {
            new: true,
            upsert: true,
        });
        return doc;
    }
    catch (error) {
        console.error(error);
        return;
    }
}
exports.upsert = upsert;
//# sourceMappingURL=upsert.js.map