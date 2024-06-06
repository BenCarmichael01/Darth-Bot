﻿/* global __base */
import i18n from 'i18n';
import Discord, { ButtonInteraction, ComponentType, Embed, EmbedBuilder } from 'discord.js';

import { LOCALE } from './utils';
import { Isong } from 'src/types/types';

if (LOCALE) i18n.setLocale(LOCALE);

interface arguments {
	client?: Discord.Client;
	npSong?: any;
	guildIdParam?: string;
	interaction?: Discord.ButtonInteraction | Discord.CommandInteraction;
	message?: Discord.Message;
}
interface output {
	npmessage: Discord.Message | undefined;
	collector: Discord.InteractionCollector<ButtonInteraction<"cached">> | undefined;
}
export async function npMessage(args: arguments): Promise<{
	npmessage?: Discord.Message | undefined;
	collector?: Discord.InteractionCollector<ButtonInteraction<"cached">> | undefined;
	error?: string;
}> {
	const { client, npSong, guildIdParam, interaction, message } = args;
	let i;
	if (!message && interaction && !guildIdParam) {
		i = interaction;
	} else if (message) {
		i = message;
	}

	const guildId = (guildIdParam ? guildIdParam : i?.guildId) as string;

	let settings;
	if (client) {
		settings = await client.db.findOne({where: {id: guildId}});
	} else if (i) {
		settings = await i.client.db.findOne({where: {id: guildId}});
	}
	if (!settings) return { error: 'nosettings' };
	const MUSIC_CHANNEL_ID = settings.get('musicChannel');
	const playingMessageId = settings.get('playingMessage');

	let musicChannel;
	if (i === undefined && client) {
		let cacheGuild = client.guilds.cache.get(guildId);
		musicChannel = await cacheGuild?.channels.fetch(MUSIC_CHANNEL_ID);
		if (!musicChannel) {
			return { error: 'noMusicChannel1' };
		}
	} else if (i) {
		musicChannel = i.client.channels.cache.get(MUSIC_CHANNEL_ID);
	}

	if (!musicChannel) {
		if (!i) {
			console.error('music channel not found');
			return { error: 'noMusicChannel2' };
		}
		if ('isButton' in i) {
			i.reply({
				content:
					'There has been an error with the Now Playing message\nPlease consult an administrator to re-run setup.',
			});
		}
		return { error: 'noMusicChannel3' };
	}
	let queue: Isong[] | undefined;
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
		newEmbed = new EmbedBuilder()
			.setColor('#5865F2')
			.setTitle(i18n.__('npmessage.title'))
			.setURL('')
			.setImage('https://i.imgur.com/TObp4E6.jpg')
			.setFooter({ text: i18n.__('npmessage.footer') });
	} else {
		newEmbed = new EmbedBuilder()
			.setColor('#5865F2')
			.setTitle(i18n.__mf('npmessage.titleSong', { title: npSong.title }))
			.setURL(npSong.url)
			.setImage(npSong.thumbUrl)
			.setFooter({ text: i18n.__('npmessage.footer') });
	}

	const messages = await (musicChannel as Discord.TextChannel).messages.fetch({ limit: 10 });

	const npmessage = messages.get(playingMessageId);
	if (!npmessage) {
		throw new Error('cannot get npmessage');
	}
	// output.npmessage = await messages.get(playingMessageId);
	// Change now playing message to match current song
	npmessage?.edit({ content: outputQueue, embeds: [newEmbed] });
	// outputArr[0].edit({ content: outputQueue, embeds: [newEmbed] });

	const collector = npmessage?.createMessageComponentCollector({ componentType: ComponentType.Button });

	const output: output = { npmessage, collector };
	return output;
}
