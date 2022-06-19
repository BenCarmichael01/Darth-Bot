import { canModifyQueue, LOCALE, MSGTIMEOUT } from '../../include/utils';
import { npMessage } from '../../include/npmessage';
import i18n from 'i18n';
import { reply } from '../../include/responses';
import { CommandInteraction, GuildMember, Message } from 'discord.js';
import { ICommand } from 'wokcommands';

if (LOCALE) i18n.setLocale(LOCALE);

export default {
	name: 'shuffle',
	category: 'music',
	description: i18n.__('shuffle.description'),
	guildOnly: true,
	slash: true,

	async callback({ interaction }: { interaction: CommandInteraction }): Promise<Message | void> {
		try {
			await interaction.deferReply({ ephemeral: true });
			if (typeof interaction.guildId === 'string') {
				var GUILDID = interaction.guildId as string;
			} else {
				return interaction.reply({ content: i18n.__('common.unknownError') });
			}
			// TODO add error message with return above^^

			const queue = interaction.client.queue.get(GUILDID);
			if (!queue) {
				return reply({ interaction, content: i18n.__('shuffle.errorNotQueue'), ephemeral: true });
			}
			if ('member' in interaction) {
				var guildMember = interaction.member as GuildMember;
			} else {
				return interaction.reply({ content: i18n.__('common.unknownError') });
			}

			if (!canModifyQueue(guildMember)) {
				return reply({
					interaction,
					content: i18n.__('common.errorNotChannel'),
					ephemeral: true,
				});
			}
			const { songs } = queue;
			for (let i = songs.length - 1; i > 1; i--) {
				const j = 1 + Math.floor(Math.random() * i);
				[songs[i], songs[j]] = [songs[j], songs[i]];
			}
			queue.songs = songs;
			interaction.client.queue.set(GUILDID, queue);
			npMessage({ interaction, npSong: songs[0] });
			reply({
				interaction,
				content: i18n.__('shuffle.success'),
				ephemeral: true,
			});
			queue.textChannel
				.send({
					content: i18n.__mf('shuffle.result', { author: guildMember.id }),
					ephemeral: false,
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
	},
} as ICommand;
