"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const tslib_1 = require("tslib");
const musicModel_1 = tslib_1.__importDefault(require("../schemas/musicModel"));
exports.default = async (client) => {
    const docs = await musicModel_1.default.find();
    docs.forEach((guild) => {
        const id = guild._id;
        const { musicChannel, playingMessage } = guild;
        const cache = { musicChannel, playingMessage };
        client.db.set(id, cache);
    });
    client.emit('dbCached');
};
exports.config = {
    displayName: 'Database Cache',
    dbName: 'MUSIC_DATA_CACHE',
};
//# sourceMappingURL=amusic-data-cache.js.map