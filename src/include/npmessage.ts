﻿/* global __base */
import i18n from 'i18n';
import Discord from 'discord.js';

import { LOCALE } from './utils';

if (LOCALE) i18n.setLocale(LOCALE);
// TODO update npmessage when prefix is changed
interface arguments {
	client?: Discord.Client,
	npSong?: any,
	guildIdParam?: string,
	interaction?: Discord.CommandInteraction,
	message?: Discord.Message
}
interface output {
	npmessage: Discord.Message | undefined,
	collector: Discord.InteractionCollector<Discord.ButtonInteraction> | undefined
}
export
	async function npMessage(args: arguments):
	Promise<{
	npmessage?: Discord.Message | undefined,
	collector?: Discord.InteractionCollector<Discord.ButtonInteraction> | undefined
}> {
	const { client, npSong, guildIdParam, interaction, message } = args;
	let i;
	if (!message && interaction && !guildIdParam) {
		i = interaction;
	} else if (message) {
		i = message;
	};
	const guildId =(guildIdParam ? guildIdParam : i?.guildId) as string;
	let settings;
	if (client) {
		settings = client.db.get(guildId);
	} else if (i) {
		settings = i.client.db.get(guildId);
	}
	if (!settings) return {} as output;
	const MUSIC_CHANNEL_ID = settings.musicChannel;
	const playingMessageId = settings.playingMessage;

	let musicChannel;
	if (i === undefined && client) {
		musicChannel = await client.guilds.cache.get(guildId)?.channels.cache.get(MUSIC_CHANNEL_ID);
		if (!musicChannel) {
			return {};
		}
	} else if (i){
		musicChannel = await i.client.channels.cache.get(MUSIC_CHANNEL_ID);
	}

	if (!musicChannel) {
		if (!i) return {};
		i.reply({ content: 'There has been an error with the Now Playing message\nPlease consult an administrator to re-run setup.'})
		return {};
	}
	let queue = [];
	if (i && npSong && guildId !== null) {
		queue = i.client.queue.get(guildId)?.songs;
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
		newEmbed = new Discord.MessageEmbed()
			.setColor('#5865F2')
			.setTitle(i18n.__('npmessage.title'))
			.setURL('')
			.setImage('https://i.imgur.com/TObp4E6.jpg')
			.setFooter({ text: i18n.__('npmessage.footer') });
	} else {
		newEmbed = new Discord.MessageEmbed()
			.setColor('#5865F2')
			.setTitle(i18n.__mf('npmessage.titleSong', { title: npSong.title }))
			.setURL(npSong.url)
			.setImage(npSong.thumbUrl)
			.setFooter({ text: i18n.__('npmessage.footer') });
	}

	const output = await (musicChannel as Discord.TextChannel).messages
		.fetch({ limit: 10 })
		.then(async (messages) => {
			const npmessage = messages.get(playingMessageId);
			// output.npmessage = await messages.get(playingMessageId);
			// Change now playing message to match current song
			npmessage?.edit({ content: outputQueue, embeds: [newEmbed] });
			// outputArr[0].edit({ content: outputQueue, embeds: [newEmbed] });
			return npmessage;
		})
		.then(async (npmessage) => {
			const collector = npmessage?.createMessageComponentCollector({ componentType: 'BUTTON' });
			const output: output = { npmessage, collector };
			return output;
		})
		.catch(console.error);

	return output as output;
}
