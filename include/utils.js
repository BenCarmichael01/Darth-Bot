/* global __base */
require('dotenv').config();

let config;

try {
	config = require(`${__base}config.json`);
} catch (error) {
	config = null;
}
/**
 * Determines if the member is in the same voice channel as the bot
 * @param {discordMember} member
 * @returns True or False
 */
exports.canModifyQueue = (member) => {
	const { channelId } = member.voice;
	const botChannel = member.guild.me.voice.channelId;

	if (channelId !== botChannel) {
		return false;
	}

	return true;
};

exports.PREFIX = config ? config.PREFIX : process.env.PREFIX;
exports.YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
exports.MAX_PLAYLIST_SIZE = config ? config.MAX_PLAYLIST_SIZE : process.env.MAX_PLAYLIST_SIZE;
exports.PRUNING = config ? config.PRUNING : process.env.PRUNING;
exports.STAY_TIME = config ? config.STAY_TIME : process.env.STAY_TIME;
exports.MSGTIMEOUT = config ? config.MSGTIMEOUT : process.env.MSGTIMEOUT;
exports.LOCALE = config ? config.LOCALE : process.env.LOCALE;
