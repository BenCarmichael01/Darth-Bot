/* global __base */
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
	 * @param {DiscordInteraction} args.interaction
	 * @returns {[DiscordMessage, MessageReactionCollector]} An array where the first item is the sent message object and the second is the reaction collector
	 */
	async npMessage({ client, npSong, guildIdParam, interaction, message }) {
		let i;
		if (!message && interaction && !guildIdParam) {
			i = interaction;
		} else if (message) {
			i = message;
		} else {
			i = undefined;
		}
		const guildId = guildIdParam ? guildIdParam : i.guildId;
		const settings = await findById(guildId);

		const MUSIC_CHANNEL_ID = settings.musicChannel;
		const playingMessageId = settings.playingMessage;

		let musicChannel = '';
		if (i === undefined) {
			musicChannel = await client.guilds.cache.get(guildId).channels.cache.get(MUSIC_CHANNEL_ID);
			if (!musicChannel) {
				return [];
			}
		} else {
			musicChannel = await i.client.channels.cache.get(MUSIC_CHANNEL_ID);
		}
		let queue = [];
		if (i !== undefined && npSong !== undefined) {
			queue = i.client.queue.get(i.guildId)?.songs;
		}

		var outputQueue = i18n.__('npmessage.emptyQueue');
		var songsQueue = '';
		if (queue) {
			const displayQueue = queue.slice(1, 11);

			let index = 0;
			for (let i = 0; i < displayQueue.length; i++) {
				index = i + 1;
				songsQueue = `**${index}.** ${displayQueue[i].title}\n ${songsQueue}`;
				if (i === displayQueue.length - 1 && queue.length - 1 > displayQueue.length) {
					const overflow = queue.length - 1 - displayQueue.length;
					if (overflow === 1 && i < displayQueue.length) {
						songsQueue = `**${index + 1}.** ${queue[i + 2].title}\n ${songsQueue}`;
						break;
					} else if (overflow > 1) {
						songsQueue = i18n.__mf('npmessage.overflow', { overflow, songsQueue });
						break;
					}
				}
			}
			outputQueue = i18n.__mf('npmessage.outputQueue', { songsQueue });
		}
		let newEmbed = {};
		if (npSong === undefined) {
			newEmbed = new MessageEmbed()
				.setColor('#5865F2')
				.setTitle(i18n.__('npmessage.title'))
				.setURL('')
				.setImage('https://i.imgur.com/TObp4E6.jpg');
			//.setFooter(i18n.__mf('npmessage.prefix', { prefix }));
		} else {
			newEmbed = new MessageEmbed()
				.setColor('#5865F2')
				.setTitle(i18n.__mf('npmessage.titleSong', { title: npSong.title }))
				.setURL(npSong.url)
				.setImage(npSong.thumbUrl);
			//.setFooter(i18n.__mf('npmessage.prefix', { prefix }));
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
				const outputVar = outputArr;
				outputVar[1] = outputArr[0].createMessageComponentCollector({ componentType: 'BUTTON' });
				return outputVar;
			})
			.catch(console.error);

		return output1;
		// outputs an arrray with the first item being the playingMessage and the second being the reaction collector
	},
};
