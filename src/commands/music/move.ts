/* global __base */
import move from 'array-move';
import i18n from 'i18n';

import { canModifyQueue, LOCALE, MSGTIMEOUT } from '../../include/utils';
import { npMessage } from '../../include/npmessage';
import { Client, CommandInteraction, GuildMember, Message } from 'discord.js';
import { followUp } from '../../include/responses';

// i18n.setLocale(LOCALE);

module.exports = {
	name: 'move',
	aliases: ['mv'],
	category: 'music',
	description: i18n.__('move.description'),
	guildOnly: 'true',
	usage: i18n.__('move.usagesReply'),
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

	async callback({
		interaction,
		args,
		client,
	}: {
		interaction: CommandInteraction;
		args: string[];
		client: Client;
	}) {
		try {
			await interaction.deferReply({ ephemeral: true });
			if (!interaction.guild) return; // TODO return error message
			const queue = client.queue.get(interaction.guild.id);
			if (!queue) {
				return interaction.editReply({ content: i18n.__('move.errorNotQueue') });
			}

			if (interaction.member) {
				var member = interaction.member as GuildMember;
			} else return; // TODO return error message

			if (!canModifyQueue(member)) return;
			if (Number.isNaN(args[0]) || parseInt(args[0]) < 1) {
				return interaction.editReply({
					content: i18n.__mf('move.usagesReply', { prefix: '/' }),
				});
			}

			const currentPos = parseInt(args[0]);
			const newPos = parseInt(args[1]);
			const song = queue.songs[newPos];
			if (currentPos > queue.songs.length - 1 || newPos > queue.songs.length - 1) {
				return interaction.editReply({ content: i18n.__('move.range') });
			}
			queue.songs = move(queue.songs, currentPos, newPos);
			npMessage({ interaction, npSong: queue.songs[0] });
			await interaction.editReply({ content: i18n.__('move.success') });
			followUp({
				interaction,
				content: i18n.__mf('move.result', {
					author: member.id,
					title: song.title,
					index: newPos,
				}),
			})
				.then((msg) => {
					setTimeout(() => {
						if (msg) {
							msg.delete();
						}
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
