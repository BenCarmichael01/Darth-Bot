import Youtube from 'youtube.ts';
import i18n from 'i18n';
import he from 'he';
import * as discordjs from 'discord.js';
import WOKCommands, { ICommand } from 'wokcommands';
import * as voice from '@discordjs/voice';

import { YOUTUBE_API_KEY, LOCALE } from '../../include/utils';
import { reply } from '../../include/responses';

const { MessageEmbed, MessageButton, MessageActionRow } = discordjs;
const youtube = new Youtube(YOUTUBE_API_KEY);

if (LOCALE) i18n.setLocale(LOCALE);
export default {
	name: 'search',
	category: 'music',
	description: i18n.__('search.description'),
	guildOnly: true,
	slash: true,
	options: [
		{
			name: 'search',
			description: 'The term to search for',
			type: 'STRING',
			required: true,
		},
	],
	async callback({
		interaction,
		instance,
		args,
	}: {
		interaction: discordjs.CommandInteraction;
		instance: WOKCommands;
		args: Array<string>;
	}): Promise<discordjs.Message | undefined> {
		await interaction.deferReply({ ephemeral: true });

		if (typeof interaction.guildId === 'string') {
			var GUILDID = interaction.guildId as string;
		} else return;
		const settings = interaction.client.db.get(interaction.guildId);

		if (!settings?.musicChannel) {
			reply({ interaction, content: i18n.__('common.noSetup'), ephemeral: true });
			return;
		}
		var userVc;
		if ('voice' in interaction.member!) {
			userVc = interaction.member.voice?.channel;
		} else {
			return await reply({ interaction, content: i18n.__('search.errorNotChannel'), ephemeral: true });
		}

		if (!userVc) {
			reply({ interaction, content: i18n.__('play.errorNotChannel'), ephemeral: true });
			return;
		}
		const serverQueue = interaction.client.queue.get(GUILDID);
		const myVoice = voice.getVoiceConnection(GUILDID);
		if (serverQueue && myVoice && userVc.id !== myVoice.joinConfig.channelId) {
			reply({
				interaction,
				content: i18n.__mf('play.errorNotInSameChannel', {
					user: interaction.client.user,
				}),
				ephemeral: true,
			});
			return;
		}

		const search = args[0];

		let resultsEmbed = new MessageEmbed()
			.setTitle(i18n.__('search.resultEmbedTtile'))
			.setDescription(i18n.__mf('search.resultEmbedDesc', { search: search }))
			.setColor('#F8AA2A');

		try {
			const results = await youtube.videos.search({ q: search, maxResults: 5 });
			// console.log(results.items[0].id);
			results.items.map((video, index) => {
				video.snippet.title = he.decode(video.snippet.title);
				let vidURL = `https://youtu.be/${video.id.videoId}`;
				resultsEmbed.addField(`${index + 1}. ${video.snippet.title}`, vidURL);
			});
			let searchEmbed = new MessageEmbed().setTitle('Searching...').setColor('#F8AA2A');

			await interaction.editReply({ embeds: [searchEmbed] });

			const buttons = [
				new MessageButton().setCustomId('one').setLabel('1').setStyle('PRIMARY'),
				new MessageButton().setCustomId('two').setLabel('2').setStyle('PRIMARY'),
				new MessageButton().setCustomId('three').setLabel('3').setStyle('PRIMARY'),
				new MessageButton().setCustomId('four').setLabel('4').setStyle('PRIMARY'),
				new MessageButton().setCustomId('five').setLabel('5').setStyle('PRIMARY'),
			];
			const row = new MessageActionRow().addComponents(...buttons);

			await interaction.editReply({
				embeds: [resultsEmbed],
				components: [row],
			});

			const collector = await interaction
				.fetchReply()
				.then((reply) => {
					if ('createMessageComponentCollector' in reply) {
						return reply.createMessageComponentCollector({
							time: 30_000,
							componentType: 'BUTTON',
						});
					}
				})
				.catch(console.error);
			// TODO return with error message below
			if (!collector) return;
			collector.on('collect', async (i) => {
				await i.deferReply({ ephemeral: true });
				switch (i.customId) {
					case 'one': {
						const choice = resultsEmbed.fields[0].name;
						instance.commandHandler
							.getCommand('play')
							.callback({ interaction: i, args: [choice] });
						collector.stop('choiceMade');
						break;
					}
					case 'two': {
						const choice = resultsEmbed.fields[1].name;
						instance.commandHandler
							.getCommand('play')
							.callback({ interaction: i, args: [choice] });
						collector.stop('choiceMade');
						break;
					}
					case 'three': {
						const choice = resultsEmbed.fields[2].name;
						instance.commandHandler
							.getCommand('play')
							.callback({ interaction: i, args: [choice] });
						collector.stop('choiceMade');
						break;
					}
					case 'four': {
						const choice = resultsEmbed.fields[3].name;
						instance.commandHandler
							.getCommand('play')
							.callback({ interaction: i, args: [choice] });
						collector.stop('choiceMade');
						break;
					}
					case 'five': {
						const choice = resultsEmbed.fields[4].name;
						instance.commandHandler
							.getCommand('play')
							.callback({ interaction: i, args: [choice] });
						collector.stop('choiceMade');
						break;
					}
				}
			});
			collector.on('end', (_, reason) => {
				if (reason === 'time') {
					const timeEmbed = new MessageEmbed()
						.setTitle(i18n.__('search.timeout'))
						.setColor('#F8AA2A');
					interaction.editReply({
						embeds: [timeEmbed],
						components: [],
					});
				}
			});
		} catch (error) {
			console.error(error);
		}
	},
} as ICommand;
