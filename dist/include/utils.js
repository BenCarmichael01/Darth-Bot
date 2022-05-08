/* global __base */
require('dotenv').config();
var config;
try {
    config = require("".concat(__base, "config.json"));
}
catch (error) {
    config = null;
}
/**
 * Determines if the member is in the same voice channel as the bot
 * @param {discordMember} member
 * @returns True or False
 */
exports.canModifyQueue = function (member) {
    var channelId = member.voice.channelId;
    var botChannel = member.guild.me.voice.channelId;
    if (channelId !== botChannel) {
        return false;
    }
    return true;
};
exports.deEscape = function (htmlStr) {
    htmlStr = htmlStr.replace(/&lt;/g, '<');
    htmlStr = htmlStr.replace(/&gt;/g, '>');
    htmlStr = htmlStr.replace(/&quot;/g, '"');
    htmlStr = htmlStr.replace(/&#39;/g, "'");
    htmlStr = htmlStr.replace(/&amp;/g, '&');
    return htmlStr;
};
exports.PREFIX = config ? config.PREFIX : process.env.PREFIX;
exports.YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
exports.MAX_PLAYLIST_SIZE = config ? config.MAX_PLAYLIST_SIZE : process.env.MAX_PLAYLIST_SIZE;
exports.PRUNING = config ? config.PRUNING : process.env.PRUNING;
exports.STAY_TIME = config ? config.STAY_TIME : process.env.STAY_TIME;
exports.MSGTIMEOUT = config ? config.MSGTIMEOUT : process.env.MSGTIMEOUT;
exports.LOCALE = config ? config.LOCALE : process.env.LOCALE;
