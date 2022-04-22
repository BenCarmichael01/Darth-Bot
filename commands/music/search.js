/* global __base */
const YouTubeAPI = require('simple-youtube-api');
const { YOUTUBE_API_KEY, LOCALE } = require(`${__base}include/utils`);
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);
const i18n = require('i18n');
const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');
const { reply } = require(`../../include/responses`);

i18n.setLocale(LOCALE);
/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 * @typedef {import('discord.js').Message} Message
 */

module.exports = {
	name: 'search',
	category: 'music',
	description: i18n.__('search.description'),
	guildOnly: 'true',
	slash: true,
	testOnly: true,
	options: [
		{
			name: 'search',
			description: 'The term to search for',
			type: 'STRING',
			required: true,
		},
	],
	/**
	 *
	 * @param {{ interaction: CommandInteraction, args: Array<String>}}
	 * @returns {Void}
	 */
	async callback({ interaction, instance, args, prefix }) {
		await interaction.deferReply({ ephemeral: true });
		// if (interaction.channel.activeCollector) return message.reply(i18n.__('search.errorAlreadyCollector'));
		if (!interaction.member.voice)
			return await reply({ interaction, content: i18n.__('search.errorNotChannel'), ephemeral: true });

		// const search = args.join(' ');
		const search = args[0];

		let resultsEmbed = new MessageEmbed()
			.setTitle(i18n.__('search.resultEmbedTtile'))
			.setDescription(i18n.__mf('search.resultEmbedDesc', { search: search }))
			.setColor('#F8AA2A');

		try {
			const results = await youtube.searchVideos(search, 5);
			results.map((video, index) =>
				resultsEmbed.addField(video.shortURL, `${index + 1}. ${video.title}`),
			);
			let searchEmbed = new MessageEmbed().setTitle('Searching...').setColor('#F8AA2A');
			// await interaction.editReply({ content: 'searching...', ephemeral: true });
			await interaction.editReply({ embeds: [searchEmbed], ephemeral: true });

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
				ephemeral: true,
			});

			const collector = await interaction
				.fetchReply()
				.then((reply) => {
					return reply.createMessageComponentCollector({
						time: 30_000,
						componentType: 'BUTTON',
					});
				})
				.catch(console.error);

			collector.on('collect', async (i) => {
				await i.deferReply({ ephemeral: true });
				switch (i.customId) {
					case 'one': {
						const choice = resultsEmbed.fields[0].name;
						instance.commandHandler
							.getCommand('play')
							.callback({ interaction: i, args: [choice], prefix });
						collector.stop('choiceMade');
						break;
					}
					case 'two': {
						const choice = resultsEmbed.fields[1].name;
						instance.commandHandler
							.getCommand('play')
							.callback({ interaction: i, args: [choice], prefix });
						collector.stop('choiceMade');
						break;
					}
					case 'three': {
						const choice = resultsEmbed.fields[2].name;
						instance.commandHandler
							.getCommand('play')
							.callback({ interaction: i, args: [choice], prefix });
						collector.stop('choiceMade');
						break;
					}
					case 'four': {
						const choice = resultsEmbed.fields[3].name;
						instance.commandHandler
							.getCommand('play')
							.callback({ interaction: i, args: [choice], prefix });
						collector.stop('choiceMade');
						break;
					}
					case 'five': {
						const choice = resultsEmbed.fields[4].name;
						instance.commandHandler
							.getCommand('play')
							.callback({ interaction: i, args: [choice], prefix });
						collector.stop('choiceMade');
						break;
					}
				}
			});
		} catch (error) {
			console.error(error);
		}
	},
};
