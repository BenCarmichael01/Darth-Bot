const Discord = require('discord.js');
const i18n = require('i18n');
const sqlite3 = require('sqlite3').verbose();
const sql = require('sqlite');
const fs = require('fs');
const path = require('path');
const { openDb } = require('@include/opendb');
const { LOCALE } = require('../util/utils');

const { MessageEmbed } = Discord;
i18n.setLocale(LOCALE);

module.exports = {
	async npMessage(message, npSong, client, guildIdParam) {
		// TODO this searches all channels bot can see, must fix if to be added to more servers. Must be like this so np message can be
		// reset everytime the bot launches
		const guildId = (guildIdParam ? guildIdParam : message.guild.id);
		const prefix = (message ? message.guild.commandPrefix : client.guilds.cache.get(guildId).commandPrefix);
		// const db = await openDb();

		// TODO get all values in one db request to make faster
		// const MUSIC_CHANNEL_ID = (await db.get(`SELECT channelId FROM servers WHERE guildId='${guildId}'`)).channelId;
		const MUSIC_CHANNEL_ID = (await message ? await message.guild : await client.guilds.cache.get(guildId)).settings.get('musicChannel');
		// console.log(MUSIC_CHANNEL_ID);
		/* .then(row => {
		// console.log(row.channelId);
		return row.channelId
		}).catch(console.error); */

		// const { playingMessageId } = await db.get(`SELECT playingMessageId FROM servers WHERE guildId='${guildId}'`);
		const playingMessageId = (await message ? await message.guild : await client.guilds.cache.get(guildId)).settings.get('playingMessage');
		// console.log(playingMessageId);
		/* .then(row => {
			// console.log(row.channelId);
			return row.playingMessageId
		}).catch(console.error); */

		// console.log(guildId)
		let musicChannel = '';
		if (message === undefined) {
			musicChannel = await client.guilds.cache.get(guildId).channels.cache.get(MUSIC_CHANNEL_ID);
		} else {
			musicChannel = await message.client.channels.cache.get(MUSIC_CHANNEL_ID);
		}
		let queue = [];
		if (message !== undefined && npSong !== undefined) {
			queue = message.client.queue.get(message.guild.id).songs;
		}

		var outputQueue = '__**Up Next:**__:\nSend a url or a song name to start the queue';
		var songsQueue = '';
		if (queue) {
			const currentQueue = queue.slice(1, 22);

			let index = 0;
			for (let i = 0; i < currentQueue.length; i++) {
				index = i + 1;
				songsQueue = `**${index}.** ${currentQueue[i].title}\n ${songsQueue}`;
			}
			outputQueue = `__**Up Next:**__:\n ${songsQueue}`;
		}
		let newEmbed = {};
		if (npSong === undefined) {
			newEmbed = new MessageEmbed()
				.setColor('#5865F2')
				.setTitle('🎶 Nothing is playing right now')
				.setURL('')
				.setImage('https://i.imgur.com/TObp4E6.jpg')
				.setFooter(`The prefix for this server is ${prefix}`);
		} else {
			newEmbed = new MessageEmbed()
				.setColor('#5865F2')
				.setTitle(`🎶 Now playing: ${npSong.title}`)
				.setURL(npSong.url)
				.setImage(npSong.thumbUrl)
				.setFooter(`The prefix for this server is ${prefix}`);
		}

		const output1 = await musicChannel.messages.fetch({ limit: 10 })
			.then(async (messages) => {
				const outputArr = [];
				outputArr[0] = await messages.get(playingMessageId);
				// Change now playing message to match current song
				outputArr[0].edit(outputQueue, newEmbed);
				return outputArr;
			})
			.then(async (outputArr) => {
				const filter = (reaction, user) => user.id !== (message ? message.client : client).user.id;

				const outputVar = outputArr;
				outputVar[1] = outputArr[0].createReactionCollector(filter, {
					time: npSong === undefined || npSong.duration < 0 ? 600000 : npSong.duration * 1000,
				});

				return outputVar;
			}).catch(console.error);

		return output1;
		// outputs an arrray with the first item being the playingMessage and the second being the reaction collector
	},
};
