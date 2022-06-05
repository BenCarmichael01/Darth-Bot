import { GuildMember } from 'discord.js';

require('dotenv').config();

let config;

try {
	config = require('../config.json');
} catch (error) {
	config = null;
}
/**
 * Determines if the member is in the same voice channel as the bot
 * @param {discordMember} member
 * @returns True or False
 */
export const canModifyQueue = (member: GuildMember) => {
	const { channelId } = member.voice;
	const botChannel = member.guild.me!.voice.channelId;

	if (channelId !== botChannel) {
		return false;
	}

	return true;
};
exports.deEscape = (htmlStr: string) => {
	htmlStr = htmlStr.replace(/&lt;/g, '<');
	htmlStr = htmlStr.replace(/&gt;/g, '>');
	htmlStr = htmlStr.replace(/&quot;/g, '"');
	htmlStr = htmlStr.replace(/&#39;/g, "'");
	htmlStr = htmlStr.replace(/&amp;/g, '&');
	return htmlStr;
};

export const PREFIX = (config ? config.PREFIX : process.env.PREFIX) as string;
export const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY as string;
export const MAX_PLAYLIST_SIZE = (
	config ? config.MAX_PLAYLIST_SIZE : process.env.MAX_PLAYLIST_SIZE
) as number;
export const PRUNING = (config ? config.PRUNING : process.env.PRUNING) as boolean;
export const STAY_TIME = (config ? config.STAY_TIME : process.env.STAY_TIME) as number;
export const MSGTIMEOUT = (config ? config.MSGTIMEOUT : process.env.MSGTIMEOUT) as number;
export const LOCALE = (config ? config.LOCALE : process.env.LOCALE) as string;
