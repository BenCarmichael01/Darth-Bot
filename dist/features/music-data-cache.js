"use strict";
const musicSchema = require('../schemas/musicSchema');
module.exports = async (client) => {
    const docs = await musicSchema.find();
    docs.forEach((guild) => {
        const cache = guild._doc;
        const id = cache._id;
        delete cache.__v;
        delete cache._id;
        client.db.set(id, cache);
    });
    client.emit('dbCached');
};
module.exports.config = {
    displayName: 'Database Cache',
    dbName: 'MUSIC_DATA_CACHE',
};
//# sourceMappingURL=music-data-cache.js.map