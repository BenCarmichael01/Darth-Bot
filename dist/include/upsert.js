"use strict";
const musicSchema = require(`${__base}schemas/musicSchema`);
module.exports = {
    async upsert({ _id, musicChannel, playingMessage }) {
        try {
            await musicSchema.findOneAndUpdate({
                _id,
            }, {
                _id,
                musicChannel,
                playingMessage,
            }, {
                upsert: true,
            });
            return 1;
        }
        catch (error) {
            console.error(error);
            return 0;
        }
    },
};
//# sourceMappingURL=upsert.js.map