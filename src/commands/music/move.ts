/* global __base */
import i18n from 'i18n';
import { canModifyQueue, LOCALE, MSGTIMEOUT } from '../../include/utils';
import { npMessage } from '../../include/npmessage';
import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from 'discord.js';
import {myClient} from '../../types/types';

if (LOCALE) i18n.setLocale(LOCALE);
function arraymove(array: Array<any>, fromIndex: number, toIndex: number) {
	var element = array[fromIndex];
	array.splice(fromIndex, 1);
	array.splice(toIndex, 0, element);
	return array;
}
module.exports = {
	data: new SlashCommandBuilder()
			.setName('move')
			.setDescription(i18n.__('move.description'))
			.addNumberOption(option =>
				option.setName('from')
				.setDescription(i18n.__('move.fromDescription'))
				.setRequired(true)
			)
			.addNumberOption(option => 
				option.setName('to')
				.setDescription(i18n.__('move.toDescription'))
				.setRequired(true)
			).setDMPermission(false),
			
	async execute(interaction: ChatInputCommandInteraction) {
		try {
			await interaction.deferReply({ ephemeral: true });
			if (!interaction.guild) {
				interaction.reply({ content: i18n.__('common.unknownError'), ephemeral: true });
				return;
			}
			const client = interaction.client as myClient;
			const queue = client.queue.get(interaction.guild.id);
			if (!queue) {
				return interaction.editReply({ content: i18n.__('move.errorNotQueue') });
			}

			if (interaction.member) {
				var member = interaction.member as GuildMember;
			} else {
				interaction.reply({ content: i18n.__('common.unknownError'), ephemeral: true });
				return;
			}

			if (!canModifyQueue(member)) return;
			// Shouldn't be needed with required options
			// if (Number.isNaN(args[0]) || parseInt(args[0]) < 1) {
			// 	return interaction.editReply({
			// 		content: i18n.__mf('move.usagesReply', { prefix: '/' }),
			// 	});
			// }

			const currentPos = interaction.options.getInteger('from');
			const newPos = interaction.options.getInteger('to');

			if (!currentPos || !newPos ) return;

			const song = queue.songs[newPos];
			if (currentPos > queue.songs.length - 1 || newPos > queue.songs.length - 1) {
				return interaction.editReply({ content: i18n.__('move.range') });
			}

			queue.songs = arraymove(queue.songs, currentPos, newPos);
			npMessage({ interaction, npSong: queue.songs[0] });
			await interaction.editReply({ content: i18n.__('move.success') });
			interaction.followUp({
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
				.followUp({ content: i18n.__('common.unknownError'), ephemeral: true })
				.catch(console.error);
		}
	}		

}
