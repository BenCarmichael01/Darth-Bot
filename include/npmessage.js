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
		// reset everytime the bot launches also i broke the whole thing trying to reset np message at startup
		// var guilds = client.guilds.cache
		// console.log(guilds);
		const guildId = (guildIdParam ? guildIdParam : message.guild.id);
		const prefix = (message ? message.guild.commandPrefix : client.guilds.cache.get(guildId).commandPrefix);
		const db = await openDb();

		// TODO get all values in one db request to make faster
		const MUSIC_CHANNEL_ID = (await db.get(`SELECT channelId FROM servers WHERE guildId='${guildId}'`)).channelId;

		/* .then(row => {
		// console.log(row.channelId);
		return row.channelId
		}).catch(console.error); */

		const { playingMessageId } = await db.get(`SELECT playingMessageId FROM servers WHERE guildId='${guildId}'`);
		//console.log(playingMessageId);
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
		let queue = {};
		if (message !== undefined && npSong !== undefined) {
			queue = message.client.queue.get(message.guild.id).songs;
		}

		/* function generateQueue(message, queue) {
			let outputQueue = [];
			// TODO add queue size to config//
			let k = 10;

			for (let i = 0; i < queue.length; i += 1) {
				const current = queue.slice(i, k);
				let j = i;
				k += 10;

				// const info = current.map((track) => `${++j} - [${track.title}](${track.url})`).join('\n');
				currentQueue = current[1].title
				const embed = new MessageEmbed()
					.setTitle(i18n.__('queue.embedTitle'))
					.setThumbnail(message.guild.iconURL())
					.setColor('#F8AA2A')
					.setDescription(
						i18n.__mf('queue.embedCurrentSong', { title: queue[0].title, url: queue[0].url, info: info })
					)
					.setTimestamp();
				outputQueue.push(currentQueue);
			}

			return outputQueue;
		} */
		// console.log(generateQueue(message, queue));

		let outputQueue = '';
		let newEmbed = {};
		if (npSong === undefined) {
			outputQueue = 'There is nothing in the queue right now';
			newEmbed = new MessageEmbed()
				.setColor('#5865F2')
				.setTitle('🎶Nothing is playing right now')
				.setURL('')
				// .setAuthor(args[3], args[4], args[5])
				// .setDescription(args[6])
				.setImage('https://i.imgur.com/TObp4E6.jpg')
				// .setImage('attachment://grogu.jpg')
				.setFooter(`The prefix for this server is ${prefix}`);
		} else {
			const currentQueue = queue.slice(1, 22);

			let index = 0;
			for (let i = 0; i < currentQueue.length; i++) {
				index = i + 1;
				outputQueue = `${index}. ${currentQueue[i].title}\n ${outputQueue}`;
			}
			console.log(npSong.thumbUrl);
			newEmbed = new MessageEmbed()
				.setColor('#5865F2')
				.setTitle(`🎶 Now playing: ${npSong.title}`)
				.setURL(npSong.url)
				// .setAuthor(args[3], args[4], args[5])
				// .setDescription(args[6])
				.setImage(npSong.thumbUrl)
				.setFooter(`The prefix for this server is ${prefix}`);
		}

		const output1 = await musicChannel.messages.fetch({ limit: 10 })
			.then(async (messages) => {
				const outputArr = [];
				outputArr[0] = await messages.get(playingMessageId);
				//console.log(messages.get(playingMessageId));
				// Change now playing message to match current song
				outputArr[0].edit(outputQueue, newEmbed);
				return outputArr;
			})
			.then(async (outputArr) => {
				// console.log(client.user.id)
				const filter = (reaction, user) => user.id !== (message ? message.client : client).user.id;

				/* if (message) { var filter = (reaction, user) => user.id !== message.client.user.id; }
				else if (client) { var filter = (reaction, user) => user.id !== client.user.id;} */
				/* if (npSong !== undefined) { var timeSet = npSong.duration * 1000 }
				else { var timeSet = 600000 } */
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
// npSong.duration > 0 ? npSong.duration * 1000 : 600000
// check if playlist has been added by checking if songs is true or falsey