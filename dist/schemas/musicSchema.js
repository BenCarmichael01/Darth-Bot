"use strict";
const mongoose = require('mongoose');
const musicSchema = mongoose.Schema({
    _id: String,
    musicChannel: String,
    playingMessage: String,
});
module.exports = mongoose.model('musicData', musicSchema, 'musicData');
//# sourceMappingURL=musicSchema.js.map