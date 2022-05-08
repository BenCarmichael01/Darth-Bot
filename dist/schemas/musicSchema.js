var mongoose = require('mongoose');
var musicSchema = mongoose.Schema({
    _id: String,
    musicChannel: String,
    playingMessage: String,
});
module.exports = mongoose.model('musicData', musicSchema, 'musicData');
