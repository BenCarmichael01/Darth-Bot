import { canModifyQueue, LOCALE, MSGTIMEOUT } from '../../include/utils';
import { npMessage } from '../../include/npmessage';
import i18n from 'i18n';
import { reply } from '../../include/responses';
import { ChatInputCommandInteraction, GuildMember, Message, SlashCommandBuilder } from 'discord.js';
import { myClient } from '../../types/types';

if (LOCALE) i18n.setLocale(LOCALE);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shuffle')
		.setDescription(i18n.__('shuffle.description')),

	async execute(interaction:ChatInputCommandInteraction) {
		try {
			await interaction.deferReply({ ephemeral: true });

			let guildId = interaction.guildId;
			if (!guildId) {
				return interaction.editReply({ content: i18n.__('common.unknownError') });
			}
			const client = interaction.client as myClient;
			const queue = client.queue.get(guildId);

			if (!queue) {
				return reply({ interaction, content: i18n.__('shuffle.errorNotQueue'), ephemeral: true });
			}
			if (interaction.member instanceof GuildMember) {
				var guildMember = interaction.member as GuildMember;
			} else {
				interaction.editReply({ content: i18n.__('common.unknownError') });
				return;
			}

			if (!canModifyQueue(guildMember)) {
				 interaction.editReply({
					content: i18n.__('common.errorNotChannel'),
				});
			}
			const { songs } = queue;
			for (let i = songs.length - 1; i > 1; i--) {
				const j = 1 + Math.floor(Math.random() * i);
				[songs[i], songs[j]] = [songs[j], songs[i]];
			}
			queue.songs = songs;
			interaction.client.queue.set(guildId, queue);
			npMessage({ interaction, npSong: songs[0] });
			interaction.editReply({
				content: i18n.__('shuffle.success'),
			});
			queue.textChannel
				.send({
					content: i18n.__mf('shuffle.result', { author: guildMember.id }),
				})
				.then((msg: Message) => {
					setTimeout(() => {
						msg.delete().catch(console.error);
					}, MSGTIMEOUT);
				})
				.catch(console.error);
			return;
		} catch (error) {
			console.error(error);
		}
	}
}
