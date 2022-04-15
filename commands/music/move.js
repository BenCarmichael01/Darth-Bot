/* global __base */
const move = require('array-move');
const i18n = require('i18n');

const { canModifyQueue, LOCALE, MSGTIMEOUT } = require(`${__base}/include/utils`);
const { npMessage } = require(`${__base}include/npmessage`);

i18n.setLocale(LOCALE);

module.exports = {
	name: 'move',
	aliases: ['mv'],
	category: 'music',
	description: i18n.__('move.description'),
	guildOnly: 'true',
	usage: i18n.__('move.usagesReply'),
	testOnly: true,
	slash: true,
	options: [
		{
			name: 'from',
			description: i18n.__('move.fromDescription'),
			type: 'INTEGER',
			required: true,
		},
		{
			name: 'to',
			description: i18n.__('move.toDescription'),
			type: 'INTEGER',
			required: true,
		},
	],

	async callback({ interaction, args, prefix, client }) {
		try {
			await interaction.deferReply({ ephemeral: true });
			const queue = client.queue.get(interaction.guildId);
			if (!queue) {
				return interaction.editReply({ content: i18n.__('move.errorNotQueue'), ephemeral: true });
			}
			if (!canModifyQueue(interaction.member)) return;

			// if (!args.length) {
			// 	return message
			// 		.reply(i18n.__mf('move.usagesReply', { prefix }))
			// 		.then((msg) => {
			// 			setTimeout(() => msg.delete(), MSGTIMEOUT);
			// 		})
			// 		.catch(console.error);
			// }
			if (Number.isNaN(args[0]) || args[0] < 1) {
				return interaction.editReply({
					content: i18n.__mf('move.usagesReply', { prefix }),
					ephemeral: true,
				});
			}

			const currentPos = args[0];
			const newPos = args[1];
			const song = queue.songs[newPos];
			if (currentPos > queue.songs.length - 1 || newPos > queue.songs.length - 1) {
				return interaction.editReply({ content: i18n.__('move.range'), ephemeral: true });
			}
			queue.songs = move(queue.songs, currentPos, newPos);
			npMessage({ interaction, npSong: queue.songs[0], prefix });
			await interaction.editReply({ content: i18n.__('move.success'), ephemeral: true });
			interaction
				.followUp(
					i18n.__mf('move.result', {
						author: interaction.member.id,
						title: song.title,
						index: newPos,
					}),
				)
				.then((msg) => {
					setTimeout(() => {
						msg.delete();
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		} catch (error) {
			console.error(error);
			interaction
				.followUp({ content: 'Sorry, an unexpected error has occured.', ephemeral: true })
				.catch(console.error);
		}
	},
};
