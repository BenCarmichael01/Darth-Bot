"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCALE = exports.MSGTIMEOUT = exports.STAY_TIME = exports.TESTING = exports.PRUNING = exports.MAX_PLAYLIST_SIZE = exports.YOUTUBE_API_KEY = exports.PREFIX = exports.canModifyQueue = void 0;
require('dotenv').config();
let config;
try {
    config = require('../../config.json');
}
catch (error) {
    config = null;
}
const canModifyQueue = (member) => {
    const { channelId } = member.voice;
    const botChannel = member.guild.me.voice.channelId;
    if (channelId !== botChannel) {
        return false;
    }
    return true;
};
exports.canModifyQueue = canModifyQueue;
exports.deEscape = (htmlStr) => {
    htmlStr = htmlStr.replace(/&lt;/g, '<');
    htmlStr = htmlStr.replace(/&gt;/g, '>');
    htmlStr = htmlStr.replace(/&quot;/g, '"');
    htmlStr = htmlStr.replace(/&#39;/g, "'");
    htmlStr = htmlStr.replace(/&amp;/g, '&');
    return htmlStr;
};
exports.PREFIX = (config ? config.PREFIX : process.env.PREFIX);
exports.YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
exports.MAX_PLAYLIST_SIZE = (config ? config.MAX_PLAYLIST_SIZE : process.env.MAX_PLAYLIST_SIZE);
exports.PRUNING = (config ? config.PRUNING : process.env.PRUNING);
exports.TESTING = (config ? config.TESTING : process.env.TESTING);
exports.STAY_TIME = (config ? config.STAY_TIME : process.env.STAY_TIME);
exports.MSGTIMEOUT = (config ? config.MSGTIMEOUT : process.env.MSGTIMEOUT);
exports.LOCALE = (config ? config.LOCALE : process.env.LOCALE);
//# sourceMappingURL=utils.js.map