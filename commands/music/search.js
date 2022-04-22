/* global __base */
const YouTubeAPI = require('simple-youtube-api');
const { YOUTUBE_API_KEY, LOCALE } = require(`${__base}include/utils`);
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);
const i18n = require('i18n');
const { MessageEmbed, MessageButton, MessageActionRow, Client } = require('discord.js');
const { reply, followUp } = require(`../../include/responses`);

i18n.setLocale(LOCALE);
/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 * @typedef {import('discord.js').Message} Message
 */

function filter(msg) {
	const pattern = /^[0-9]{1,2}(\s*,\s*[0-9]{1,2})*$/;
	return pattern.test(msg.content);
}

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
	async callback({ client, interaction, instance, args, prefix }) {
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
			// await interaction.editReply({ content: 'searching...', ephemeral: true });
			await reply({ interaction, content: 'Searching...', ephemeral: true });

			const buttons = [
				new MessageButton().setCustomId('one').setLabel('1').setStyle('PRIMARY'),
				new MessageButton().setCustomId('two').setLabel('2').setStyle('PRIMARY'),
				new MessageButton().setCustomId('three').setLabel('3').setStyle('PRIMARY'),
				new MessageButton().setCustomId('four').setLabel('4').setStyle('PRIMARY'),
				new MessageButton().setCustomId('five').setLabel('5').setStyle('PRIMARY'),
			];
			const row = new MessageActionRow().addComponents(...buttons);
			const resultsMessage = await interaction.followUp({
				embeds: [resultsEmbed],
				components: [row],
				fetchReply: true,
			});
			// const filter = (interaction) => {
			// 	// interaction.message.id === resultsMessage.id;
			// };
			const collector = await resultsMessage.createMessageComponentCollector({
				time: 30_000,
				componentType: 'BUTTON',
			});
			collector.on('collect', async (i) => {
				console.log('why');
				i.deferReply({ ephemeral: true });
				switch (i.customId) {
					case 'one': {
						const choice = resultsEmbed.fields[0].name;
						await i.editReply({
							content: `Now playing: ${results[0].title}`,
							ephemeral: true,
						});
						instance.commandHandler
							.getCommand('play')
							.callback({ interaction: i, args: [choice], prefix });
						break;
					}
					case 'two': {
						const choice = resultsEmbed.fields[1].name;
						instance.commandHandler
							.getCommand('play')
							.callback({ interaction: i, args: [choice], prefix });
						break;
					}
					case 'three': {
						const choice = resultsEmbed.fields[2].name;
						instance.commandHandler
							.getCommand('play')
							.callback({ interaction: i, args: [choice], prefix });
						break;
					}
					case 'four': {
						const choice = resultsEmbed.fields[3].name;
						instance.commandHandler
							.getCommand('play')
							.callback({ interaction: i, args: [choice], prefix });
						break;
					}
					case 'five': {
						const choice = resultsEmbed.fields[4].name;
						instance.commandHandler
							.getCommand('play')
							.callback({ interaction: i, args: [choice], prefix });
						break;
					}
				}
			});
			collector.on('end', () => {
				console.log('end');
			});
			// interaction.channel.activeCollector = true;
			// const response = await interaction.channel.awaitMessages(filter, {
			// 	max: 1,
			// 	time: 30000,
			// 	errors: ['time'],
			// });
			// const answer = response.first().content;

			// if (reply.includes(',')) {
			// 	let songs = reply.split(',').map((str) => str.trim());

			// 	for (let song of songs) {
			// 		await message.client.commands
			// 			.get('play')
			// 			.execute(message, [resultsEmbed.fields[parseInt(song) - 1].name]);
			// 	}
			// } else {
			// 	const choice = resultsEmbed.fields[parseInt(response.first()) - 1].name;
			// 	message.client.commands.get('play').execute(message, [choice]);
			// }

			// message.channel.activeCollector = false;
			setTimeout(() => {
				resultsMessage.delete().catch(console.error);
			}, 30_000);

			// response.first().delete().catch(console.error);
		} catch (error) {
			console.error(error);
			interaction.channel.activeCollector = false;
			// message.reply(error.message).catch(console.error);
		}
	},
};
