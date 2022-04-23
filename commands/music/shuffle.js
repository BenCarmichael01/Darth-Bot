/* global __base */
const { canModifyQueue, LOCALE, MSGTIMEOUT } = require(`${__base}include/utils`);
const { npMessage } = require(`${__base}include/npmessage`);
const i18n = require('i18n');
const { reply } = require(`../../include/responses`);

i18n.setLocale(LOCALE);

module.exports = {
	name: 'shuffle',
	category: 'music',
	description: i18n.__('shuffle.description'),
	guildOnly: 'true',
	slash: true,
	testOnly: true,

	async callback({ interaction, prefix }) {
		try {
			await interaction.deferReply({ ephemeral: true });
			// const command = message ? message : interaction;
			const queue = interaction.client.queue.get(interaction.guildId);
			if (!queue) {
				return reply({ interaction, content: i18n.__('shuffle.errorNotQueue'), ephemeral: true });
			}
			if (!canModifyQueue(interaction.member)) {
				return reply({ interaction, content: i18n.__('common.errorNotChannel'), ephemeral: true });
			}
			const { songs } = queue;
			for (let i = songs.length - 1; i > 1; i--) {
				const j = 1 + Math.floor(Math.random() * i);
				[songs[i], songs[j]] = [songs[j], songs[i]];
			}
			queue.songs = songs;
			interaction.client.queue.set(interaction.guildId, queue);
			npMessage({ interaction, npSong: songs[0], prefix });
			reply({
				interaction,
				content: i18n.__('shuffle.success'),
				ephemeral: true,
			});
			queue.textChannel
				.send({
					content: i18n.__mf('shuffle.result', { author: interaction.member.id }),
					ephemeral: false,
				})
				.then((msg) => {
					setTimeout(() => {
						msg.delete().catch(console.error);
					}, MSGTIMEOUT);
				})
				.catch(console.error);
			return;
		} catch (error) {
			console.error(error);
		}
	},
};
