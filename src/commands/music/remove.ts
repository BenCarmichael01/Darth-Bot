//@ts-check
import { canModifyQueue, LOCALE } from '../../include/utils';
import { npMessage } from '../../include/npmessage';
import { GuildMember, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Isong } from '../../types/types';
import i18n from 'i18n';

if (LOCALE) i18n.setLocale(LOCALE);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription(i18n.__('remove.description'))
		.addIntegerOption(option => 
			option.setName('firstsong')
			.setDescription(i18n.__('remove.optionDescription'))
			.setRequired(true)
		)
		.addIntegerOption(option => 
			option.setName('secondsong')
			.setDescription(i18n.__('remove.optionDescription'))
			.setRequired(false)
		)
		.addIntegerOption(option => 
			option.setName('thirdsong')
			.setDescription(i18n.__('remove.optionDescription'))
			.setRequired(false)
		),

		async execute(interaction: ChatInputCommandInteraction) {
			await interaction.deferReply({ ephemeral: true });

			if (!interaction.guild) return;
			const queue = interaction.client.queue.get(interaction.guild.id);

			if (interaction.member) {
				var member = interaction.member as GuildMember;
			} else {
				interaction.reply({ content: i18n.__('common.unknownError'), ephemeral: true });
				return;
			}
			if (!canModifyQueue(member)) {
				return interaction.reply({
					content: i18n.__('common.errorNotChannel'),
					ephemeral: true,
				});
			}
			if (!queue) {
				return interaction.reply({ content: i18n.__('remove.errorNotQueue'), ephemeral: true });
			}
			interaction.options.data
			const songs =interaction.options.data.map((arg) => {
				if (arg.value === undefined || typeof arg.value === 'boolean') return;
				if (typeof arg.value === 'number') return arg.value;
				return parseInt(arg.value, 10);
			});
			const removed: Isong[] = [];

			queue.songs = queue.songs.filter((item, index) => {
				if (songs.find((songIndex) => songIndex === index)) {
					removed.push(item);
					return false;
				}
				return true;
			});
			npMessage({ interaction, npSong: queue.songs[0] });
			await interaction.reply({ content: 'Successfully removed song(s)', ephemeral: true });
			interaction.followUp({
				content: `<@${member.id}> ❌ removed: \n- **${removed
					.map((song) => song.title)
					.join('\n- ')}** \nfrom the queue.`,
				ephemeral: false,
			});
		}
}