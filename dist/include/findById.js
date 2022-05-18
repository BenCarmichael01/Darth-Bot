"use strict";
const musicSchema = require(`${__base}schemas/musicSchema`);
module.exports = {
    async findById(_id) {
        const doc = await musicSchema.findById(_id);
        return doc;
    },
};
//# sourceMappingURL=findById.js.map