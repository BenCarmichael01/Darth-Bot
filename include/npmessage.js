﻿/* global __base */
const i18n = require('i18n');
const { MessageEmbed } = require('discord.js');

const { LOCALE } = require(`${__base}include/utils`);
const { findById } = require(`${__base}/include/findById`);

i18n.setLocale(LOCALE);
// TODO update npmessage when prefix is changed
module.exports = {
	/**
	 *
	 * @param {object} args
	 * @param {DiscordClient} args.client
	 * @param {DiscordMessage} args.message
	 * @param {object} args.npSong
	 * @param {String} args.guildIdParam
	 * @param {String} args.prefix
	 * @returns {[DiscordMessage, MessageReactionCollector]} An array where the first item is the sent message object and the second is the reaction collector
	 */
	async npMessage(args) {
		const { client, message, npSong, guildIdParam, prefix } = args;
		// TODO need to pass wok instance to this to retrieve prefix from _prefixes array.
		const guildId = guildIdParam ? guildIdParam : message.guild.id;
		const settings = await findById(message ? message.guildId : guildIdParam);
		const MUSIC_CHANNEL_ID = settings.musicChannel;
		// const MUSIC_CHANNEL_ID = (await message ? await message.guild : await client.guilds.cache.get(guildId)).settings.get('musicChannel');
		const playingMessageId = settings.playingMessage;
		// const playingMessageId = (await message ? await message.guild : await client.guilds.cache.get(guildId)).settings.get('playingMessage');

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

		var outputQueue = i18n.__('npmessage.emptyQueue');
		var songsQueue = '';
		if (queue) {
			const currentQueue = queue.slice(1, 10);

			let index = 0;
			for (let i = 0; i < currentQueue.length; i++) {
				index = i + 1;
				songsQueue = `**${index}.** ${currentQueue[i].title}\n ${songsQueue}`;
				if (i === currentQueue.length - 1 && queue.length - 1 > currentQueue.length) {
					const overflow = queue.length - currentQueue.length - 1;
					if (overflow === 1) {
						continue;
					} else if (overflow > 1) {
						// songsQueue = `There are **${overflow}** more songs in the queue..\n ${songsQueue}`;
						songsQueue = i18n.__mf('npmessage.overflow', { overflow, songsQueue });
					}
				}
			}
			// outputQueue = `__**Up Next:**__\n ${songsQueue}`;
			outputQueue = i18n.__mf('npmessage.outputQueue', { songsQueue });
		}
		let newEmbed = {};
		if (npSong === undefined) {
			newEmbed = new MessageEmbed()
				.setColor('#5865F2')
				.setTitle(i18n.__('npmessage.title'))
				.setURL('')
				.setImage('https://i.imgur.com/TObp4E6.jpg')
				.setFooter(i18n.__mf('npmessage.prefix', { prefix }));
		} else {
			newEmbed = new MessageEmbed()
				.setColor('#5865F2')
				.setTitle(i18n.__mf('npmessage.titleSong', { title: npSong.title }))
				.setURL(npSong.url)
				.setImage(npSong.thumbUrl)
				.setFooter(i18n.__mf('npmessage.prefix', { prefix }));
		}

		const output1 = await musicChannel.messages
			.fetch({ limit: 10 })
			.then(async (messages) => {
				const outputArr = [];
				outputArr[0] = await messages.get(playingMessageId);
				// Change now playing message to match current song
				outputArr[0].edit({ content: outputQueue, embeds: [newEmbed] });
				// outputArr[0].edit({ content: outputQueue, embeds: [newEmbed] });
				return outputArr;
			})
			.then(async (outputArr) => {
				const filter = (reaction, user) => user.id !== (message ? message.client : client).user.id;

				const outputVar = outputArr;
				outputVar[1] = outputArr[0].createReactionCollector({
					filter,
					time: npSong === undefined || npSong.duration < 0 ? 600000 : npSong.duration * 1000,
				});

				return outputVar;
			})
			.catch(console.error);

		return output1;
		// outputs an arrray with the first item being the playingMessage and the second being the reaction collector
	},
};
