/* global __base */
const { canModifyQueue, LOCALE } = require(`${__base}include/utils`);
const { npMessage } = require(`${__base}include/npmessage`);
const i18n = require('i18n');
const { reply, followUp } = require(`../../include/responses`);

i18n.setLocale(LOCALE);

const pattern = /^[0-9]{1,2}(\s*,\s*[0-9]{1,2})*$/;
/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */
module.exports = {
	name: 'remove',
	category: 'music',
	description: i18n.__('remove.description'),
	guildOnly: 'true',
	testOnly: true,
	slash: true,
	options: [
		{
			name: 'songnumbers',
			description: i18n.__('remove.optionDescription'),
			type: 'STRING',
			required: true,
		},
	],
	/**
	 *
	 * @param {{interaction: CommandInteraction, args: Array<String>, prefix: String}}
	 * @returns
	 */
	async callback({ interaction, args, prefix }) {
		await interaction.deferReply({ ephemeral: true });
		if (prefix === undefined) {
			prefix = 'unset';
		}
		const queue = interaction.client.queue.get(interaction.guildId);
		if (!canModifyQueue(interaction.member)) {
			return reply({
				interaction,
				content: i18n.__('common.errorNotChannel'),
				ephemeral: true,
			});
		}
		if (!queue) {
			return reply({ interaction, content: i18n.__('remove.errorNotQueue'), ephemeral: true });
		}

		args = args[0].split(' ');
		const songs = args.map((arg) => parseInt(arg, 10));
		const removed = [];

		if (pattern.test(args)) {
			queue.songs = queue.songs.filter((item, index) => {
				if (songs.find((songIndex) => songIndex === index)) {
					removed.push(item);
					return false;
				}
				return true;
			});
			npMessage({ interaction, prefix, npSong: queue.songs[0] });
			await reply({ interaction, content: 'Successfully removed song(s)', ephemeral: true });
			followUp({
				interaction,
				content: `<@${interaction.member.id}> ❌ removed: \n- **${removed
					.map((song) => song.title)
					.join('\n- ')}** \nfrom the queue.`,
				ephemeral: false,
			});
		} else if (!Number.isNaN(args[0]) && args[0] >= 1 && args[0] <= queue.songs.length) {
			reply({ interaction, content: 'Successfully removed song(s)', ephemeral: true });
			followUp({
				interaction,
				content: `<@${interaction.member.id}> ❌ removed **${
					queue.songs.splice(args[0] - 1, 1)[0].title
				}** from the queue.`,
				ephemeral: false,
			});
			return npMessage({ interaction, prefix, npSong: queue.songs[0] });
		} else {
			reply({ interaction, content: i18n.__mf('remove.usageReply', { prefix }), ephemeral: false });
			return npMessage({ interaction, prefix, npSong: queue.songs[0] });
		}
	},
};

