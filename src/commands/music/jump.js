/* global __base */
const { canModifyQueue, LOCALE, MSGTIMEOUT } = require(`${__base}include/utils`);
const i18n = require('i18n');
const { reply } = require(`../../include/responses`);

// i18n.setLocale(LOCALE);
/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 * @typedef {import('discord.js').Message} Message
 */

module.exports = {
	name: 'jump',
	category: 'music',
	description: i18n.__('jump.description'),
	guildOnly: 'true',
	slash: true,
	options: [
		{
			name: 'number',
			description: 'Queue number to skip to',
			type: 'INTEGER',
			minValue: 0,
			required: true,
		},
	],
	/**
	 *
	 * @param {{interaction: CommandInteraction, args: Array<Strings> }}
	 * @returns
	 */
	async callback({ interaction, args }) {
		await interaction.deferReply({ ephemeral: true });

		const queue = interaction.client.queue.get(interaction.guildId);
		if (!queue)
			return reply({
				interaction,
				content: i18n.__('jump.errorNotQueue'),
				ephemeral: true,
			});

		if (!canModifyQueue(interaction.member)) {
			return reply({
				interaction,
				content: i18n.__('common.errorNotChannel'),
				ephemeral: true,
			});
		}
		if (args[0] > queue.songs.length) {
			return reply({
				interaction,
				content: i18n.__mf('jump.errorNotValid', {
					length: queue.songs.length,
				}),
				ephemeral: true,
			});
		}
		queue.playing = true;

		if (queue.loop) {
			for (let i = 0; i < args[0]; i++) {
				queue.songs.push(queue.songs.shift());
			}
		} else {
			queue.songs = queue.songs.slice(args[0]);
		}
		queue.player.emit('jump');
		reply({
			interaction,
			content: i18n.__mf('jump.success', { track: args[0] }),
		});
		queue.textChannel
			.send(
				i18n.__mf('jump.result', {
					author: interaction.member.id,
					arg: args[0] - 1,
				}),
			)
			.then((msg) => {
				setTimeout(() => {
					msg.delete().catch(console.error);
				}, MSGTIMEOUT);
			})
			.catch(console.error);
	},
};